from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.core.security import require_role
from app.models.user import UserRole
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorOut
from app.services.doctor import (
    create_doctor, get_doctor, get_doctors, update_doctor, delete_doctor,
    manage_schedule, start_consultation, end_consultation, update_queue, add_medical_record
)
from app.core.database import get_db

router = APIRouter(prefix="/doctor", tags=["Doctor"])

@router.post("/", response_model=DoctorOut, dependencies=[Depends(require_role(UserRole.Doctor))])
def create_doctor_endpoint(doctor_in: DoctorCreate, db: Session = Depends(get_db)):
    return create_doctor(db, doctor_in)

@router.get("/{doctor_id}", response_model=DoctorOut, dependencies=[Depends(require_role(UserRole.Doctor))])
def read_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.get("/", response_model=list[DoctorOut], dependencies=[Depends(require_role(UserRole.Doctor))])
def list_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_doctors(db, skip=skip, limit=limit)

@router.put("/{doctor_id}", response_model=DoctorOut, dependencies=[Depends(require_role(UserRole.Doctor))])
def update_doctor_endpoint(doctor_id: int, doctor_in: DoctorUpdate, db: Session = Depends(get_db)):
    return update_doctor(db, doctor_id, doctor_in)

@router.delete("/{doctor_id}", dependencies=[Depends(require_role(UserRole.Doctor))])
def delete_doctor_endpoint(doctor_id: int, db: Session = Depends(get_db)):
    delete_doctor(db, doctor_id)
    return {"ok": True}

@router.post("/schedule/", dependencies=[Depends(require_role(UserRole.Doctor))])
def manage_schedule_endpoint(doctor_id: int, schedule_data: dict, db: Session = Depends(get_db)):
    return manage_schedule(db, doctor_id, schedule_data)

@router.post("/consultation/start/", dependencies=[Depends(require_role(UserRole.Doctor))])
def start_consultation_endpoint(doctor_id: int, patient_id: int, db: Session = Depends(get_db)):
    return start_consultation(db, doctor_id, patient_id)

@router.post("/consultation/end/", dependencies=[Depends(require_role(UserRole.Doctor))])
def end_consultation_endpoint(doctor_id: int, patient_id: int, db: Session = Depends(get_db)):
    return end_consultation(db, doctor_id, patient_id)

@router.post("/queue/update/", dependencies=[Depends(require_role(UserRole.Doctor))])
def update_queue_endpoint(doctor_id: int, db: Session = Depends(get_db)):
    return update_queue(db, doctor_id)

@router.post("/medical-record/", dependencies=[Depends(require_role(UserRole.Doctor))])
def add_medical_record_endpoint(patient_id: int, record_data: dict, db: Session = Depends(get_db)):
    return add_medical_record(db, patient_id, record_data)
