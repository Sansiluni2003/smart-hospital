from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate
from datetime import datetime

# Create Audit Log
def create_audit_log(db: Session, audit_log: AuditLogCreate):
    db_audit_log = AuditLog(
        UserID=audit_log.UserID,
        Action=audit_log.Action,
        Details=audit_log.Details,
        Timestamp=audit_log.Timestamp or datetime.utcnow()
    )
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

# Get Audit Log by ID
def get_audit_log(db: Session, log_id: int):
    return db.query(AuditLog).filter(AuditLog.LogID == log_id).first()

# Get All Audit Logs
def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AuditLog).offset(skip).limit(limit).all()

# Delete Audit Log
def delete_audit_log(db: Session, log_id: int):
    db_audit_log = db.query(AuditLog).filter(AuditLog.LogID == log_id).first()
    if not db_audit_log:
        return None
    db.delete(db_audit_log)
    db.commit()
    return db_audit_log
