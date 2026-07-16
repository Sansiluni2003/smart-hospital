"""
Tests for the authentication endpoint: POST /api/v1/auth/login
"""

import pytest


class TestLogin:
    def test_login_invalid_credentials(self, client):
        """Wrong password returns 401."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "admin123@gmail.com", "password": "WRONG"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Completely unknown email returns 401."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@nowhere.com", "password": "pass"},
        )
        assert resp.status_code == 401

    def test_admin_login_success(self, client):
        """Admin can log in and receives a token with correct metadata."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "admin123@gmail.com", "password": "ADMIN2003#"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["Role"] == "Admin"

    def test_inactive_patient_cannot_login(self, client, registered_patient):
        """A freshly registered (inactive) patient gets 403."""
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": "testpatient@example.com", "password": "TestPass123!"},
        )
        assert resp.status_code == 403

    def test_active_patient_login_success(self, client, active_patient, patient_token):
        """After activation the patient can log in successfully."""
        assert patient_token is not None

    def test_doctor_login_success(self, client, test_doctor, doctor_token):
        """Doctor created by admin can log in."""
        assert doctor_token is not None

    def test_staff_login_success(self, client, test_staff, staff_token):
        """Staff created by admin can log in."""
        assert staff_token is not None
