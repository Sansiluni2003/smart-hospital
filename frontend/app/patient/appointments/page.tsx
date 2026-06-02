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
  X,
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { authFetch } from "@/lib/authFetch"

interface Toast {
  id: number
  type: "success" | "error"
  message: string
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl text-sm font-medium ${
            t.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

interface Appointment {
  id: string
  date: string
  time: string
  doctor: string
  specialty: string
  queueNumber: number
  status: 'upcoming' | 'allocated' | 'ongoing' | 'completed' | 'cancelled' | 'scheduled' | 'arrived'
  location: string
  backend_id?: number
  qrCode?: string
}

const normalizeAppointmentStatus = (status?: string): Appointment['status'] => {
  if (!status) return 'upcoming'

  switch (status.toLowerCase()) {
    case 'pending allocation':
    case 'scheduled':
    case 'upcoming':
      return 'upcoming'
    case 'allocated':
      return 'allocated'
    case 'arrived':
      return 'arrived'
    case 'in progress':
    case 'ongoing':
      return 'ongoing'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'upcoming'
  }
}

const getAppointmentStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'arrived':
      return 'Arrival sent to staff'
    case 'ongoing':
      return 'In Progress'
    case 'upcoming':
      return 'Pending allocation'
    case 'allocated':
      return 'Doctor allocated'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export default function AppointmentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = { current: 0 }

  const pushToast = (type: "success" | "error", message: string) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      // Get patient_id from localStorage user object
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      const user = JSON.parse(userStr);
      const patient_id = user.patient_id || user.Patient_ID;
      if (!patient_id) throw new Error('Patient ID not found');

      // Use /api/v1/patients/{patient_id}/appointments if available
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await authFetch(
        `${apiUrl}/api/v1/patients/${patient_id}/appointments`
      );
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      // Map backend response to frontend Appointment type
      const formatted = data.map((apt: any) => ({
        id: `APT-${apt.Appointment_ID || apt.id}`,
        backend_id: apt.Appointment_ID || apt.id,
        date: apt.AppointmentDate || apt.appointment_date,
        time: apt.AppointmentTime || apt.appointment_time,
        doctor: apt.Doctor_Name || apt.doctor_name || 'Doctor will be assigned by staff',
        specialty: apt.Speciality || apt.specialty || 'Assignment pending',
        queueNumber: apt.Queue_Number || apt.queue_number || 1,
        status: normalizeAppointmentStatus(apt.Status || apt.status),
        location: apt.Location || apt.location || 'Main Building',
        qrCode: apt.QR_code || apt.qr_code || `${apt.Appointment_ID || apt.id}`
      }));
      setAppointments(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'upcoming') return appointment.status === 'upcoming' || appointment.status === 'allocated' || appointment.status === 'scheduled'
    return appointment.status === filterStatus
  })

  const canCheckIn = (appointment: Appointment) => {
    return appointment.status === 'upcoming' || appointment.status === 'allocated' || appointment.status === 'arrived'
  }

  const canMarkAsArrived = (appointment: Appointment) => {
    return appointment.status === 'upcoming' || appointment.status === 'allocated'
  }

  const handleCancelAppointment = async (appointmentId: string, backend_id?: number) => {
    if (!backend_id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      await authFetch(`${apiUrl}/api/v1/appointments/${backend_id}`, {
        method: 'DELETE'
      });
      fetchAppointments();
      setSelectedAppointment(null);
      pushToast('success', 'Appointment cancelled successfully.');
    } catch (error) {
      pushToast('error', 'Failed to cancel appointment. Please try again.');
    }
  };

  const handleMarkAsArrived = async (appointmentId: string, backend_id?: number) => {
    if (!backend_id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await authFetch(`${apiUrl}/api/v1/patients/appointments/${backend_id}/arrive`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark as arrived');
      fetchAppointments();
      pushToast('success', 'You have been marked as arrived. Staff can now see your notification.');
    } catch (error) {
      pushToast('error', 'Failed to mark as arrived. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'upcoming': 'bg-blue-100 text-blue-700',
      'allocated': 'bg-green-100 text-green-700',
      'completed': 'bg-gray-100 text-gray-700',
      'cancelled': 'bg-red-100 text-red-700',
      'ongoing': 'bg-blue-100 text-blue-700',
      'arrived': 'bg-green-100 text-green-700'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700'
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600">
              Track booking status, open your QR code, and notify staff when you arrive.
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

        <Card className="border-0 bg-blue-50 shadow-sm">
          <CardContent className="px-5 py-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-blue-900">How to use this page</p>
                <p className="text-sm text-blue-800">Use Check-In to open your QR code at reception. Use Mark as Arrived once you are physically at the hospital.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Doctor assignment</p>
                <p className="text-sm text-blue-800">Patients book first. Staff assign the doctor later based on availability and maximum patient limits.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: appointments.length },
            { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => a.status === 'upcoming' || a.status === 'allocated').length },
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
                        <td className="px-6 py-4 max-w-[220px]">
                          <span className="font-medium text-gray-900 block leading-snug">{appointment.doctor}</span>
                        </td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <span className="text-gray-600 block leading-snug">{appointment.specialty}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium" style={{ color: '#02006c' }}>#{appointment.queueNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {getAppointmentStatusLabel(appointment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 min-w-[260px]">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm hover:bg-gray-50"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            {canCheckIn(appointment) && (
                              <>
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
                                  Show QR
                                </Button>
                                {canMarkAsArrived(appointment) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-sm border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleMarkAsArrived(appointment.id, appointment.backend_id)}
                                  >
                                    <Bell className="h-4 w-4 mr-1" />
                                    I Arrived
                                  </Button>
                                )}
                              </>
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
                      {getAppointmentStatusLabel(selectedAppointment.status)}
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
                    {(selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'allocated') && (
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
                          {(() => {
                            const raw = selectedAppointment.qrCode || ""
                            const looksLikePath = raw.includes("\\") || raw.includes("/")
                            const payload = looksLikePath || !raw
                              ? `apt:${selectedAppointment.backend_id || selectedAppointment.id}|date:${selectedAppointment.date}|time:${selectedAppointment.time}`
                              : raw
                            return (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payload)}`}
                                alt="QR Code"
                              />
                            )
                          })()}
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
    </>
  )
}