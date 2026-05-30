
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.live_queue import LiveQueue
from app.models.doctor_schedule import DoctorSchedule
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.schemas.appointment import AppointmentUpdate
from datetime import datetime
from app.models.patient import Patient
from app.utils.notification import send_sms, send_email

# 1. Verify patient arrival using QR code (appointment_id)
def verify_patient_arrival(db: Session, appointment_id: int):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None
    appointment.Status = AppointmentStatus.Arrived
    db.commit()
    db.refresh(appointment)
    # Add to live queue
    live_queue = LiveQueue(
        Clinic_ID=appointment.ClinicID,
        Patient_ID=appointment.Patient_ID,
        QueueNumber=appointment.Queue_Number,
        Status="Waiting"
    )
    db.add(live_queue)
    db.commit()
    db.refresh(live_queue)
    return appointment

# 2. Allocate appointment to doctor, add to live queue, and notify patient
def allocate_appointment(db: Session, appointment_id: int, doctor_id: int, appointment_time: datetime):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None
    # Assign doctor and time
    appointment.Doctor_ID = doctor_id
    appointment.AppointmentTime = appointment_time.time()
    appointment.Status = AppointmentStatus.Allocated
    db.commit()
    db.refresh(appointment)

    # Add to live queue (if not already present)
    existing_queue = db.query(LiveQueue).filter(
        LiveQueue.Clinic_ID == appointment.ClinicID,
        LiveQueue.Patient_ID == appointment.Patient_ID,
        LiveQueue.Status == "Waiting"
    ).first()
    if not existing_queue:
        live_queue = LiveQueue(
            Clinic_ID=appointment.ClinicID,
            Patient_ID=appointment.Patient_ID,
            QueueNumber=appointment.Queue_Number,
            Status="Waiting"
        )
        db.add(live_queue)
        db.commit()
        db.refresh(live_queue)

    # Send notification to patient (stub)
    # from app.services.patient import send_notification
    # send_notification(db, appointment.Patient_ID, f"Your appointment is scheduled at {appointment_time.strftime('%H:%M')}.")

    return appointment

# 3. Reschedule appointment
def reschedule_appointment(db: Session, appointment_id: int, new_time: datetime):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None
    appointment.AppointmentTime = new_time.time()
    appointment.Status = AppointmentStatus.Allocated
    db.commit()
    db.refresh(appointment)
    return appointment

# 4. Get live queue for a clinic
def get_live_queue(db: Session, clinic_id: int):
    return db.query(LiveQueue).filter(LiveQueue.Clinic_ID == clinic_id, LiveQueue.Status == "Waiting").order_by(LiveQueue.QueueNumber).all()

# 5. Monitor doctor availability
def get_doctor_availability(db: Session, doctor_id: int, date: datetime):
    # Returns doctor's schedule for the day and current appointments
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.Doctor_ID == doctor_id,
        DoctorSchedule.ScheduleDate == date.date()
    ).all()
    appointments = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor_id,
        Appointment.AppointmentDate == date.date(),
        Appointment.Status.in_([AppointmentStatus.Allocated, AppointmentStatus.In_Progress])
    ).all()
    return {"schedule": schedule, "appointments": appointments}

# Staff: Verify and activate patient account
def activate_patient_account(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not patient:
        return None
    patient.is_active = True  # Make sure this field exists in your Patient model
    db.commit()
    db.refresh(patient)
    return patient

# Staff: Allocate appointment to doctor
def allocate_appointment(db: Session, appointment_id: int, doctor_id: int, appointment_time: datetime):
    appointment = db.query(Appointment).filter(Appointment.Appointment_ID == appointment_id).first()
    if not appointment:
        return None
    # Check if doctor has a schedule for this time
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.Doctor_ID == doctor_id,
        DoctorSchedule.ScheduleDate == appointment_time.date(),
        DoctorSchedule.StartTime <= appointment_time.time(),
        DoctorSchedule.EndTime >= appointment_time.time()
    ).first()
    if not schedule:
        raise ValueError("No schedule found for this doctor and time.")
    count = db.query(Appointment).filter(
        Appointment.Doctor_ID == doctor_id,
        Appointment.AppointmentDate == appointment_time.date(),
        Appointment.AppointmentTime >= schedule.StartTime,
        Appointment.AppointmentTime <= schedule.EndTime,
        Appointment.Status.in_([AppointmentStatus.Allocated, AppointmentStatus.In_Progress])
    ).count()
    if count >= schedule.max_patients:
        raise ValueError("This slot has reached its maximum patient count.")
    # Assign doctor and time
    appointment.Doctor_ID = doctor_id
    appointment.AppointmentTime = appointment_time.time()
    appointment.Status = AppointmentStatus.Allocated
    db.commit()
    db.refresh(appointment)

    # Add to live queue (if not already present)
    existing_queue = db.query(LiveQueue).filter(
        LiveQueue.Clinic_ID == appointment.ClinicID,
        LiveQueue.Patient_ID == appointment.Patient_ID,
        LiveQueue.Status == "Waiting"
    ).first()
    if not existing_queue:
        live_queue = LiveQueue(
            Clinic_ID=appointment.ClinicID,
            Patient_ID=appointment.Patient_ID,
            QueueNumber=appointment.Queue_Number,
            Status="Waiting"
        )
        db.add(live_queue)
        db.commit()
        db.refresh(live_queue)

    # Send SMS and Email notification to patient
    patient = db.query(Patient).filter(Patient.Patient_ID == appointment.Patient_ID).first()
    if patient:
        # You may need to add Email field to Patient or join with User
        sms_message = f"Your appointment is scheduled at {appointment_time.strftime('%H:%M')}."
        send_sms(patient.Phone_No, sms_message)
        # If patient has email, send email as well
        if hasattr(patient, 'Email') and patient.Email:
            send_email(patient.Email, "Appointment Scheduled", sms_message)

    return appointment
