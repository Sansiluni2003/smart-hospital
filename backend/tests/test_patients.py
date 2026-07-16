"""
Tests for patient endpoints under /api/v1/patients/
"""

import pytest


class TestPatientRegistration:
    def test_register_patient_success(self, client):
        resp = client.post(
            "/api/v1/patients/",
            json={
                "Name": "Alice",
                "Phone_No": "0700111222",
                "OPD_Id": "OPD-ALICE-01",
                "Email": "alice@example.com",
                "Password": "Alice123!",
                "DateOfBirth": "1995-05-20",
                "Address": "456 Test Ave",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["Name"] == "Alice"
        assert body["Email"] == "alice@example.com"
        assert "Patient_ID" in body

    def test_register_duplicate_email(self, client, registered_patient):
        """Duplicate email must return 400."""
        resp = client.post(
            "/api/v1/patients/",
            json={
                "Name": "Duplicate",
                "Phone_No": "0700000099",
                "OPD_Id": "OPD-DUP-001",
                "Email": "testpatient@example.com",  # same as registered_patient
                "Password": "Dup123!",
            },
        )
        assert resp.status_code == 400

    def test_register_duplicate_opd_id(self, client, registered_patient):
        """Duplicate OPD ID must return 400."""
        resp = client.post(
            "/api/v1/patients/",
            json={
                "Name": "Another",
                "Phone_No": "0700000088",
                "OPD_Id": "OPD-TEST-001",  # same as registered_patient
                "Email": "another@example.com",
                "Password": "Another123!",
            },
        )
        assert resp.status_code == 400


class TestPatientRead:
    def test_get_patient_by_id(self, client, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.get(f"/api/v1/patients/{pid}")
        assert resp.status_code == 200
        assert resp.json()["Patient_ID"] == pid

    def test_get_nonexistent_patient(self, client):
        resp = client.get("/api/v1/patients/99999")
        assert resp.status_code == 404

    def test_list_patients(self, client, registered_patient):
        resp = client.get("/api/v1/patients/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1


class TestPatientUpdate:
    def test_update_patient(self, client, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.put(
            f"/api/v1/patients/{pid}",
            json={"Name": "Updated Name", "Phone_No": "0799999999"},
        )
        assert resp.status_code == 200
        assert resp.json()["Name"] == "Updated Name"

    def test_activate_patient_requires_staff(self, client, registered_patient, patient_headers):
        """A patient cannot activate another patient (needs Staff role)."""
        pid = registered_patient["Patient_ID"]
        # patient_headers fixture needs an active patient – create a separate one
        resp = client.post(
            f"/api/v1/patients/{pid}/activate",
            headers=patient_headers,
        )
        assert resp.status_code == 403


class TestPatientDelete:
    def test_delete_patient(self, client, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.delete(f"/api/v1/patients/{pid}")
        assert resp.status_code == 200

        # Confirm deletion
        resp2 = client.get(f"/api/v1/patients/{pid}")
        assert resp2.status_code == 404


class TestPatientActivation:
    def test_staff_can_activate_patient(self, client, registered_patient, staff_headers):
        pid = registered_patient["Patient_ID"]
        resp = client.post(
            f"/api/v1/patients/{pid}/activate",
            headers=staff_headers,
        )
        assert resp.status_code == 200


class TestPatientNotificationsAndRecords:
    def test_get_empty_notifications(self, client, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.get(f"/api/v1/patients/{pid}/notifications")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_empty_medical_records(self, client, registered_patient):
        pid = registered_patient["Patient_ID"]
        resp = client.get(f"/api/v1/patients/{pid}/medical-records")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_notifications_for_nonexistent_patient(self, client):
        resp = client.get("/api/v1/patients/99999/notifications")
        assert resp.status_code == 404

    def test_medical_records_for_nonexistent_patient(self, client):
        resp = client.get("/api/v1/patients/99999/medical-records")
        assert resp.status_code == 404
