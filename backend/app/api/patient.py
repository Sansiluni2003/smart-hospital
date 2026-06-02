from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.appointment import AppointmentResponse, AppointmentCreate
from app.services.patient import (
    create_patient, get_patient, get_patients, update_patient, delete_patient,
    verify_and_activate_patient, book_appointment, mark_as_arrived,
    change_patient_password, get_patient_medical_records_list, get_patient_notifications_list,
    get_patient_live_queue,
)
from app.dependencies import get_db
from app.core.security import require_role, get_current_user
from app.models.user import UserRole, User
from sqlalchemy.exc import IntegrityError
from app.services.appointment import get_appointments_by_patient

class PasswordChangeRequest(BaseModel):
    CurrentPassword: str
    NewPassword: str


router = APIRouter(tags=["patients"])

# Helper to build patient response with Email
def build_patient_response(db_patient, db):
    db_user = db.query(User).filter(User.UserID == db_patient.UserID).first()
    return {
        "Patient_ID": db_patient.Patient_ID,
        "UserID": db_patient.UserID,
        "OPD_Id": db_patient.OPD_Id,
        "Name": db_patient.Name,
        "Address": db_patient.Address,
        "Phone_No": db_patient.Phone_No,
        "DateOfBirth": db_patient.DateOfBirth,
        "is_active": db_patient.is_active,
        "Email": db_user.Email if db_user else None,
    }

@router.post("/", response_model=PatientResponse)
def register_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    try:
        db_patient = create_patient(db, patient)
        return build_patient_response(db_patient, db)
    except IntegrityError as e:
        db.rollback()
        if "user.Email" in str(e.orig):
            raise HTTPException(status_code=400, detail="Email already exists")
        if "OPD_Id" in str(e.orig):
            raise HTTPException(status_code=400, detail="OPD ID already exists")
        raise HTTPException(status_code=400, detail="Registration failed: Duplicate or invalid data")

@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return build_patient_response(db_patient, db)

@router.get("/", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    db_patients = get_patients(db)
    return [build_patient_response(p, db) for p in db_patients]

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_info(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db)):
    db_patient = update_patient(db, patient_id, patient_update)
    return build_patient_response(db_patient, db)

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

@router.get("/{patient_id}/appointments", response_model=list[AppointmentResponse])
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    # Check if patient exists
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return get_appointments_by_patient(db, patient_id)


@router.post("/me/password", dependencies=[Depends(require_role(UserRole.Patient))])
def patient_change_password(payload: PasswordChangeRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = change_patient_password(db, user.UserID, payload.CurrentPassword, payload.NewPassword)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    if result is False:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"ok": True}


@router.get("/{patient_id}/medical-records")
def patient_get_medical_records(patient_id: int, db: Session = Depends(get_db)):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return get_patient_medical_records_list(db, patient_id)


@router.get("/{patient_id}/notifications")
def patient_get_notifications(patient_id: int, db: Session = Depends(get_db)):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return get_patient_notifications_list(db, patient_id)


@router.get("/{patient_id}/live-queue")
def patient_get_live_queue(patient_id: int, db: Session = Depends(get_db)):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return get_patient_live_queue(db, patient_id)