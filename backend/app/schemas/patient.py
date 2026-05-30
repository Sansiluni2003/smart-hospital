from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class PatientBase(BaseModel):
    Name: str
    Address: Optional[str] = None
    Phone_No: str
    DateOfBirth: Optional[date] = None
    OPD_Id: str

class PatientCreate(PatientBase):
    Email: EmailStr
    Password: str

class PatientUpdate(BaseModel):
    Name: Optional[str] = None
    Address: Optional[str] = None
    Phone_No: Optional[str] = None
    DateOfBirth: Optional[date] = None

class PatientResponse(PatientBase):
    Patient_ID: int
    UserID: int
    Email: EmailStr

    class Config:
        orm_mode = True