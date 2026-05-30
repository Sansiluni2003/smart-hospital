"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarDays,
  ClipboardList,
  QrCode,
  ListChecks,
  MessageSquareText,
  UserCheck,
  BellRing,
  Phone,
  Clock3,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Send,
  RefreshCw,
} from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"



type DoctorAvailability = {
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  time: string
  maxPatients: number
  bookedPatients: number
}

type Appointment = {
  id: string
  patientName: string
  phone: string
  doctorName: string
  date: string
  time: string
  status: string
}

type QueueEntry = {
  appointmentId: string
  patientName: string
  doctorName: string
  queueNumber: number
  eta: string
  status: string
}

type LiveQueueEntry = {
  queueNumber: number
  patientName: string
  doctorName: string
  appointmentId: string
  status: string
}


const initialAvailability: DoctorAvailability[] = [
  { doctorId: "DOC-101", doctorName: "Dr. Anura Perera", specialty: "General Medicine", date: "2026-05-28", time: "08:00 - 12:00", maxPatients: 25, bookedPatients: 18 },
  { doctorId: "DOC-102", doctorName: "Dr. Roshini Silva", specialty: "Pediatrics", date: "2026-05-28", time: "10:00 - 14:00", maxPatients: 20, bookedPatients: 20 },
  { doctorId: "DOC-103", doctorName: "Dr. Chamika Fernando", specialty: "ENT", date: "2026-05-29", time: "09:00 - 13:00", maxPatients: 16, bookedPatients: 11 },
]

const initialAppointments: Appointment[] = [
  { id: "APT-1201", patientName: "Nishan A.", phone: "+94771234567", doctorName: "Dr. Anura Perera", date: "2026-05-28", time: "08:15", status: "Waiting allocation" },
  { id: "APT-1202", patientName: "Hiruni K.", phone: "+94772345678", doctorName: "Dr. Roshini Silva", date: "2026-05-28", time: "10:30", status: "Booked" },
  { id: "APT-1203", patientName: "Sanjaya M.", phone: "+94773456789", doctorName: "Dr. Chamika Fernando", date: "2026-05-29", time: "09:45", status: "Booked" },
]

export default function StaffDashboardPage() {
  // Only render dashboard summary widgets here. Layout handles nav and headings.
  const doctorAvailability = initialAvailability;
  const appointments = initialAppointments;
  const queueEntries = [
    { appointmentId: "APT-1201", patientName: "Nishan A.", doctorName: "Dr. Anura Perera", queueNumber: 1, eta: "08:20", status: "Allocated" },
    { appointmentId: "APT-1202", patientName: "Hiruni K.", doctorName: "Dr. Roshini Silva", queueNumber: 2, eta: "10:40", status: "Waiting arrival" },
  ];
  const liveQueue = [
    { queueNumber: 1, patientName: "Nishan A.", doctorName: "Dr. Anura Perera", appointmentId: "APT-1201", status: "Now serving" },
  ];
  const smsLog = [
    "Queue message sent to +94771234567 for APT-1201.",
  ];
  const quickStats = [
    { label: "Open appointments", value: appointments.length, icon: ClipboardList },
    { label: "Queue allocations", value: queueEntries.length, icon: ListChecks },
    { label: "Live queue", value: liveQueue.length, icon: UserCheck },
    { label: "SMS notifications", value: smsLog.length, icon: MessageSquareText },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => {
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
      {/* Add more dashboard widgets/content here if needed */}
    </div>
  );
}