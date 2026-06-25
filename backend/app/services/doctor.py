from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule, ScheduleStatus
from app.models.live_queue import LiveQueue, LiveQueueStatus
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.schemas.doctor import DoctorProfileUpdate, DoctorUpdate
from app.schemas.doctor_schedule import DoctorScheduleCreate, DoctorScheduleUpdate

# Appointment statuses representing patients physically waiting in the clinic
WAITING_APPOINTMENT_STATUSES = {
    AppointmentStatus.Allocated,
    AppointmentStatus.Arrived,
}

def _get_doctor_by_user_id(db: Session, user_id: int):
    return db.query(Doctor).filter(Doctor.UserID == user_id).first()

def _get_doctor_appointment(db: Session, doctor_id: int, appointment_id: int):
    return db.query(Appointment).filter(
        Appointment.Appointment_ID == appointment_id,
        Appointment.Doctor_ID == doctor_id,
    ).first()

def _build_queue_item(db: Session, appointment: Appointment):
    patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
    user = db.query(User).filter(User.UserID == patient.UserID).first() if patient else None
    status_value = appointment.Status.value if hasattr(appointment.Status, "value") else str(appointment.Status)
    
    if status_value == AppointmentStatus.In_Progress.value:
        queue_status = "in-consultation"
    elif status_value == AppointmentStatus.Completed.value:
        queue_status = "completed"
    elif status_value == AppointmentStatus.Skipped.value:
        queue_status = "skipped"
    else:
        queue_status = "waiting"
        
    return {
        "queue_id": appointment.Appointment_ID,
        "appointment_id": appointment.Appointment_ID,
        "queue_number": appointment.Queue_Number or 0,
        "status": queue_status,
        "patient_name": patient.Name if patient else f"Patient #{appointment.Patient_ID}",
        "arrived_at": f"{appointment.AppointmentDate}T{appointment.AppointmentTime or '09:00:00'}",
        "appointment_date": appointment.AppointmentDate.isoformat() if appointment.AppointmentDate else None,
        "appointment_time": str(appointment.AppointmentTime) if appointment.AppointmentTime else None,
        "notes": appointment.Notes,
        "patient_id": appointment.Patient_ID,
        "email": user.Email if user else None,
        "phone": patient.Phone_No if patient else None,
        "address": patient.Address if patient else None,
        "opd_id": patient.OPD_Id if patient else None,
        "date_of_birth": patient.DateOfBirth.isoformat() if patient and patient.DateOfBirth else None,
    }

def _notify_queue_updates(db: Session, doctor_id: int, appointment_date: date):
    """
    Scans the remaining live queue for today, identifies who is immediately 'Up Next'
    and alerts them. It also updates wait times and counts for other patients behind them.
    """
    try:
        # Prevent circular imports by importing utility routing dynamically
      
        from app.utils.notify import notify_patient, EVT_QUEUE_UPDATE
       
       # Query all active waiting appointments remaining for today
        waiting_appointments = db.query(Appointment).filter(
            Appointment.Doctor_ID == doctor_id,
            Appointment.AppointmentDate == appointment_date,
            Appointment.Status.in_(WAITING_APPOINTMENT_STATUSES)
        ).order_by(Appointment.Queue_Number, Appointment.AppointmentTime, Appointment.Appointment_ID).all()

        if not waiting_appointments:
            return

        # 1. Resolve Doctor Object
        doctor_obj = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
        doctor_name = doctor_obj.Name if doctor_obj else "Your doctor"

        # 2. Extract and notify the immediate next patient (Up Next / Queue position 1)
        up_next = waiting_appointments[0]
        notify_patient(
            db,
            up_next.Patient_ID,
            EVT_QUEUE_UPDATE,
            "🎯 You are Up Next!",
            f"Dr. {doctor_name} is ready to see you now. Please proceed to the consultation room immediately.",
            {
                "appointment_id": up_next.Appointment_ID,
                "is_next": True,
                "queue_position": 1,
                "total_ahead": 0,
                "doctor_name": doctor_name
            }
        )

        # 3. Notify remaining patients that the queue has progressed
        for idx, appointment in enumerate(waiting_appointments[1:], start=1):
            # Calculate position message
            if idx == 1:
                position_msg = "You are 1 ahead, you will be next"
            elif idx == 2:
                position_msg = "You are 2 ahead"
            else:
                position_msg = f"You are {idx} ahead"
            
            notify_patient(
                db,
                appointment.Patient_ID,
                EVT_QUEUE_UPDATE,
                f"📊 Queue Update - Position {idx + 1}",
                f"Dr. {doctor_name} has arrived and is now consulting. {position_msg} in the queue.",
                {
                    "appointment_id": appointment.Appointment_ID,
                    "is_next": False,
                    "queue_position": idx + 1,
                    "total_ahead": idx,
                    "doctor_name": doctor_name,
                    "position_message": position_msg
                }
            )
    except Exception as e:
        # Silence notifications layer errors to protect the main DB transaction commit
        print(f"[Queue Notifier Error]: {e}")

def update_doctor(db: Session, doctor_id: int, doctor_update: DoctorUpdate):
    db_doctor = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
    if not db_doctor:
        return None
    for var, value in vars(doctor_update).items():
        if value is not None:
            setattr(db_doctor, var, value)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

def get_doctor_appointment_for_user(db: Session, user_id: int, appointment_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    return _get_doctor_appointment(db, doctor.Doctor_ID, appointment_id)

def get_doctor_profile(db: Session, user_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    user = db.query(User).filter(User.UserID == doctor.UserID).first()
    return {
        "Doctor_ID": doctor.Doctor_ID,
        "UserID": doctor.UserID,
        "Name": doctor.Name,
        "Speciality": doctor.Speciality,
        "Phone_No": doctor.Phone_No,
        "AverageConsultationMinutes": doctor.AverageConsultationMinutes,
        "Email": user.Email if user else None,
        "CreatedAt": user.CreatedAt.isoformat() if user and user.CreatedAt else None,
    }

def update_doctor_profile(db: Session, user_id: int, profile_update: DoctorProfileUpdate):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    if profile_update.Name is not None:
        doctor.Name = profile_update.Name
    if profile_update.Speciality is not None:
        doctor.Speciality = profile_update.Speciality
    if profile_update.Phone_No is not None:
        doctor.Phone_No = profile_update.Phone_No
    user = db.query(User).filter(User.UserID == doctor.UserID).first()
    if user and profile_update.Email is not None:
        user.Email = profile_update.Email
    db.commit()
    db.refresh(doctor)
    return get_doctor_profile(db, user_id)

def update_doctor_password(db: Session, user_id: int, current_password: str, new_password: str):
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user:
        return None
    if not verify_password(current_password, user.Password):
        return False
    user.Password = get_password_hash(new_password[:72])
    db.commit()
    return True

def get_doctor_dashboard(db: Session, user_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    today = date.today()
    appointments = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor.Doctor_ID,
        Appointment.AppointmentDate == today,
    ).order_by(Appointment.Queue_Number, Appointment.AppointmentTime, Appointment.Appointment_ID).all()
    
    queue_items = [_build_queue_item(db, appointment) for appointment in appointments]
    completed = sum(1 for appointment in appointments if appointment.Status == AppointmentStatus.Completed)
    pending = sum(1 for appointment in appointments if appointment.Status == AppointmentStatus.Pending_Allocation)
    waiting = sum(1 for appointment in appointments if appointment.Status in WAITING_APPOINTMENT_STATUSES)
    
    return {
        "doctor": get_doctor_profile(db, user_id),
        "stats": {
            "todayPatients": len(appointments),
            "inQueue": waiting,
            "completed": completed,
            "pending": pending,
        },
        "queue": queue_items,
    }

def get_doctor_queue(db: Session, user_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    today = date.today()
    appointments = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor.Doctor_ID,
        Appointment.AppointmentDate == today,
        Appointment.Status.in_([
            AppointmentStatus.Allocated,
            AppointmentStatus.Arrived,
            AppointmentStatus.In_Progress,
            AppointmentStatus.Completed,
            AppointmentStatus.Skipped,
        ]),
    ).order_by(Appointment.Queue_Number, Appointment.AppointmentTime, Appointment.Appointment_ID).all()
    return [_build_queue_item(db, appointment) for appointment in appointments]

def get_patient_medical_records(db: Session, patient_id: int):
    records = db.query(MedicalRecord).filter(
        MedicalRecord.Patient_ID == patient_id,
    ).order_by(MedicalRecord.RecordDate.desc()).all()
    return records

def start_doctor_consultation(db: Session, user_id: int, appointment_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    appointment = _get_doctor_appointment(db, doctor.Doctor_ID, appointment_id)
    if not appointment:
        return None
        
    appointment.Status = AppointmentStatus.In_Progress
    
    # Update LiveQueue entry to In_Consultation
    lq_entry = db.query(LiveQueue).filter(LiveQueue.AppointmentID == appointment.Appointment_ID).first()
    if lq_entry:
        lq_entry.Status = LiveQueueStatus.In_Consultation
        
    db.commit()
    db.refresh(appointment)
    
    # 1. Real-time notify the active patient that consultation has officially started
    try:

        from app.utils.notify import notify_patient, EVT_CONSULTATION_STARTED, EVT_DOCTOR_ARRIVED
        

        doctor_obj = db.query(Doctor).filter(Doctor.Doctor_ID == appointment.Doctor_ID).first()
        doctor_name = doctor_obj.Name if doctor_obj else "Your doctor"
        
        # Notify the active patient
        notify_patient(
            db,
            appointment.Patient_ID,
            EVT_CONSULTATION_STARTED,
            "🏥 Consultation Started",
            f"Dr. {doctor_name} has started your consultation. Please proceed to the room immediately.",
            {"appointment_id": appointment.Appointment_ID, "doctor_name": doctor_name},
        )
        
        # Notify all other waiting patients that the doctor has arrived
        waiting_appointments = db.query(Appointment).filter(
            Appointment.Doctor_ID == appointment.Doctor_ID,
            Appointment.AppointmentDate == appointment.AppointmentDate,
            Appointment.Status.in_(WAITING_APPOINTMENT_STATUSES),
            Appointment.Appointment_ID != appointment.Appointment_ID
        ).all()
        
        for waiting_apt in waiting_appointments:
            notify_patient(
                db,
                waiting_apt.Patient_ID,
                EVT_DOCTOR_ARRIVED,
                "👨‍⚕️ Doctor Has Arrived",
                f"Dr. {doctor_name} has arrived and is now consulting. Your turn will be announced shortly.",
                {
                    "appointment_id": waiting_apt.Appointment_ID,
                    "doctor_name": doctor_name,
                    "doctor_id": appointment.Doctor_ID
                },
            )
    except Exception:
        pass

    # 2. Trigger automated updates for remaining patients in the queue (shifts positions / identifies next patient)
    _notify_queue_updates(db, doctor.Doctor_ID, appointment.AppointmentDate)

    return _build_queue_item(db, appointment)

def complete_doctor_consultation(
    db: Session,
    user_id: int,
    appointment_id: int,
    consultation_notes: str | None = None,
    prescription: str | None = None,
    appointment_notes: str | None = None,
):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    appointment = _get_doctor_appointment(db, doctor.Doctor_ID, appointment_id)
    if not appointment:
        return None
        
    appointment.Status = AppointmentStatus.Completed
    if appointment_notes:
        appointment.Notes = appointment_notes
        
    # Update LiveQueue entry to Completed
    lq_entry = db.query(LiveQueue).filter(LiveQueue.AppointmentID == appointment.Appointment_ID).first()
    if lq_entry:
        lq_entry.Status = LiveQueueStatus.Completed
        
    record = db.query(MedicalRecord).filter(MedicalRecord.Appointment_ID == appointment.Appointment_ID).first()
    if not record:
        record = MedicalRecord(
            Appointment_ID=appointment.Appointment_ID,
            Patient_ID=appointment.Patient_ID,
            Doctor_ID=doctor.Doctor_ID,
            ConsultationNotes=consultation_notes,
            Prescription=prescription,
            RecordDate=datetime.utcnow(),
        )
        db.add(record)
    else:
        record.ConsultationNotes = consultation_notes
        record.Prescription = prescription
        record.RecordDate = datetime.utcnow()
        
    db.commit()
    db.refresh(appointment)

    # Trigger queue updates for waiting patients as the queue progresses
    _notify_queue_updates(db, doctor.Doctor_ID, appointment.AppointmentDate)

    return _build_queue_item(db, appointment)

def skip_doctor_consultation(db: Session, user_id: int, appointment_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    appointment = _get_doctor_appointment(db, doctor.Doctor_ID, appointment_id)
    if not appointment:
        return None
        
    appointment.Status = AppointmentStatus.Skipped
    
    # Update LiveQueue entry to Skipped
    lq_entry = db.query(LiveQueue).filter(LiveQueue.AppointmentID == appointment.Appointment_ID).first()
    if lq_entry:
        lq_entry.Status = LiveQueueStatus.Skipped
        
    db.commit()
    db.refresh(appointment)

    # Trigger queue updates for waiting patients as the queue progresses
    _notify_queue_updates(db, doctor.Doctor_ID, appointment.AppointmentDate)

    return _build_queue_item(db, appointment)

def update_doctor_schedule(db: Session, doctor_id: int, schedule_data: DoctorScheduleCreate):
    schedule = DoctorSchedule(
        DoctorID=doctor_id,
        AvailableDate=schedule_data.AvailableDate,
        StartTime=schedule_data.StartTime,
        EndTime=schedule_data.EndTime,
        Status=ScheduleStatus.Available,
        max_patients=schedule_data.max_patients or 10,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

def get_doctor_schedules(db: Session, user_id: int, start_date: date | None = None, end_date: date | None = None):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    query = db.query(DoctorSchedule).filter(DoctorSchedule.DoctorID == doctor.Doctor_ID)
    if start_date:
        query = query.filter(DoctorSchedule.AvailableDate >= start_date)
    if end_date:
        query = query.filter(DoctorSchedule.AvailableDate <= end_date)
    schedules = query.order_by(DoctorSchedule.AvailableDate, DoctorSchedule.StartTime).all()
    return schedules

def update_doctor_schedule_entry(db: Session, user_id: int, schedule_id: int, schedule_data: DoctorScheduleUpdate):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.ScheduleID == schedule_id,
        DoctorSchedule.DoctorID == doctor.Doctor_ID,
    ).first()
    if not schedule:
        return None
    for field, value in vars(schedule_data).items():
        if value is not None:
            setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    return schedule

def delete_doctor_schedule_entry(db: Session, user_id: int, schedule_id: int):
    doctor = _get_doctor_by_user_id(db, user_id)
    if not doctor:
        return None
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.ScheduleID == schedule_id,
        DoctorSchedule.DoctorID == doctor.Doctor_ID,
    ).first()
    if not schedule:
        return None
    db.delete(schedule)
    db.commit()
    return schedule

def get_today_queue(db: Session, doctor_id: int, clinic_id: int, today: date):
    appointments = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor_id,
        Appointment.AppointmentDate == today,
    ).order_by(Appointment.Queue_Number, Appointment.AppointmentTime, Appointment.Appointment_ID).all()
    return [_build_queue_item(db, appointment) for appointment in appointments]

def create_medical_record(db: Session, patient_id: int, doctor_id: int, clinic_id: int, notes: str):
    appointment = db.query(Appointment).filter(
        Appointment.Patient_ID == patient_id,
        Appointment.Doctor_ID == doctor_id,
        Appointment.ClinicID == clinic_id,
    ).order_by(Appointment.CreatedAt.desc()).first()
    if not appointment:
        return None
    record = MedicalRecord(
        Appointment_ID=appointment.Appointment_ID,
        Patient_ID=patient_id,
        Doctor_ID=doctor_id,
        ConsultationNotes=notes,
        Prescription=None,
        RecordDate=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_medical_record(db: Session, record_id: int, notes: str):
    record = db.query(MedicalRecord).filter(MedicalRecord.Record_ID == record_id).first()
    if not record:
        return None
    record.ConsultationNotes = notes
    db.commit()
    db.refresh(record)
    return record

def mark_patient_consulted(db: Session, queue_id: int, notes: str = None):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == queue_id).first()
    if not appointment:
        return None
    appointment.Status = AppointmentStatus.Completed
    db.commit()
    db.refresh(appointment)
    if notes:
        record = db.query(MedicalRecord).filter(MedicalRecord.Appointment_ID == appointment.Appointment_ID).first()
        if not record:
            record = MedicalRecord(
                Appointment_ID=appointment.Appointment_ID,
                Patient_ID=appointment.Patient_ID,
                Doctor_ID=appointment.Doctor_ID,
                ConsultationNotes=notes,
                Prescription=None,
                RecordDate=datetime.utcnow(),
            )
            db.add(record)
            db.commit()
            db.refresh(record)

    # Trigger queue updates for waiting patients as the queue progresses
    _notify_queue_updates(db, appointment.Doctor_ID, appointment.AppointmentDate)

    return appointment
