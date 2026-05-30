from sqlalchemy import Column, Integer, String, Time
from app.models import Base

class Clinic(Base):
    __tablename__ = "Clinic"

    ClinicID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(255), nullable=False)
    OperatingDays = Column(String(100), default="Weekdays")
    StartTime = Column(Time, default="08:00:00")
    EndTime = Column(Time, default="15:00:00")
    MaxPatients = Column(Integer, default=100)
