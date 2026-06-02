from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.appointment import (
    create_appointment, get_appointment, get_appointments, update_appointment, delete_appointment
)
from app.dependencies import get_db
from fastapi import Depends
from app.core.security import require_role
from app.models.user import UserRole
router = APIRouter(tags=["appointments"])

@router.post("/", response_model=AppointmentResponse, dependencies=[Depends(require_role(UserRole.Staff))])
def create_appointment_api(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    return create_appointment(db, appointment)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.get("/", response_model=list[AppointmentResponse])
def list_appointments(db: Session = Depends(get_db)):
    return get_appointments(db)

@router.put("/{appointment_id}", response_model=AppointmentResponse, dependencies=[Depends(require_role(UserRole.Staff))])
def update_appointment_api(appointment_id: int, appointment_update: AppointmentUpdate, db: Session = Depends(get_db)):
    return update_appointment(db, appointment_id, appointment_update)

@router.delete("/{appointment_id}", dependencies=[Depends(require_role(UserRole.Staff))])
def remove_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return delete_appointment(db, appointment_id)
