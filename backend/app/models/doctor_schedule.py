from sqlalchemy import Column, Integer, Date, Time, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models import Base

class ScheduleStatus(enum.Enum):
    Available = "Available"
    Booked = "Booked"
    Unavailable = "Unavailable"

class DoctorSchedule(Base):
    __tablename__ = "DoctorSchedule"

    ScheduleID = Column(Integer, primary_key=True, autoincrement=True)
    DoctorID = Column(Integer, ForeignKey("Doctor.Doctor_ID", ondelete="CASCADE"), nullable=False)
    AvailableDate = Column(Date, nullable=False)
    StartTime = Column(Time, nullable=False)
    EndTime = Column(Time, nullable=False)
    Status = Column(Enum(ScheduleStatus), default=ScheduleStatus.Available)
    doctor = relationship("Doctor")
    max_patients = Column(Integer, default=10)  # New field for maximum patients per schedule
