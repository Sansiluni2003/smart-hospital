from pydantic import BaseModel
from typing import Optional

class ClinicStaffBase(BaseModel):
    UserID: int
    Name: str
    Phone_No: Optional[str] = None
    JobTitle: Optional[str] = None
    ClinicID: int

class ClinicStaffCreate(ClinicStaffBase):
    pass

class ClinicStaffUpdate(BaseModel):
    Name: Optional[str] = None
    Phone_No: Optional[str] = None
    JobTitle: Optional[str] = None
    ClinicID: Optional[int] = None

class ClinicStaffResponse(ClinicStaffBase):
    Staff_ID: int

    class Config:
        orm_mode = True

class ClinicStaffOut(BaseModel):
    Staff_ID: int
    UserID: int
    Name: str
    Phone_No: str
    JobTitle: str
    ClinicID: int

    class Config:
        from_attributes = True  # For Pydantic v2, replaces orm_mode
