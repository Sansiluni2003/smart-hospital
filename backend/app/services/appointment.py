from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from datetime import datetime

# Create Appointment
def create_appointment(db: Session, appointment: AppointmentCreate):
    if not appointment.Patient_ID:
        raise ValueError("Patient_ID is required")
    db_appointment = Appointment(
        Patient_ID=appointment.Patient_ID,
        Doctor_ID=appointment.Doctor_ID,
        ClinicID=appointment.ClinicID,
        AppointmentDate=appointment.AppointmentDate,
        AppointmentTime=appointment.AppointmentTime,
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

# Get Appointments by Patient
def get_appointments_by_patient(db: Session, patient_id: int):
    appointments = db.query(Appointment).filter(Appointment.Patient_ID == patient_id).all()
    result = []
    for apt in appointments:
        doctor_name = apt.doctor.Name if apt.doctor else None
        speciality = apt.doctor.Speciality if apt.doctor else None
        result.append({
            "Appointment_ID": apt.Appointment_ID,
            "Patient_ID": apt.Patient_ID,
            "ClinicID": apt.ClinicID,
            "Doctor_ID": apt.Doctor_ID,
            "Doctor_Name": doctor_name,
            "Speciality": speciality,
            "AppointmentDate": apt.AppointmentDate,
            "AppointmentTime": apt.AppointmentTime,
            "Queue_Number": apt.Queue_Number,
            "QR_code": apt.QR_code,
            "Status": apt.Status,
            "CreatedAt": apt.CreatedAt,
        })
    return result

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