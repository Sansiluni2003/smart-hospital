from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    Patient = "Patient"
    Doctor = "Doctor"
    Staff = "Staff"
    Admin = "Admin"

class UserBase(BaseModel):
    Email: EmailStr
    Role: UserRole

class UserCreate(UserBase):
    Password: str

class UserUpdate(BaseModel):
    Email: Optional[EmailStr] = None
    Password: Optional[str] = None
    Role: Optional[UserRole] = None

class UserResponse(UserBase):
    UserID: int
    CreatedAt: datetime

    class Config:
        orm_mode = True
