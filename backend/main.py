from fastapi import FastAPI
from app.api import patient, appointment, clinic_staff, doctor, admin, report, auth

app = FastAPI()

app.include_router(patient.router)
app.include_router(appointment.router)
app.include_router(clinic_staff.router)
app.include_router(doctor.router)
app.include_router(admin.router)
app.include_router(report.router)
app.include_router(auth.router)
