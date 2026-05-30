
from fastapi import APIRouter, Depends
from app.services.report import (
    get_appointment_counts,
    get_arrival_completion_rates,
    get_doctor_workload,
    get_queue_wait_times
)
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.core.security import require_role
from app.models.user import UserRole

router = APIRouter()

@router.get("/reports/appointments", dependencies=[Depends(require_role(UserRole.Admin))])
def report_appointments(start: str, end: str, db: Session = Depends(get_db)):
    return get_appointment_counts(db, start, end)

@router.get("/reports/arrival-completion", dependencies=[Depends(require_role(UserRole.Admin))])
def report_arrival_completion(start: str, end: str, db: Session = Depends(get_db)):
    return get_arrival_completion_rates(db, start, end)

@router.get("/reports/doctor-workload", dependencies=[Depends(require_role(UserRole.Admin))])
def report_doctor_workload(start: str, end: str, db: Session = Depends(get_db)):
    return get_doctor_workload(db, start, end)

@router.get("/reports/queue-wait", dependencies=[Depends(require_role(UserRole.Admin))])
def report_queue_wait(start: str, end: str, db: Session = Depends(get_db)):
    return get_queue_wait_times(db, start, end)