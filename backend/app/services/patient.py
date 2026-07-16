from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.models.user import User
from app.models.user import UserStatus
from app.models.appointment import Appointment
from app.models.clinic import Clinic
from datetime import datetime, date, time
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import AppointmentCreate
import qrcode
import os
from app.core.security import get_password_hash, verify_password
from app.models.medical_record import MedicalRecord
from app.models.notification import Notification
from app.models.live_queue import LiveQueue, LiveQueueStatus
from app.models.doctor import Doctor

# Register a new patient (and user)
def create_patient(db: Session, patient: PatientCreate):
    # Create User first
    db_user = User(
        Email=patient.Email,
        Password=get_password_hash(patient.Password[:72]),  # <-- hash here!
        Role="Patient",
        Status=UserStatus.Pending,
        CreatedAt=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Create Patient
    db_patient = Patient(
        UserID=db_user.UserID,
        OPD_Id=patient.OPD_Id,
        Name=patient.Name,
        Address=patient.Address,
        Phone_No=patient.Phone_No,
        DateOfBirth=patient.DateOfBirth
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

# Patient: Mark themselves as arrived for an appointment
def mark_as_arrived(db: Session, appointment_id: int):
    db_appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not db_appointment:
        return None

    # Already in a terminal or arrived state – nothing to do except return current state
    if db_appointment.Status in {
        AppointmentStatus.In_Progress,
        AppointmentStatus.Completed,
        AppointmentStatus.Skipped,
        AppointmentStatus.Cancelled,
    }:
        return db_appointment

    if db_appointment.Status == AppointmentStatus.Arrived:
        # Already arrived – still notify staff in case they missed the first event
        _notify_staff_patient_arrived(db, db_appointment)
        return db_appointment

    # Transition to Arrived
    db_appointment.Status = AppointmentStatus.Arrived
    db.commit()
    db.refresh(db_appointment)

    # ── Update live queue (only possible once a doctor is allocated) ───────
    if db_appointment.Doctor_ID:
        try:
            from app.services.clinic_staff import _upsert_live_queue
            from app.models.live_queue import LiveQueueStatus
            queue_entry = _upsert_live_queue(db, db_appointment, LiveQueueStatus.Waiting)
            if queue_entry:
                try:
                    from app.utils.notification import create_in_app_notification
                    from app.services.clinic_staff import _queue_notification_message
                    create_in_app_notification(
                        db,
                        db_appointment.Patient_ID,
                        _queue_notification_message(queue_entry.QueuePosition),
                    )
                except Exception:
                    pass
        except Exception:
            pass

    # ── Notify all connected staff members ─────────────────────────────────
    _notify_staff_patient_arrived(db, db_appointment)

    return db_appointment


def _notify_staff_patient_arrived(db: Session, appointment):
    """Push a real-time WebSocket event to every connected Staff user so they
    can verify the patient's arrival in the live-queue dashboard."""
    try:
        patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
        patient_name = patient.Name if patient else f"Patient #{appointment.Patient_ID}"
        opd_id = patient.OPD_Id if patient else ""

        from app.utils.notify import notify_staff_users, EVT_PATIENT_ARRIVED
        notify_staff_users(
            db,
            EVT_PATIENT_ARRIVED,
            "Patient Self-Arrived",
            f"{patient_name} (OPD: {opd_id}) has marked themselves as arrived for "
            f"appointment APT-{appointment.Appointment_ID}. Please verify at the counter.",
            {
                "appointment_id": appointment.Appointment_ID,
                "patient_id": appointment.Patient_ID,
                "patient_name": patient_name,
                "opd_id": opd_id,
                "doctor_id": appointment.Doctor_ID,
                "date": str(appointment.AppointmentDate),
            },
        )
    except Exception as e:
        # Never let a notification failure break the main arrival flow
        print(f"[mark_as_arrived] Staff notify failed: {e}")

# Get patient by ID
def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.Patient_ID == patient_id).first()

# Get all patients
def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).offset(skip).limit(limit).all()

# Update patient info
def update_patient(db: Session, patient_id: int, patient_update: PatientUpdate):
    db_patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not db_patient:
        return None
    for var, value in vars(patient_update).items():
        if value is not None:
            setattr(db_patient, var, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient

# Delete patient
def delete_patient(db: Session, patient_id: int):
    db_patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not db_patient:
        return None
    db.delete(db_patient)
    db.commit()
    return db_patient

# Business logic: Verify and activate patient
def verify_and_activate_patient(db: Session, patient_id: int):
    db_patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not db_patient:
        return None
    db_patient.is_active = True  # Add this field to your model if missing
    db.commit()
    db.refresh(db_patient)
    return db_patient

# Business logic: Book appointment
def book_appointment(db: Session, patient_id: int, appointment_data: AppointmentCreate):
    clinic = db.query(Clinic).filter(Clinic.ClinicID == appointment_data.ClinicID).first()
    if not clinic:
        raise HTTPException(status_code=400, detail=f"Clinic with ID {appointment_data.ClinicID} not found")

    appointment_date = appointment_data.AppointmentDate
    appointment_time = appointment_data.AppointmentTime or time(9, 0)

    count = db.query(Appointment).filter(
        Appointment.ClinicID == clinic.ClinicID,
        Appointment.AppointmentDate == appointment_date
    ).count()
    if count >= clinic.MaxPatients:
        raise HTTPException(status_code=400, detail="Clinic has reached its maximum patient count for the day.")

    # Validate weekday
    if not is_weekday(datetime.combine(appointment_date, appointment_time)):
        raise HTTPException(status_code=400, detail="Appointments can only be booked on weekdays (Monday–Friday).")

    # Validate clinic hours
    if not is_within_clinic_hours(datetime.combine(appointment_date, appointment_time)):
        raise HTTPException(status_code=400, detail="Appointments can only be booked between 08:00 and 16:00.")

    appointment = Appointment(
        Patient_ID=patient_id,
        ClinicID=appointment_data.ClinicID,
        Doctor_ID=appointment_data.Doctor_ID,
        AppointmentDate=appointment_date,
        AppointmentTime=appointment_time,
        Notes=appointment_data.Notes,
        Status=AppointmentStatus.Pending_Allocation,
        CreatedAt=datetime.utcnow(),
        # Generate queue number logic here
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Generate QR payload with real details
    qr_data = (
        f"apt:{appointment.Appointment_ID}"
        f"|patient:{patient_id}"
        f"|clinic:{appointment.ClinicID}"
        f"|date:{appointment.AppointmentDate}"
        f"|time:{appointment.AppointmentTime or time(0, 0)}"
    )
    qr_dir = os.path.join(os.getcwd(), "qr_codes")
    os.makedirs(qr_dir, exist_ok=True)
    qr_filename = f"qr_{appointment.Appointment_ID}.png"
    qr_path = os.path.join(qr_dir, qr_filename)
    generate_qr_code(qr_data, qr_path)
    # Store payload in DB so the frontend can render/scanner can read details
    appointment.QR_code = qr_data
    db.commit()
    db.refresh(appointment)

    # Real-time notification: tell patient their booking is confirmed
    try:
        from app.utils.notify import notify_patient, notify_staff_users, EVT_APPOINTMENT_BOOKED
        notify_patient(
            db, patient_id,
            EVT_APPOINTMENT_BOOKED,
            "Appointment Booked",
            f"Your appointment (APT-{appointment.Appointment_ID}) on {appointment.AppointmentDate} has been booked. Awaiting doctor allocation.",
            {"appointment_id": appointment.Appointment_ID, "date": str(appointment.AppointmentDate)}
        )
        notify_staff_users(
            db,
            EVT_APPOINTMENT_BOOKED,
            "New Appointment",
            f"New appointment APT-{appointment.Appointment_ID} booked for {appointment.AppointmentDate}. Please allocate a doctor.",
            {"appointment_id": appointment.Appointment_ID, "patient_id": patient_id, "date": str(appointment.AppointmentDate)}
        )
        notify_staff_users(
            db,
            "allocation_pending",
            "Allocation Pending",
            f"APT-{appointment.Appointment_ID} is waiting for doctor allocation.",
            {"appointment_id": appointment.Appointment_ID, "patient_id": patient_id, "date": str(appointment.AppointmentDate)}
        )
    except Exception:
        pass

    return appointment

# Business logic: Confirm arrival
def confirm_arrival(db: Session, appointment_id: int):
    db_appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not db_appointment:
        return None
    db_appointment.Status = AppointmentStatus.Arrived
    db.commit()
    db.refresh(db_appointment)

    # Real-time: notify all staff that a patient has self-marked as arrived
    try:
        from app.utils.notify import notify_staff_users, EVT_PATIENT_ARRIVED
        notify_staff_users(
            db,
            EVT_PATIENT_ARRIVED,
            "Patient Arrived",
            f"Patient (APT-{appointment_id}) has marked themselves as arrived. Please scan & verify.",
            {"appointment_id": appointment_id}
        )
    except Exception:
        pass

    return db_appointment

# Business logic: Receive notification (stub)
def send_notification(db: Session, user_id: int, message: str):
    # Implement notification logic (e.g., insert into Notification table, send email/SMS, etc.)
    pass

def generate_qr_code(data, filename):
    img = qrcode.make(data)
    img.save(filename)
    return filename

def is_weekday(dt: datetime):
    # Monday is 0, Sunday is 6
    return dt.weekday() < 5

def is_within_clinic_hours(dt: datetime, start_hour=8, end_hour=16):
    # dt is a datetime object
    return time(start_hour, 0) <= dt.time() <= time(end_hour, 0)


def change_patient_password(db: Session, user_id: int, current_password: str, new_password: str):
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user:
        return None
    if not verify_password(current_password, user.Password):
        return False
    user.Password = get_password_hash(new_password[:72])
    db.commit()
    return True


def get_patient_medical_records_list(db: Session, patient_id: int):
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.Patient_ID == patient_id)
        .order_by(MedicalRecord.RecordDate.desc())
        .all()
    )
    result = []
    for r in records:
        doctor_name = r.doctor.Name if r.doctor else "Unknown"
        appointment_date = None
        if r.appointment:
            appointment_date = str(r.appointment.AppointmentDate)
        result.append({
            "Record_ID": r.Record_ID,
            "Appointment_ID": r.Appointment_ID,
            "AppointmentDate": appointment_date,
            "Doctor_Name": doctor_name,
            "ConsultationNotes": r.ConsultationNotes,
            "Prescription": r.Prescription,
            "RecordDate": str(r.RecordDate) if r.RecordDate else None,
        })
    return result


def get_patient_notifications_list(db: Session, patient_id: int):
    notifications = (
        db.query(Notification)
        .filter(Notification.Patient_ID == patient_id)
        .order_by(Notification.Sent_Time.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "Notification_ID": n.Notification_ID,
            "Message": n.Message,
            "NotificationType": n.NotificationType.value if n.NotificationType else None,
            "Status": n.Status.value if n.Status else None,
            "Sent_Time": str(n.Sent_Time) if n.Sent_Time else None,
        }
        for n in notifications
    ]


def get_patient_live_queue(db: Session, patient_id: int):
    """
    Returns the live queue context for a patient.
    For each active queue entry the patient has (Waiting / In_Consultation),
    we also return the FULL queue list for that doctor+day so the frontend
    can render the "Live Queue Progress" board.
    """
    today = date.today()
    my_entries = (
        db.query(LiveQueue)
        .join(Appointment, LiveQueue.AppointmentID == Appointment.Appointment_ID)
        .filter(
            LiveQueue.PatientID == patient_id,
            LiveQueue.Status.in_([LiveQueueStatus.Waiting, LiveQueueStatus.In_Consultation]),
            Appointment.AppointmentDate == today,
        )
        .order_by(LiveQueue.QueuePosition.asc())
        .all()
    )

    results = []
    for entry in my_entries:
        appointment = db.query(Appointment).filter(Appointment.Appointment_ID == entry.AppointmentID).first()
        doctor = db.query(Doctor).filter(Doctor.Doctor_ID == entry.DoctorID).first() if entry.DoctorID else None
        appointment_date = appointment.AppointmentDate if appointment else None

        # ----- full queue for this doctor+day -----
        full_queue_rows = []
        currently_serving: int | None = None
        total_in_queue = 0
        avg_minutes = doctor.AverageConsultationMinutes if doctor and doctor.AverageConsultationMinutes else 10

        if appointment_date and entry.DoctorID:
            all_entries = (
                db.query(LiveQueue)
                .join(Appointment, LiveQueue.AppointmentID == Appointment.Appointment_ID)
                .filter(
                    LiveQueue.DoctorID == entry.DoctorID,
                    Appointment.AppointmentDate == appointment_date,
                )
                .order_by(LiveQueue.QueuePosition.asc())
                .all()
            )

            for q in all_entries:
                q_status = q.Status.value if hasattr(q.Status, "value") else str(q.Status)
                q_patient = db.query(Doctor).filter(Doctor.Doctor_ID == q.PatientID).first()  # just for count
                full_queue_rows.append({
                    "queue_position": q.QueuePosition,
                    "is_me": q.PatientID == patient_id,
                    "status": q_status,
                })
                if q.Status == LiveQueueStatus.In_Consultation:
                    currently_serving = q.QueuePosition

            total_in_queue = len([r for r in full_queue_rows if r["status"] in ("Waiting", "In Consultation")])

        # How many active entries are ahead of me
        ahead_count = len([
            r for r in full_queue_rows
            if r["queue_position"] < entry.QueuePosition and r["status"] in ("Waiting", "In Consultation")
        ])

        est_wait_minutes = ahead_count * avg_minutes

        results.append({
            "Appointment_ID": entry.AppointmentID,
            "Doctor_Name": doctor.Name if doctor else None,
            "Doctor_Specialization": doctor.Speciality if doctor else None,
            "QueuePosition": entry.QueuePosition,
            "AheadCount": ahead_count,
            "CurrentlyServing": currently_serving,
            "TotalInQueue": total_in_queue,
            "EstWaitMinutes": est_wait_minutes,
            "AvgConsultMinutes": avg_minutes,
            "Status": entry.Status.value if hasattr(entry.Status, "value") else str(entry.Status),
            "AppointmentDate": appointment.AppointmentDate.isoformat() if appointment and appointment.AppointmentDate else None,
            "AppointmentTime": str(appointment.AppointmentTime) if appointment and appointment.AppointmentTime else None,
            "CheckedInAt": entry.ArrivalTime.isoformat() if entry.ArrivalTime else None,
            "FullQueue": full_queue_rows,
        })

    return results
