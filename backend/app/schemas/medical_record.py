from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MedicalRecordBase(BaseModel):
    Appointment_ID: int
    Patient_ID: int
    Doctor_ID: int
    ConsultationNotes: Optional[str] = None
    Prescription: Optional[str] = None
    RecordDate: Optional[datetime] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    ConsultationNotes: Optional[str] = None
    Prescription: Optional[str] = None

class MedicalRecordResponse(MedicalRecordBase):
    Record_ID: int

    class Config:
        orm_mode = True
