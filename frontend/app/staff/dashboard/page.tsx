"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ClipboardList, Clock3, ListChecks, RefreshCw, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

type Appointment = {
  Appointment_ID: number;
  Patient_ID: number;
  ClinicID: number;
  Doctor_ID: number | null;
  AppointmentDate: string;
  AppointmentTime?: string | null;
  Status: string;
};

type DoctorAvailability = {
  doctorId: number;
  doctorName: string;
  date: string;
  time: string;
  maxPatients: number;
  bookedPatients: number;
  scheduleId: number;
};

type LiveQueueEntry = {
  queueNumber: number;
  patientName: string;
  doctorName: string;
  appointmentId: string;
  status: string;
};

type Patient = {
  Patient_ID: number;
  Name: string;
  is_active: boolean;
};

export default function StaffDashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [clinicId, setClinicId] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorAvailability[]>([]);
  const [liveQueue, setLiveQueue] = useState<LiveQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [appointmentsResponse, patientsResponse, availabilityResponse, queueResponse] = await Promise.all([
        authFetch(`${apiUrl}/api/v1/appointments/`),
        authFetch(`${apiUrl}/api/v1/patients/`),
        authFetch(`${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(date)}&clinic_id=${encodeURIComponent(clinicId)}`),
        authFetch(`${apiUrl}/api/v1/staff/clinic-staff/live-queue/${encodeURIComponent(clinicId)}`),
      ]);

      setAppointments(appointmentsResponse.ok ? await appointmentsResponse.json() : []);
      setPatients(patientsResponse.ok ? await patientsResponse.json() : []);
      setAvailableDoctors(availabilityResponse.ok ? await availabilityResponse.json() : []);
      setLiveQueue(queueResponse.ok ? await queueResponse.json() : []);
    } catch (error) {
      console.error("Failed to load staff dashboard:", error);
      setAppointments([]);
      setPatients([]);
      setAvailableDoctors([]);
      setLiveQueue([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, date]);

  const summaryCards = useMemo(
    () => [
      { label: "Open appointments", value: appointments.length, icon: ClipboardList },
      { label: "Available doctors", value: availableDoctors.length, icon: ListChecks },
      { label: "Live queue", value: liveQueue.length, icon: UserCheck },
      { label: "Patients", value: patients.length, icon: Users },
    ],
    [appointments.length, availableDoctors.length, liveQueue.length, patients.length],
  );

  const activePatients = patients.filter((patient) => patient.is_active).length;
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <BellRing className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">Staff Dashboard</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadDashboard(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Clinic ID</span>
            <input
              value={clinicId}
              onChange={(event) => setClinicId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Today at a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Active patients</span>
              <span className="font-semibold text-slate-900">{activePatients}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Available doctors</span>
              <span className="font-semibold text-slate-900">{availableDoctors.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Live queue entries</span>
              <span className="font-semibold text-slate-900">{liveQueue.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading dashboard...</p>
            ) : recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-500">No appointments available.</p>
            ) : (
              recentAppointments.map((appointment) => (
                <div key={appointment.Appointment_ID} className="rounded-xl border border-slate-200 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Appointment #{appointment.Appointment_ID}</p>
                      <p className="text-slate-500">Clinic {appointment.ClinicID} • {appointment.AppointmentDate} {appointment.AppointmentTime || "Time pending"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{appointment.Status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
