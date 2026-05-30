from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    Patient_ID: int
    Doctor_ID: int
    Clinic_ID: int
    AppointmentDate: datetime
    Status: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    AppointmentDate: Optional[datetime] = None
    Status: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    Appointment_ID: int

    class Config:
        orm_mode = True
