from datetime import date
from pathlib import Path
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.security import require_role, get_current_user
from app.models.user import UserRole
from app.schemas.doctor import DoctorConsultationComplete, DoctorPasswordUpdate, DoctorProfileUpdate, DoctorUpdate, DoctorResponse
from app.schemas.doctor_schedule import DoctorScheduleCreate, DoctorScheduleUpdate, DoctorScheduleResponse
from app.schemas.medical_record import MedicalRecordResponse
from app.core.database import get_db
from app.services.doctor import (
    complete_doctor_consultation,
    create_medical_record,
    delete_doctor_schedule_entry,
    get_doctor_dashboard,
    get_doctor_appointment_for_user,
    get_doctor_profile,
    get_doctor_queue,
    get_doctor_schedules,
    get_patient_medical_records,
    get_today_queue,
    mark_patient_consulted,
    skip_doctor_consultation,
    start_doctor_consultation,
    update_doctor,
    update_doctor_password,
    update_doctor_profile,
    update_doctor_schedule,
    update_doctor_schedule_entry,
    update_medical_record,
)

router = APIRouter(prefix="/doctor", tags=["Doctor"])

UPLOADS_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "doctor_records"


def _doctor_attachment_dir(patient_id: int, appointment_id: int) -> Path:
    path = UPLOADS_ROOT / f"patient_{patient_id}" / f"appointment_{appointment_id}"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sanitize_filename(filename: str) -> str:
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename or "document")
    return safe_name or "document"


def _list_attachment_payload(patient_id: int, appointment_id: int):
    attachment_dir = _doctor_attachment_dir(patient_id, appointment_id)
    items = []
    for file_path in sorted(attachment_dir.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
        if not file_path.is_file():
            continue
        name_parts = file_path.name.split("__", 2)
        category = name_parts[1] if len(name_parts) >= 3 else "record"
        items.append({
            "filename": file_path.name,
            "display_name": name_parts[2] if len(name_parts) >= 3 else file_path.name,
            "category": category,
            "uploaded_at": file_path.stat().st_mtime,
            "size": file_path.stat().st_size,
            "url": f"/uploads/doctor_records/patient_{patient_id}/appointment_{appointment_id}/{file_path.name}",
        })
    return items


@router.get("/me/profile", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = get_doctor_profile(db, user.UserID)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile


@router.put("/me/profile", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_update_profile(profile_in: DoctorProfileUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = update_doctor_profile(db, user.UserID, profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile


@router.post("/me/password", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_change_password(payload: DoctorPasswordUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    result = update_doctor_password(db, user.UserID, payload.CurrentPassword, payload.NewPassword)
    if result is None:
        raise HTTPException(status_code=404, detail="Doctor user not found")
    if result is False:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"ok": True}


@router.get("/me/dashboard", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    dashboard = get_doctor_dashboard(db, user.UserID)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Doctor dashboard data not found")
    return dashboard


@router.get("/me/queue", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_queue(db: Session = Depends(get_db), user=Depends(get_current_user)):
    queue = get_doctor_queue(db, user.UserID)
    if queue is None:
        raise HTTPException(status_code=404, detail="Doctor queue not found")
    return queue


@router.post("/me/appointments/{appointment_id}/start", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_start_consultation(appointment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appointment = start_doctor_consultation(db, user.UserID, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/me/appointments/{appointment_id}/complete", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_complete_consultation(
    appointment_id: int,
    payload: DoctorConsultationComplete,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    appointment = complete_doctor_consultation(
        db,
        user.UserID,
        appointment_id,
        consultation_notes=payload.ConsultationNotes,
        prescription=payload.Prescription,
        appointment_notes=payload.AppointmentNotes,
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/me/appointments/{appointment_id}/skip", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_skip_consultation(appointment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appointment = skip_doctor_consultation(db, user.UserID, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.get("/me/patients/{patient_id}/medical-records", response_model=list[MedicalRecordResponse], dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_patient_records(patient_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_patient_medical_records(db, patient_id)


@router.get("/me/appointments/{appointment_id}/attachments", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_appointment_attachments(appointment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appointment = get_doctor_appointment_for_user(db, user.UserID, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _list_attachment_payload(appointment.Patient_ID, appointment.Appointment_ID)


@router.post("/me/appointments/{appointment_id}/attachments", dependencies=[Depends(require_role(UserRole.Doctor))])
async def doctor_upload_appointment_attachment(
    appointment_id: int,
    file: UploadFile = File(...),
    category: str = Form("record"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    appointment = get_doctor_appointment_for_user(db, user.UserID, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    safe_category = re.sub(r"[^A-Za-z0-9_-]", "_", category or "record")
    safe_filename = _sanitize_filename(file.filename or "document")
    attachment_dir = _doctor_attachment_dir(appointment.Patient_ID, appointment.Appointment_ID)
    stored_name = f"{date.today().isoformat()}__{safe_category}__{safe_filename}"
    target = attachment_dir / stored_name

    content = await file.read()
    target.write_bytes(content)

    return {
        "ok": True,
        "attachment": {
            "filename": stored_name,
            "display_name": safe_filename,
            "category": safe_category,
            "size": len(content),
            "url": f"/uploads/doctor_records/patient_{appointment.Patient_ID}/appointment_{appointment.Appointment_ID}/{stored_name}",
        },
    }


@router.get("/me/schedule", response_model=list[DoctorScheduleResponse], dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_get_schedule(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    schedules = get_doctor_schedules(db, user.UserID, start_date, end_date)
    if schedules is None:
        raise HTTPException(status_code=404, detail="Doctor schedule not found")
    return schedules


@router.post("/me/schedule", response_model=DoctorScheduleResponse, dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_create_schedule(schedule_data: DoctorScheduleCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = get_doctor_profile(db, user.UserID)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return update_doctor_schedule(db, profile["Doctor_ID"], schedule_data)


@router.put("/me/schedule/{schedule_id}", response_model=DoctorScheduleResponse, dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_update_schedule(schedule_id: int, schedule_data: DoctorScheduleUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    schedule = update_doctor_schedule_entry(db, user.UserID, schedule_id, schedule_data)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


@router.delete("/me/schedule/{schedule_id}", dependencies=[Depends(require_role(UserRole.Doctor))])
def doctor_delete_schedule(schedule_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    schedule = delete_doctor_schedule_entry(db, user.UserID, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"ok": True}


# Update doctor (doctor or admin)
@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor_endpoint(
    doctor_id: int,
    doctor_in: DoctorUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.Role not in [UserRole.Doctor, UserRole.Admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    result = update_doctor(db, doctor_id, doctor_in)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result

# Update doctor schedule (doctor only)
@router.post("/{doctor_id}/schedule", dependencies=[Depends(require_role(UserRole.Doctor))])
def update_schedule_endpoint(doctor_id: int, schedule_data: DoctorScheduleCreate, db: Session = Depends(get_db)):
    return update_doctor_schedule(db, doctor_id, schedule_data)

# Get today's queue (doctor only)
@router.get("/{doctor_id}/queue", dependencies=[Depends(require_role(UserRole.Doctor))])
def get_queue_endpoint(doctor_id: int, clinic_id: int, today: date, db: Session = Depends(get_db)):
    return get_today_queue(db, doctor_id, clinic_id, today)

# Create medical record (doctor only)
@router.post("/{doctor_id}/medical-record", dependencies=[Depends(require_role(UserRole.Doctor))])
def create_medical_record_endpoint(doctor_id: int, patient_id: int, clinic_id: int, notes: str, db: Session = Depends(get_db)):
    return create_medical_record(db, patient_id, doctor_id, clinic_id, notes)

# Update medical record (doctor only)
@router.put("/medical-record/{record_id}", dependencies=[Depends(require_role(UserRole.Doctor))])
def update_medical_record_endpoint(record_id: int, notes: str, db: Session = Depends(get_db)):
    result = update_medical_record(db, record_id, notes)
    if not result:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return result

# Mark patient as consulted (doctor only)
@router.post("/queue/{queue_id}/consulted", dependencies=[Depends(require_role(UserRole.Doctor))])
def mark_patient_consulted_endpoint(queue_id: int, notes: str = None, db: Session = Depends(get_db)):
    result = mark_patient_consulted(db, queue_id, notes)
    if not result:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    return result
