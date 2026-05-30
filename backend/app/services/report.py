from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.models.live_queue import LiveQueue

# 1. Appointment counts by clinic, doctor, status
def get_appointment_counts(db: Session, start_date, end_date):
    return db.query(
        Clinic.Name.label("clinic"),
        Doctor.Name.label("doctor"),
        Appointment.AppointmentDate.label("date"),
        Appointment.Status.label("status"),
        func.count(Appointment.Appointment_ID).label("count")
    ).join(Clinic, Clinic.ClinicID == Appointment.ClinicID
    ).join(Doctor, Doctor.Doctor_ID == Appointment.Doctor_ID
    ).filter(
        Appointment.AppointmentDate >= start_date,
        Appointment.AppointmentDate <= end_date
    ).group_by(Clinic.Name, Doctor.Name, Appointment.AppointmentDate, Appointment.Status).all()

# 2. Patient arrival/completion rates
def get_arrival_completion_rates(db: Session, start_date, end_date):
    return db.query(
        Appointment.AppointmentDate.label("date"),
        func.count(Appointment.Appointment_ID).label("total_appointments"),
        func.sum(Appointment.Status == AppointmentStatus.Arrived).label("arrived"),
        func.sum(Appointment.Status == AppointmentStatus.Completed).label("completed")
    ).filter(
        Appointment.AppointmentDate >= start_date,
        Appointment.AppointmentDate <= end_date
    ).group_by(Appointment.AppointmentDate).all()

# 3. Doctor workload
def get_doctor_workload(db: Session, start_date, end_date):
    return db.query(
        Doctor.Name.label("doctor"),
        Appointment.AppointmentDate.label("date"),
        func.count(Appointment.Appointment_ID).label("appointment_count")
    ).join(Doctor, Doctor.Doctor_ID == Appointment.Doctor_ID
    ).filter(
        Appointment.AppointmentDate >= start_date,
        Appointment.AppointmentDate <= end_date
    ).group_by(Doctor.Name, Appointment.AppointmentDate).all()

# 4. Queue wait times (average per clinic per day)
def get_queue_wait_times(db: Session, start_date, end_date):
    return db.query(
        Clinic.Name.label("clinic"),
        LiveQueue.ArrivalDate.label("date"),
        func.avg(func.timestampdiff(func.MINUTE, LiveQueue.ArrivalTime, LiveQueue.ConsultedTime)).label("average_wait_minutes")
    ).join(Clinic, Clinic.ClinicID == LiveQueue.Clinic_ID
    ).filter(
        LiveQueue.ArrivalDate >= start_date,
        LiveQueue.ArrivalDate <= end_date,
        LiveQueue.ArrivalTime != None,
        LiveQueue.ConsultedTime != None
    ).group_by(Clinic.Name, LiveQueue.ArrivalDate).all()