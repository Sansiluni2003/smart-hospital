
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";

const initialDoctor = {
  email: "",
  password: "",
  name: "",
  phone: "",
  speciality: "",
  averageConsultationMinutes: "10",
};

const initialStaff = {
  email: "",
  password: "",
  name: "",
  phone: "",
  jobTitle: "",
  clinicId: "",
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

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "staff">("doctor");
  const [doctor, setDoctor] = useState(initialDoctor);
  const [staff, setStaff] = useState(initialStaff);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setErrorMessage("Admin login is required. Please log in again.");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.Role !== "Admin") {
        setErrorMessage("Only admin users can access this page.");
        router.push("/login");
      }
    } catch {
      setErrorMessage("Invalid session. Please log in again.");
      router.push("/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResultMessage(null);
    setErrorMessage(null);
    if (role === "doctor") {
      setDoctor({ ...doctor, [name]: value });
    } else {
      setStaff({ ...staff, [name]: value });
    }
  };

  const handleRoleChange = (r: "doctor" | "staff") => {
    setRole(r);
    setResultMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const adminApiBase = `${apiUrl}/api/v1/admin/admin`;

    let createdUserId: number | null = null;

    try {
      const userPayload = role === "doctor"
        ? {
            Email: doctor.email,
            Password: doctor.password,
            Role: "Doctor",
          }
        : {
            Email: staff.email,
            Password: staff.password,
            Role: "Staff",
          };

      const userResponse = await authFetch(`${adminApiBase}/user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          throw new Error("Session expired or invalid token. Please log in again as Admin.");
        }
        if (userResponse.status === 403) {
          throw new Error("Only Admin role can create doctor/staff accounts.");
        }
        const errorPayload = await userResponse.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(errorPayload, "Failed to create user account"));
      }

      const userData = await userResponse.json();
      createdUserId = userData.UserID;

      const profilePayload = role === "doctor"
        ? {
            UserID: createdUserId,
            Name: doctor.name,
            Phone_No: doctor.phone || null,
            Speciality: doctor.speciality || null,
            AverageConsultationMinutes: Number(doctor.averageConsultationMinutes || "10"),
          }
        : {
            UserID: createdUserId,
            Name: staff.name,
            Phone_No: staff.phone || null,
            JobTitle: staff.jobTitle || null,
            ClinicID: Number(staff.clinicId),
          };

      const profileEndpoint = role === "doctor" ? "doctor" : "staff";
      const profileResponse = await authFetch(`${adminApiBase}/${profileEndpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          throw new Error("Session expired or invalid token. Please log in again as Admin.");
        }
        if (profileResponse.status === 403) {
          throw new Error("Only Admin role can create doctor/staff accounts.");
        }
        const errorPayload = await profileResponse.json().catch(() => ({}));

        if (createdUserId) {
          await authFetch(`${adminApiBase}/user/${createdUserId}`, { method: "DELETE" });
        }

        throw new Error(getApiErrorMessage(errorPayload, `Failed to create ${role} profile`));
      }

      setResultMessage(`${role === "doctor" ? "Doctor" : "Staff"} account created successfully.`);
      setDoctor(initialDoctor);
      setStaff(initialStaff);
    } catch (error: any) {
      setErrorMessage(error?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-8">
        <div className="flex justify-center mb-8 gap-4">
        <button
          type="button"
          onClick={() => handleRoleChange("doctor")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${role === "doctor" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-purple-50"}`}
        >
          Register Doctor
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange("staff")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${role === "staff" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-purple-50"}`}
        >
          Register Staff
        </button>
      </div>
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
        {role === "doctor" ? (
          <>
            <p className="text-sm text-gray-600">Doctor ID is generated automatically by the system.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Staff ID is generated automatically by the system.</p>
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            value={role === "doctor" ? doctor.email : staff.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            value={role === "doctor" ? doctor.password : staff.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            required
            value={role === "doctor" ? doctor.name : staff.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone No</label>
          <input
            name="phone"
            value={role === "doctor" ? doctor.phone : staff.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        {role === "doctor" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Speciality</label>
              <input
                name="speciality"
                value={doctor.speciality}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Average Consultation Minutes</label>
              <input
                name="averageConsultationMinutes"
                type="number"
                min={5}
                max={60}
                value={doctor.averageConsultationMinutes}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                name="jobTitle"
                value={staff.jobTitle}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clinic ID</label>
              <input
                name="clinicId"
                type="number"
                min={1}
                required
                value={staff.clinicId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </>
        )}
        {resultMessage && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{resultMessage}</p>
        )}
        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>
      </div>
    </div>
  );
}
