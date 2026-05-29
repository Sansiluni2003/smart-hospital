"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Clock, Users, CheckCircle, AlertCircle, RefreshCw,
  User, Activity, Wifi
} from "lucide-react"

interface QueueItem {
  queue_id: number
  appointment_id: number
  queue_number: number
  status: string
  patient_name: string
  arrived_at: string
}

interface AppointmentData {
  id: number
  doctor_id: number
  doctor_name: string
  specialty: string
  appointment_date: string
  appointment_time: string
  status: string
  queue_number: number
}

export default function PatientQueuePage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [queueData, setQueueData] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [patientName, setPatientName] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role !== 'patient') {
        router.push('/')
        return
      }
      setPatientName(user.full_name || user.username)
    } else {
      router.push('/login')
      return
    }
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true)
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const token = localStorage.getItem('token')
      
      // Fetch patient appointments
      const aptResponse = await fetch('http://localhost:5000/api/appointments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (aptResponse.status === 401 || aptResponse.status === 422) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (aptResponse.ok) {
        const aptData = await aptResponse.json()
        setAppointments(aptData)
        
        // For each scheduled appointment, fetch queue data
        const todayStr = new Date().toISOString().split('T')[0]
        const todayApts = aptData.filter((a: AppointmentData) => 
          a.appointment_date === todayStr && a.status === 'scheduled'
        )
        
        // Fetch queue for each doctor
        const doctorIds = [...new Set(todayApts.map((a: AppointmentData) => a.doctor_id))]
        const allQueueData: QueueItem[] = []
        
        for (const doctorId of doctorIds) {
          try {
            const queueResponse = await fetch(`http://localhost:5000/api/queue/live/${doctorId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (queueResponse.ok) {
              const qData = await queueResponse.json()
              allQueueData.push(...qData)
            }
          } catch (e) {
            console.error(e)
          }
        }
        
        setQueueData(allQueueData)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch queue data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr && a.status === 'scheduled')

  // Find the patient's position in queue
  const getPatientQueuePosition = (appointmentId: number) => {
    const entry = queueData.find(q => q.appointment_id === appointmentId)
    return entry
  }

  const totalWaiting = queueData.filter(q => q.status === 'waiting').length
  const totalInConsultation = queueData.filter(q => q.status === 'in-consultation').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue Status</h1>
            <p className="text-sm text-gray-600 mt-1">
              Live queue tracking • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-700 font-medium">Live</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 flex items-center">
            <Wifi className="h-3 w-3 mr-1" />
            Auto-refreshing every 30s
          </span>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Your Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Today</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <User className="h-6 w-6" style={{ color: '#02006c' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Patients Waiting</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{totalWaiting}</p>
                  <p className="text-xs text-gray-500 mt-1">In queue</p>
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Consultation</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{totalInConsultation}</p>
                  <p className="text-xs text-gray-500 mt-1">Being seen now</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: '#02006c' }}></div>
              <p className="text-gray-500">Loading queue status...</p>
            </CardContent>
          </Card>
        ) : todayAppointments.length > 0 ? (
          <>
            {/* Your Queue Status Cards */}
            {todayAppointments.map((apt) => {
              const queueEntry = getPatientQueuePosition(apt.id)
              const isInQueue = !!queueEntry
              
              return (
                <Card key={apt.id} className="border-0 shadow-lg overflow-hidden">
                  <CardHeader 
                    className="text-white p-5" 
                    style={{ background: 'linear-gradient(135deg, #02006c, #1a0066)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-white">
                          Dr. {apt.doctor_name}
                        </CardTitle>
                        <p className="text-blue-200 mt-1">{apt.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-200">Appointment Time</p>
                        <p className="text-2xl font-bold text-white">{apt.appointment_time}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isInQueue ? (
                      <div className="space-y-6">
                        {/* Queue Position */}
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-600 mb-2">Your Queue Position</p>
                          <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white mb-3" style={{ backgroundColor: '#02006c' }}>
                            #{queueEntry.queue_number}
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                            queueEntry.status === 'waiting' 
                              ? 'bg-orange-100 text-orange-700' 
                              : queueEntry.status === 'in-consultation'
                              ? 'bg-green-100 text-green-700 animate-pulse'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {queueEntry.status === 'waiting' ? '⏳ Waiting' : 
                             queueEntry.status === 'in-consultation' ? '🩺 In Consultation' : 
                             '✅ Completed'}
                          </span>
                        </div>

                        {/* Queue Progress */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Queue Progress</span>
                            <span className="text-sm text-gray-600">
                              {queueData.filter(q => q.status === 'completed').length} / {queueData.length} completed
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all duration-500"
                              style={{ 
                                backgroundColor: '#02006c',
                                width: `${queueData.length > 0 ? (queueData.filter(q => q.status === 'completed').length / queueData.length) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Full Queue List */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 mb-3">Current Queue</h3>
                          <div className="space-y-2">
                            {queueData
                              .filter(q => q.status !== 'completed')
                              .sort((a, b) => a.queue_number - b.queue_number)
                              .map((q) => {
                                const isYou = q.patient_name === patientName
                                return (
                                  <div 
                                    key={q.queue_id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      isYou 
                                        ? 'border-2 bg-blue-50' 
                                        : 'border-gray-200 bg-white'
                                    }`}
                                    style={isYou ? { borderColor: '#02006c' } : {}}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        q.status === 'in-consultation' 
                                          ? 'bg-green-500 text-white' 
                                          : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {q.queue_number}
                                      </div>
                                      <div>
                                        <p className={`text-sm font-medium ${isYou ? 'font-bold' : ''} text-gray-900`}>
                                          {isYou ? `${q.patient_name} (You)` : q.patient_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Arrived: {new Date(q.arrived_at).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      q.status === 'waiting' ? 'bg-orange-100 text-orange-700' :
                                      q.status === 'in-consultation' ? 'bg-green-100 text-green-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {q.status === 'waiting' ? 'Waiting' : 
                                       q.status === 'in-consultation' ? 'In Session' : q.status}
                                    </span>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                        <p className="text-lg font-medium text-gray-900">Not in Queue Yet</p>
                        <p className="text-sm text-gray-600 mt-2">
                          Please check in at the reception desk or scan your QR code to join the queue.
                        </p>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium" style={{ color: '#02006c' }}>
                            Appointment ID: APT-{apt.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Show this at reception for check-in
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Appointments Today</h3>
              <p className="text-gray-600 mt-2">You don&apos;t have any appointments scheduled for today.</p>
              <Button 
                className="mt-4 text-white"
                style={{ backgroundColor: '#02006c' }}
                onClick={() => router.push('/patient/book-appointment')}
              >
                Book an Appointment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="border-0 shadow-sm bg-blue-50 border border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#02006c' }} />
              <div>
                <p className="font-medium text-gray-900">How Queue Works</p>
                <p className="text-sm text-gray-600 mt-1">
                  After checking in at the reception, you&apos;ll be assigned a queue number. 
                  This page updates automatically every 30 seconds to show your current position. 
                  You&apos;ll see a notification when it&apos;s almost your turn.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}