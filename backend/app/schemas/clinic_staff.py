from pydantic import BaseModel
from typing import Optional

class ClinicStaffBase(BaseModel):
    UserID: int
    Clinic_ID: int
    Position: Optional[str] = None

class ClinicStaffCreate(ClinicStaffBase):
    pass

class ClinicStaffUpdate(BaseModel):
    Position: Optional[str] = None

class ClinicStaffResponse(ClinicStaffBase):
    Staff_ID: int

    class Config:
        orm_mode = True
