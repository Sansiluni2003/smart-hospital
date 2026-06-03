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
  Building2,
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

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState(todayDate())
  const [selectedClinicId, setSelectedClinicId] = useState<string>("1") // Defaulted to 1 to avoid empty state

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const patientLookup = useMemo(() => new Map(patients.map((p) => [p.Patient_ID, p])), [patients])

  // Derive pending and allocated appointments
  const pendingAppointments = useMemo(
    () => appointments.filter((a) => !a.Doctor_ID || String(a.Status ?? "").toLowerCase().includes("pending")),
    [appointments]
  )

  const allocatedAppointments = useMemo(
    () => appointments.filter((a) => a.Doctor_ID && String(a.Status ?? "").toLowerCase().includes("allocated")),
    [appointments]
  )

  const selectedAppointment = useMemo(
    () => appointments.find((a) => String(a.Appointment_ID) === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId]
  )

  const selectedDoctor = useMemo(
    () => availableDoctors.find((d) => String(d.doctorId) === selectedDoctorId) ?? null,
    [availableDoctors, selectedDoctorId]
  )

  const loadAppointments = async () => {
    const res = await authFetch(`${apiUrl}/api/v1/appointments/`)
    if (!res.ok) throw new Error("Failed to load appointments")
    const data: Appointment[] = await res.json()

    // Filter appointments: remove ONLY completed and arrived
    const filteredAppointments = data.filter((a) => {
      const status = String(a.Status ?? "").toLowerCase()
      const isCompletedOrArrived = status.includes("completed") || status.includes("arrived")
      return !isCompletedOrArrived
    })

    setAppointments(filteredAppointments)

    // Auto-select first pending if none selected
    const firstPending = filteredAppointments.find((a) => !a.Doctor_ID || String(a.Status ?? "").toLowerCase().includes("pending"))
    if (firstPending && !selectedAppointmentId) {
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

    // Filter out doctors who are already fully booked
    const actuallyAvailableDoctors = data.filter((d) => d.bookedPatients < d.maxPatients)

    setAvailableDoctors(actuallyAvailableDoctors)
    setSelectedDoctorId((cur) =>
      actuallyAvailableDoctors.some((d) => String(d.doctorId) === cur)
        ? cur
        : String(actuallyAvailableDoctors[0]?.doctorId ?? ""),
    )
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
      
      // Auto-select the next pending appointment after successful allocation
      const nextPending = pendingAppointments.find(a => String(a.Appointment_ID) !== String(selectedAppointment.Appointment_ID))
      if (nextPending) setSelectedAppointmentId(String(nextPending.Appointment_ID))

      await refreshAll(true)
      await loadAvailableDoctors(selectedClinicId, selectedDate)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to allocate appointment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col relative"
      style={{
        fontFamily: '"Space Grotesk", "Sora", sans-serif',
        background: "radial-gradient(circle at top left, #f0fdfa 0%, #f8fafc 40%, #ffffff 100%)",
      }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@400;600&display=swap");
      `}</style>
      
      {/* Decorative Background Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      {/* Notifications */}
      {(successMsg || errorMsg) && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 space-y-2 w-[90%] max-w-md">
          {successMsg && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/95 backdrop-blur-sm px-4 py-3 text-sm text-emerald-800 shadow-xl animate-in slide-in-from-top-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="flex-1 font-medium">{successMsg}</span>
              <button className="text-emerald-600 hover:text-emerald-800" onClick={() => setSuccessMsg("")}><XCircle className="h-4 w-4"/></button>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/95 backdrop-blur-sm px-4 py-3 text-sm text-red-800 shadow-xl animate-in slide-in-from-top-4">
              <XCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="flex-1 font-medium">{errorMsg}</span>
              <button className="text-red-600 hover:text-red-800" onClick={() => setErrorMsg("")}><XCircle className="h-4 w-4"/></button>
            </div>
          )}
        </div>
      )}

      {/* Top Navigation / Header */}
      <header className="relative z-10 shrink-0 bg-white/70 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 mb-1">
              <Sparkles className="h-3 w-3" /> Staff Portal
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Queue Allocation Center</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Unified Filter Toolbar */}
            <div className="flex items-center gap-0 rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden h-10">
              <div className="flex items-center px-3 bg-slate-50 border-r border-slate-200 h-full">
                <Building2 className="w-4 h-4 text-slate-400 mr-2" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Clinic</span>
                <input
                  type="number"
                  min={1}
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-12 bg-transparent border-none text-sm font-medium text-slate-900 focus:outline-none focus:ring-0 p-0"
                />
              </div>
              <div className="flex items-center px-3 bg-white h-full">
                <CalendarDays className="w-4 h-4 text-slate-400 mr-2" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-900 focus:outline-none focus:ring-0 p-0"
                />
              </div>
            </div>

            <Button
              variant="default"
              onClick={() => void refreshAll(true)}
              disabled={refreshing}
              className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 shadow-sm transition-all"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 min-h-0 overflow-hidden p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto h-full grid lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Pending Appointments */}
          <Card className="lg:col-span-6 xl:col-span-5 flex flex-col h-full overflow-hidden border-slate-200 shadow-md bg-white/95 backdrop-blur-sm">
            <CardHeader className="shrink-0 border-b border-slate-100 bg-white py-4 px-5">
              <CardTitle className="text-lg flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Pending Allocation
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingAppointments.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
              {loading ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">Loading appointments...</div>
              ) : pendingAppointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <div className="p-4 rounded-full bg-slate-100"><CheckCircle2 className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-sm font-medium text-slate-500">No pending appointments right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingAppointments.map((apt) => {
                    const patient = patientLookup.get(apt.Patient_ID)
                    const isSelected = selectedAppointmentId === String(apt.Appointment_ID)
                    const badgeCls = appointmentStatusBadge(apt.Status ?? "")
                    return (
                      <button
                        key={apt.Appointment_ID}
                        onClick={() => setSelectedAppointmentId(String(apt.Appointment_ID))}
                        className={`w-full group rounded-xl border p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500/20"
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="truncate font-semibold text-slate-900">
                                {patient?.Name ?? `Patient #${apt.Patient_ID}`}
                              </p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${badgeCls}`}>
                                {apt.Status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                              <span className="flex items-center text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">
                                ID: #{apt.Appointment_ID}
                              </span>
                              <span className="flex items-center">
                                <Building2 className="inline h-3 w-3 mr-1" /> Clinic {apt.ClinicID}
                              </span>
                              <span className="flex items-center">
                                <Clock3 className="inline h-3 w-3 mr-1 text-emerald-600" /> 
                                {apt.AppointmentTime ?? "Time TBA"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {apt.Notes && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-100 text-xs text-yellow-800 line-clamp-2">
                            <span className="font-semibold">Note:</span> {apt.Notes}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT COLUMN: Actions & Allocated */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6 h-full min-h-0">
            
            {/* TOP HALF: Doctor Allocation Box */}
            <Card className="flex flex-col shrink-0 border-emerald-200 shadow-md bg-white/95 backdrop-blur-sm max-h-[60%]">
              <CardHeader className="shrink-0 border-b border-emerald-100 bg-emerald-50/50 py-4 px-5">
                <CardTitle className="text-lg flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                    Allocate Doctor
                  </div>
                  <span className="bg-white border border-emerald-200 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {availableDoctors.length} Available
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex flex-col flex-1 overflow-hidden p-5 gap-5 min-h-0">
                {/* Selected Patient Banner */}
                {selectedAppointment ? (
                  <div className="shrink-0 flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                        Currently Allocating
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {patientLookup.get(selectedAppointment.Patient_ID)?.Name ?? `Patient #${selectedAppointment.Patient_ID}`}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Apt #{selectedAppointment.Appointment_ID} • {selectedAppointment.AppointmentDate} {selectedAppointment.AppointmentTime ? `at ${selectedAppointment.AppointmentTime}` : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-medium text-slate-500">Select a pending appointment on the left to begin.</p>
                  </div>
                )}

                {/* Doctor List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {availableDoctors.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl py-8">
                      <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No available doctors found.</p>
                      <p className="text-xs text-slate-400 mt-1">Check the clinic and date filters above.</p>
                    </div>
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
                          className={`w-full group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDocSelected
                              ? "border-slate-800 bg-slate-900 shadow-md ring-2 ring-slate-900/20"
                              : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
                            <div className="min-w-0">
                              <p className={`font-semibold truncate text-base ${isDocSelected ? 'text-white' : 'text-slate-900'}`}>
                                {doc.doctorName}
                              </p>
                              <p className={`text-xs font-medium ${isDocSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {doc.specialty ?? "General"} • Shift: {doc.time}
                              </p>
                            </div>
                            <div className={`shrink-0 flex flex-col items-end`}>
                               <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isFull 
                                  ? "bg-red-100 text-red-700" 
                                  : isDocSelected 
                                    ? "bg-slate-700 text-white" 
                                    : "bg-emerald-100 text-emerald-800"
                               }`}>
                                 {doc.bookedPatients} / {doc.maxPatients}
                               </span>
                            </div>
                          </div>
                          <div className={`h-2 w-full rounded-full relative z-10 overflow-hidden ${isDocSelected ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Submit Action */}
                <div className="shrink-0 pt-2 border-t border-slate-100 mt-auto">
                  <Button
                    size="lg"
                    onClick={() => void allocateAppointment()}
                    className="w-full h-14 text-base font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-all"
                    disabled={!selectedAppointment || !selectedDoctor || saving}
                  >
                    {saving ? (
                      <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Confirming Allocation...</>
                    ) : (
                      <>
                        <ListChecks className="mr-2 h-5 w-5" />
                        Confirm Allocation to {selectedDoctor ? selectedDoctor.doctorName.split(' ')[0] : "Doctor"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* BOTTOM HALF: Allocated Appointments */}
            <Card className="flex flex-col flex-1 overflow-hidden border-slate-200 shadow-md bg-white/95 backdrop-blur-sm min-h-0">
              <CardHeader className="shrink-0 border-b border-slate-100 py-3 px-5 bg-slate-50/50">
                <CardTitle className="text-sm flex items-center justify-between font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    Recently Allocated Today
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md">
                    {allocatedAppointments.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {allocatedAppointments.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6 text-sm text-slate-400 font-medium">
                    No appointments allocated yet today.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {allocatedAppointments.map((apt) => {
                      const patient = patientLookup.get(apt.Patient_ID)
                      return (
                        <div key={apt.Appointment_ID} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div className="min-w-0 pr-4">
                            <p className="font-semibold text-sm text-slate-800 truncate">
                              {patient?.Name ?? `Patient #${apt.Patient_ID}`}
                            </p>
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">Dr. #{apt.Doctor_ID}</span> 
                              • Apt #{apt.Appointment_ID}
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Allocated
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}
