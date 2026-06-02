from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP
from app.models import Base
import enum

class UserRole(enum.Enum):
    Patient = "Patient"
    Doctor = "Doctor"
    Staff = "Staff"
    Admin = "Admin"

class UserStatus(enum.Enum):
    Pending = "Pending"
    Active = "Active"

class User(Base):
    __tablename__ = "User"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    Email = Column(String(255), unique=True, nullable=False)
    Password = Column(String(255), nullable=False)
    Role = Column(Enum(UserRole), nullable=False)
    Status = Column(Enum(UserStatus), nullable=False, default=UserStatus.Pending)
    CreatedAt = Column(TIMESTAMP, nullable=False)
