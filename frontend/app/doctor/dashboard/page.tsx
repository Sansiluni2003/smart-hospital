"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Activity,
  TrendingUp,
  ArrowRight,
  Stethoscope,
  FileText,
  UserCheck,
  RefreshCw,
  PlayCircle,
  BarChart2,
  ChevronRight,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { authFetch } from "@/lib/authFetch"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good Morning"
  if (h < 17) return "Good Afternoon"
  return "Good Evening"
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayPatients: 0,
    inQueue: 0,
    completed: 0,
    pending: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<{id: number; time: string; patient: string; type: string; status: string; queue_number: number}[]>([])
  const [doctorName, setDoctorName] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // auto-refresh every 60s
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      
      const user = JSON.parse(userStr)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/dashboard`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setDoctorName(data?.doctor?.Name || user.Name || user.full_name || user.Email || "Doctor")
      setLastRefreshed(new Date())
      
      setStats(data.stats || {
        todayPatients: 0,
        inQueue: 0,
        completed: 0,
        pending: 0,
      })
      
      // Filter out completed/skipped patients from the active "Current Queue" display
      const mappedQueue = (data.queue || [])
        .filter((entry: {status: string}) => entry.status === 'waiting' || entry.status === 'in-consultation')
        .map((entry: {appointment_id: number; patient_name: string; status: string; queue_number: number; appointment_time?: string | null; notes?: string | null}) => ({
        id: entry.appointment_id,
        time: entry.appointment_time || "Pending",
        patient: entry.patient_name,
        type: entry.notes || "Consultation",
        status: entry.status,
        queue_number: entry.queue_number
      }))
      
      setUpcomingAppointments(mappedQueue)
      
    } catch (error) {
      console.error(error)
    } finally {
      setRefreshing(false)
    }
  }

  const updateQueueStatus = async (queueId: number, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const endpoint = newStatus === 'in-consultation'
        ? `${apiUrl}/api/v1/doctors/doctor/me/appointments/${queueId}/start`
        : `${apiUrl}/api/v1/doctors/doctor/me/appointments/${queueId}/complete`
        
      // Ensure we send the required payload for completing a consultation
      const payload = newStatus === 'completed' 
        ? { ConsultationNotes: "Completed from dashboard", Prescription: "", AppointmentNotes: "" }
        : {}

      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        fetchDashboardData() // Refresh queue
      }
    } catch (e) {
      console.error(e)
    }
  }

  const completionRate = stats.todayPatients > 0
    ? Math.round((stats.completed / stats.todayPatients) * 100)
    : 0

  const quickActions = [
    {
      label: "Start Consultation",
      description: "Call next patient from queue",
      icon: PlayCircle,
      href: "/doctor/queue",
      color: "bg-blue-900 hover:bg-blue-800 text-white",
      iconBg: "bg-blue-700",
    },
    {
      label: "Patient Queue",
      description: `${stats.inQueue} waiting now`,
      icon: Users,
      href: "/doctor/queue",
      color: "bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200",
      iconBg: "bg-orange-100",
    },
    {
      label: "My Schedule",
      description: "View today's appointments",
      icon: Calendar,
      href: "/doctor/schedule",
      color: "bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200",
      iconBg: "bg-purple-100",
    },
    {
      label: "Consultation",
      description: "Open consultation panel",
      icon: Stethoscope,
      href: "/doctor/consultation",
      color: "bg-green-50 hover:bg-green-100 text-green-900 border border-green-200",
      iconBg: "bg-green-100",
    },
    {
      label: "My Profile",
      description: "Update info & availability",
      icon: UserCheck,
      href: "/doctor/profile",
      color: "bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200",
      iconBg: "bg-teal-100",
    },
    {
      label: "Reports",
      description: "View consultation history",
      icon: BarChart2,
      href: "/doctor/consultation",
      color: "bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200",
      iconBg: "bg-pink-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#02006c] to-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
          <div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold">{getGreeting()}, Dr. {doctorName}</h1>
            <p className="text-blue-100 mt-1">
              {stats.inQueue === 0
                ? "No patients waiting — you're all caught up!"
                : `${stats.inQueue} patient${stats.inQueue > 1 ? 's' : ''} waiting in queue right now`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className="text-blue-200 text-xs hidden md:block">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Today's Patients",
              value: stats.todayPatients,
              sub: <span className="text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Active today</span>,
              icon: Users,
              iconColor: "text-blue-700",
              iconBg: "bg-blue-50",
              valueColor: "text-gray-900",
            },
            {
              label: "In Queue",
              value: stats.inQueue,
              sub: "Waiting for consultation",
              icon: Clock,
              iconColor: "text-orange-600",
              iconBg: "bg-orange-50",
              valueColor: "text-orange-600",
            },
            {
              label: "Completed",
              value: stats.completed,
              sub: `${completionRate}% completion rate`,
              icon: CheckCircle,
              iconColor: "text-green-600",
              iconBg: "bg-green-50",
              valueColor: "text-green-600",
            },
            {
              label: "Pending",
              value: stats.pending,
              sub: "Follow-ups required",
              icon: AlertCircle,
              iconColor: "text-purple-600",
              iconBg: "bg-purple-50",
              valueColor: "text-purple-600",
            },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
                    <p className={`text-4xl font-extrabold mt-1 ${s.valueColor}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{s.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${s.iconBg}`}>
                    <s.icon className={`h-6 w-6 ${s.iconColor}`} />
                  </div>
                </div>
                {/* Progress bar for completed */}
                {s.label === "Completed" && stats.todayPatients > 0 && (
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className={`rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow-md flex flex-col gap-2 h-full ${action.color}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                    <action.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <p className="font-semibold text-sm leading-tight">{action.label}</p>
                  <p className="text-xs opacity-70 leading-tight">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Queue + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Queue */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md rounded-xl">
              <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base font-bold text-gray-900">Live Queue</CardTitle>
                    {stats.inQueue > 0 && (
                      <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {stats.inQueue} waiting
                      </span>
                    )}
                  </div>
                  <Link href="/doctor/queue">
                    <Button variant="outline" size="sm" className="text-xs">
                      Full Queue <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <CheckCircle className="h-10 w-10 mb-2 text-green-300" />
                    <p className="font-medium">Queue is clear</p>
                    <p className="text-xs mt-1">No patients waiting right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment, idx) => (
                      <div
                        key={appointment.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          appointment.status === 'in-consultation'
                            ? 'bg-green-50 border-green-200'
                            : idx === 0
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm ${
                              appointment.status === 'in-consultation' ? 'bg-green-600' : 'bg-[#02006c]'
                            }`}
                          >
                            #{appointment.queue_number}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{appointment.patient}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {appointment.time !== "Pending" ? appointment.time : "Walk-in"} &middot; {appointment.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            appointment.status === 'waiting' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {appointment.status === 'waiting' ? 'Waiting' : 'In Consultation'}
                          </span>
                          {appointment.status === 'waiting' && (
                            <Button
                              size="sm"
                              onClick={() => updateQueueStatus(appointment.id, 'in-consultation')}
                              className="text-xs bg-[#02006c] hover:bg-blue-800 text-white"
                            >
                              Call
                            </Button>
                          )}
                          {appointment.status === 'in-consultation' && (
                            <Button
                              size="sm"
                              onClick={() => updateQueueStatus(appointment.id, 'completed')}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Panel */}
          <div className="flex flex-col gap-4">
            {/* Today's Progress */}
            <Card className="border-0 shadow-md rounded-xl">
              <CardHeader className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-gray-900">Today's Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Consultations done</span>
                    <span className="font-semibold text-green-600">{stats.completed} / {stats.todayPatients}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.todayPatients}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.inQueue}</p>
                    <p className="text-xs text-gray-500 mt-0.5">In Queue</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Done</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card className="border-0 shadow-md rounded-xl">
              <CardHeader className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <CardTitle className="text-sm font-bold text-gray-900">Reminders</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {[
                  { text: "Update your availability for next week", link: "/doctor/schedule", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
                  { text: "Review pending consultation notes", link: "/doctor/consultation", color: "bg-blue-50 border-blue-200 text-blue-800" },
                  { text: "Check upcoming schedule", link: "/doctor/schedule", color: "bg-purple-50 border-purple-200 text-purple-800" },
                ].map((r, i) => (
                  <Link key={i} href={r.link}>
                    <div className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${r.color}`}>
                      <span>{r.text}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
