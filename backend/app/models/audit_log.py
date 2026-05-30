from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship

from app.models import Base

class AuditLog(Base):
    __tablename__ = "AuditLog"

    LogID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("User.UserID", ondelete="CASCADE"), nullable=False)
    Action = Column(String(255), nullable=False)
    Details = Column(Text)
    Timestamp = Column(TIMESTAMP)
    user = relationship("User")
