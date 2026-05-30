from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base

class MedicalRecord(Base):
    __tablename__ = "Medical_Record"

    Record_ID = Column(Integer, primary_key=True, autoincrement=True)
    Appointment_ID = Column(Integer, ForeignKey("Appointment.Appointment_ID", ondelete="CASCADE"), nullable=False)
    Patient_ID = Column(Integer, ForeignKey("Patient.Patient_ID", ondelete="CASCADE"), nullable=False)
    Doctor_ID = Column(Integer, ForeignKey("Doctor.Doctor_ID", ondelete="CASCADE"), nullable=False)
    ConsultationNotes = Column(Text)
    Prescription = Column(Text)
    RecordDate = Column(TIMESTAMP)
    appointment = relationship("Appointment")
    patient = relationship("Patient")
    doctor = relationship("Doctor")
