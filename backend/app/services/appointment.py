from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from datetime import datetime

# Create Appointment
def create_appointment(db: Session, appointment: AppointmentCreate):
    db_appointment = Appointment(
        Patient_ID=appointment.Patient_ID,
        Doctor_ID=appointment.Doctor_ID,
        ClinicID=appointment.Clinic_ID,
        AppointmentDate=appointment.AppointmentDate.date(),
        AppointmentTime=appointment.AppointmentDate.time() if hasattr(appointment.AppointmentDate, 'time') else None,
        Status=AppointmentStatus.Pending_Allocation,
        CreatedAt=datetime.utcnow()
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# Get Appointment by ID
def get_appointment(db: Session, appointment_id: int):
    return db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()

# Get All Appointments
def get_appointments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Appointment).offset(skip).limit(limit).all()

# Update Appointment
def update_appointment(db: Session, appointment_id: int, appointment_update: AppointmentUpdate):
    db_appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not db_appointment:
        return None
    for var, value in vars(appointment_update).items():
        if value is not None:
            setattr(db_appointment, var, value)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# Delete Appointment
def delete_appointment(db: Session, appointment_id: int):
    db_appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not db_appointment:
        return None
    db.delete(db_appointment)
    db.commit()
    return db_appointment