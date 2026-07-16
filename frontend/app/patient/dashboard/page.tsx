"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, User, AlertCircle, CheckCircle, Clock, 
  Plus, FileText, ArrowRight, Activity
} from "lucide-react"
import Link from "next/link"
import { authFetch } from "@/lib/authFetch";

interface AppointmentData {
  id: number
  doctor_name: string
  specialty: string
  appointment_date: string
  appointment_time: string
  status: string
  queue_number: number
  location: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [patientName, setPatientName] = useState("")
  const [opdId, setOpdId] = useState("")
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.Role !== 'Patient') {
        router.push('/')
        return
      }
      setPatientName(user.Name || user.Email)
      setOpdId(user.Patient_ID || '')
    } else {
      router.push('/login')
      return
    }
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchAppointments = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const patientId = user.Patient_ID
      if (!patientId) return
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/patients/${patientId}/appointments`)
      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  const todayAppointments = appointments.filter((a: any) => {
    const d = a.AppointmentDate || a.appointment_date || ''
    const s = (a.Status || a.status || '').toLowerCase()
    return d === todayStr && s !== 'completed' && s !== 'cancelled'
  })
  const upcomingAppointments = appointments.filter((a: any) => {
    const d = a.AppointmentDate || a.appointment_date || ''
    const s = (a.Status || a.status || '').toLowerCase()
    return d >= todayStr && s !== 'completed' && s !== 'cancelled'
  })
  const completedAppointments = appointments.filter((a: any) => {
    const s = (a.Status || a.status || '').toLowerCase()
    return s === 'completed'
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #02006c, #1a0066, #3300cc)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getGreeting()}, {patientName}</h1>
              <p className="text-blue-200 mt-1">Patient ID: {opdId}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-blue-200">Today&apos;s Date</p>
            <p className="font-medium text-lg">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Queue Alert Banner */}
      {todayAppointments.length > 0 && (
        <div className="rounded-xl p-4 border-l-4 bg-green-50 border-green-400 animate-in fade-in">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
            <div>
              <p className="font-medium text-green-800">You have {todayAppointments.length} appointment(s) today!</p>
              <p className="text-sm text-green-700">
                Next: {(todayAppointments[0] as any).Doctor_Name || 'Doctor to be assigned'} at {(todayAppointments[0] as any).AppointmentTime || 'TBD'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointments.length}</p>
                <p className="text-xs text-gray-500 mt-1">Appointments</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Calendar className="h-6 w-6" style={{ color: '#02006c' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{upcomingAppointments.length}</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedAppointments.length}</p>
                <p className="text-xs text-gray-500 mt-1">Consultations</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{appointments.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointment Card */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" style={{ color: '#02006c' }} />
              Today&apos;s Appointments
            </CardTitle>
            <Link href="/patient/appointments">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#02006c' }}></div>
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.map((apt: any) => (
                <div key={apt.Appointment_ID} className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Appointment Confirmed</span>
                      </div>
                      <p className="text-gray-700 font-medium">{apt.Doctor_Name || 'Doctor to be assigned'}</p>
                      <p className="text-sm text-gray-600">{apt.AppointmentTime || 'Time TBD'} • Queue #{apt.Queue_Number || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Queue Position</p>
                      <p className="text-2xl font-bold text-green-600">#{apt.Queue_Number || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No appointments today</p>
              <p className="text-sm text-gray-500 mt-1">Book a new appointment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/patient/book-appointment">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#02006c' }}>
                <Plus className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Book Appointment</h3>
              <p className="text-sm text-gray-500 mt-1">Schedule your next visit</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/queue">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Queue Status</h3>
              <p className="text-sm text-gray-500 mt-1">Check live queue</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/history">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Medical History</h3>
              <p className="text-sm text-gray-500 mt-1">View past records</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/profile">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-500 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-500 mt-1">Account settings</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {upcomingAppointments.slice(0, 5).map((apt: any) => (
                <div key={apt.Appointment_ID} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#02006c' }}>
                      #{apt.Queue_Number || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{apt.Doctor_Name || 'Doctor to be assigned'}</p>
                      <p className="text-sm text-gray-600">{apt.Speciality || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {apt.AppointmentDate ? new Date(apt.AppointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    </p>
                    <p className="text-sm text-gray-600">{apt.AppointmentTime || 'Time TBD'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}