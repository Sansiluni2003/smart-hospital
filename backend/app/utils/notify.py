"""
notify.py  –  thin async wrapper that pushes a real-time event over WebSocket
              AND saves a Notification row in the DB for the patient's inbox.

Event shape sent over the wire:
{
  "event": "string",          # e.g. "appointment_booked", "patient_arrived" …
  "title": "string",          # Short heading for the toast
  "message": "string",        # Full message text
  "data": { ... }             # Optional structured payload
}
"""
from __future__ import annotations
import asyncio
from sqlalchemy.orm import Session
from app.utils.ws_manager import manager


# ── Event type constants ────────────────────────────────────────────────────
EVT_APPOINTMENT_BOOKED   = "appointment_booked"
EVT_APPOINTMENT_ALLOCATED= "appointment_allocated"
EVT_PATIENT_ARRIVED      = "patient_arrived"
EVT_CHECKIN_VERIFIED     = "checkin_verified"
EVT_QUEUE_UPDATE         = "queue_update"
EVT_CONSULTATION_STARTED = "consultation_started"
EVT_SMS_SENT             = "sms_sent"


def _fire(user_id: int, payload: dict):
    """Push payload over WebSocket without blocking a sync caller."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.send(user_id, payload))
        else:
            loop.run_until_complete(manager.send(user_id, payload))
    except Exception:
        pass   # never crash the main request if WS push fails


def _fire_many(user_ids: list[int], payload: dict):
    for uid in user_ids:
        _fire(uid, payload)


# ── Public helpers ──────────────────────────────────────────────────────────

def notify_patient(db: Session, patient_id: int, event: str, title: str, message: str, data: dict | None = None):
    """
    1. Save a Notification row in the DB (patient inbox).
    2. Push real-time WS event to the patient's browser.
    """
    from app.utils.notification import create_in_app_notification
    from app.models.notification import NotificationType
    try:
        create_in_app_notification(db, patient_id, message, NotificationType.SMS)
    except Exception:
        pass

    # Resolve patient → user_id for WS routing
    try:
        from app.models.patient import Patient
        patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
        if patient:
            _fire(patient.UserID, {"event": event, "title": title, "message": message, "data": data or {}})
    except Exception:
        pass


def notify_staff_users(db: Session, event: str, title: str, message: str, data: dict | None = None):
    """Push a real-time WS event to all currently connected staff members."""
    try:
        from app.models.user import User, UserRole
        staff_users = db.query(User).filter(User.Role == UserRole.Staff).all()
        user_ids = [u.UserID for u in staff_users]
        _fire_many(user_ids, {"event": event, "title": title, "message": message, "data": data or {}})
    except Exception:
        pass


def notify_doctor_user(db: Session, doctor_id: int, event: str, title: str, message: str, data: dict | None = None):
    """Push a real-time WS event to a specific doctor."""
    try:
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.Doctor_ID == doctor_id).first()
        if doctor:
            _fire(doctor.UserID, {"event": event, "title": title, "message": message, "data": data or {}})
    except Exception:
        pass
