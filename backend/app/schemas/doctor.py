from pydantic import BaseModel, EmailStr
from typing import Optional

class DoctorBase(BaseModel):
    UserID: int
    Name: str
    Speciality: Optional[str] = None  # Match model spelling
    Phone_No: Optional[str] = None
    AverageConsultationMinutes: Optional[int] = 10

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    Name: Optional[str] = None
    Speciality: Optional[str] = None
    Phone_No: Optional[str] = None
    AverageConsultationMinutes: Optional[int] = None

class DoctorProfileUpdate(BaseModel):
    Name: Optional[str] = None
    Speciality: Optional[str] = None
    Phone_No: Optional[str] = None
    Email: Optional[EmailStr] = None

class DoctorConsultationComplete(BaseModel):
    ConsultationNotes: Optional[str] = None
    Prescription: Optional[str] = None
    AppointmentNotes: Optional[str] = None

class DoctorPasswordUpdate(BaseModel):
    CurrentPassword: str
    NewPassword: str

class DoctorResponse(DoctorBase):
    Doctor_ID: int

    class Config:
        from_attributes = True
