from sqlalchemy import Column, Integer, Text, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models import Base

class NotificationType(enum.Enum):
    SMS = "SMS"
    Email = "Email"

class NotificationStatus(enum.Enum):
    Sent = "Sent"
    Failed = "Failed"
    Pending = "Pending"

class Notification(Base):
    __tablename__ = "Notification"

    Notification_ID = Column(Integer, primary_key=True, autoincrement=True)
    Patient_ID = Column(Integer, ForeignKey("Patient.Patient_ID", ondelete="CASCADE"), nullable=False)
    Message = Column(Text, nullable=False)
    NotificationType = Column(Enum(NotificationType), nullable=False)
    Status = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.Pending)
    Sent_Time = Column(TIMESTAMP)
    patient = relationship("Patient")
