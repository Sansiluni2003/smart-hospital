"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";

type User = {
  UserID: number;
  Email: string;
  Role: "Patient" | "Doctor" | "Staff" | "Admin";
  CreatedAt: string;
};

type Doctor = {
  Doctor_ID: number;
  UserID: number;
  Name: string;
  Phone_No?: string | null;
  Speciality?: string | null;
  AverageConsultationMinutes?: number | null;
};

type Staff = {
  Staff_ID: number;
  UserID: number;
  Name: string;
  Phone_No?: string | null;
  JobTitle?: string | null;
  ClinicID: number;
};

const getApiErrorMessage = (payload: any, fallback: string) => {
  const detail = payload?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item: any) => item?.msg || JSON.stringify(item)).join("; ");
  }
  if (typeof detail === "string") {
    return detail;
  }
  return fallback;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const adminApiBase = `${apiUrl}/api/v1/admin/admin`;

  const userEmailById = useMemo(() => {
    const map = new Map<number, string>();
    users.forEach((user) => map.set(user.UserID, user.Email));
    return map;
  }, [users]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, doctorsResponse, staffResponse] = await Promise.all([
        authFetch(`${adminApiBase}/users/`),
        authFetch(`${adminApiBase}/doctors/`),
        authFetch(`${adminApiBase}/staffs/`),
      ]);

      if (!usersResponse.ok || !doctorsResponse.ok || !staffResponse.ok) {
        if (usersResponse.status === 401 || doctorsResponse.status === 401 || staffResponse.status === 401) {
          setError("Session expired or invalid token. Please log in again as Admin.");
          router.push("/login");
          return;
        }
        if (usersResponse.status === 403 || doctorsResponse.status === 403 || staffResponse.status === 403) {
          setError("Only Admin role can access manage users.");
          router.push("/login");
          return;
        }
        throw new Error("Failed to load users");
      }

      const [usersData, doctorsData, staffData] = await Promise.all([
        usersResponse.json(),
        doctorsResponse.json(),
        staffResponse.json(),
      ]);

      setUsers(usersData);
      setDoctors(doctorsData);
      setStaff(staffData);
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setError("Admin login is required. Please log in again.");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.Role !== "Admin") {
        setError("Only admin users can access this page.");
        router.push("/login");
        return;
      }
    } catch {
      setError("Invalid session. Please log in again.");
      router.push("/login");
      return;
    }

    fetchAll();
  }, [router]);

  const handleDeleteDoctor = async (doctorId: number) => {
    if (!confirm(`Delete doctor #${doctorId}?`)) return;

    try {
      const response = await authFetch(`${adminApiBase}/doctor/${doctorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload, "Failed to delete doctor"));
      }

      await fetchAll();
    } catch (err: any) {
      alert(err?.message || "Failed to delete doctor");
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm(`Delete staff #${staffId}?`)) return;

    try {
      const response = await authFetch(`${adminApiBase}/staff/${staffId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(payload, "Failed to delete staff"));
      }

      await fetchAll();
    } catch (err: any) {
      alert(err?.message || "Failed to delete staff");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Link
          href="/admin/register"
          className="rounded-lg bg-purple-700 px-4 py-2 font-medium text-white transition hover:bg-purple-800"
        >
          Create Doctor/Staff
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Doctors</h2>
          <span className="text-sm text-gray-500">Total: {doctors.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Doctor ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Speciality</th>
                <th className="px-4 py-2">Avg. Minutes</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500" colSpan={7}>Loading doctors...</td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500" colSpan={7}>No doctors found.</td>
                </tr>
              ) : doctors.map((doc) => (
                <tr key={doc.Doctor_ID} className="border-b">
                  <td className="px-4 py-2">{doc.Doctor_ID}</td>
                  <td className="px-4 py-2">{doc.Name}</td>
                  <td className="px-4 py-2">{userEmailById.get(doc.UserID) || "-"}</td>
                  <td className="px-4 py-2">{doc.Phone_No || "-"}</td>
                  <td className="px-4 py-2">{doc.Speciality || "-"}</td>
                  <td className="px-4 py-2">{doc.AverageConsultationMinutes || 10}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleDeleteDoctor(doc.Doctor_ID)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Staff</h2>
          <span className="text-sm text-gray-500">Total: {staff.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Staff ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Job Title</th>
                <th className="px-4 py-2">Clinic ID</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500" colSpan={7}>Loading staff...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500" colSpan={7}>No staff found.</td>
                </tr>
              ) : staff.map((member) => (
                <tr key={member.Staff_ID} className="border-b">
                  <td className="px-4 py-2">{member.Staff_ID}</td>
                  <td className="px-4 py-2">{member.Name}</td>
                  <td className="px-4 py-2">{userEmailById.get(member.UserID) || "-"}</td>
                  <td className="px-4 py-2">{member.Phone_No || "-"}</td>
                  <td className="px-4 py-2">{member.JobTitle || "-"}</td>
                  <td className="px-4 py-2">{member.ClinicID}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleDeleteStaff(member.Staff_ID)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}