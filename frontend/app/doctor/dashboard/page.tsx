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
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { authFetch } from "@/lib/authFetch"

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayPatients: 0,
    inQueue: 0,
    completed: 0,
    pending: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<{id: number; time: string; patient: string; type: string; status: string; queue_number: number}[]>([])
  const [doctorName, setDoctorName] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      
      const user = JSON.parse(userStr)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/dashboard`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setDoctorName(data?.doctor?.Name || user.Name || user.full_name || user.Email || "Doctor")
      
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold">Good Morning, {doctorName}</h1>
          <p className="text-blue-100 mt-2">You have {stats.inQueue} patients waiting in queue today</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayPatients}</p>
                  <p className="text-xs text-green-600 flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from yesterday
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Users className="h-6 w-6" style={{ color: '#02006c' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Queue</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inQueue}</p>
                  <p className="text-xs text-gray-600 mt-2">Waiting for consultation</p>
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
                  <p className="text-xs text-gray-600 mt-2">Consultations today</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.pending}</p>
                  <p className="text-xs text-gray-600 mt-2">Follow-ups required</p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Queue */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">Current Queue</CardTitle>
                <Link href="/doctor/queue">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-white"
                           style={{ backgroundColor: '#02006c' }}>
                        #{appointment.queue_number}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-600">{appointment.time} • {appointment.type}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        appointment.status === 'waiting' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {appointment.status === 'waiting' ? 'Waiting' : 'In Consultation'}
                      </span>
                      {appointment.status === 'waiting' && (
                        <Button size="sm" onClick={() => updateQueueStatus(appointment.id, 'in-consultation')} className="text-xs bg-green-600 hover:bg-green-700">
                          Call Next
                        </Button>
                      )}
                      {appointment.status === 'in-consultation' && (
                        <Button size="sm" onClick={() => updateQueueStatus(appointment.id, 'completed')} className="text-xs bg-blue-600 hover:bg-blue-700">
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Recent Consultations */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-lg font-bold text-gray-900">Current Queue Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-6">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-gray-600">No active patients in queue</p>
                ) : (
                  <p className="text-gray-700">{upcomingAppointments.length} patient(s) waiting for consultation</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/doctor/queue">
                <Button className="w-full text-white font-medium" style={{ backgroundColor: '#02006c' }}>
                  <Clock className="h-4 w-4 mr-2" />
                  Start Consultation
                </Button>
              </Link>
              <Link href="/doctor/schedule">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
              </Link>
              <Link href="/doctor/patients">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Patient Records
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Update Availability
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
