"""
Tests for Admin API endpoints under /api/v1/admin/admin/
"""

import pytest


class TestAdminUserCRUD:
    def test_create_user(self, client, admin_headers):
        resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "newuser@example.com", "Password": "Pass123!", "Role": "Staff"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["Email"] == "newuser@example.com"
        assert body["Role"] == "Staff"

    def test_create_user_requires_admin(self, client, patient_headers):
        resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "unauthorized@example.com", "Password": "Pass123!", "Role": "Staff"},
            headers=patient_headers,
        )
        assert resp.status_code == 403

    def test_get_user(self, client, admin_headers):
        # create first
        create_resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "getme@example.com", "Password": "Pass123!", "Role": "Doctor"},
            headers=admin_headers,
        )
        uid = create_resp.json()["UserID"]

        resp = client.get(f"/api/v1/admin/admin/user/{uid}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["UserID"] == uid

    def test_get_nonexistent_user(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/user/999999", headers=admin_headers)
        assert resp.status_code == 404

    def test_list_users(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/users/", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_users_filter_by_role(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/users/?role=Admin", headers=admin_headers)
        assert resp.status_code == 200
        users = resp.json()
        assert all(u["Role"] == "Admin" for u in users)

    def test_update_user(self, client, admin_headers):
        create_resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "updateme@example.com", "Password": "Pass123!", "Role": "Staff"},
            headers=admin_headers,
        )
        uid = create_resp.json()["UserID"]

        resp = client.put(
            f"/api/v1/admin/admin/user/{uid}",
            json={"Status": "Active"},
            headers=admin_headers,
        )
        assert resp.status_code == 200

    def test_delete_user(self, client, admin_headers):
        create_resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "deleteme@example.com", "Password": "Pass123!", "Role": "Staff"},
            headers=admin_headers,
        )
        uid = create_resp.json()["UserID"]

        del_resp = client.delete(f"/api/v1/admin/admin/user/{uid}", headers=admin_headers)
        assert del_resp.status_code == 200

        get_resp = client.get(f"/api/v1/admin/admin/user/{uid}", headers=admin_headers)
        assert get_resp.status_code == 404


class TestAdminDoctorCRUD:
    def test_create_and_get_doctor(self, client, admin_headers):
        # create user
        user_resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "doc2@example.com", "Password": "Doc123!", "Role": "Doctor"},
            headers=admin_headers,
        )
        uid = user_resp.json()["UserID"]

        doc_resp = client.post(
            "/api/v1/admin/admin/doctor/",
            json={"UserID": uid, "Name": "Dr. House", "Speciality": "Diagnostics", "Phone_No": "0700111000"},
            headers=admin_headers,
        )
        assert doc_resp.status_code == 200
        doc_id = doc_resp.json()["Doctor_ID"]

        get_resp = client.get(f"/api/v1/admin/admin/doctor/{doc_id}", headers=admin_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["Name"] == "Dr. House"

    def test_list_doctors(self, client, admin_headers, test_doctor):
        resp = client.get("/api/v1/admin/admin/doctors/", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_delete_doctor(self, client, admin_headers, test_doctor):
        doc_id = test_doctor["Doctor_ID"]
        resp = client.delete(f"/api/v1/admin/admin/doctor/{doc_id}", headers=admin_headers)
        assert resp.status_code == 200

        get_resp = client.get(f"/api/v1/admin/admin/doctor/{doc_id}", headers=admin_headers)
        assert get_resp.status_code == 404

    def test_get_nonexistent_doctor(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/doctor/99999", headers=admin_headers)
        assert resp.status_code == 404


class TestAdminStaffCRUD:
    def test_create_and_get_staff(self, client, admin_headers, test_clinic):
        user_resp = client.post(
            "/api/v1/admin/admin/user/",
            json={"Email": "staff2@example.com", "Password": "Staff123!", "Role": "Staff"},
            headers=admin_headers,
        )
        uid = user_resp.json()["UserID"]

        staff_resp = client.post(
            "/api/v1/admin/admin/staff/",
            json={
                "UserID": uid,
                "Name": "Jane Staff",
                "Phone_No": "0700222000",
                "JobTitle": "Nurse",
                "ClinicID": test_clinic,
            },
            headers=admin_headers,
        )
        assert staff_resp.status_code == 200
        sid = staff_resp.json()["Staff_ID"]

        get_resp = client.get(f"/api/v1/admin/admin/staff/{sid}", headers=admin_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["Name"] == "Jane Staff"

    def test_list_staffs(self, client, admin_headers, test_staff):
        resp = client.get("/api/v1/admin/admin/staffs/", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_delete_staff(self, client, admin_headers, test_staff):
        sid = test_staff["Staff_ID"]
        resp = client.delete(f"/api/v1/admin/admin/staff/{sid}", headers=admin_headers)
        assert resp.status_code == 200

    def test_get_nonexistent_staff(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/staff/99999", headers=admin_headers)
        assert resp.status_code == 404


class TestAdminAuditAndReport:
    def test_get_audit_logs(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/audit-logs/", headers=admin_headers)
        assert resp.status_code == 200

    def test_get_report(self, client, admin_headers):
        resp = client.get("/api/v1/admin/admin/report/", headers=admin_headers)
        assert resp.status_code == 200
