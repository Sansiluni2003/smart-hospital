"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch } from "@/lib/authFetch"
import { 
  Users, Clock, CheckCircle, User, 
  AlertCircle, FileText, Play, RefreshCw, XCircle
} from "lucide-react"

interface QueueItem {
  queue_id: number
  appointment_id: number
  patient_id: number
  queue_number: number
  status: 'waiting' | 'in-consultation' | 'completed' | 'skipped'
  patient_name: string
  arrived_at: string
  notes?: string | null
  chiefComplaint?: string
  contact?: string
  email?: string
  phone?: string | null
  address?: string | null
  opd_id?: string | null
  date_of_birth?: string | null
  appointment_time?: string | null
}

export default function DoctorQueuePage() {
  const router = useRouter()
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [doctorName, setDoctorName] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const role = String(user?.Role || user?.role || '').toLowerCase()
      if (role !== 'doctor') {
        router.push('/')
        return
      }
      setDoctorName(user.Name || user.full_name || user.username || user.Email || user.email || "Doctor")
    } else {
      router.push('/login')
      return
    }
    fetchQueueData()

    // Auto refresh every 20 seconds
    const interval = setInterval(() => {
      fetchQueueData(true)
    }, 20000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchQueueData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/queue`)

      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        const processed = data.map((item: QueueItem) => ({
          ...item,
          chiefComplaint: item.notes || 'No consultation notes yet',
          contact: item.phone || item.contact || 'Not provided',
          email: item.email || 'Not provided',
        }))

        setQueueItems(processed)
        
        // Update current consulting patient
        const consulting = processed.find((p: QueueItem) => p.status === 'in-consultation')
        setCurrentPatient(consulting || null)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch doctor queue:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUpdateStatus = async (queueId: number, newStatus: 'in-consultation' | 'completed' | 'skipped') => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const endpoint = newStatus === 'in-consultation'
        ? `${apiUrl}/api/v1/doctors/doctor/me/appointments/${queueId}/start`
        : newStatus === 'completed'
          ? `${apiUrl}/api/v1/doctors/doctor/me/appointments/${queueId}/complete`
          : `${apiUrl}/api/v1/doctors/doctor/me/appointments/${queueId}/skip`
      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        if (newStatus === 'in-consultation') {
          router.push('/doctor/consultation')
          return
        }
        fetchQueueData(true)
      } else {
        const err = await response.json()
        alert(err.message || 'Failed to update queue status')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const waitingPatients = queueItems.filter(p => p.status === 'waiting')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Queue Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, Dr. {doctorName} • Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchQueueData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Currently Consulting</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {currentPatient ? '1' : '0'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Waiting in Queue</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{waitingPatients.length}</p>
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
                  <p className="text-sm text-gray-600">Total Today</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{queueItems.length}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#02006c' }}></div>
              <p className="text-gray-500">Loading queue entries...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Columns: Consultation Room & Waiting List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Current Consulting Patient */}
              {currentPatient ? (
                <Card className="border-0 shadow-lg border-l-4" style={{ borderLeftColor: '#02006c' }}>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center" style={{ color: '#02006c' }}>
                        <Play className="h-5 w-5 mr-2 animate-pulse text-red-600" />
                        Active Consultation Room
                      </CardTitle>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full animate-pulse">
                        IN PROGRESS
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                             style={{ backgroundColor: '#02006c' }}>
                          #{currentPatient.queue_number}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900">{currentPatient.patient_name}</h3>
                          <p className="text-gray-600">Appointment #{currentPatient.appointment_id} • Queue #{currentPatient.queue_number}</p>
                          <p className="text-xs text-gray-500 mt-1">Queue Entry ID: Q-{currentPatient.queue_id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 font-semibold">Patient ID</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">#{currentPatient.patient_id}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 font-semibold">Contact Number</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{currentPatient.contact}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 font-semibold">Appointment Time</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{currentPatient.appointment_time || 'Pending'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border col-span-2">
                          <p className="text-xs text-gray-500 font-semibold">Email Address</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{currentPatient.email}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border col-span-2">
                          <p className="text-xs text-gray-500 font-semibold">Address</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{currentPatient.address || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-orange-900 mb-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Chief Complaint
                        </p>
                        <p className="text-sm text-orange-850 leading-relaxed">
                          {currentPatient.chiefComplaint}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 py-5"
                          onClick={() => router.push('/doctor/consultation')}
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Open Consultation
                        </Button>
                        <Button 
                          className="flex-1 text-white font-medium py-5"
                          style={{ backgroundColor: '#02006c' }}
                          onClick={() => handleUpdateStatus(currentPatient.queue_id, 'completed')}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete & Close
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 py-5"
                          onClick={() => handleUpdateStatus(currentPatient.queue_id, 'skipped')}
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Skip / Absent
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <Play className="h-5 w-5 mr-2 text-gray-500" />
                      Active Consultation Room
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-12 text-center">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">No Active Consultation</h3>
                    <p className="text-gray-600 mt-1 max-w-md mx-auto">
                      Click the &quot;Start Consultation&quot; button on the first patient in the waiting queue below to begin.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Waiting List */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Waiting Queue ({waitingPatients.length} patients)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {waitingPatients.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No patients waiting in queue</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {waitingPatients
                        .sort((a, b) => a.queue_number - b.queue_number)
                        .map((patient) => (
                          <div 
                            key={patient.queue_id} 
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors shadow-sm"
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-lg font-bold text-[#02006c]">
                                #{patient.queue_number}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{patient.patient_name}</h4>
                                <p className="text-sm text-gray-500">
                                  Queue #{patient.queue_number} • Arrived: {new Date(patient.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-gray-650 mt-1 italic line-clamp-1">
                                  Complaint: {patient.chiefComplaint}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="text-white font-medium px-4"
                              style={{ backgroundColor: '#02006c' }}
                              onClick={() => handleUpdateStatus(patient.queue_id, 'in-consultation')}
                              disabled={!!currentPatient}
                            >
                              Start Consultation
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Today's completed list & Doctor details */}
            <div className="space-y-6">
              
              {/* Doctor Status Card */}
              <Card className="border-0 shadow-md bg-blue-900 text-white">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">Dr. {doctorName}</h4>
                      <p className="text-xs text-blue-200">Active Consultation Portal</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg text-xs space-y-1.5 border border-white/10">
                    <p className="flex justify-between">
                      <span className="text-blue-200">Room Status:</span>
                      <span className="font-semibold text-green-400">● Open</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-blue-200">Hospital:</span>
                      <span>National Eye Hospital</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Today List */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-base font-bold text-gray-900">
                    Completed Today ({queueItems.filter(p => p.status === 'completed').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {queueItems.filter(p => p.status === 'completed').length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No patients completed yet today.</p>
                  ) : (
                    <div className="space-y-2">
                      {queueItems
                        .filter(p => p.status === 'completed')
                        .map((patient) => (
                          <div 
                            key={patient.queue_id} 
                            className="flex items-center space-x-2.5 p-2.5 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">{patient.patient_name}</p>
                              <p className="text-xs text-gray-500">Queue #{patient.queue_number}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>
        )}
      </div>
    </div>
  )
}
