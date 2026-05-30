from pydantic import BaseModel
from typing import Optional
from datetime import date

class DoctorBase(BaseModel):
    UserID: int
    Name: str
    Specialty: Optional[str] = None
    Phone_No: Optional[str] = None
    DateOfBirth: Optional[date] = None

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    Name: Optional[str] = None
    Specialty: Optional[str] = None
    Phone_No: Optional[str] = None
    DateOfBirth: Optional[date] = None

class DoctorResponse(DoctorBase):
    Doctor_ID: int

    class Config:
        orm_mode = True
