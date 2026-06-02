"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

type Patient = {
  Patient_ID: number;
  Name: string;
  Email: string;
  Phone_No: string;
  is_active: boolean;
};

export default function PatientAccountsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadPatients = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/v1/patients/`);
      setPatients(response.ok ? await response.json() : []);
    } catch (error) {
      console.error("Failed to load patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleActive = async (patientId: number, current: boolean) => {
    setMessage("");
    try {
      const response = await authFetch(`${apiUrl}/api/v1/staff/clinic-staff/activate-patient/?patient_id=${patientId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update patient account");
      }
      setPatients((currentPatients) =>
        currentPatients.map((patient) =>
          patient.Patient_ID === patientId ? { ...patient, is_active: !current } : patient,
        ),
      );
      setMessage(`Patient #${patientId} ${current ? "deactivated" : "activated"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update patient account");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto w-full max-w-6xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-700" />
            <CardTitle>Patient Accounts</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadPatients(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">Loading patients...</td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No patients found.</td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.Patient_ID}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{patient.Name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{patient.Email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{patient.Phone_No}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${patient.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {patient.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant={patient.is_active ? "outline" : "default"} size="sm" onClick={() => void toggleActive(patient.Patient_ID, patient.is_active)}>
                          {patient.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
