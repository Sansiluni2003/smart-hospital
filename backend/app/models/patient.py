from sqlalchemy import Boolean, Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.models import Base

class Patient(Base):
    __tablename__ = "Patient"

    Patient_ID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("User.UserID", ondelete="CASCADE"), unique=True, nullable=False)
    OPD_Id = Column(String(50), unique=True, nullable=False)
    Name = Column(String(255), nullable=False)
    Address = Column(String(255))
    Phone_No = Column(String(20), nullable=False)
    DateOfBirth = Column(Date)
    user = relationship("User")
    is_active = Column(Boolean, default=False)
