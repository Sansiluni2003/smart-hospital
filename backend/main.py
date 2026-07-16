import os
import sys
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.user import User, UserRole, UserStatus
from app.core.database import SessionLocal
from app.core.security import get_password_hash

def create_admin_user():
    db: Session = SessionLocal()
    admin_email = "admin123@gmail.com"
    admin_password = "ADMIN2003#"  # In production, hash this!
    hashed_admin_password = get_password_hash(admin_password[:72])
    admin_role = UserRole.Admin
    # Check if admin exists
    existing = db.query(User).filter(User.Email == admin_email).first()
    if not existing:
        from datetime import datetime
        admin = User(Email=admin_email, Password=hashed_admin_password, Role=admin_role, CreatedAt=datetime.utcnow())
        admin.Status = UserStatus.Active
        db.add(admin)
        db.commit()
        print("Admin user created.")
    else:
        if not str(existing.Password).startswith("$2"):
            existing.Password = hashed_admin_password
            existing.Role = admin_role
            existing.Status = UserStatus.Active
            db.commit()
            print("Admin user password repaired.")
        else:
            existing.Role = admin_role
            existing.Status = UserStatus.Active
            db.commit()
        print("Admin user already exists.")
    db.close()

create_admin_user()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import patient, doctor, clinic_staff, admin, appointment, auth, report, ws

app = FastAPI()
uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

# CORS: defaults to localhost dev origins; override with ALLOWED_ORIGINS env var
# in production (comma-separated list, e.g. "https://yourdomain.com").
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient.router, prefix="/api/v1/patients")
app.include_router(doctor.router, prefix="/api/v1/doctors")
app.include_router(clinic_staff.router, prefix="/api/v1/staff")
app.include_router(admin.router, prefix="/api/v1/admin")
app.include_router(appointment.router, prefix="/api/v1/appointments")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(report.router, prefix="/api/v1/reports")
app.include_router(ws.router)  # WebSocket: /ws/{user_id}
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
