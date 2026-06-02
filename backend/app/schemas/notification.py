from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    Patient_ID: int
    Message: str
    NotificationType: str
    Status: Optional[str] = "Pending"
    Sent_Time: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    Status: Optional[str] = None

class NotificationResponse(NotificationBase):
    Notification_ID: int

    class Config:
        orm_mode = True
