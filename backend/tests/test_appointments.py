"""
Tests for appointment endpoints under /api/v1/appointments/
"""

import pytest
from datetime import date, timedelta


def _future_date(days=7):
    return (date.today() + timedelta(days=days)).isoformat()


class TestAppointmentCRUD:
    def test_create_appointment_requires_staff(self, client, patient_headers, test_clinic, active_patient):
        """Only Staff can create via the shared appointment route."""
        resp = client.post(
            "/api/v1/appointments/",
            json={
                "Patient_ID": active_patient["Patient_ID"],
                "ClinicID": test_clinic,
                "AppointmentDate": _future_date(),
            },
            headers=patient_headers,
        )
        assert resp.status_code == 403

    def test_create_appointment_as_staff(self, client, staff_headers, test_clinic, active_patient):
        """Staff can create an appointment via the direct endpoint now that the schema is fixed."""
        resp = client.post(
            "/api/v1/appointments/",
            json={
                "Patient_ID": active_patient["Patient_ID"],
                "ClinicID": test_clinic,
                "AppointmentDate": _future_date(),
            },
            headers=staff_headers,
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["ClinicID"] == test_clinic
        assert body["Patient_ID"] == active_patient["Patient_ID"]

    def test_get_appointment(self, client, staff_headers, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        create_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        assert create_resp.status_code == 200, create_resp.text
        appt_id = create_resp.json()["Appointment_ID"]

        get_resp = client.get(f"/api/v1/appointments/{appt_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["Appointment_ID"] == appt_id

    def test_get_nonexistent_appointment(self, client):
        resp = client.get("/api/v1/appointments/99999")
        assert resp.status_code == 404

    def test_list_appointments(self, client, staff_headers, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        resp = client.get("/api/v1/appointments/")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_appointment_status_as_staff(self, client, staff_headers, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        create_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        appt_id = create_resp.json()["Appointment_ID"]

        update_resp = client.put(
            f"/api/v1/appointments/{appt_id}",
            json={"Status": "Arrived"},
            headers=staff_headers,
        )
        assert update_resp.status_code == 200

    def test_delete_appointment_as_staff(self, client, staff_headers, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        create_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        appt_id = create_resp.json()["Appointment_ID"]

        del_resp = client.delete(f"/api/v1/appointments/{appt_id}", headers=staff_headers)
        assert del_resp.status_code == 200

        get_resp = client.get(f"/api/v1/appointments/{appt_id}")
        assert get_resp.status_code == 404


class TestPatientBookAppointment:
    def test_patient_can_book_appointment(self, client, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={
                "ClinicID": test_clinic,
                "AppointmentDate": _future_date(),
            },
        )
        assert resp.status_code == 200
        assert resp.json()["Patient_ID"] == pid

    def test_patient_appointments_list(self, client, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        resp = client.get(f"/api/v1/patients/{pid}/appointments")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_patient_mark_arrived(self, client, staff_headers, test_clinic, active_patient):
        pid = active_patient["Patient_ID"]
        # book
        book_resp = client.post(
            f"/api/v1/patients/{pid}/book-appointment",
            json={"ClinicID": test_clinic, "AppointmentDate": _future_date()},
        )
        assert book_resp.status_code == 200, book_resp.text
        appt_id = book_resp.json()["Appointment_ID"]

        # mark arrived directly via patient endpoint
        arrive_resp = client.post(f"/api/v1/patients/appointments/{appt_id}/arrive")
        assert arrive_resp.status_code == 200
