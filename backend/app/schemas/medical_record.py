from pydantic import BaseModel
from typing import Optional
from datetime import date

class MedicalRecordBase(BaseModel):
    Patient_ID: int
    Doctor_ID: int
    Clinic_ID: int
    RecordDate: date
    Notes: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    Notes: Optional[str] = None

class MedicalRecordResponse(MedicalRecordBase):
    Record_ID: int

    class Config:
        orm_mode = True
