"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock, Users, CheckCircle, AlertCircle, RefreshCw,
  User, Activity, Stethoscope, RadioTower, ArrowRight,
} from "lucide-react"
import { authFetch } from "@/lib/authFetch"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

const APT_STATUS_COLORS: Record<string, string> = {
  "Pending Allocation": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Allocated":          "bg-blue-100 text-blue-800 border-blue-200",
  "Arrived":            "bg-indigo-100 text-indigo-800 border-indigo-200",
  "In Progress":        "bg-purple-100 text-purple-800 border-purple-200",
  "Completed":          "bg-green-100 text-green-800 border-green-200",
  "Cancelled":          "bg-red-100 text-red-800 border-red-200",
}

interface QueueRow {
  queue_position: number
  is_me: boolean
  status: string
}

interface LiveEntry {
  Appointment_ID: number
  Doctor_Name: string | null
  Doctor_Specialization: string | null
  QueuePosition: number
  AheadCount: number
  CurrentlyServing: number | null
  TotalInQueue: number
  EstWaitMinutes: number
  AvgConsultMinutes: number
  Status: string
  AppointmentDate: string | null
  AppointmentTime: string | null
  CheckedInAt: string | null
  FullQueue: QueueRow[]
}

export default function PatientQueuePage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [liveQueue, setLiveQueue] = useState<LiveEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [patientId, setPatientId] = useState<number | null>(null)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user")
      if (!userStr) { router.push("/login"); return }
      const user = JSON.parse(userStr)
      if (user.Role !== "Patient") { router.push("/"); return }
      setPatientId(user.Patient_ID)
    } catch {
      router.push("/login")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchData = useCallback(async (silent = false, signal?: AbortSignal) => {
    if (!patientId) return
    if (!silent) setLoading(true); else setRefreshing(true)
    setFetchError(false)
    try {
      const [aptRes, liveRes] = await Promise.all([
        authFetch(`${apiUrl}/api/v1/patients/${patientId}/appointments`),
        authFetch(`${apiUrl}/api/v1/patients/${patientId}/live-queue`),
      ])
      if (signal?.aborted) return
      if (aptRes.status === 401) { router.push("/login"); return }
      if (aptRes.ok) {
        const data = await aptRes.json()
        if (!signal?.aborted)
          setAppointments(data.filter((a: any) => !["Completed", "Cancelled"].includes(a.Status)))
      }
      if (!signal?.aborted) {
        setLiveQueue(liveRes.ok ? await liveRes.json() : [])
        setLastUpdated(new Date())
      }
    } catch (e: unknown) {
      if (signal?.aborted) return
      const isAbort = e instanceof DOMException && e.name === "AbortError"
      if (!isAbort) {
        console.error("Queue fetch error:", e)
        setFetchError(true)
      }
    } finally {
      if (!signal?.aborted) { setLoading(false); setRefreshing(false) }
    }
  }, [patientId, router])

  useEffect(() => {
    if (!patientId) return
    const ac = new AbortController()
    fetchData(false, ac.signal).catch(console.error)
    const interval = setInterval(() => {
      fetchData(true, ac.signal).catch(console.error)
    }, liveEnabled ? 5000 : 30000)
    return () => { ac.abort(); clearInterval(interval) }
  }, [patientId, liveEnabled, fetchData])

  const markArrived = async (appointmentId: number) => {
    setMarkingId(appointmentId)
    setSuccessMsg("")
    try {
      const res = await authFetch(
        `${apiUrl}/api/v1/patients/appointments/${appointmentId}/arrive`,
        { method: "POST" }
      )
      if (res.ok) {
        setSuccessMsg("Arrival confirmed! Staff has been notified.")
        setTimeout(() => setSuccessMsg(""), 4000)
        fetchData(true).catch(console.error)
      }
    } catch (e) { console.error(e) }
    finally { setMarkingId(null) }
  }

  const todayStr = new Date().toLocaleDateString("en-CA")
  const todayAppointments = appointments.filter((a: any) => (a.AppointmentDate || "") === todayStr)
  const upcomingAppointments = appointments.filter((a: any) => (a.AppointmentDate || "") > todayStr)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: "#02006c" }} />
          <p className="text-gray-500">Loading queue status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Queue Status</h1>
          <p className="text-sm text-gray-500">Real-time tracking of your appointment queue</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <div
          onClick={() => setLiveEnabled(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${liveEnabled ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${liveEnabled ? "translate-x-5" : ""}`} />
        </div>
        <div className="flex items-center gap-1.5">
          {liveEnabled && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-sm text-gray-700 font-medium">
            {liveEnabled ? "Live Updates Active (Updates every 5 seconds)" : "Live Updates Paused"}
          </span>
        </div>
      </label>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span className="text-sm">Could not reach the server. Please check your connection or try refreshing.</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchData(true)}>Retry</Button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center text-green-800">
          <CheckCircle className="h-5 w-5 mr-3 text-green-600 shrink-0" />{successMsg}
        </div>
      )}

      {/* ══ LIVE QUEUE ENTRIES ══ */}
      {liveQueue.length > 0 ? (
        liveQueue.map((entry) => {
          const isConsulting = entry.Status === "In Consultation"
          const nowServing = entry.CurrentlyServing
          const ahead = entry.AheadCount
          const checkedInStr = entry.CheckedInAt
            ? new Date(entry.CheckedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "—"
          const doctorAvailable = nowServing != null || isConsulting

          return (
            <div key={entry.Appointment_ID} className="space-y-4">

              {/* Appointment info */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700">Your Appointment</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Stethoscope className="h-3 w-3" /> Doctor</p>
                      <p className="font-bold text-sm text-gray-900">{entry.Doctor_Name || "—"}</p>
                      {entry.Doctor_Specialization && <p className="text-xs text-gray-400">{entry.Doctor_Specialization}</p>}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Appointment Time</p>
                      <p className="font-bold text-sm text-gray-900">{entry.AppointmentTime || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><CheckCircle className="h-3 w-3" /> Checked In At</p>
                      <p className="font-bold text-sm text-gray-900">{checkedInStr}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Activity className="h-3 w-3" /> Status</p>
                      <p className={`font-bold text-sm ${isConsulting ? "text-green-600" : "text-indigo-700"}`}>
                        {isConsulting ? "In Consultation" : "Waiting"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Position + Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-5 flex flex-col items-center justify-center gap-3">
                    <p className="text-sm font-semibold text-gray-600">Your Position</p>
                    <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${isConsulting ? "border-green-500 bg-green-50" : "border-indigo-700 bg-white"}`}>
                      <span className={`text-3xl font-extrabold ${isConsulting ? "text-green-600" : "text-indigo-900"}`}>#{entry.QueuePosition}</span>
                      <span className="text-xs text-gray-400">in queue</span>
                    </div>
                    {isConsulting ? (
                      <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><RadioTower className="h-3.5 w-3.5" /> It&apos;s your turn!</span>
                    ) : ahead === 0 ? (
                      <span className="text-xs font-semibold text-amber-600 flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5" /> Your turn is coming soon!</span>
                    ) : (
                      <span className="text-xs text-gray-500">{ahead} {ahead === 1 ? "person" : "people"} ahead</span>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm font-semibold text-gray-600">Queue Statistics</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1"><Users className="h-3 w-3" /> Total in Queue</p>
                        <p className="text-2xl font-bold text-gray-900">{entry.TotalInQueue}</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1"><Clock className="h-3 w-3" /> Est. Wait Time</p>
                        <p className="text-2xl font-bold text-orange-500">{entry.EstWaitMinutes}</p>
                        <p className="text-xs text-gray-400">minutes</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1"><Stethoscope className="h-3 w-3" /> Currently Seeing</p>
                        <p className="text-2xl font-bold text-purple-600">{nowServing != null ? `#${nowServing}` : "—"}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1"><Activity className="h-3 w-3" /> Doctor Status</p>
                        <p className={`text-sm font-bold ${doctorAvailable ? "text-green-600" : "text-gray-400"}`}>
                          {doctorAvailable ? "✓ Available" : "Not started"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Average consultation time: <strong>{entry.AvgConsultMinutes} minutes</strong> · Based on today&apos;s appointments
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Live Queue Progress board */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-gray-700">Live Queue Progress</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {entry.FullQueue.map((row, rowIdx) => {
                    const isInConsult = row.status === "In Consultation"
                    const isCompleted = row.status === "Completed" || row.status === "Skipped"
                    // "Next" is the first Waiting patient after the one currently being consulted
                    const firstWaitingPos = entry.FullQueue.find(r => r.status === "Waiting")?.queue_position
                    const isNext = !isInConsult && !isCompleted && row.queue_position === firstWaitingPos && nowServing != null
                    const isMe = row.is_me

                    let rowBg = "bg-white border border-gray-200"
                    let numBg = "bg-gray-200 text-gray-600"
                    let badge = <span className="text-xs text-gray-400 border border-gray-300 rounded-full px-2 py-0.5">WAITING</span>
                    let label = `Patient #${row.queue_position}`
                    let sublabel: string | null = null

                    if (isCompleted) {
                      rowBg = "bg-gray-50 border border-gray-200 opacity-60"
                      numBg = "bg-gray-300 text-gray-500"
                      badge = <span className="text-xs font-semibold tracking-wide text-gray-400 border border-gray-300 rounded-full px-2 py-0.5">COMPLETED</span>
                    } else if (isInConsult) {
                      rowBg = "bg-red-50 border border-red-200"
                      numBg = "bg-red-500 text-white"
                      label = isMe ? "You are here — Currently in Consultation" : "Currently in Consultation"
                      badge = <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2.5 py-0.5">IN PROGRESS</span>
                    } else if (isNext && !isMe) {
                      rowBg = "bg-green-50 border border-green-200"
                      numBg = "bg-green-500 text-white"
                      label = "Up Next"
                      badge = <span className="text-xs font-bold bg-green-500 text-white rounded-full px-2.5 py-0.5">NEXT</span>
                    } else if (isMe) {
                      rowBg = "bg-blue-50 border-2 border-blue-400"
                      numBg = "bg-blue-600 text-white"
                      label = "You are here"
                      badge = <span className="text-xs font-bold bg-blue-600 text-white rounded-full px-2.5 py-0.5">WAITING</span>
                      if (ahead > 0) sublabel = `Approximately ${entry.EstWaitMinutes} minutes remaining`
                    }

                    return (
                      <div key={`q-${entry.Appointment_ID}-${row.queue_position}-${rowIdx}`} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${rowBg}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${numBg}`}>
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : `#${row.queue_position}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isMe ? "text-blue-900" : isInConsult ? "text-red-800" : "text-gray-800"}`}>
                            {isInConsult && !isMe && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 align-middle animate-pulse" />}
                            {label}
                          </p>
                          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
                        </div>
                        {badge}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          )
        })
      ) : (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center space-y-2">
            <Activity className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-600">You are not in any active live queue</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              On your appointment day, come to the clinic and tap <strong>Mark Arrived</strong> below,
              then staff will scan your QR to add you to the live queue.
            </p>
          </CardContent>
        </Card>
      )}

      {/* TODAY'S APPOINTMENTS */}
      {todayAppointments.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" style={{ color: "#02006c" }} />
              Today&apos;s Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {todayAppointments.map((apt: any) => (
              <div key={apt.Appointment_ID} className={`rounded-xl border p-4 ${APT_STATUS_COLORS[apt.Status] || "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${APT_STATUS_COLORS[apt.Status] || ""}`}>{apt.Status}</span>
                      {apt.Queue_Number && <span className="text-sm font-bold text-indigo-800">Queue #{apt.Queue_Number}</span>}
                    </div>
                    <p className="font-semibold text-gray-900">{apt.Doctor_Name || "Doctor to be assigned"}</p>
                    <p className="text-sm text-gray-600">{apt.AppointmentTime ? `Slot: ${apt.AppointmentTime}` : "Time will be assigned by staff"}</p>
                  </div>
                  {(apt.Status === "Allocated" || apt.Status === "Pending Allocation") && (
                    <Button size="sm" onClick={() => markArrived(apt.Appointment_ID)} disabled={markingId === apt.Appointment_ID}
                      className="text-white shrink-0" style={{ backgroundColor: "#02006c" }}>
                      <User className="h-4 w-4 mr-1" />
                      {markingId === apt.Appointment_ID ? "Marking..." : "Mark Arrived"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* UPCOMING APPOINTMENTS */}
      {upcomingAppointments.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Your queue number is pre-assigned when staff allocates a doctor.
                The live queue opens on your appointment day — come to clinic and tap <strong>Mark Arrived</strong>.
              </span>
            </div>
            {upcomingAppointments.map((apt: any) => (
              <div key={apt.Appointment_ID} className="rounded-xl p-4 border border-gray-200 bg-white space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900">{apt.Doctor_Name || "Doctor to be assigned"}</p>
                    <p className="text-sm text-gray-500">{apt.AppointmentDate}{apt.AppointmentTime ? ` at ${apt.AppointmentTime}` : ""}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${APT_STATUS_COLORS[apt.Status] || "bg-gray-100 text-gray-600"}`}>
                    {apt.Status}
                  </span>
                </div>
                {apt.Queue_Number ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                      Queue #{apt.Queue_Number}
                    </span>
                    <span className="text-xs text-gray-400">Pre-assigned · live queue opens on appointment day</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 pt-1">Queue number not yet assigned — staff will allocate soon</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {appointments.length === 0 && liveQueue.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-10 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No active appointments</p>
            <p className="text-sm text-gray-400 mt-1">Book an appointment to see your queue status here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
