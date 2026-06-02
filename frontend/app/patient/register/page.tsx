"use client"

import { PatientRegistrationForm } from "@/components/registration/patient-registration-form"

export default function PatientRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Patient Account</h1>
          <p className="text-sm text-gray-600 mt-1">Register to book appointments and view your health records.</p>
        </div>
        <PatientRegistrationForm />
      </div>
    </div>
  )
}
