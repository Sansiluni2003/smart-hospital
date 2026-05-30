"use client";
import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DoctorAvailability = {
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  maxPatients: number;
  bookedPatients: number;
};
type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
};
type QueueEntry = {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  queueNumber: number;
  eta: string;
  status: string;
};

const initialAvailability: DoctorAvailability[] = [
  { doctorId: "DOC-101", doctorName: "Dr. Anura Perera", specialty: "General Medicine", date: "2026-05-28", time: "08:00 - 12:00", maxPatients: 25, bookedPatients: 18 },
  { doctorId: "DOC-102", doctorName: "Dr. Roshini Silva", specialty: "Pediatrics", date: "2026-05-28", time: "10:00 - 14:00", maxPatients: 20, bookedPatients: 20 },
  { doctorId: "DOC-103", doctorName: "Dr. Chamika Fernando", specialty: "ENT", date: "2026-05-29", time: "09:00 - 13:00", maxPatients: 16, bookedPatients: 11 },
];
const initialAppointments: Appointment[] = [
  { id: "APT-1201", patientName: "Nishan A.", phone: "+94771234567", doctorName: "Dr. Anura Perera", date: "2026-05-28", time: "08:15", status: "Waiting allocation" },
  { id: "APT-1202", patientName: "Hiruni K.", phone: "+94772345678", doctorName: "Dr. Roshini Silva", date: "2026-05-28", time: "10:30", status: "Booked" },
  { id: "APT-1203", patientName: "Sanjaya M.", phone: "+94773456789", doctorName: "Dr. Chamika Fernando", date: "2026-05-29", time: "09:45", status: "Booked" },
];
const initialQueue: QueueEntry[] = [
  { appointmentId: "APT-1201", patientName: "Nishan A.", doctorName: "Dr. Anura Perera", queueNumber: 1, eta: "08:20", status: "Allocated" },
  { appointmentId: "APT-1202", patientName: "Hiruni K.", doctorName: "Dr. Roshini Silva", queueNumber: 2, eta: "10:40", status: "Waiting arrival" },
];

export default function StaffAllocationPage() {
  const [allocationAppointmentId, setAllocationAppointmentId] = useState(initialAppointments[0].id);
  const [allocationDoctorId, setAllocationDoctorId] = useState(initialAvailability[0].doctorId);
  const [allocationMessage, setAllocationMessage] = useState("");
  const [queueEntries, setQueueEntries] = useState(initialQueue);
  const appointments = initialAppointments;
  const doctorAvailability = initialAvailability;
  const selectedAppointment = appointments.find(a => a.id === allocationAppointmentId);
  const selectedDoctor = doctorAvailability.find(d => d.doctorId === allocationDoctorId);

  const allocateToQueue = () => {
    setAllocationMessage(`Allocated ${selectedAppointment?.patientName} to ${selectedDoctor?.doctorName}'s queue!`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <ListChecks className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">Queue Allocation</h2>
      </div>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Appointment</span>
              <select
                value={allocationAppointmentId}
                onChange={e => setAllocationAppointmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {appointments.map(appointment => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.id} - {appointment.patientName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Doctor</span>
              <select
                value={allocationDoctorId}
                onChange={e => setAllocationDoctorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {doctorAvailability.map(doctor => (
                  <option key={doctor.doctorId} value={doctor.doctorId}>
                    {doctor.doctorName} - {doctor.date} {doctor.time}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Selected appointment</p>
              <p className="font-medium text-slate-900">{selectedAppointment?.patientName}</p>
              <p className="text-slate-500">{selectedAppointment?.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Selected doctor</p>
              <p className="font-medium text-slate-900">{selectedDoctor?.doctorName}</p>
              <p className="text-slate-500">{selectedDoctor?.date} • {selectedDoctor?.time}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Queue capacity</p>
              <p className="font-medium text-slate-900">Max {selectedDoctor?.maxPatients} patients</p>
              <p className="text-slate-500">Booked {selectedDoctor?.bookedPatients}</p>
            </div>
          </div>
          {allocationMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {allocationMessage}
            </div>
          )}
          <Button onClick={allocateToQueue} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            Allocate to queue and queue the SMS
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {queueEntries.map(entry => (
          <Card key={entry.appointmentId} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Queue number</p>
                <p className="text-2xl font-semibold text-emerald-700">#{entry.queueNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">{entry.patientName}</p>
                <p className="text-sm text-slate-500">{entry.appointmentId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                <p className="font-medium text-slate-900">{entry.doctorName}</p>
                <p className="text-sm text-slate-500">ETA {entry.eta}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="font-medium text-slate-900">{entry.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
