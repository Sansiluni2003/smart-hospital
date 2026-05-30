from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base

class ClinicStaff(Base):
    __tablename__ = "Clinic_Staff"

    Staff_ID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("User.UserID", ondelete="CASCADE"), unique=True, nullable=False)
    Name = Column(String(255), nullable=False)
    Phone_No = Column(String(20))
    JobTitle = Column(String(100))
    ClinicID = Column(Integer, ForeignKey("Clinic.ClinicID"))
    user = relationship("User")
    clinic = relationship("Clinic")
