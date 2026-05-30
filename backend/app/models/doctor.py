from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base

class Doctor(Base):
    __tablename__ = "Doctor"

    Doctor_ID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("User.UserID", ondelete="CASCADE"), unique=True, nullable=False)
    Name = Column(String(255), nullable=False)
    Phone_No = Column(String(20))
    Speciality = Column(String(100))
    AverageConsultationMinutes = Column(Integer, default=10)
    user = relationship("User")
