from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Enum, TIMESTAMP
from sqlalchemy.orm import relationship
import enum

from app.models import Base

class AppointmentStatus(enum.Enum):
    Pending_Allocation = "Pending Allocation"
    Allocated = "Allocated"
    Arrived = "Arrived"
    In_Progress = "In Progress"
    Completed = "Completed"
    Cancelled = "Cancelled"
    Skipped = "Skipped"

class Appointment(Base):
    __tablename__ = "Appointment"

    Appointment_ID = Column(Integer, primary_key=True, autoincrement=True)
    Patient_ID = Column(Integer, ForeignKey("Patient.Patient_ID", ondelete="CASCADE"), nullable=False)
    ClinicID = Column(Integer, ForeignKey("Clinic.ClinicID", ondelete="CASCADE"), nullable=False)
    Doctor_ID = Column(Integer, ForeignKey("Doctor.Doctor_ID", ondelete="CASCADE"), nullable=True)
    AppointmentDate = Column(Date, nullable=False)
    AppointmentTime = Column(Time, nullable=True)
    Queue_Number = Column(Integer)
    QR_code = Column(String(255), unique=True)
    Status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.Pending_Allocation)
    CreatedAt = Column(TIMESTAMP)
    patient = relationship("Patient")
    clinic = relationship("Clinic")
    doctor = relationship("Doctor")
