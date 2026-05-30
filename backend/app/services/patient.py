from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.models.user import User
from app.models.appointment import Appointment
from app.models.clinic import Clinic
from datetime import datetime, time
import qrcode
import os

# Register a new patient (and user)
def create_patient(db: Session, patient: PatientCreate):
    # Create User first
    db_user = User(
        Email=patient.Email,
        Password=patient.Password,  # Hash in production!
        Role="Patient",
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
    db_appointment.Status = "Arrived"
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

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
def book_appointment(db: Session, patient_id: int, appointment_data):
    clinic = db.query(Clinic).filter(Clinic.ClinicID == appointment_data.Clinic_ID).first()
    count = db.query(Appointment).filter(
        Appointment.ClinicID == clinic.ClinicID,
        Appointment.AppointmentDate == appointment_data.AppointmentDate.date()
    ).count()
    if count >= clinic.MaxPatients:
        raise ValueError("Clinic has reached its maximum patient count for the day.")

    appointment_dt = appointment_data.AppointmentDate  # Should be a datetime object

    # Validate weekday
    if not is_weekday(appointment_dt):
        raise ValueError("Appointments can only be booked on weekdays (Monday–Friday).")

    # Validate clinic hours
    if not is_within_clinic_hours(appointment_dt):
        raise ValueError("Appointments can only be booked between 08:00 and 16:00.")

    db_appointment = Appointment(
        Patient_ID=patient_id,
        ClinicID=appointment_data.Clinic_ID,
        AppointmentDate=appointment_data.AppointmentDate,
        Status=AppointmentStatus.Pending_Allocation,
        CreatedAt=datetime.utcnow(),
        # Generate queue number logic here
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    # Generate QR code
    qr_data = f"appointment_id:{db_appointment.Appointment_ID}|patient_id:{patient_id}"
    qr_dir = os.path.join(os.getcwd(), "qr_codes")
    os.makedirs(qr_dir, exist_ok=True)
    qr_filename = f"qr_{db_appointment.Appointment_ID}.png"
    qr_path = os.path.join(qr_dir, qr_filename)
    generate_qr_code(qr_data, qr_path)
    db_appointment.QR_code = qr_path
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# Business logic: Confirm arrival
def confirm_arrival(db: Session, appointment_id: int):
    db_appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not db_appointment:
        return None
    db_appointment.Status = "Arrived"
    db.commit()
    db.refresh(db_appointment)
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
