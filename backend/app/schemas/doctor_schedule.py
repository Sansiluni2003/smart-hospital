from pydantic import BaseModel
from typing import Optional
from datetime import date, time

class DoctorScheduleBase(BaseModel):
    DoctorID: Optional[int] = None
    AvailableDate: date
    StartTime: time
    EndTime: time
    Status: Optional[str] = "Available"
    max_patients: Optional[int] = 10

class DoctorScheduleCreate(DoctorScheduleBase):
    pass

class DoctorScheduleUpdate(BaseModel):
    AvailableDate: Optional[date] = None
    StartTime: Optional[time] = None
    EndTime: Optional[time] = None
    Status: Optional[str] = None
    max_patients: Optional[int] = None

class DoctorScheduleResponse(DoctorScheduleBase):
    ScheduleID: int

    class Config:
        from_attributes = True
