from pydantic import BaseModel
from typing import Optional

class LiveQueueBase(BaseModel):
    Clinic_ID: int
    Patient_ID: int
    QueueNumber: int
    Status: Optional[str] = None

class LiveQueueCreate(LiveQueueBase):
    pass

class LiveQueueUpdate(BaseModel):
    Status: Optional[str] = None

class LiveQueueResponse(LiveQueueBase):
    Queue_ID: int

    class Config:
        orm_mode = True
