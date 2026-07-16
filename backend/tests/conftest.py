"""
Shared pytest fixtures for the Smart Hospital backend test suite.

Uses an in-memory SQLite database so no real DB is touched.
Both dependency injection points (app.dependencies.get_db and
app.core.security.get_db) are overridden with the same test session.

IMPORTANT: env vars must be set BEFORE any app module is imported so
that SQLAlchemy creates its engine against SQLite, not MySQL.
"""

import os

# ── Override env vars BEFORE any app code is imported ───────────────────────
# These MUST be set before importing any app module so that SQLAlchemy and
# jose pick up test values instead of the production .env values.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret-key-not-used-in-production"

import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── in-memory SQLite engine ──────────────────────────────────────────────────
# StaticPool reuses the SAME underlying connection for all sessions so all
# sessions share the same in-memory database and see each other's tables.
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Patch app.core.database engine BEFORE importing app models ───────────────
# This ensures that SessionLocal used inside main.py (for create_admin_user)
# also points at the in-memory SQLite engine.
import app.core.database as _db_module   # noqa: E402 – must come after env set
_db_module.engine = engine
_db_module.SessionLocal = TestingSessionLocal

# ── Now register all models so Base.metadata knows all tables ───────────────
from app.models import Base          # noqa: E402
import app.models.user               # noqa
import app.models.patient            # noqa
import app.models.doctor             # noqa
import app.models.clinic_staff       # noqa
import app.models.clinic             # noqa
import app.models.appointment        # noqa
import app.models.doctor_schedule    # noqa
import app.models.medical_record     # noqa
import app.models.notification       # noqa
import app.models.audit_log          # noqa
import app.models.live_queue         # noqa
import app.models.doctor_clinic_assignment  # noqa

# ── Create all tables once at module level (needed before main.py import) ───
Base.metadata.create_all(bind=engine)

# ── Import app (main.py) – this triggers create_admin_user() ─────────────────
# Tables already exist at this point so the seeding succeeds against SQLite.
import app.dependencies as _dep_module   # noqa
import app.core.security as _sec_module  # noqa

# Patch security module's get_db as well (it has its own SessionLocal ref)
import app.core.security as _sec          # noqa
_sec_module.get_db = _db_module.get_db

from main import app as _fastapi_app     # noqa – runs create_admin_user()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Wipe & re-create data tables around each test ───────────────────────────
@pytest.fixture(autouse=True)
def reset_db():
    """Drop all rows but keep schema; re-seed the admin user each test."""
    # Clear all data
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Seed admin user using the test session
    from app.models.user import User, UserRole, UserStatus
    from app.core.security import get_password_hash

    db = TestingSessionLocal()
    admin = User(
        Email="admin123@gmail.com",
        Password=get_password_hash("ADMIN2003#"),
        Role=UserRole.Admin,
        Status=UserStatus.Active,
        CreatedAt=datetime.utcnow(),
    )
    db.add(admin)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


# ── TestClient with dependency overrides ────────────────────────────────────
@pytest.fixture()
def client():
    _fastapi_app.dependency_overrides[_dep_module.get_db] = override_get_db
    _fastapi_app.dependency_overrides[_db_module.get_db] = override_get_db
    _fastapi_app.dependency_overrides[_sec_module.get_db] = override_get_db

    with TestClient(_fastapi_app, raise_server_exceptions=True) as c:
        yield c

    _fastapi_app.dependency_overrides.clear()


# ── Helper: seed an Admin user and return a token ───────────────────────────
@pytest.fixture()
def admin_token(client):
    """Returns a valid Bearer token for the pre-seeded admin account."""
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin123@gmail.com", "password": "ADMIN2003#"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ── Helper: register a patient and return (patient_dict, token) ─────────────
@pytest.fixture()
def registered_patient(client):
    payload = {
        "Name": "Test Patient",
        "Phone_No": "0712345678",
        "OPD_Id": "OPD-TEST-001",
        "Email": "testpatient@example.com",
        "Password": "TestPass123!",
        "DateOfBirth": "1990-01-15",
        "Address": "123 Test Street",
    }
    resp = client.post("/api/v1/patients/", json=payload)
    assert resp.status_code == 200, resp.text
    return resp.json()


@pytest.fixture()
def active_patient(client, admin_headers, registered_patient):
    """Patient with is_active=True so they can log in."""
    pid = registered_patient["Patient_ID"]
    # Activate via admin-level patient update
    resp = client.put(
        f"/api/v1/patients/{pid}",
        json={"is_active": True},
        headers=admin_headers,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


@pytest.fixture()
def patient_token(client, active_patient):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "testpatient@example.com", "password": "TestPass123!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def patient_headers(patient_token):
    return {"Authorization": f"Bearer {patient_token}"}


# ── Helper: create a Clinic via raw DB ──────────────────────────────────────
@pytest.fixture()
def test_clinic():
    from app.models.clinic import Clinic
    from datetime import time as dtime

    db = TestingSessionLocal()
    clinic = Clinic(
        Name="Test Clinic",
        OperatingDays="Weekdays",
        StartTime=dtime(8, 0),
        EndTime=dtime(15, 0),
        MaxPatients=50,
    )
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    cid = clinic.ClinicID
    db.close()
    return cid


# ── Helper: create a Doctor (admin creates user + doctor) ───────────────────
@pytest.fixture()
def test_doctor(client, admin_headers):
    # 1. create user
    user_resp = client.post(
        "/api/v1/admin/admin/user/",
        json={
            "Email": "doctor@example.com",
            "Password": "Doctor123!",
            "Role": "Doctor",
        },
        headers=admin_headers,
    )
    assert user_resp.status_code == 200, user_resp.text
    user_id = user_resp.json()["UserID"]

    # 2. create doctor record
    doc_resp = client.post(
        "/api/v1/admin/admin/doctor/",
        json={
            "UserID": user_id,
            "Name": "Dr. Test",
            "Speciality": "General",
            "Phone_No": "0700000001",
            "AverageConsultationMinutes": 10,
        },
        headers=admin_headers,
    )
    assert doc_resp.status_code == 200, doc_resp.text
    return doc_resp.json()


@pytest.fixture()
def doctor_token(client, test_doctor):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "doctor@example.com", "password": "Doctor123!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def doctor_headers(doctor_token):
    return {"Authorization": f"Bearer {doctor_token}"}


# ── Helper: create a Staff user ─────────────────────────────────────────────
@pytest.fixture()
def test_staff(client, admin_headers, test_clinic):
    user_resp = client.post(
        "/api/v1/admin/admin/user/",
        json={
            "Email": "staff@example.com",
            "Password": "Staff123!",
            "Role": "Staff",
        },
        headers=admin_headers,
    )
    assert user_resp.status_code == 200, user_resp.text
    user_id = user_resp.json()["UserID"]

    staff_resp = client.post(
        "/api/v1/admin/admin/staff/",
        json={
            "UserID": user_id,
            "Name": "Test Staff",
            "Phone_No": "0700000002",
            "JobTitle": "Receptionist",
            "ClinicID": test_clinic,
        },
        headers=admin_headers,
    )
    assert staff_resp.status_code == 200, staff_resp.text
    return staff_resp.json()


@pytest.fixture()
def staff_token(client, test_staff):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "staff@example.com", "password": "Staff123!"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}
