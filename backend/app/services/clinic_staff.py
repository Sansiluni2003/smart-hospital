
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinic import Clinic
from app.models.doctor_clinic_assignment import DoctorClinicAssignment
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule
from app.models.live_queue import LiveQueue, LiveQueueStatus
from app.models.patient import Patient
from app.models.user import User
from app.models.audit_log import AuditLog

from app.schemas.appointment import AppointmentUpdate
from app.schemas.audit_log import AuditLogCreate,AuditLogResponse,AuditLogBase
from app.schemas.clinic_staff import ClinicStaffUpdate

from app.utils.notification import send_email, send_sms


def update_clinic_staff(db: Session, staff_id: int, staff_update: ClinicStaffUpdate):
    from app.models.clinic_staff import ClinicStaff

    db_staff = db.query(ClinicStaff).filter(ClinicStaff.Staff_ID == staff_id).first()
    if not db_staff:
        return None
    for var, value in vars(staff_update).items():
        if value is not None:
            setattr(db_staff, var, value)
    db.commit()
    db.refresh(db_staff)
    return db_staff


def _get_patient_user_email(db: Session, patient: Patient):
    user = db.query(User).filter(User.UserID == patient.UserID).first()
    return user.Email if user else None


def _queue_position_for_appointment(db: Session, doctor_id: int, appointment_date):
    return (
        db.query(Appointment)
        .filter(
            Appointment.Doctor_ID == doctor_id,
            Appointment.AppointmentDate == appointment_date,
            Appointment.Status.in_([
                AppointmentStatus.Allocated,
                AppointmentStatus.Arrived,
                AppointmentStatus.In_Progress,
            ]),
        )
        .count()
        + 1
    )


def _upsert_live_queue(db: Session, appointment: Appointment, status: LiveQueueStatus = LiveQueueStatus.Waiting):
    if not appointment.Doctor_ID:
        return None

    pos_from_appointment = appointment.Queue_Number if (appointment.Queue_Number is not None and appointment.Queue_Number > 0) else None

    existing_queue = db.query(LiveQueue).filter(LiveQueue.AppointmentID == appointment.Appointment_ID).first()
    if not existing_queue:
        existing_queue = LiveQueue(
            AppointmentID=appointment.Appointment_ID,
            DoctorID=appointment.Doctor_ID,
            PatientID=appointment.Patient_ID,
            QueuePosition=pos_from_appointment or _queue_position_for_appointment(db, appointment.Doctor_ID, appointment.AppointmentDate),
            ArrivalTime=datetime.utcnow(),
            Status=status,
        )
        db.add(existing_queue)
    else:
        existing_queue.DoctorID = appointment.Doctor_ID
        existing_queue.PatientID = appointment.Patient_ID
        if pos_from_appointment:
            existing_queue.QueuePosition = pos_from_appointment
        existing_queue.ArrivalTime = datetime.utcnow()
        existing_queue.Status = status

    db.commit()
    db.refresh(existing_queue)
    return existing_queue


def _serialize_live_queue_entry(db: Session, live_queue: LiveQueue):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == live_queue.AppointmentID).first()
    patient = db.query(Patient).filter(Patient.Patient_ID == live_queue.PatientID).first() if live_queue.PatientID else None
    doctor = db.query(Doctor).filter(Doctor.Doctor_ID == live_queue.DoctorID).first() if live_queue.DoctorID else None
    user = db.query(User).filter(User.UserID == patient.UserID).first() if patient else None

    return {
        "queueNumber": live_queue.QueuePosition,
        "patientName": patient.Name if patient else f"Patient #{live_queue.PatientID}",
        "doctorName": doctor.Name if doctor else "Not allocated yet",
        "appointmentId": f"APT-{live_queue.AppointmentID}",
        "appointment_id": live_queue.AppointmentID,
        "patient_id": live_queue.PatientID,
        "doctor_id": live_queue.DoctorID,
        "status": live_queue.Status.value if hasattr(live_queue.Status, "value") else str(live_queue.Status),
        "date": appointment.AppointmentDate.isoformat() if appointment and appointment.AppointmentDate else None,
        "time": str(appointment.AppointmentTime) if appointment and appointment.AppointmentTime else None,
        "arrivalTime": live_queue.ArrivalTime.isoformat() if live_queue.ArrivalTime else None,
        "phone": patient.Phone_No if patient else None,
        "email": user.Email if user else None,
        "queueNumberDisplay": f"#{live_queue.QueuePosition}",
    }


def _queue_notification_message(queue_position: int | None):
    if not queue_position:
        return "Checked in. Please wait in the reception area."
    ahead = max(queue_position - 1, 0)
    if ahead == 0:
        return f"Checked in. Queue #{queue_position}. You are next."
    return f"Checked in. Queue #{queue_position}. {ahead} patient(s) ahead of you."


def _parse_qr_payload(payload: str):
    parts = [p.strip() for p in payload.split("|") if p.strip()]
    data: dict[str, str] = {}
    for part in parts:
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        data[key.strip().lower()] = value.strip()
    return data


def _arrival_response(db: Session, appointment, queue_entry):
    """Build a rich dict returned to the staff UI after check-in."""
    from app.models.patient import Patient
    patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
    return {
        "appointment_id": appointment.Appointment_ID,
        "patient_id": appointment.Patient_ID,
        "patient_name": patient.Name if patient else "Unknown",
        "patient_opd": patient.OPD_Id if patient else "",
        "appointment_date": str(appointment.AppointmentDate),
        "queue": _serialize_live_queue_entry(db, queue_entry) if queue_entry else None,
    }


def verify_patient_arrival(db: Session, appointment_id: int):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None

    if appointment.Status in {
        AppointmentStatus.In_Progress,
        AppointmentStatus.Completed,
        AppointmentStatus.Cancelled,
        AppointmentStatus.Skipped,
    }:
        raise ValueError("Appointment is already processed and cannot be checked in again")

    if appointment.Status == AppointmentStatus.Arrived:
        queue_entry = _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)
        return _arrival_response(db, appointment, queue_entry)

    if not appointment.Doctor_ID:
        raise ValueError("Doctor not allocated yet")

    appointment.Status = AppointmentStatus.Arrived
    db.commit()
    db.refresh(appointment)

    queue_entry = _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)
    if queue_entry:
        try:
            from app.utils.notification import create_in_app_notification
            create_in_app_notification(db, appointment.Patient_ID, _queue_notification_message(queue_entry.QueuePosition))
        except Exception:
            pass
        try:
            from app.utils.notify import notify_staff_users, EVT_CHECKIN_VERIFIED
            notify_staff_users(
                db,
                EVT_CHECKIN_VERIFIED,
                "Patient Check-in Verified",
                f"APT-{appointment.Appointment_ID} checked in and added to queue #{queue_entry.QueuePosition}.",
                {
                    "appointment_id": appointment.Appointment_ID,
                    "patient_id": appointment.Patient_ID,
                    "doctor_id": appointment.Doctor_ID,
                    "queue_number": queue_entry.QueuePosition,
                },
            )
        except Exception:
            pass
    return _arrival_response(db, appointment, queue_entry)


def verify_patient_arrival_from_qr(db: Session, payload: str):
    data = _parse_qr_payload(payload)
    appointment_id_raw = data.get("apt") or data.get("appointment") or data.get("appointment_id")
    if not appointment_id_raw:
        raise ValueError("QR payload missing appointment id")

    try:
        appointment_id = int(appointment_id_raw)
    except ValueError as exc:
        raise ValueError("Invalid appointment id in QR payload") from exc

    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None

    if appointment.Status in {
        AppointmentStatus.In_Progress,
        AppointmentStatus.Completed,
        AppointmentStatus.Cancelled,
        AppointmentStatus.Skipped,
    }:
        raise ValueError("Appointment is already processed and cannot be checked in again")

    if appointment.Status == AppointmentStatus.Arrived:
        queue_entry = _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)
        return _arrival_response(db, appointment, queue_entry)

    if data.get("patient") and int(data["patient"]) != appointment.Patient_ID:
        raise ValueError("QR payload patient mismatch")
    if data.get("clinic") and int(data["clinic"]) != appointment.ClinicID:
        raise ValueError("QR payload clinic mismatch")
    if data.get("date") and str(appointment.AppointmentDate) != data["date"]:
        raise ValueError("QR payload date mismatch")
    # Skip strict time comparison — timedelta/time str formats vary; apt+patient+clinic+date is sufficient

    if not appointment.Doctor_ID:
        raise ValueError("Doctor not allocated yet")

    appointment.Status = AppointmentStatus.Arrived
    db.commit()
    db.refresh(appointment)

    queue_entry = _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)

    if queue_entry:
        try:
            from app.utils.notification import create_in_app_notification
            create_in_app_notification(db, appointment.Patient_ID, _queue_notification_message(queue_entry.QueuePosition))
        except Exception:
            pass
        try:
            from app.utils.notify import notify_staff_users, EVT_CHECKIN_VERIFIED
            notify_staff_users(
                db,
                EVT_CHECKIN_VERIFIED,
                "Patient Check-in Verified",
                f"APT-{appointment.Appointment_ID} checked in via QR and added to queue #{queue_entry.QueuePosition}.",
                {
                    "appointment_id": appointment.Appointment_ID,
                    "patient_id": appointment.Patient_ID,
                    "doctor_id": appointment.Doctor_ID,
                    "queue_number": queue_entry.QueuePosition,
                },
            )
        except Exception:
            pass
        # Real-time WS queue update to patient
        try:
            from app.utils.notify import notify_patient, EVT_CHECKIN_VERIFIED
            notify_patient(
                db, appointment.Patient_ID,
                EVT_CHECKIN_VERIFIED,
                "Check-in Verified",
                _queue_notification_message(queue_entry.QueuePosition),
                {"appointment_id": appointment.Appointment_ID, "queue_number": queue_entry.QueuePosition}
            )
        except Exception:
            pass

    return _arrival_response(db, appointment, queue_entry)


def allocate_appointment(db: Session, appointment_id: int, doctor_id: int, appointment_date: datetime):
    """
    Allocate an appointment to a doctor and auto-calculate the appointment time as:
        schedule.StartTime + (already_allocated_count × doctor.AverageConsultationMinutes)
    """
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None

    doctor = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
    if not doctor:
        raise ValueError("Doctor not found.")

    target_date = appointment_date.date()

    # Find the doctor's schedule for that date
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.DoctorID == doctor_id,
        DoctorSchedule.AvailableDate == target_date,
    ).first()
    if not schedule:
        raise ValueError("No schedule found for this doctor on the selected date.")

    # Count how many patients are already allocated ahead in the queue
    already_allocated = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor_id,
        Appointment.AppointmentDate == target_date,
        Appointment.Status.in_([
            AppointmentStatus.Allocated,
            AppointmentStatus.Arrived,
            AppointmentStatus.In_Progress,
        ]),
    ).count()

    if already_allocated >= (schedule.max_patients or 10):
        raise ValueError("This slot has reached its maximum patient count.")

    # Auto-calculate appointment time:
    # StartTime + (queue_position × avg_consultation_minutes)
    avg_minutes = doctor.AverageConsultationMinutes or 10
    from datetime import timedelta, date as _date, time as _time, datetime as _datetime
    start_dt = _datetime.combine(_date.today(), schedule.StartTime)
    calculated_dt = start_dt + timedelta(minutes=already_allocated * avg_minutes)
    calculated_time = calculated_dt.time()

    # Assign doctor, calculated time, and update status
    appointment.Doctor_ID = doctor_id
    appointment.AppointmentDate = target_date
    appointment.AppointmentTime = calculated_time
    appointment.Queue_Number = already_allocated + 1
    appointment.Status = AppointmentStatus.Allocated
    db.commit()
    db.refresh(appointment)

    _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)

    # Notify patient via SMS and email with their exact slot time
    patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
    if patient:
        slot_str = calculated_time.strftime("%H:%M")
        date_str = target_date.strftime("%d %b %Y")
        sms_message = (
            f"Your appointment has been confirmed.\n"
            f"Doctor: {doctor.Name}\n"
            f"Date: {date_str}\n"
            f"Time: {slot_str}\n"
            f"Queue No: {appointment.Queue_Number}\n"
            f"Please arrive 10 minutes early."
        )
        send_result = send_sms(patient.Phone_No, sms_message)
        if send_result is None:
            print(f"[ALLOC] WARNING: SMS failed to send to patient {patient.Patient_ID} ({patient.Phone_No})")
        patient_email = _get_patient_user_email(db, patient)
        if patient_email:
            send_email(patient_email, "Appointment Confirmed", sms_message)
        # Save in-app notification so it appears in the patient's notification page
        try:
            from app.utils.notification import create_in_app_notification
            create_in_app_notification(db, patient.Patient_ID, sms_message)
        except Exception:
            pass

        # Real-time WS: notify the patient immediately of their allocation details
        try:
            from app.utils.notify import notify_patient, EVT_APPOINTMENT_ALLOCATED
            notify_patient(
                db, patient.Patient_ID,
                EVT_APPOINTMENT_ALLOCATED,
                "Doctor Allocated",
                sms_message,
                {
                    "appointment_id": appointment.Appointment_ID,
                    "doctor": doctor.Name,
                    "date": str(target_date),
                    "time": slot_str,
                    "queue_number": appointment.Queue_Number,
                }
            )
        except Exception:
            pass

    return appointment


def reschedule_appointment(db: Session, appointment_id: int, new_time: datetime):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None
    appointment.AppointmentTime = new_time.time()
    appointment.Status = AppointmentStatus.Allocated
    db.commit()
    db.refresh(appointment)

    if appointment.Doctor_ID:
        _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)
    return appointment


def get_live_queue(db: Session, clinic_id: int):
    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.ClinicID == clinic_id,
            Appointment.Status.in_([
                AppointmentStatus.Allocated,
                AppointmentStatus.Arrived,
                AppointmentStatus.In_Progress,
                AppointmentStatus.Completed,
                AppointmentStatus.Skipped,
            ]),
        )
        .order_by(Appointment.AppointmentDate, Appointment.Queue_Number, Appointment.AppointmentTime, Appointment.Appointment_ID)
        .all()
    )

    live_queue = []
    for appointment in appointments:
        if appointment.Doctor_ID:
            queue_entry = db.query(LiveQueue).filter(LiveQueue.AppointmentID == appointment.Appointment_ID).first()
            if not queue_entry:
                queue_entry = _upsert_live_queue(db, appointment, LiveQueueStatus.Waiting)
            if queue_entry:
                live_queue.append(_serialize_live_queue_entry(db, queue_entry))
                continue

        patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
        doctor = db.query(Doctor).filter(Doctor.Doctor_ID == appointment.Doctor_ID).first() if appointment.Doctor_ID else None
        user = db.query(User).filter(User.UserID == patient.UserID).first() if patient else None
        live_queue.append({
            "queueNumber": appointment.Queue_Number or 0,
            "patientName": patient.Name if patient else f"Patient #{appointment.Patient_ID}",
            "doctorName": doctor.Name if doctor else "Not allocated yet",
            "appointmentId": f"APT-{appointment.Appointment_ID}",
            "appointment_id": appointment.Appointment_ID,
            "patient_id": appointment.Patient_ID,
            "doctor_id": appointment.Doctor_ID,
            "status": appointment.Status.value if hasattr(appointment.Status, "value") else str(appointment.Status),
            "date": appointment.AppointmentDate.isoformat() if appointment.AppointmentDate else None,
            "time": str(appointment.AppointmentTime) if appointment.AppointmentTime else None,
            "arrivalTime": None,
            "phone": patient.Phone_No if patient else None,
            "email": user.Email if user else None,
        })

    return live_queue


def get_doctor_availability(db: Session, doctor_id: int, date: datetime):
    schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.DoctorID == doctor_id,
        DoctorSchedule.AvailableDate == date.date(),
    ).all()
    appointments = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor_id,
        Appointment.AppointmentDate == date.date(),
        Appointment.Status.in_([
            AppointmentStatus.Allocated,
            AppointmentStatus.Arrived,
            AppointmentStatus.In_Progress,
            AppointmentStatus.Completed,
        ])
    ).all()

    return {
        "schedule": [
            {
                "ScheduleID": schedule.ScheduleID,
                "DoctorID": schedule.DoctorID,
                "AvailableDate": schedule.AvailableDate.isoformat() if schedule.AvailableDate else None,
                "StartTime": str(schedule.StartTime) if schedule.StartTime else None,
                "EndTime": str(schedule.EndTime) if schedule.EndTime else None,
                "Status": schedule.Status.value if hasattr(schedule.Status, "value") else str(schedule.Status),
                "max_patients": schedule.max_patients,
            }
            for schedule in schedules
        ],
        "appointments": [
            {
                "Appointment_ID": appointment.Appointment_ID,
                "AppointmentDate": appointment.AppointmentDate.isoformat() if appointment.AppointmentDate else None,
                "AppointmentTime": str(appointment.AppointmentTime) if appointment.AppointmentTime else None,
                "Status": appointment.Status.value if hasattr(appointment.Status, "value") else str(appointment.Status),
                "Queue_Number": appointment.Queue_Number,
                "Patient_ID": appointment.Patient_ID,
            }
            for appointment in appointments
        ],
    }


def get_available_doctors(db: Session, date: datetime, clinic_id: int | None = None):
    query = db.query(DoctorSchedule, Doctor).join(Doctor, Doctor.Doctor_ID == DoctorSchedule.DoctorID).filter(
        DoctorSchedule.AvailableDate == date.date(),
    )
    schedules = query.all()

    if clinic_id is not None:
        # Only restrict by clinic assignment when the clinic actually has doctors assigned.
        # If the assignment table is empty for that clinic, fall back to all available doctors
        # so freshly configured clinics still surface schedules.
        clinic_has_assignments = (
            db.query(DoctorClinicAssignment)
            .filter(DoctorClinicAssignment.ClinicID == clinic_id)
            .first()
        )
        if clinic_has_assignments:
            schedules = [
                row for row in schedules
                if db.query(DoctorClinicAssignment).filter(
                    DoctorClinicAssignment.DoctorID == row[0].DoctorID,
                    DoctorClinicAssignment.ClinicID == clinic_id,
                ).first()
            ]

    results = []
    for schedule, doctor in schedules:
        booked_patients = db.query(Appointment).filter(
            Appointment.Doctor_ID == doctor.Doctor_ID,
            Appointment.AppointmentDate == date.date(),
            Appointment.Status.in_([
                AppointmentStatus.Allocated,
                AppointmentStatus.Arrived,
                AppointmentStatus.In_Progress,
            ]),
        ).count()
        results.append({
            "doctorId": doctor.Doctor_ID,
            "doctorName": doctor.Name,
            "specialty": doctor.Speciality,
            "date": schedule.AvailableDate.isoformat() if schedule.AvailableDate else None,
            "time": f"{schedule.StartTime} - {schedule.EndTime}",
            "maxPatients": schedule.max_patients or 10,
            "bookedPatients": booked_patients,
            "scheduleId": schedule.ScheduleID,
            "startTime": str(schedule.StartTime) if schedule.StartTime else None,
            "endTime": str(schedule.EndTime) if schedule.EndTime else None,
            "status": schedule.Status.value if hasattr(schedule.Status, "value") else str(schedule.Status),
        })

    return results

def activate_patient_account(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not patient:
        return None
    patient.is_active = True
    db.commit()
    db.refresh(patient)
    try:
        from app.utils.notify import notify_staff_users, EVT_PATIENT_ACCOUNT_ACTIVATED
        notify_staff_users(
            db,
            EVT_PATIENT_ACCOUNT_ACTIVATED,
            "Patient Account Activated",
            f"Patient account {patient.Name} (ID {patient.Patient_ID}) has been activated.",
            {"patient_id": patient.Patient_ID, "patient_name": patient.Name},
        )
    except Exception:
        pass
    return patient

def get_staff_notifications(db: Session, user_id: int, limit: int = 25):
    notifications = (
        db.query(AuditLog)
        .filter(AuditLog.UserID == user_id, AuditLog.Action == "staff_notification")
        .order_by(AuditLog.Timestamp.desc())
        .limit(limit)
        .all()
    )

    active_lifecycle_events = {
        "appointment_booked",
        "allocation_pending",
        "appointment_allocated",
        "patient_arrived",
        "checkin_verified",
        "queue_update",
        "consultation_started",
    }
    terminal_statuses = {
        AppointmentStatus.Completed,
        AppointmentStatus.Cancelled,
        AppointmentStatus.Skipped,
    }

    results = []
    seen_fingerprints: set[str] = set()
    for item in notifications:
        title = "Staff Notification"
        message = item.Details or ""
        event = "staff_notification"
        data = {}
        try:
            import json
            payload = json.loads(item.Details or "{}")
            title = payload.get("title", title)
            message = payload.get("message", message)
            event = payload.get("event", event)
            data = payload.get("data", {}) or {}
        except Exception:
            pass

        appointment_id = data.get("appointment_id")
        if event in active_lifecycle_events and appointment_id is not None:
            try:
                appointment_id_int = int(appointment_id)
                appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id_int).first()
                if appointment and appointment.Status in terminal_statuses:
                    continue
            except Exception:
                pass

        fingerprint = f"{event}|{message}|{data.get('appointment_id')}"
        if fingerprint in seen_fingerprints:
            continue
        seen_fingerprints.add(fingerprint)

        results.append({
            "id": item.LogID,
            "event": event,
            "title": title,
            "message": message,
            "data": data,
            "time": item.Timestamp.isoformat() if item.Timestamp else None,
        })

    return results



