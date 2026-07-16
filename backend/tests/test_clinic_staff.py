"""
Tests for Clinic Staff endpoints under /api/v1/staff/clinic-staff/
"""

import pytest
from datetime import date, timedelta


def _future_date(days=7):
    return (date.today() + timedelta(days=days)).isoformat()


class TestStaffLiveQueue:
    def test_get_live_queue(self, client, staff_headers, test_clinic):
        resp = client.get(
            f"/api/v1/staff/clinic-staff/live-queue/{test_clinic}",
            headers=staff_headers,
        )
        assert resp.status_code == 200

    def test_live_queue_requires_staff(self, client, patient_headers, test_clinic):
        resp = client.get(
            f"/api/v1/staff/clinic-staff/live-queue/{test_clinic}",
            headers=patient_headers,
        )
        assert resp.status_code == 403


class TestStaffAvailableDoctors:
    def test_get_available_doctors(self, client, staff_headers, test_doctor):
        resp = client.get(
            "/api/v1/staff/clinic-staff/available-doctors/",
            params={"date": _future_date()},
            headers=staff_headers,
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_available_doctors_requires_staff(self, client, patient_headers):
        resp = client.get(
            "/api/v1/staff/clinic-staff/available-doctors/",
            params={"date": _future_date()},
            headers=patient_headers,
        )
        assert resp.status_code == 403


class TestStaffVerifyArrival:
    def _book_and_allocate(self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor):
        """Helper: book + create schedule + allocate, return appointment_id."""
        pid = active_patient["Patient_ID"]
        doc_id = test_doctor["Doctor_ID"]
        appt_date = _future_date()

        # Doctor schedule is required for allocation
        client.post(
            "/api/v1/doctors/doctor/me/schedule",
            json={"AvailableDate": appt_date, "StartTime": "09:00:00", "EndTime": "17:00:00", "max_patients": 20},
            headers=doctor_headers,
        )

        book_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": appt_date},
        )
        appt_id = book_resp.json()["Appointment_ID"]

        client.post(
            "/api/v1/staff/clinic-staff/allocate-appointment/",
            params={"appointment_id": appt_id, "doctor_id": doc_id, "appointment_date": appt_date},
            headers=staff_headers,
        )
        return appt_id

    def test_verify_arrival_for_valid_appointment(
        self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
    ):
        appt_id = self._book_and_allocate(
            client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
        )
        resp = client.post(
            "/api/v1/staff/clinic-staff/verify-arrival/",
            params={"appointment_id": appt_id},
            headers=staff_headers,
        )
        assert resp.status_code == 200

    def test_verify_arrival_nonexistent(self, client, staff_headers):
        resp = client.post(
            "/api/v1/staff/clinic-staff/verify-arrival/",
            params={"appointment_id": 99999},
            headers=staff_headers,
        )
        assert resp.status_code == 404


class TestStaffAllocateAppointment:
    def test_allocate_appointment(
        self, client, staff_headers, doctor_headers, test_clinic, active_patient, test_doctor
    ):
        pid = active_patient["Patient_ID"]
        doc_id = test_doctor["Doctor_ID"]
        appt_date = _future_date()

        # Doctor must have a schedule for that date
        sched_resp = client.post(
            "/api/v1/doctors/doctor/me/schedule",
            json={"AvailableDate": appt_date, "StartTime": "09:00:00", "EndTime": "17:00:00", "max_patients": 20},
            headers=doctor_headers,
        )
        assert sched_resp.status_code in (200, 201), sched_resp.text

        book_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": appt_date},
        )
        appt_id = book_resp.json()["Appointment_ID"]

        alloc_resp = client.post(
            "/api/v1/staff/clinic-staff/allocate-appointment/",
            params={"appointment_id": appt_id, "doctor_id": doc_id, "appointment_date": appt_date},
            headers=staff_headers,
        )
        assert alloc_resp.status_code == 200, alloc_resp.text

    def test_allocate_requires_staff(
        self, client, patient_headers, test_clinic, active_patient, test_doctor
    ):
        pid = active_patient["Patient_ID"]
        book_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        appt_id = book_resp.json()["Appointment_ID"]

        resp = client.post(
            "/api/v1/staff/clinic-staff/allocate-appointment/",
            params={
                "appointment_id": appt_id,
                "doctor_id": test_doctor["Doctor_ID"],
                "appointment_date": _future_date(),
            },
            headers=patient_headers,
        )
        assert resp.status_code == 403


class TestStaffActivatePatient:
    def test_activate_patient(self, client, staff_headers, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.post(
            "/api/v1/staff/clinic-staff/activate-patient/",
            params={"patient_id": pid},
            headers=staff_headers,
        )
        assert resp.status_code == 200

    def test_activate_nonexistent_patient(self, client, staff_headers):
        resp = client.post(
            "/api/v1/staff/clinic-staff/activate-patient/",
            params={"patient_id": 99999},
            headers=staff_headers,
        )
        assert resp.status_code == 404


class TestStaffNotifications:
    def test_get_notifications_empty(self, client, staff_headers):
        resp = client.get("/api/v1/staff/clinic-staff/notifications/", headers=staff_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_notifications_requires_staff(self, client, patient_headers):
        resp = client.get("/api/v1/staff/clinic-staff/notifications/", headers=patient_headers)
        assert resp.status_code == 403
