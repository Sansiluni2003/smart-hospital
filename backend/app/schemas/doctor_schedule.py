from pydantic import BaseModel
from typing import Optional
from datetime import date

class DoctorScheduleBase(BaseModel):
    Doctor_ID: int
    Clinic_ID: int
    ScheduleDate: date
    StartTime: str
    EndTime: str
    max_patients: Optional[int] = 10  # New field for maximum patients per schedule

class DoctorScheduleCreate(DoctorScheduleBase):
    pass

class DoctorScheduleUpdate(BaseModel):
    ScheduleDate: Optional[date] = None
    StartTime: Optional[str] = None
    EndTime: Optional[str] = None
    max_patients: Optional[int] = None
class DoctorScheduleResponse(DoctorScheduleBase):
    Schedule_ID: int

    class Config:
        orm_mode = True
