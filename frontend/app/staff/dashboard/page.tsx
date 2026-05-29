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

type StaffTab = "overview" | "availability" | "appointments" | "allocation" | "checkin" | "live-queue" | "sms"

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

const tabs: Array<{ id: StaffTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: Users },
  { id: "availability", label: "Doctor Availability", icon: CalendarDays },
  { id: "appointments", label: "Patient Appointments", icon: ClipboardList },
  { id: "allocation", label: "Queue Allocation", icon: ListChecks },
  { id: "checkin", label: "QR Check-in", icon: QrCode },
  { id: "live-queue", label: "Live Queue", icon: UserCheck },
  { id: "sms", label: "SMS Center", icon: MessageSquareText },
]

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
  const [activeTab, setActiveTab] = useState<StaffTab>("overview")
  const [doctorAvailability] = useState(initialAvailability)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [allocationAppointmentId, setAllocationAppointmentId] = useState("APT-1201")
  const [allocationDoctorId, setAllocationDoctorId] = useState("DOC-101")
  const [allocationMessage, setAllocationMessage] = useState("")
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([
    { appointmentId: "APT-1201", patientName: "Nishan A.", doctorName: "Dr. Anura Perera", queueNumber: 1, eta: "08:20", status: "Allocated" },
    { appointmentId: "APT-1202", patientName: "Hiruni K.", doctorName: "Dr. Roshini Silva", queueNumber: 2, eta: "10:40", status: "Waiting arrival" },
  ])
  const [liveQueue, setLiveQueue] = useState<LiveQueueEntry[]>([
    { queueNumber: 1, patientName: "Nishan A.", doctorName: "Dr. Anura Perera", appointmentId: "APT-1201", status: "Now serving" },
  ])
  const [smsLog, setSmsLog] = useState<string[]>([
    "Queue message sent to +94771234567 for APT-1201.",
  ])
  const [qrInput, setQrInput] = useState("")
  const [scanMessage, setScanMessage] = useState("")
  const [scannerError, setScannerError] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualSmsNumber, setManualSmsNumber] = useState("+94771234567")
  const [manualSmsMessage, setManualSmsMessage] = useState("")
  const [queueFilter, setQueueFilter] = useState("")

  const scannerRef = useState<{ current: Html5Qrcode | null }>({ current: null })[0]

  useEffect(() => {
    const hashToTab: Record<string, StaffTab> = {
      "#availability": "availability",
      "#appointments": "appointments",
      "#allocation": "allocation",
      "#checkin": "checkin",
      "#live-queue": "live-queue",
      "#sms": "sms",
    }

    const applyHash = () => {
      const nextTab = hashToTab[window.location.hash] || "overview"
      setActiveTab(nextTab)
    }

    applyHash()
    window.addEventListener("hashchange", applyHash)

    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => undefined)
      }
    }
  }, [scannerRef])

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === allocationAppointmentId) || appointments[0],
    [allocationAppointmentId, appointments]
  )

  const selectedDoctor = useMemo(
    () => doctorAvailability.find((doctor) => doctor.doctorId === allocationDoctorId) || doctorAvailability[0],
    [allocationDoctorId, doctorAvailability]
  )

  const filteredLiveQueue = useMemo(() => {
    if (!queueFilter.trim()) return liveQueue
    const query = queueFilter.toLowerCase()
    return liveQueue.filter((entry) =>
      entry.patientName.toLowerCase().includes(query) ||
      entry.doctorName.toLowerCase().includes(query) ||
      entry.appointmentId.toLowerCase().includes(query)
    )
  }, [liveQueue, queueFilter])

  const allocateToQueue = () => {
    if (!selectedAppointment || !selectedDoctor) return

    const nextQueueNumber = queueEntries.length + 1
    const eta = selectedDoctor.time.split(" - ")[0]
    const entry: QueueEntry = {
      appointmentId: selectedAppointment.id,
      patientName: selectedAppointment.patientName,
      doctorName: selectedDoctor.doctorName,
      queueNumber: nextQueueNumber,
      eta,
      status: "Allocated",
    }

    setQueueEntries((current) => [...current, entry])
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? { ...appointment, status: `Allocated to queue #${nextQueueNumber}` }
          : appointment
      )
    )
    setSmsLog((current) => [
      `SMS sent to ${selectedAppointment.phone}: ${selectedAppointment.patientName}, you are queue #${nextQueueNumber} for ${selectedDoctor.doctorName} on ${selectedDoctor.date} at ${selectedDoctor.time}.`,
      ...current,
    ])
    setAllocationMessage(`Allocated ${selectedAppointment.patientName} to queue #${nextQueueNumber} for ${selectedDoctor.doctorName}. SMS queued.`)
  }

  const handleCheckIn = () => {
    const appointmentId = qrInput.trim().toUpperCase()
    if (!appointmentId) return

    const queuedEntry = queueEntries.find((entry) => entry.appointmentId === appointmentId)
    if (!queuedEntry) {
      setScanMessage("No allocated queue entry found for that appointment ID.")
      return
    }

    setLiveQueue((current) => {
      if (current.some((entry) => entry.appointmentId === appointmentId)) {
        return current
      }

      return [
        {
          queueNumber: queuedEntry.queueNumber,
          patientName: queuedEntry.patientName,
          doctorName: queuedEntry.doctorName,
          appointmentId: queuedEntry.appointmentId,
          status: "Checked in",
        },
        ...current,
      ]
    })

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status: "Arrived and checked in" } : appointment
      )
    )
    setScanMessage(`Patient checked in for queue #${queuedEntry.queueNumber} and moved to live queue.`)
    setQrInput("")
  }

  const simulateSms = () => {
    if (!manualSmsNumber.trim() || !manualSmsMessage.trim()) return
    setSmsLog((current) => [`SMS sent to ${manualSmsNumber}: ${manualSmsMessage}`, ...current])
    setManualSmsMessage("")
  }

  const startScanner = async () => {
    setScannerError("")
    setIsScanning(true)

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("staff-reader")
        scannerRef.current = html5QrCode
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            setQrInput(decodedText)
            setScanMessage(`QR decoded: ${decodedText}`)
            html5QrCode.stop().catch(() => undefined)
            setIsScanning(false)
          },
          () => undefined
        )
      } catch {
        setScannerError("Could not access the camera. Use manual entry or upload a QR image.")
        setIsScanning(false)
      }
    }, 100)
  }

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(() => undefined)
    }
    setIsScanning(false)
  }

  const quickStats = [
    { label: "Open appointments", value: appointments.length, icon: ClipboardList },
    { label: "Queue allocations", value: queueEntries.length, icon: ListChecks },
    { label: "Live queue", value: liveQueue.length, icon: UserCheck },
    { label: "SMS notifications", value: smsLog.length, icon: MessageSquareText },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon
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
          )
        })}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-xl text-slate-900">Staff Workstation</CardTitle>
          <p className="text-sm text-slate-500">Use the sections below to manage doctors, appointments, queue allocation, check-ins, and SMS delivery.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[280px_1fr] min-h-[780px]">
            <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4 space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isActive ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </aside>

            <section className="p-4 sm:p-6 space-y-6 bg-white">
              {activeTab === "overview" && (
                <div id="availability" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {doctorAvailability.map((doctor) => (
                      <Card key={doctor.doctorId} className="border-slate-200 shadow-sm">
                        <CardContent className="p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{doctor.doctorName}</p>
                              <p className="text-sm text-slate-500">{doctor.specialty}</p>
                            </div>
                            <CalendarDays className="h-5 w-5 text-emerald-700" />
                          </div>
                          <p className="text-sm text-slate-600">{doctor.date}</p>
                          <p className="text-sm text-slate-600">{doctor.time}</p>
                          <p className="text-sm text-slate-600">Max patients: {doctor.maxPatients}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-5">
                      <p className="font-semibold text-emerald-900">Workflow</p>
                      <p className="mt-2 text-sm text-emerald-800">
                        Staff review doctor availability, assign patients to queues based on capacity, send queue details by SMS, and move arrived patients into the live queue after QR check-in.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "availability" && (
                <div id="appointments" className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarDays className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-lg font-semibold">Doctors Availability</h2>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Doctor</th>
                          <th className="px-4 py-3 text-left font-medium">Specialty</th>
                          <th className="px-4 py-3 text-left font-medium">Date</th>
                          <th className="px-4 py-3 text-left font-medium">Time</th>
                          <th className="px-4 py-3 text-left font-medium">Capacity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {doctorAvailability.map((doctor) => (
                          <tr key={doctor.doctorId}>
                            <td className="px-4 py-3 font-medium text-slate-900">{doctor.doctorName}</td>
                            <td className="px-4 py-3 text-slate-600">{doctor.specialty}</td>
                            <td className="px-4 py-3 text-slate-600">{doctor.date}</td>
                            <td className="px-4 py-3 text-slate-600">{doctor.time}</td>
                            <td className="px-4 py-3 text-slate-600">{doctor.bookedPatients}/{doctor.maxPatients}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "appointments" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
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
              )}

              {activeTab === "allocation" && (
                <div id="allocation" className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-700">
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
                            onChange={(e) => setAllocationAppointmentId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          >
                            {appointments.map((appointment) => (
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
                            onChange={(e) => setAllocationDoctorId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          >
                            {doctorAvailability.map((doctor) => (
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
                    {queueEntries.map((entry) => (
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
              )}

              {activeTab === "checkin" && (
                <div id="checkin" className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-700">
                    <QrCode className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-lg font-semibold">QR Code Check-in</h2>
                  </div>

                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-emerald-600 text-white">
                      <CardTitle className="text-xl">Patient marked as arrived</CardTitle>
                      <p className="text-sm text-emerald-50">Scan QR code, upload an image, or enter appointment ID manually.</p>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Button onClick={startScanner} className="h-24 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50" variant="outline">
                          <span className="flex flex-col items-center gap-2">
                            <QrCode className="h-7 w-7" />
                            <span>Use Device Camera</span>
                          </span>
                        </Button>
                        <label className="relative">
                          <input type="file" accept="image/*" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                          <Button className="h-24 w-full bg-white text-blue-700 border border-blue-200 hover:bg-blue-50" variant="outline">
                            <span className="flex flex-col items-center gap-2">
                              <RefreshCw className="h-7 w-7" />
                              <span>Upload QR Image</span>
                            </span>
                          </Button>
                        </label>
                      </div>

                      {isScanning && (
                        <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 text-white">
                          <div id="staff-reader" className="min-h-[280px] rounded-lg bg-black" />
                          <div className="mt-3 flex justify-end">
                            <Button onClick={stopScanner} variant="ghost" className="text-white hover:bg-white/10">
                              Stop camera
                            </Button>
                          </div>
                        </div>
                      )}

                      {scannerError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{scannerError}</div>}
                      {scanMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{scanMessage}</div>}

                      <label className="space-y-2 block">
                        <span className="text-sm font-medium text-slate-700">Appointment ID result</span>
                        <input
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          placeholder="e.g. APT-1201"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </label>

                      <Button onClick={handleCheckIn} disabled={!qrInput.trim()} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                        Confirm arrival and add to live queue
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "live-queue" && (
                <div id="live-queue" className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <UserCheck className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-lg font-semibold">Live Queue Management</h2>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      value={queueFilter}
                      onChange={(e) => setQueueFilter(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm text-slate-900"
                      placeholder="Search patient, doctor, or appointment"
                    />
                  </div>

                  <div className="grid gap-4">
                    {filteredLiveQueue.map((entry) => (
                      <Card key={entry.appointmentId} className="border-slate-200 shadow-sm">
                        <CardContent className="p-5 grid gap-3 md:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Queue #</p>
                            <p className="text-2xl font-semibold text-emerald-700">{entry.queueNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                            <p className="font-medium text-slate-900">{entry.patientName}</p>
                            <p className="text-sm text-slate-500">{entry.appointmentId}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                            <p className="font-medium text-slate-900">{entry.doctorName}</p>
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
              )}

              {activeTab === "sms" && (
                <div id="sms" className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MessageSquareText className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-lg font-semibold">SMS Center</h2>
                  </div>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-700">
                          <span className="font-medium">Phone number</span>
                          <input
                            value={manualSmsNumber}
                            onChange={(e) => setManualSmsNumber(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            placeholder="+94xxxxxxxxx"
                          />
                        </label>
                        <label className="space-y-2 text-sm text-slate-700">
                          <span className="font-medium">Message</span>
                          <textarea
                            value={manualSmsMessage}
                            onChange={(e) => setManualSmsMessage(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[110px]"
                            placeholder="Queue number, doctor, time, or arrival instructions"
                          />
                        </label>
                      </div>

                      <Button onClick={simulateSms} className="bg-emerald-600 text-white hover:bg-emerald-700">
                        <Send className="mr-2 h-4 w-4" />
                        Send SMS
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-900">SMS log</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {smsLog.map((entry, index) => (
                        <div key={`${index}-${entry}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          {entry}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "overview" && (
                <div className="hidden" />
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}