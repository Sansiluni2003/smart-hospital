
"use client";
import React, { useState } from "react";

const initialDoctor = {
  doctorId: "",
  email: "",
  password: "",
  name: "",
  phone: "",
  speciality: "",
  licenseNumber: "",
};

const initialStaff = {
  staffId: "",
  email: "",
  password: "",
  name: "",
  phone: "",
  jobTitle: "",
  clinicId: "",
};

export default function RegisterForm() {
  const [role, setRole] = useState<"doctor" | "staff">("doctor");
  const [doctor, setDoctor] = useState(initialDoctor);
  const [staff, setStaff] = useState(initialStaff);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (role === "doctor") {
      setDoctor({ ...doctor, [name]: value });
    } else {
      setStaff({ ...staff, [name]: value });
    }
  };

  const handleRoleChange = (r: "doctor" | "staff") => setRole(r);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call
    alert("Registration submitted! (API integration needed)");
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
            <div>
              <label className="block text-sm font-medium mb-1">Doctor ID</label>
              <input
                name="doctorId"
                value={doctor.doctorId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Staff ID</label>
              <input
                name="staffId"
                value={staff.staffId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
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
                value={staff.clinicId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </>
        )}
        <button
          type="submit"
          className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 transition"
        >
          Register
        </button>
      </form>
      </div>
    </div>
  );
}
