from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import require_role
from app.models.user import UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.schemas.clinic_staff import ClinicStaffCreate, ClinicStaffOut
from app.core.database import get_db
from app.services.admin import (
    create_user, get_user, get_users, update_user, delete_user,
    get_audit_logs, generate_report, manage_users,
    create_doctor, delete_doctor, get_doctor, get_doctors,
    create_clinic_staff, delete_clinic_staff, get_clinic_staff, get_clinic_staffs
)

router = APIRouter(prefix="/admin", tags=["Admin"])

# User CRUD
@router.post("/user/", response_model=UserResponse, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user_in)

@router.get("/user/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/", response_model=list[UserResponse], dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_users(role: UserRole = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_users(db, role, skip, limit)

@router.put("/user/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/user/{user_id}", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

# Doctor CRUD
@router.post("/doctor/", response_model=DoctorResponse, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_create_doctor(doctor_in: DoctorCreate, db: Session = Depends(get_db)):
    return create_doctor(db, doctor_in)

@router.get("/doctor/{doctor_id}", response_model=DoctorResponse, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.get("/doctors/", response_model=list[DoctorResponse], dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_doctors(db, skip, limit)

@router.delete("/doctor/{doctor_id}", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = delete_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"ok": True}

# Staff CRUD
@router.post("/staff/", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_create_staff(staff_in: ClinicStaffCreate, db: Session = Depends(get_db)):
    return create_clinic_staff(db, staff_in)

@router.get("/staff/{staff_id}", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = get_clinic_staff(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@router.get("/staffs/", response_model=list[ClinicStaffOut], dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_clinic_staffs(db, skip, limit)

@router.delete("/staff/{staff_id}", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = delete_clinic_staff(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"ok": True}

# Audit logs
@router.get("/audit-logs/", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_get_audit_logs(db: Session = Depends(get_db)):
    return get_audit_logs(db)

# Reports
@router.get("/report/", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_generate_report(db: Session = Depends(get_db)):
    return generate_report(db)

# Manage users (list all)
@router.get("/manage-users/", dependencies=[Depends(require_role(UserRole.Admin))])
def admin_manage_users(db: Session = Depends(get_db)):
    return manage_users(db)
