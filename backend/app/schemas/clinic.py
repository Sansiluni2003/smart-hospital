from pydantic import BaseModel
from typing import Optional
from datetime import time

class ClinicBase(BaseModel):
    Name: str
    OperatingDays: Optional[str] = "Weekdays"
    StartTime: Optional[time] = None
    EndTime: Optional[time] = None
    MaxPatients: Optional[int] = 100

class ClinicCreate(ClinicBase):
    pass

class ClinicUpdate(BaseModel):
    Name: Optional[str] = None
    OperatingDays: Optional[str] = None
    StartTime: Optional[time] = None
    EndTime: Optional[time] = None
    MaxPatients: Optional[int] = None

class ClinicResponse(ClinicBase):
    ClinicID: int

    class Config:
        orm_mode = True
