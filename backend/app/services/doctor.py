from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule, ScheduleStatus
from app.models.live_queue import LiveQueue
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.schemas.doctor import DoctorCreate, DoctorUpdate
from app.schemas.doctor_schedule import DoctorScheduleCreate, DoctorScheduleUpdate
from datetime import datetime, date, time
from app.utils.notification import create_in_app_notification

# CRUD: Create doctor (admin)
def create_doctor(db: Session, doctor: DoctorCreate):
    db_doctor = Doctor(
        UserID=doctor.UserID,
        Name=doctor.Name,
        Speciality=doctor.Specialty,
        Phone_No=doctor.Phone_No,
        DateOfBirth=doctor.DateOfBirth
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

# CRUD: Get doctor by ID
def get_doctor(db: Session, doctor_id: int):
    return db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()

# CRUD: Get all doctors
def get_doctors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Doctor).offset(skip).limit(limit).all()

# CRUD: Update doctor
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

# CRUD: Delete doctor
def delete_doctor(db: Session, doctor_id: int):
    db_doctor = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
    if not db_doctor:
        return None
    db.delete(db_doctor)
    db.commit()
    return db_doctor

# Doctor: Update availability and consultation schedules
def update_doctor_schedule(db: Session, doctor_id: int, schedule_data: DoctorScheduleCreate):
    schedule = DoctorSchedule(
        DoctorID=doctor_id,
        AvailableDate=schedule_data.ScheduleDate,
        StartTime=datetime.strptime(schedule_data.StartTime, "%H:%M").time(),
        EndTime=datetime.strptime(schedule_data.EndTime, "%H:%M").time(),
        Status=ScheduleStatus.Available
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

# Doctor: View patient list and queue order for today
def get_today_queue(db: Session, doctor_id: int, clinic_id: int, today: date):
    # Get all patients in live queue for this doctor and clinic today
    queue = db.query(LiveQueue).filter(
        LiveQueue.Clinic_ID == clinic_id,
        LiveQueue.Status == "Waiting"
    ).order_by(LiveQueue.QueueNumber).all()
    return queue

# Doctor: Access digital medical histories

# Doctor: Create a new medical record for a patient
def create_medical_record(db: Session, patient_id: int, doctor_id: int, clinic_id: int, notes: str):
    record = MedicalRecord(
        Patient_ID=patient_id,
        Doctor_ID=doctor_id,
        Clinic_ID=clinic_id,
        RecordDate=datetime.utcnow().date(),
        Notes=notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# Doctor: Update an existing medical record
def update_medical_record(db: Session, record_id: int, notes: str):
    record = db.query(MedicalRecord).filter(MedicalRecord.Record_ID == record_id).first()
    if not record:
        return None
    record.Notes = notes
    db.commit()
    db.refresh(record)
    return record

# Doctor: Record consultation outcome and mark as consulted
def mark_patient_consulted(db: Session, queue_id: int, notes: str = None):
    queue_entry = db.query(LiveQueue).filter(LiveQueue.Queue_ID == queue_id).first()
    if not queue_entry:
        return None
    queue_entry.Status = "Consulted"
    db.commit()
    db.refresh(queue_entry)
    # Optionally, add a medical record
    if notes:
        record = MedicalRecord(
            Patient_ID=queue_entry.Patient_ID,
            Doctor_ID=None,  # Set if available
            Clinic_ID=queue_entry.Clinic_ID,
            RecordDate=datetime.utcnow().date(),
            Notes=notes
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    # Find next patient in queue
    next_in_queue = db.query(LiveQueue).filter(
        LiveQueue.Status == "Waiting"
    ).order_by(LiveQueue.QueueNumber).first()
    if next_in_queue:
        create_in_app_notification(db, next_in_queue.Patient_ID, "You are next in the queue!")
    return queue_entry
