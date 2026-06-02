"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

type Appointment = {
  Appointment_ID: number;
  Patient_ID: number;
  ClinicID: number;
  Doctor_ID: number | null;
  AppointmentDate: string;
  AppointmentTime?: string | null;
  Status: string;
  Notes?: string | null;
};

type Patient = {
  Patient_ID: number;
  Name: string;
  Phone_No: string;
};

export default function StaffAppointmentsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const patientLookup = useMemo(() => new Map(patients.map((patient) => [patient.Patient_ID, patient])), [patients]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [appointmentsResponse, patientsResponse] = await Promise.all([
        authFetch(`${apiUrl}/api/v1/appointments/`),
        authFetch(`${apiUrl}/api/v1/patients/`),
      ]);
      setAppointments(appointmentsResponse.ok ? await appointmentsResponse.json() : []);
      setPatients(patientsResponse.ok ? await patientsResponse.json() : []);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      setAppointments([]);
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const patient = patientLookup.get(appointment.Patient_ID);
    const haystack = [
      appointment.Appointment_ID,
      appointment.Status,
      appointment.AppointmentDate,
      appointment.AppointmentTime,
      appointment.ClinicID,
      patient?.Name,
      patient?.Phone_No,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <ClipboardList className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">Patient Appointments</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent outline-none text-sm text-slate-900"
              placeholder="Search appointment, patient, date, or status"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 text-sm text-slate-500">Loading appointments...</CardContent>
          </Card>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const patient = patientLookup.get(appointment.Patient_ID);
            return (
              <Card key={appointment.Appointment_ID} className="border-slate-200 shadow-sm">
                <CardContent className="p-5 grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Appointment</p>
                    <p className="font-semibold text-slate-900">#{appointment.Appointment_ID}</p>
                    <p className="text-sm text-slate-500">Clinic {appointment.ClinicID}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                    <p className="font-medium text-slate-900">{patient?.Name || `Patient #${appointment.Patient_ID}`}</p>
                    <p className="text-sm text-slate-500">{patient?.Phone_No || "No phone available"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Schedule</p>
                    <p className="font-medium text-slate-900">{appointment.AppointmentDate}</p>
                    <p className="text-sm text-slate-500">{appointment.AppointmentTime || "Time pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                    <p className="font-medium text-emerald-700">{appointment.Status}</p>
                    {appointment.Notes && <p className="text-sm text-slate-500">{appointment.Notes}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 text-sm text-slate-500">No appointments found.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
