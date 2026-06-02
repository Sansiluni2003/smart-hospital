from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time

class AppointmentBase(BaseModel):
    Patient_ID: int
    ClinicID: int
    Doctor_ID: Optional[int] = None
    Doctor_Name: Optional[str] = None
    Speciality: Optional[str] = None
    AppointmentDate: date
    AppointmentTime: Optional[time] = None
    Queue_Number: Optional[int] = None
    QR_code: Optional[str] = None
    Status: Optional[str] = None
    CreatedAt: Optional[datetime] = None

class AppointmentUpdate(BaseModel):
    AppointmentDate: Optional[date] = None
    AppointmentTime: Optional[time] = None
    Status: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    Appointment_ID: int

    class Config:
        orm_mode = True

class AppointmentCreate(BaseModel):
    ClinicID: int
    Doctor_ID: Optional[int] = None
    AppointmentDate: date
    AppointmentTime: Optional[time] = None
    Notes: Optional[str] = None
