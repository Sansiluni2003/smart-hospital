from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.core.security import require_role
from app.models.user import UserRole
from app.schemas.clinic_staff import ClinicStaffCreate, ClinicStaffUpdate, ClinicStaffOut
from app.services.clinic_staff import (
    create_clinic_staff, get_clinic_staff, get_clinic_staffs, update_clinic_staff, delete_clinic_staff,
    allocate_staff_to_clinic, activate_patient, manage_queue, notify_staff
)
from app.core.database import get_db

router = APIRouter(prefix="/clinic-staff", tags=["Clinic Staff"])

@router.post("/", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Staff))])
def create_staff(staff_in: ClinicStaffCreate, db: Session = Depends(get_db)):
    return create_clinic_staff(db, staff_in)

@router.get("/{staff_id}", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Staff))])
def read_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = get_clinic_staff(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Clinic staff not found")
    return staff

@router.get("/", response_model=list[ClinicStaffOut], dependencies=[Depends(require_role(UserRole.Staff))])
def list_staffs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_clinic_staffs(db, skip=skip, limit=limit)

@router.put("/{staff_id}", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Staff))])
def update_staff(staff_id: int, staff_in: ClinicStaffUpdate, db: Session = Depends(get_db)):
    return update_clinic_staff(db, staff_id, staff_in)

@router.delete("/{staff_id}", dependencies=[Depends(require_role(UserRole.Staff))])
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    delete_clinic_staff(db, staff_id)
    return {"ok": True}

@router.post("/allocate/", response_model=ClinicStaffOut, dependencies=[Depends(require_role(UserRole.Staff))])
def allocate_staff(staff_id: int, clinic_id: int, db: Session = Depends(get_db)):
    return allocate_staff_to_clinic(db, staff_id, clinic_id)

@router.post("/activate-patient/", dependencies=[Depends(require_role(UserRole.Staff))])
def activate_patient_endpoint(patient_id: int, db: Session = Depends(get_db)):
    return activate_patient(db, patient_id)

@router.post("/manage-queue/", dependencies=[Depends(require_role(UserRole.Staff))])
def manage_queue_endpoint(clinic_id: int, db: Session = Depends(get_db)):
    return manage_queue(db, clinic_id)

@router.post("/notify/", dependencies=[Depends(require_role(UserRole.Staff))])
def notify_staff_endpoint(staff_id: int, message: str, db: Session = Depends(get_db)):
    return notify_staff(db, staff_id, message)
