"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authFetch } from "@/lib/authFetch"

type Appointment = {
  Appointment_ID: number
  Patient_ID: number
  ClinicID: number
  Doctor_ID: number | null
  AppointmentDate: string
  AppointmentTime?: string | null
  Status: string
  Notes?: string | null
}

type Patient = {
  Patient_ID: number
  Name: string
  Phone_No: string
  OPD_Id?: string
}

type DoctorOption = {
  doctorId: number
  doctorName: string
  specialty?: string
  date: string
  time: string
  maxPatients: number
  bookedPatients: number
  scheduleId: number
  startTime: string
  endTime: string
}

type QueueEntry = {
  queueNumber: number
  patientName: string
  doctorName: string
  appointmentId: string
  status: string
  date?: string | null
  time?: string | null
  phone?: string | null
}

const todayDate = () => new Date().toISOString().slice(0, 10)

function appointmentStatusBadge(status: string) {
  const s = status.toLowerCase()
  if (s.includes("allocated")) return "bg-blue-100 text-blue-700"
  if (s.includes("arrived")) return "bg-indigo-100 text-indigo-700"
  if (s.includes("completed")) return "bg-emerald-100 text-emerald-700"
  if (s.includes("cancelled")) return "bg-red-100 text-red-700"
  if (s.includes("pending")) return "bg-amber-100 text-amber-700"
  return "bg-slate-100 text-slate-600"
}

function capacityBar(booked: number, max: number) {
  const pct = max > 0 ? (booked / max) * 100 : 0
  const color = pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-400" : "bg-emerald-500"
  return { pct: Math.min(pct, 100), color }
}

export default function StaffAllocationPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([])
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const patientLookup = useMemo(() => new Map(patients.map((p) => [p.Patient_ID, p])), [patients])
  const selectedAppointment = useMemo(
    () => appointments.find((a) => String(a.Appointment_ID) === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  )
  const selectedDoctor = useMemo(
    () => availableDoctors.find((d) => String(d.doctorId) === selectedDoctorId) ?? null,
    [availableDoctors, selectedDoctorId],
  )

  const loadAppointments = async () => {
    const res = await authFetch(`${apiUrl}/api/v1/appointments/`)
    if (!res.ok) throw new Error("Failed to load appointments")
    const data: Appointment[] = await res.json()
    setAppointments(data)
    const firstPending = data.find((a) => !a.Doctor_ID || String(a.Status ?? "").toLowerCase().includes("pending"))
    if (firstPending) {
      setSelectedAppointmentId(String(firstPending.Appointment_ID))
      setSelectedClinicId(String(firstPending.ClinicID))
      setSelectedDate(firstPending.AppointmentDate)
    }
  }

  const loadPatients = async () => {
    const res = await authFetch(`${apiUrl}/api/v1/patients/`)
    if (!res.ok) throw new Error("Failed to load patients")
    setPatients(await res.json())
  }

  const loadAvailableDoctors = async (clinicId: string, date: string) => {
    if (!clinicId || !date) { setAvailableDoctors([]); return }
    const res = await authFetch(
      `${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(date)}&clinic_id=${encodeURIComponent(clinicId)}`,
    )
    if (!res.ok) throw new Error("Failed to load available doctors")
    const data: DoctorOption[] = await res.json()
    setAvailableDoctors(data)
    setSelectedDoctorId((cur) =>
      data.some((d) => String(d.doctorId) === cur) ? cur : String(data[0]?.doctorId ?? ""),
    )
  }

  const loadLiveQueue = async (clinicId: string) => {
    if (!clinicId) { setLiveQueue([]); return }
    const res = await authFetch(`${apiUrl}/api/v1/staff/clinic-staff/live-queue/${clinicId}`)
    if (!res.ok) throw new Error("Failed to load live queue")
    setLiveQueue(await res.json())
  }

  const refreshAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      await Promise.all([loadAppointments(), loadPatients()])
    } catch (e) {
      console.error(e)
      setErrorMsg("Failed to load data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void refreshAll() }, [])

  useEffect(() => {
    if (!successMsg && !errorMsg) return
    const timer = setTimeout(() => {
      setSuccessMsg("")
      setErrorMsg("")
    }, 4000)
    return () => clearTimeout(timer)
  }, [successMsg, errorMsg])

  useEffect(() => {
    if (!selectedClinicId || !selectedDate) return
    void loadAvailableDoctors(selectedClinicId, selectedDate).catch(console.error)
    void loadLiveQueue(selectedClinicId).catch(console.error)
  }, [selectedClinicId, selectedDate])

  useEffect(() => {
    if (selectedAppointment) {
      setSelectedClinicId(String(selectedAppointment.ClinicID))
      setSelectedDate(selectedAppointment.AppointmentDate)
    }
  }, [selectedAppointment])

  const allocateAppointment = async () => {
    if (!selectedAppointment || !selectedDoctor) return
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const appointmentDate = selectedDate
      const res = await authFetch(
        `${apiUrl}/api/v1/staff/clinic-staff/allocate-appointment/?appointment_id=${selectedAppointment.Appointment_ID}&doctor_id=${selectedDoctor.doctorId}&appointment_date=${encodeURIComponent(appointmentDate)}`,
        { method: "POST" },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail ?? "Failed to allocate appointment")
      }
      setSuccessMsg(
        `Appointment #${selectedAppointment.Appointment_ID} allocated to ${selectedDoctor.doctorName}.`,
      )
      await refreshAll(true)
      await loadAvailableDoctors(selectedClinicId, selectedDate)
      await loadLiveQueue(selectedClinicId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to allocate appointment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        fontFamily: '"Space Grotesk", "Sora", sans-serif',
        background: "radial-gradient(circle at top, #e6f3ff 0%, #f8fafc 35%, #ffffff 100%)",
      }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@400;600&display=swap");
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-[-120px] h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-100/60 blur-3xl" />
      </div>

      {(successMsg || errorMsg) && (
        <div className="fixed top-6 right-6 z-50 space-y-2">
          {successMsg && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-xl">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              {successMsg}
              <button className="ml-auto text-emerald-600 hover:text-emerald-800" onClick={() => setSuccessMsg("")}>x</button>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl">
              <XCircle className="h-4 w-4 shrink-0 text-red-600" />
              {errorMsg}
              <button className="ml-auto text-red-600 hover:text-red-800" onClick={() => setErrorMsg("")}>x</button>
            </div>
          )}
        </div>
      )}

      <div className="relative mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Smart Allocation
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Queue Allocation Center</h1>
            <p className="text-sm text-slate-600">
              Match patients to the right doctor and keep the live queue moving.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshAll(true)}
            disabled={refreshing}
            className="border-slate-300 bg-white/80"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh data
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm bg-white/90">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Appointments</p>
                <p className="text-2xl font-semibold text-slate-900">{appointments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-white/90">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700"><Stethoscope className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Available doctors</p>
                <p className="text-2xl font-semibold text-slate-900">{availableDoctors.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-white/90">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Clock3 className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Live queue</p>
                <p className="text-2xl font-semibold text-slate-900">{liveQueue.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white/90">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Clinic</p>
              <input
                type="number"
                min={1}
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Appointment date</p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Selected appointment</p>
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {selectedAppointment
                  ? `#${selectedAppointment.Appointment_ID} - Patient ${selectedAppointment.Patient_ID}`
                  : "Pick an appointment from the list"}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200 shadow-sm bg-white/95">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Booked Appointments
                <span className="text-xs font-normal text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                  {appointments.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[34rem] overflow-auto pr-1">
              {loading ? (
                <p className="py-6 text-center text-sm text-slate-500">Loading appointments...</p>
              ) : appointments.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No appointments found.</p>
              ) : (
                appointments.map((apt) => {
                  const patient = patientLookup.get(apt.Patient_ID)
                  const isSelected = selectedAppointmentId === String(apt.Appointment_ID)
                  const badgeCls = appointmentStatusBadge(apt.Status ?? "")
                  return (
                    <button
                      key={apt.Appointment_ID}
                      onClick={() => setSelectedAppointmentId(String(apt.Appointment_ID))}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {patient?.Name ?? `Patient #${apt.Patient_ID}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            #{apt.Appointment_ID} - Clinic {apt.ClinicID}
                            {apt.Doctor_ID ? ` - Dr #${apt.Doctor_ID}` : " - Unallocated"}
                          </p>
                          <p className="text-xs text-slate-500">
                            <CalendarDays className="inline h-3 w-3 mr-0.5 align-middle" />
                            {apt.AppointmentDate}{" "}
                            {apt.AppointmentTime ? (
                              <><Clock3 className="inline h-3 w-3 mr-0.5 align-middle" />{apt.AppointmentTime}</>
                            ) : (
                              " - time pending"
                            )}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                          {apt.Status}
                        </span>
                      </div>
                      {apt.Notes && (
                        <p className="mt-2 truncate text-xs text-slate-500">Note: {apt.Notes}</p>
                      )}
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white/95">
              <CardHeader>
                <CardTitle className="text-base">Doctor selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedAppointment ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                    <p className="font-semibold text-emerald-900">
                      Appointment #{selectedAppointment.Appointment_ID}
                    </p>
                    <p className="text-slate-600">
                      {patientLookup.get(selectedAppointment.Patient_ID)?.Name ??
                        `Patient #${selectedAppointment.Patient_ID}`}
                    </p>
                    <p className="text-slate-500">
                      {selectedAppointment.AppointmentDate}{" "}
                      {selectedAppointment.AppointmentTime ?? " - time pending"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select an appointment to continue.</p>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Available doctors
                    <span className="text-xs text-slate-400"> ({availableDoctors.length})</span>
                  </p>
                  <div className="space-y-2 max-h-[18rem] overflow-auto pr-1">
                    {availableDoctors.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
                        No available doctors found for this date and clinic.
                      </p>
                    ) : (
                      availableDoctors.map((doc) => {
                        const isDocSelected = String(doc.doctorId) === selectedDoctorId
                        const { pct, color } = capacityBar(doc.bookedPatients, doc.maxPatients)
                        const isFull = doc.bookedPatients >= doc.maxPatients
                        return (
                          <button
                            key={doc.scheduleId}
                            disabled={isFull}
                            onClick={() => setSelectedDoctorId(String(doc.doctorId))}
                            className={`w-full rounded-xl border p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              isDocSelected
                                ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300"
                                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{doc.doctorName}</p>
                                <p className="text-xs text-slate-500">{doc.specialty ?? "Doctor"} - {doc.time}</p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isFull
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {doc.bookedPatients}/{doc.maxPatients}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200">
                              <div
                                className={`h-1.5 rounded-full ${color}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => void allocateAppointment()}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={!selectedAppointment || !selectedDoctor || saving}
                >
                  {saving ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Allocating...</>
                  ) : (
                    <>
                      <ListChecks className="mr-2 h-4 w-4" />
                      Allocate to {selectedDoctor ? selectedDoctor.doctorName : "doctor"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white/95">
              <CardHeader>
                <CardTitle className="text-base">Live queue snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {liveQueue.length === 0 ? (
                  <p className="text-sm text-slate-500">No live queue entries yet.</p>
                ) : (
                  liveQueue.slice(0, 4).map((entry) => (
                    <div key={entry.appointmentId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{entry.patientName}</p>
                        <p className="text-xs text-slate-500">{entry.doctorName} - {entry.appointmentId}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">#{entry.queueNumber}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
