from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.security import require_role, get_current_user
from app.models.user import UserRole
from app.schemas.clinic_staff import ClinicStaffUpdate, ClinicStaffOut
from app.core.database import get_db
from app.services.clinic_staff import (
    verify_patient_arrival,
    verify_patient_arrival_from_qr,
    allocate_appointment,
    reschedule_appointment,
    get_live_queue,
    get_doctor_availability,
    get_available_doctors,
    activate_patient_account,
    update_clinic_staff,
    get_staff_notifications
)

router = APIRouter( prefix="/clinic-staff", tags=["Clinic Staff"])


class SendSmsRequest(BaseModel):
    to: str
    message: str


@router.post("/send-sms/", dependencies=[Depends(require_role(UserRole.Staff))])
def send_manual_sms(req: SendSmsRequest):
    from app.utils.notification import send_sms
    result = send_sms(req.to, req.message)
    if result is None:
        raise HTTPException(status_code=500, detail="SMS sending failed or not configured")
    return {"status": "sent", "to": req.to}


class QRCheckinRequest(BaseModel):
    payload: str

# Update staff (only self)
@router.put("/{staff_id}", response_model=ClinicStaffOut)
def update_staff(
    staff_id: int,
    staff_in: ClinicStaffUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.Role != UserRole.Staff or user.UserID != staff_id:
        raise HTTPException(status_code=403, detail="Not enough permissions to update this staff account")
    return update_clinic_staff(db, staff_id, staff_in)

# Verify patient arrival (by staff)
@router.post("/verify-arrival/", dependencies=[Depends(require_role(UserRole.Staff))])
def verify_arrival(appointment_id: int, db: Session = Depends(get_db)):
    try:
        result = verify_patient_arrival(db, appointment_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return result


@router.post("/verify-arrival-qr/", dependencies=[Depends(require_role(UserRole.Staff))])
def verify_arrival_qr(payload: QRCheckinRequest, db: Session = Depends(get_db)):
    try:
        result = verify_patient_arrival_from_qr(db, payload.payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return result

# Allocate appointment to doctor (by staff)
# appointment_time is the date only (YYYY-MM-DD); the actual time is auto-calculated
# from the doctor's schedule start time and their average consultation duration.
@router.post("/allocate-appointment/", dependencies=[Depends(require_role(UserRole.Staff))])
def allocate_appointment_endpoint(appointment_id: int, doctor_id: int, appointment_date: str, db: Session = Depends(get_db)):
    from datetime import datetime
    appointment_date_dt = datetime.fromisoformat(appointment_date)
    try:
        return allocate_appointment(db, appointment_id, doctor_id, appointment_date_dt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Reschedule appointment (by staff)
@router.post("/reschedule-appointment/", dependencies=[Depends(require_role(UserRole.Staff))])
def reschedule_appointment_endpoint(appointment_id: int, new_time: str, db: Session = Depends(get_db)):
    from datetime import datetime
    new_time_dt = datetime.fromisoformat(new_time)
    result = reschedule_appointment(db, appointment_id, new_time_dt)
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return result

# Get live queue for a clinic (by staff)
@router.get("/live-queue/{clinic_id}", dependencies=[Depends(require_role(UserRole.Staff))])
def get_live_queue_endpoint(clinic_id: int, db: Session = Depends(get_db)):
    return get_live_queue(db, clinic_id)

# Get doctor availability (by staff)
@router.get("/doctor-availability/{doctor_id}", dependencies=[Depends(require_role(UserRole.Staff))])
def get_doctor_availability_endpoint(doctor_id: int, date: str, db: Session = Depends(get_db)):
    from datetime import datetime
    date_dt = datetime.fromisoformat(date)
    return get_doctor_availability(db, doctor_id, date_dt)

# Get available doctors for a date (by staff)
@router.get("/available-doctors/", dependencies=[Depends(require_role(UserRole.Staff))])
def get_available_doctors_endpoint(date: str, clinic_id: int | None = None, db: Session = Depends(get_db)):
    from datetime import datetime
    date_dt = datetime.fromisoformat(date)
    return get_available_doctors(db, date_dt, clinic_id)

# Activate patient account (by staff)
@router.post("/activate-patient/", dependencies=[Depends(require_role(UserRole.Staff))])
def activate_patient_endpoint(patient_id: int, db: Session = Depends(get_db)):
    result = activate_patient_account(db, patient_id)
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result

@router.get("/notifications/", dependencies=[Depends(require_role(UserRole.Staff))])
def get_staff_notifications_endpoint(limit: int = 25, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_staff_notifications(db, user.UserID, limit)

