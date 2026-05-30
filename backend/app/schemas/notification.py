from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    UserID: int
    Message: str
    CreatedAt: datetime
    Read: Optional[bool] = False

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    Read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    Notification_ID: int

    class Config:
        orm_mode = True
