from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    UserID: int
    Action: str
    Timestamp: datetime
    Details: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    LogID: int

    class Config:
        orm_mode = True
