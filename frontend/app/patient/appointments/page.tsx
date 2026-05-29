"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar, 
  QrCode, 
  Eye, 
  Plus,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Activity,
  X
} from "lucide-react"

interface Appointment {
  id: string
  date: string
  time: string
  doctor: string
  specialty: string
  queueNumber: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'scheduled'
  location: string
  backend_id?: number
}

export default function AppointmentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/appointments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      
      const formatted = data.map((apt: {id: number; appointment_date: string; appointment_time: string; doctor_name: string; specialty: string; queue_number: number; status: string; location?: string}) => ({
        id: `APT-${apt.id}`,
        backend_id: apt.id,
        date: apt.appointment_date,
        time: apt.appointment_time,
        doctor: apt.doctor_name,
        specialty: apt.specialty,
        queueNumber: apt.queue_number,
        status: apt.status === 'scheduled' ? 'upcoming' : apt.status,
        location: apt.location || 'Main Building'
      }))
      setAppointments(formatted)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'upcoming') return appointment.status === 'upcoming' || appointment.status === 'scheduled'
    return appointment.status === filterStatus
  })

  const handleCancelAppointment = async (appointmentId: string, backend_id?: number) => {
    if (!backend_id) return
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const token = localStorage.getItem('token')
        await fetch(`http://localhost:5000/api/appointments/${backend_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        fetchAppointments()
        setSelectedAppointment(null)
      } catch (error) {
        console.error(error)
      }
    }
  }

  // Removed unused handleDeleteAppointment function

  const getStatusBadge = (status: string) => {
    const badges = {
      'upcoming': 'bg-blue-100 text-blue-700',
      'completed': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
      'ongoing': 'bg-blue-100 text-blue-700'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">
              Manage your upcoming and past appointments
            </p>
          </div>
          <Button 
            className="text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: '#02006c' }}
            onClick={() => window.location.href = '/patient/book-appointment'}
          >
            <Plus className="h-5 w-5 mr-2" />
            Book New Appointment
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: appointments.length },
            { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => a.status === 'upcoming').length },
            { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
            { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === filter.key
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
              style={filterStatus === filter.key ? { backgroundColor: '#02006c' } : {}}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Appointments Table */}
        <Card className="shadow-md border-0 bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Specialty</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Queue</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#02006c' }}></div>
                        <p className="text-gray-500 text-sm">Loading appointments...</p>
                      </td>
                    </tr>
                  ) : filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{appointment.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">{appointment.time}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{appointment.doctor}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{appointment.specialty}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium" style={{ color: '#02006c' }}>#{appointment.queueNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm hover:bg-gray-50"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            {appointment.status === 'upcoming' && (
                              <Button
                                size="sm"
                                className="text-white text-sm"
                                style={{ backgroundColor: '#02006c' }}
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setShowQR(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Check-In
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-gray-600 font-medium">No {filterStatus !== 'all' ? filterStatus : ''} appointments found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Box for Appointment Details */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <Card className="border-0">
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Appointment Details</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">National Eye Hospital, Colombo</p>
                    </div>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Appointment ID and Status */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Appointment ID</p>
                      <p className="text-lg font-bold text-gray-900">{selectedAppointment.id}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(selectedAppointment.status)}`}>
                      {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </span>
                  </div>

                  {/* Doctor Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#02006c' }}>
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedAppointment.doctor}</h3>
                        <p className="text-gray-600">{selectedAppointment.specialty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Time</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedAppointment.time}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedAppointment.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Queue Position</p>
                          <p className="text-sm font-semibold text-gray-900">#{selectedAppointment.queueNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="flex-1 text-white font-medium"
                      style={{ backgroundColor: '#02006c' }}
                      onClick={() => setShowQR(true)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Code
                    </Button>
                    {selectedAppointment.status === 'upcoming' && (
                      <Button 
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleCancelAppointment(selectedAppointment.id, selectedAppointment.backend_id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* QR Code Dialog */}
        {showQR && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              <Card className="border-0">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Appointment QR Code</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Show this at reception</p>
                    </div>
                    <button
                      onClick={() => setShowQR(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* QR Code Display */}
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-48 h-48 bg-white flex items-center justify-center mx-auto">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedAppointment.backend_id}`} alt="QR Code" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Scan at hospital reception</p>
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Appointment ID:</span>
                        <span className="text-sm font-bold text-gray-900">{selectedAppointment.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Doctor:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedAppointment.doctor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedAppointment.time}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 text-white font-medium"
                        style={{ backgroundColor: '#02006c' }}
                        onClick={() => window.print()}
                      >
                        Print QR Code
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowQR(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}