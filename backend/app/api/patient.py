from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.appointment import AppointmentResponse, AppointmentCreate
from app.services.patient import (
    create_patient, get_patient, get_patients, update_patient, delete_patient,
    verify_and_activate_patient, book_appointment, mark_as_arrived
)
from app.dependencies import get_db
from fastapi import Depends
from app.core.security import require_role
from app.models.user import UserRole

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("/", response_model=PatientResponse, dependencies=[Depends(require_role(UserRole.Patient))])
def register_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    return create_patient(db, patient)

@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    return get_patients(db)

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_info(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db)):
    return update_patient(db, patient_id, patient_update)

@router.delete("/{patient_id}")
def remove_patient(patient_id: int, db: Session = Depends(get_db)):
    return delete_patient(db, patient_id)

@router.post("/{patient_id}/activate", dependencies=[Depends(require_role(UserRole.Staff))])
def activate_patient(patient_id: int, db: Session = Depends(get_db)):
    return verify_and_activate_patient(db, patient_id)

@router.post("/{patient_id}/book-appointment", response_model=AppointmentResponse)
def book_patient_appointment(patient_id: int, appointment_data: AppointmentCreate, db: Session = Depends(get_db)):
    return book_appointment(db, patient_id, appointment_data)

@router.post("/appointments/{appointment_id}/arrive")
def patient_mark_arrived(appointment_id: int, db: Session = Depends(get_db)):
    return mark_as_arrived(db, appointment_id)