from pydantic import BaseModel
from typing import Optional

class ClinicBase(BaseModel):
    Name: str
    Location: Optional[str] = None
    MaxPatients: Optional[int] = None

class ClinicCreate(ClinicBase):
    pass

class ClinicUpdate(BaseModel):
    Name: Optional[str] = None
    Location: Optional[str] = None
    MaxPatients: Optional[int] = None

class ClinicResponse(ClinicBase):
    Clinic_ID: int

    class Config:
        orm_mode = True
