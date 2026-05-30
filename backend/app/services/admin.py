from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.models.audit_log import AuditLog
from datetime import datetime

# Admin: Create user (doctor or staff)
def create_user(db: Session, user: UserCreate):
    db_user = User(
        Email=user.Email,
        Password=user.Password,  # Hash in production!
        Role=user.Role,
        CreatedAt=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Admin: Get user by ID
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.UserID == user_id).first()

# Admin: Get all users (optionally filter by role)
def get_users(db: Session, role: UserRole = None, skip: int = 0, limit: int = 100):
    query = db.query(User)
    if role:
        query = query.filter(User.Role == role)
    return query.offset(skip).limit(limit).all()

# Admin: Update user
def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = db.query(User).filter(User.UserID == user_id).first()
    if not db_user:
        return None
    for var, value in vars(user_update).items():
        if value is not None:
            setattr(db_user, var, value)
    db.commit()
    db.refresh(db_user)
    return db_user

# Admin: Delete user
def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.UserID == user_id).first()
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user

# Admin: Monitor system activity (view audit logs)
def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AuditLog).order_by(AuditLog.Timestamp.desc()).offset(skip).limit(limit).all()

# Admin: Generate operational/performance reports (stub)
def generate_report(db: Session, report_type: str, start_date: datetime, end_date: datetime):
    # Implement logic for different report types (appointments, queue stats, etc.)
    # Example: return count of appointments in date range
    if report_type == "appointments":
        from app.models.appointment import Appointment
        return db.query(Appointment).filter(Appointment.CreatedAt >= start_date, Appointment.CreatedAt <= end_date).count()
    # Add more report types as needed
    return None
