"use client";
import React, { useState } from "react";

// Dummy data for demonstration; replace with API data
const initialDoctors = [
  { doctorId: "D001", name: "Dr. John Doe", email: "john@example.com", phone: "1234567890", speciality: "Cardiology", licenseNumber: "MBBS123" },
  { doctorId: "D002", name: "Dr. Jane Smith", email: "jane@example.com", phone: "9876543210", speciality: "Neurology", licenseNumber: "MBBS456" },
];
const initialStaff = [
  { staffId: "S001", name: "Alice Brown", email: "alice@example.com", phone: "5551234567", jobTitle: "Receptionist", clinicId: "C01" },
  { staffId: "S002", name: "Bob White", email: "bob@example.com", phone: "5559876543", jobTitle: "Nurse", clinicId: "C02" },
];

export default function AdminUsersPage() {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [staff, setStaff] = useState(initialStaff);

  // Placeholder handlers for add, update, delete
  const handleAddDoctor = () => alert("Add Doctor functionality coming soon!");
  const handleUpdateDoctor = (id: string) => alert(`Update Doctor ${id} functionality coming soon!`);
  const handleDeleteDoctor = (id: string) => setDoctors(doctors.filter(d => d.doctorId !== id));

  const handleAddStaff = () => alert("Add Staff functionality coming soon!");
  const handleUpdateStaff = (id: string) => alert(`Update Staff ${id} functionality coming soon!`);
  const handleDeleteStaff = (id: string) => setStaff(staff.filter(s => s.staffId !== id));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Doctors</h2>
          <button onClick={handleAddDoctor} className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition">Add Doctor</button>
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
                <th className="px-4 py-2">License No</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.doctorId} className="border-b">
                  <td className="px-4 py-2">{doc.doctorId}</td>
                  <td className="px-4 py-2">{doc.name}</td>
                  <td className="px-4 py-2">{doc.email}</td>
                  <td className="px-4 py-2">{doc.phone}</td>
                  <td className="px-4 py-2">{doc.speciality}</td>
                  <td className="px-4 py-2">{doc.licenseNumber}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleUpdateDoctor(doc.doctorId)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Update</button>
                    <button onClick={() => handleDeleteDoctor(doc.doctorId)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
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
          <button onClick={handleAddStaff} className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition">Add Staff</button>
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
              {staff.map((s) => (
                <tr key={s.staffId} className="border-b">
                  <td className="px-4 py-2">{s.staffId}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">{s.phone}</td>
                  <td className="px-4 py-2">{s.jobTitle}</td>
                  <td className="px-4 py-2">{s.clinicId}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleUpdateStaff(s.staffId)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Update</button>
                    <button onClick={() => handleDeleteStaff(s.staffId)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
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