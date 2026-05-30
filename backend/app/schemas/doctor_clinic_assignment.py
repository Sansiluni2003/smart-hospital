from pydantic import BaseModel
from typing import Optional

class DoctorClinicAssignmentBase(BaseModel):
    Doctor_ID: int
    Clinic_ID: int
    AssignedDate: Optional[str] = None

class DoctorClinicAssignmentCreate(DoctorClinicAssignmentBase):
    pass

class DoctorClinicAssignmentResponse(DoctorClinicAssignmentBase):
    Assignment_ID: int

    class Config:
        orm_mode = True
