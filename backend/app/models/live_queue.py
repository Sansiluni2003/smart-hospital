from sqlalchemy import Column, Integer, TIMESTAMP, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models import Base

class LiveQueueStatus(enum.Enum):
    Waiting = "Waiting"
    In_Consultation = "In Consultation"
    Skipped = "Skipped"
    Completed = "Completed"

class LiveQueue(Base):
    __tablename__ = "LiveQueue"

    LiveQueueID = Column(Integer, primary_key=True, autoincrement=True)
    AppointmentID = Column(Integer, ForeignKey("Appointment.Appointment_ID", ondelete="CASCADE"), nullable=False)
    DoctorID = Column(Integer, ForeignKey("Doctor.Doctor_ID", ondelete="CASCADE"), nullable=False)
    PatientID = Column(Integer, ForeignKey("Patient.Patient_ID", ondelete="CASCADE"), nullable=False)
    QueuePosition = Column(Integer, nullable=False)
    ArrivalTime = Column(TIMESTAMP)
    Status = Column(
        Enum(
            LiveQueueStatus,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=LiveQueueStatus.Waiting,
    )
    appointment = relationship("Appointment")
    doctor = relationship("Doctor")
    patient = relationship("Patient")
