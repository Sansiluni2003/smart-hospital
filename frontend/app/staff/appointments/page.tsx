"use client";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
};

const initialAppointments: Appointment[] = [
  { id: "APT-1201", patientName: "Nishan A.", phone: "+94771234567", doctorName: "Dr. Anura Perera", date: "2026-05-28", time: "08:15", status: "Waiting allocation" },
  { id: "APT-1202", patientName: "Hiruni K.", phone: "+94772345678", doctorName: "Dr. Roshini Silva", date: "2026-05-28", time: "10:30", status: "Booked" },
  { id: "APT-1203", patientName: "Sanjaya M.", phone: "+94773456789", doctorName: "Dr. Chamika Fernando", date: "2026-05-29", time: "09:45", status: "Booked" },
];

export default function StaffAppointmentsPage() {
  const appointments = initialAppointments;
  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <ClipboardList className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">Patient Appointments</h2>
      </div>
      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Appointment</p>
                <p className="font-semibold text-slate-900">{appointment.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">{appointment.patientName}</p>
                <p className="text-sm text-slate-500">{appointment.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                <p className="font-medium text-slate-900">{appointment.doctorName}</p>
                <p className="text-sm text-slate-500">{appointment.date} at {appointment.time}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="font-medium text-emerald-700">{appointment.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
