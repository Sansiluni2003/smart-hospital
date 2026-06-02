from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
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
    rows = db.query(
        Appointment.AppointmentDate,
        Appointment.Status,
    ).filter(
        Appointment.AppointmentDate >= start_date,
        Appointment.AppointmentDate <= end_date
    ).all()

    grouped = {}
    for appointment_date, status in rows:
        key = appointment_date.isoformat() if hasattr(appointment_date, "isoformat") else str(appointment_date)
        if key not in grouped:
            grouped[key] = {
                "date": key,
                "total_appointments": 0,
                "arrived": 0,
                "completed": 0,
            }

        grouped[key]["total_appointments"] += 1

        status_value = status.value if hasattr(status, "value") else str(status)
        if status_value == AppointmentStatus.Arrived.value:
            grouped[key]["arrived"] += 1
        if status_value == AppointmentStatus.Completed.value:
            grouped[key]["completed"] += 1

    return list(grouped.values())

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
    rows = db.query(
        Clinic.Name,
        Appointment.AppointmentDate,
        Appointment.AppointmentTime,
        LiveQueue.ArrivalTime,
    ).join(Appointment, Appointment.Appointment_ID == LiveQueue.AppointmentID
    ).join(Clinic, Clinic.ClinicID == Appointment.ClinicID
    ).filter(
        Appointment.AppointmentDate >= start_date,
        Appointment.AppointmentDate <= end_date,
        Appointment.AppointmentTime != None,
        LiveQueue.ArrivalTime != None,
    ).all()

    grouped = {}
    for clinic_name, appointment_date, appointment_time, arrival_time in rows:
        key_date = appointment_date.isoformat() if hasattr(appointment_date, "isoformat") else str(appointment_date)
        key = (clinic_name, key_date)

        scheduled_dt = datetime.combine(appointment_date, appointment_time)
        wait_minutes = (arrival_time - scheduled_dt).total_seconds() / 60.0

        if key not in grouped:
            grouped[key] = {
                "clinic": clinic_name,
                "date": key_date,
                "wait_values": [],
            }

        grouped[key]["wait_values"].append(wait_minutes)

    results = []
    for value in grouped.values():
        waits = value["wait_values"]
        average_wait = sum(waits) / len(waits) if waits else 0
        results.append(
            {
                "clinic": value["clinic"],
                "date": value["date"],
                "average_wait_minutes": round(average_wait, 2),
            }
        )

    return results