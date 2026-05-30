"use client";
import { CalendarDays } from "lucide-react";
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

const initialAvailability: DoctorAvailability[] = [
  { doctorId: "DOC-101", doctorName: "Dr. Anura Perera", specialty: "General Medicine", date: "2026-05-28", time: "08:00 - 12:00", maxPatients: 25, bookedPatients: 18 },
  { doctorId: "DOC-102", doctorName: "Dr. Roshini Silva", specialty: "Pediatrics", date: "2026-05-28", time: "10:00 - 14:00", maxPatients: 20, bookedPatients: 20 },
  { doctorId: "DOC-103", doctorName: "Dr. Chamika Fernando", specialty: "ENT", date: "2026-05-29", time: "09:00 - 13:00", maxPatients: 16, bookedPatients: 11 },
];

export default function StaffAvailabilityPage() {
  const doctorAvailability = initialAvailability;
  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <CalendarDays className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">Doctor Availability</h2>
      </div>
      <div className="grid gap-4">
        {doctorAvailability.map((doctor) => (
          <Card key={doctor.doctorId} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                <p className="font-semibold text-slate-900">{doctor.doctorName}</p>
                <p className="text-sm text-slate-500">{doctor.specialty}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Date</p>
                <p className="font-medium text-slate-900">{doctor.date}</p>
                <p className="text-sm text-slate-500">{doctor.time}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Max Patients</p>
                <p className="font-medium text-slate-900">{doctor.maxPatients}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Booked</p>
                <p className="font-medium text-emerald-700">{doctor.bookedPatients}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
