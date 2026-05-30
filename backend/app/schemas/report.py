from pydantic import BaseModel
from typing import List, Optional

class AppointmentCountReport(BaseModel):
    clinic: str
    doctor: Optional[str]
    date: str
    status: str
    count: int

class ArrivalCompletionReport(BaseModel):
    date: str
    total_appointments: int
    arrived: int
    completed: int

class DoctorWorkloadReport(BaseModel):
    doctor: str
    date: str
    appointment_count: int

class QueueWaitTimeReport(BaseModel):
    clinic: str
    date: str
    average_wait_minutes: float