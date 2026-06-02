from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LiveQueueBase(BaseModel):
    AppointmentID: int
    DoctorID: int
    PatientID: int
    QueuePosition: int
    ArrivalTime: Optional[datetime] = None
    Status: Optional[str] = "Waiting"

class LiveQueueCreate(LiveQueueBase):
    pass

class LiveQueueUpdate(BaseModel):
    Status: Optional[str] = None

class LiveQueueResponse(LiveQueueBase):
    LiveQueueID: int

    class Config:
        orm_mode = True
