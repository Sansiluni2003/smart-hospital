from sqlalchemy.orm import Session
from app.models.user import User, UserRole, UserStatus
from app.models.audit_log import AuditLog
from app.models.doctor import Doctor
from app.models.clinic_staff import ClinicStaff
from app.schemas.doctor import DoctorCreate
from app.schemas.clinic_staff import ClinicStaffCreate
from datetime import datetime
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

# Admin: Create user (doctor or staff)
def create_user(db: Session, user: UserCreate):
    user_status = UserStatus.Pending if user.Role == UserRole.Patient else UserStatus.Active
    db_user = User(
        Email=user.Email,
        Password=get_password_hash(user.Password[:72]),
        Role=user.Role,
        Status=user_status,
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
            if var == "Password":
                value = get_password_hash(value[:72])
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
def get_audit_logs(db: Session):
    return db.query(AuditLog).order_by(AuditLog.Timestamp.desc()).all()

# Admin: Manage users (list all users)
def manage_users(db: Session):
    return db.query(User).all()

# Admin: Generate report
def generate_report(db: Session):
    user_count = db.query(User).count()
    doctor_count = db.query(Doctor).count()
    staff_count = db.query(ClinicStaff).count()
    return {
        "total_users": user_count,
        "total_doctors": doctor_count,
        "total_staff": staff_count
    }

# Admin: Create doctor
def create_doctor(db: Session, doctor_in: DoctorCreate):
    db_doctor = Doctor(
        UserID=doctor_in.UserID,
        Name=doctor_in.Name,
        Speciality=doctor_in.Speciality,
        Phone_No=doctor_in.Phone_No,
        AverageConsultationMinutes=doctor_in.AverageConsultationMinutes or 10
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

# Admin: Delete doctor
def delete_doctor(db: Session, doctor_id: int):
    db_doctor = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
    if not db_doctor:
        return None
    db.delete(db_doctor)
    db.commit()
    return db_doctor
# CRUD: Get doctor by ID
def get_doctor(db: Session, doctor_id: int):
    return db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()

# CRUD: Get all doctors
def get_doctors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Doctor).offset(skip).limit(limit).all()



# Admin: Create staff
def create_clinic_staff(db: Session, staff_in: ClinicStaffCreate):
    db_staff = ClinicStaff(
        UserID=staff_in.UserID,
        Name=staff_in.Name,
        Phone_No=staff_in.Phone_No,
        JobTitle=staff_in.JobTitle,
        ClinicID=staff_in.ClinicID
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

# Admin: Delete staff
def delete_clinic_staff(db: Session, staff_id: int):
    db_staff = db.query(ClinicStaff).filter(ClinicStaff.Staff_ID == staff_id).first()
    if not db_staff:
        return None
    db.delete(db_staff)
    db.commit()
    return db_staff

# CRUD: Get staff by ID
def get_clinic_staff(db: Session, staff_id: int):
    return db.query(ClinicStaff).filter(ClinicStaff.Staff_ID == staff_id).first()

# CRUD: Get all staff
def get_clinic_staffs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ClinicStaff).offset(skip).limit(limit).all()
