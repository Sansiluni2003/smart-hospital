"""
Tests for Doctor API endpoints under /api/v1/doctors/doctor/
"""

import pytest
from datetime import date, timedelta


def _future_date(days=7):
    return (date.today() + timedelta(days=days)).isoformat()


class TestDoctorProfile:
    def test_get_own_profile(self, client, doctor_headers, test_doctor):
        resp = client.get("/api/v1/doctors/doctor/me/profile", headers=doctor_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["Name"] == "Dr. Test"

    def test_profile_requires_doctor_role(self, client, patient_headers):
        resp = client.get("/api/v1/doctors/doctor/me/profile", headers=patient_headers)
        assert resp.status_code == 403

    def test_profile_unauthenticated(self, client):
        resp = client.get("/api/v1/doctors/doctor/me/profile")
        assert resp.status_code == 401

    def test_update_own_profile(self, client, doctor_headers, test_doctor):
        resp = client.put(
            "/api/v1/doctors/doctor/me/profile",
            json={"Name": "Dr. Updated", "Speciality": "Cardiology"},
            headers=doctor_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["Name"] == "Dr. Updated"

    def test_change_password_wrong_current(self, client, doctor_headers):
        resp = client.post(
            "/api/v1/doctors/doctor/me/password",
            json={"CurrentPassword": "WrongPass!", "NewPassword": "NewPass123!"},
            headers=doctor_headers,
        )
        assert resp.status_code == 400

    def test_change_password_success(self, client, doctor_headers):
        resp = client.post(
            "/api/v1/doctors/doctor/me/password",
            json={"CurrentPassword": "Doctor123!", "NewPassword": "NewDoctor456!"},
            headers=doctor_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


class TestDoctorDashboard:
    def test_get_dashboard(self, client, doctor_headers, test_doctor):
        resp = client.get("/api/v1/doctors/doctor/me/dashboard", headers=doctor_headers)
        # Could be 200 (empty data) or 404 if doctor has no data yet
        assert resp.status_code in (200, 404)

    def test_get_queue(self, client, doctor_headers, test_doctor):
        resp = client.get("/api/v1/doctors/doctor/me/queue", headers=doctor_headers)
        assert resp.status_code == 200


class TestDoctorSchedule:
    def test_add_schedule(self, client, doctor_headers, test_doctor):
        resp = client.post(
            "/api/v1/doctors/doctor/me/schedule",
            json={
                "AvailableDate": _future_date(),
                "StartTime": "09:00:00",
                "EndTime": "13:00:00",
                "max_patients": 10,
            },
            headers=doctor_headers,
        )
        assert resp.status_code in (200, 201), resp.text

    def test_list_schedules(self, client, doctor_headers, test_doctor):
        # Add one first
        client.post(
            "/api/v1/doctors/doctor/me/schedule",
            json={
                "AvailableDate": _future_date(days=10),
                "StartTime": "09:00:00",
                "EndTime": "13:00:00",
            },
            headers=doctor_headers,
        )
        resp = client.get("/api/v1/doctors/doctor/me/schedule", headers=doctor_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestDoctorConsultation:
    def _create_appointment_in_progress(self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor):
        """Helper: create, allocate and start an appointment, returning appointment_id."""
        pid = active_patient["Patient_ID"]
        doc_id = test_doctor["Doctor_ID"]
        appt_date = _future_date()

        # 1. Doctor must have a schedule for that date
        sched_resp = client.post(
            "/api/v1/doctors/doctor/me/schedule",
            json={
                "AvailableDate": appt_date,
                "StartTime": "09:00:00",
                "EndTime": "17:00:00",
                "max_patients": 20,
            },
            headers=doctor_headers,
        )
        assert sched_resp.status_code in (200, 201), f"Schedule create failed: {sched_resp.text}"

        # 2. Book appointment
        book_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": appt_date},
        )
        assert book_resp.status_code == 200, book_resp.text
        appt_id = book_resp.json()["Appointment_ID"]

        # 3. Allocate
        alloc_resp = client.post(
            "/api/v1/staff/clinic-staff/allocate-appointment/",
            params={
                "appointment_id": appt_id,
                "doctor_id": doc_id,
                "appointment_date": appt_date,
            },
            headers=staff_headers,
        )
        assert alloc_resp.status_code == 200, f"Alloc failed: {alloc_resp.text}"

        # 4. Mark arrived
        arrive_resp = client.post(f"/api/v1/patients/appointments/{appt_id}/arrive")
        assert arrive_resp.status_code == 200, arrive_resp.text

        # 5. Start consultation
        start_resp = client.post(
            f"/api/v1/doctors/doctor/me/appointments/{appt_id}/start",
            headers=doctor_headers,
        )
        assert start_resp.status_code == 200, start_resp.text
        return appt_id

    def test_start_consultation(
        self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
    ):
        appt_id = self._create_appointment_in_progress(
            client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
        )
        assert appt_id is not None

    def test_complete_consultation(
        self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
    ):
        appt_id = self._create_appointment_in_progress(
            client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
        )

        complete_resp = client.post(
            f"/api/v1/doctors/doctor/me/appointments/{appt_id}/complete",
            json={"ConsultationNotes": "Patient is fine.", "Prescription": "Rest"},
            headers=doctor_headers,
        )
        assert complete_resp.status_code == 200, complete_resp.text

    def test_skip_consultation(
        self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
    ):
        appt_id = self._create_appointment_in_progress(
            client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
        )

        skip_resp = client.post(
            f"/api/v1/doctors/doctor/me/appointments/{appt_id}/skip",
            headers=doctor_headers,
        )
        assert skip_resp.status_code == 200, skip_resp.text
