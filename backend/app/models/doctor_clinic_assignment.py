from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models import Base

class DoctorClinicAssignment(Base):
    __tablename__ = "Doctor_Clinic_Assignment"
    __table_args__ = (UniqueConstraint('DoctorID', 'ClinicID', name='uix_doctor_clinic'),)

    AssignmentID = Column(Integer, primary_key=True, autoincrement=True)
    DoctorID = Column(Integer, ForeignKey("Doctor.Doctor_ID", ondelete="CASCADE"), nullable=False)
    ClinicID = Column(Integer, ForeignKey("Clinic.ClinicID", ondelete="CASCADE"), nullable=False)
    doctor = relationship("Doctor")
    clinic = relationship("Clinic")
