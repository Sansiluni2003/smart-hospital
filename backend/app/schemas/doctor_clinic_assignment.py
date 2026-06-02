from pydantic import BaseModel

class DoctorClinicAssignmentBase(BaseModel):
    DoctorID: int
    ClinicID: int

class DoctorClinicAssignmentCreate(DoctorClinicAssignmentBase):
    pass

class DoctorClinicAssignmentResponse(DoctorClinicAssignmentBase):
    AssignmentID: int

    class Config:
        orm_mode = True
