"use client"

import { useState, useEffect, useMemo } from "react"
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
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-0 ${
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
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
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
  createdAt?: string
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

const getStatusStyles = (status: string) => {
  const styles = {
    'upcoming': { bg: 'bg-sky-50 text-sky-700 border-sky-100', dot: 'bg-sky-500' },
    'allocated': { bg: 'bg-teal-50 text-teal-700 border-teal-100', dot: 'bg-teal-500' },
    'completed': { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    'cancelled': { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' },
    'ongoing': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse', dot: 'bg-indigo-500' },
    'arrived': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' }
  }
  return styles[status as keyof typeof styles] || { bg: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-400' }
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
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      const user = JSON.parse(userStr);
      const patient_id = user.patient_id || user.Patient_ID;
      if (!patient_id) throw new Error('Patient ID not found');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await authFetch(
        `${apiUrl}/api/v1/patients/${patient_id}/appointments`
      );

      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();

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
        qrCode: apt.QR_code || apt.qr_code || `${apt.Appointment_ID || apt.id}`,
        createdAt: apt.CreatedAt || apt.created_at
      }));
      setAppointments(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sophisticated sorting logic: 
  // 1. Active/upcoming by recency (newly booked first), then by date
  // 2. Completed/cancelled by date (most recent first)
  // 3. Excludes past appointments from active list
  const sortedAppointments = useMemo(() => {
    const isPast = (status: Appointment['status']) => status === 'completed' || status === 'cancelled';

    const parseDateTime = (dateStr: string, timeStr?: string) => {
      try {
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (timeStr) {
          const d = new Date(`${cleanDate}T${timeStr}`);
          return isNaN(d.getTime()) ? new Date(cleanDate) : d;
        }
        return new Date(cleanDate);
      } catch {
        return new Date(0);
      }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...appointments].sort((a, b) => {
      const aPast = isPast(a.status);
      const bPast = isPast(b.status);

      // Separate past from active
      if (aPast !== bPast) {
        return aPast ? 1 : -1;
      }

      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);

      if (aPast) {
        // Completed/Cancelled: newest first (descending date)
        return dateB.getTime() - dateA.getTime();
      } else {
        // Active: Sort by recency (newly booked first), then by date
        // If CreatedAt available, prioritize by that
        const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        // If both have createdAt, sort by that (newest first)
        if (createdAtA && createdAtB) {
          const createdDiff = createdAtB - createdAtA;
          if (createdDiff !== 0) return createdDiff;
        }

        // Otherwise sort by appointment date (soonest first)
        return dateA.getTime() - dateB.getTime();
      }
    });
  }, [appointments]);

  // Extract the next FUTURE active appointment for "Up Next" spotlight
  const nextAppointment = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDateTime = (dateStr: string, timeStr?: string) => {
      try {
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (timeStr) {
          const d = new Date(`${cleanDate}T${timeStr}`);
          return isNaN(d.getTime()) ? new Date(cleanDate) : d;
        }
        return new Date(cleanDate);
      } catch {
        return new Date(0);
      }
    };

    return sortedAppointments.find((a) => {
      // Must be active status
      if (!['upcoming', 'allocated', 'arrived', 'ongoing', 'scheduled'].includes(a.status)) {
        return false;
      }
      // Must be in the future (today or later)
      const appointmentDate = parseDateTime(a.date, a.time);
      return appointmentDate >= today;
    });
  }, [sortedAppointments]);

  const filteredAppointments = useMemo(() => {
    return sortedAppointments.filter(appointment => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'upcoming') {
        return appointment.status === 'upcoming' || 
               appointment.status === 'allocated' || 
               appointment.status === 'scheduled' || 
               appointment.status === 'arrived' || 
               appointment.status === 'ongoing'
      }
      return appointment.status === filterStatus
    })
  }, [sortedAppointments, filterStatus]);

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

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Appointments</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Track booking status, view check-in QR codes, and notify receptionists when you arrive.
              </p>
            </div>
            <Button 
              className="text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:shadow-md transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
              style={{ backgroundColor: '#02006c' }}
              onClick={() => window.location.href = '/patient/book-appointment'}
            >
              <Plus className="h-5 w-5" />
              Book New Appointment
            </Button>
          </div>

          {/* Up Next / Feature Banner */}
          {nextAppointment && (
            <Card className="border-0 bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-lg overflow-hidden relative">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="space-y-3">
                    <span className="bg-blue-500/30 text-blue-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400/20">
                      Up Next
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      {nextAppointment.doctor}
                    </h2>
                    <p className="text-blue-100/90 font-medium flex items-center gap-2 text-sm md:text-base">
                      <Activity className="h-4 w-4 text-sky-400" /> {nextAppointment.specialty}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2 text-sm text-blue-100">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg font-medium">
                        <Calendar className="h-4 w-4 text-sky-300" />
                        {new Date(nextAppointment.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg font-medium">
                        <Clock className="h-4 w-4 text-sky-300" />
                        {nextAppointment.time}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg font-medium">
                        <MapPin className="h-4 w-4 text-sky-300" />
                        {nextAppointment.location}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg font-medium">
                        <span className="font-bold text-sky-300">Queue Position:</span> #{nextAppointment.queueNumber}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <Button
                      className="flex-1 lg:flex-initial bg-white text-indigo-950 font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                      onClick={() => {
                        setSelectedAppointment(nextAppointment)
                        setShowQR(true)
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Check-In QR
                    </Button>
                    {canMarkAsArrived(nextAppointment) && (
                      <Button
                        className="flex-1 lg:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-sm"
                        onClick={() => handleMarkAsArrived(nextAppointment.id, nextAppointment.backend_id)}
                      >
                        <Bell className="h-4 w-4 mr-2 animate-bounce" />
                        I Arrived
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Informational Tips */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Easy Reception Check-In</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Click 'Show QR' or 'Details' to open your barcode, then present it at the reception desk to instantly check in.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Mark as Arrived</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Once physically inside the hospital, tap 'I Arrived' to directly alert the nurse's station of your arrival.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Physician Assignment</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    We secure your slot first. Clinical staff will automatically assign and confirm the specialist doctor on duty.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar with Badge Count indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'All Bookings', icon: Activity, count: appointments.length, color: 'text-indigo-600' },
                { key: 'upcoming', label: 'Upcoming', icon: Calendar, count: appointments.filter(a => ['upcoming', 'allocated', 'scheduled', 'arrived', 'ongoing'].includes(a.status)).length, color: 'text-sky-600' },
                { key: 'completed', label: 'Completed', icon: CheckCircle, count: appointments.filter(a => a.status === 'completed').length, color: 'text-emerald-600' },
                { key: 'cancelled', label: 'Cancelled', icon: XCircle, count: appointments.filter(a => a.status === 'cancelled').length, color: 'text-rose-600' }
              ].map((filter) => {
                const Icon = filter.icon;
                const isSelected = filterStatus === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setFilterStatus(filter.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    style={isSelected ? { backgroundColor: '#02006c' } : {}}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : filter.color}`} />
                    <span>{filter.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-slate-400 font-semibold px-3 py-1 bg-slate-50 rounded-lg self-start sm:self-auto">
              Viewing {filteredAppointments.length} Appointments
            </div>
          </div>

          {/* Core Layout List / Table Container */}
          <Card className="shadow-sm border border-slate-100 bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              
              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/75 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Care Provider</th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Area</th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Queue #</th>
                      <th className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                          <p className="text-slate-500 text-sm font-medium">Retrieving appointments list...</p>
                        </td>
                      </tr>
                    ) : filteredAppointments.length > 0 ? (
                      filteredAppointments.map((appointment) => {
                        const statusStyle = getStatusStyles(appointment.status);
                        return (
                          <tr key={appointment.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="font-bold text-slate-800 text-sm bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/40">
                                {appointment.id}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 text-sm">
                                  {new Date(appointment.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 font-medium">
                                  <Clock className="h-3 w-3" /> {appointment.time}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm leading-tight">{appointment.doctor}</span>
                                <span className="text-indigo-600 text-xs font-semibold mt-0.5">{appointment.specialty}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-slate-600 text-sm font-medium flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {appointment.location}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="font-extrabold text-sm text-indigo-950 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                                #{appointment.queueNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyle.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                {getAppointmentStatusLabel(appointment.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8.5 text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-200"
                                  onClick={() => setSelectedAppointment(appointment)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                  Details
                                </Button>
                                {canCheckIn(appointment) && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-8.5 text-xs font-bold text-white shadow"
                                      style={{ backgroundColor: '#02006c' }}
                                      onClick={() => {
                                        setSelectedAppointment(appointment)
                                        setShowQR(true)
                                      }}
                                    >
                                      <QrCode className="h-3.5 w-3.5 mr-1" />
                                      Show QR
                                    </Button>
                                    {canMarkAsArrived(appointment) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8.5 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/20"
                                        onClick={() => handleMarkAsArrived(appointment.id, appointment.backend_id)}
                                      >
                                        <Bell className="h-3.5 w-3.5 mr-1 text-emerald-600 animate-pulse" />
                                        I Arrived
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <p className="text-slate-800 font-bold text-base">No appointments found</p>
                            <p className="text-slate-400 text-xs mt-1">There are no records matching your selected filter view.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List Layout */}
              <div className="block md:hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-slate-500 text-xs">Retrieving appointments...</p>
                  </div>
                ) : filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => {
                    const statusStyle = getStatusStyles(appointment.status);
                    return (
                      <div key={appointment.id} className="p-5 space-y-4 hover:bg-slate-50/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/40">
                            {appointment.id}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyle.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {getAppointmentStatusLabel(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-900 text-base leading-tight">{appointment.doctor}</h4>
                          <p className="text-indigo-600 text-xs font-bold">{appointment.specialty}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400 font-semibold">Date & Time</span>
                            <span className="font-bold text-slate-800">
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })} at {appointment.time}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400 font-semibold">Facility Block</span>
                            <span className="font-bold text-slate-800 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" /> {appointment.location}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2 border-t border-slate-200/40 pt-2.5 mt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-semibold">Your Queue Position</span>
                              <span className="font-extrabold text-xs text-indigo-950 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                                #{appointment.queueNumber}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs font-bold text-slate-700 border-slate-200"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            Details
                          </Button>
                          {canCheckIn(appointment) && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 h-9 text-xs font-bold text-white shadow"
                                style={{ backgroundColor: '#02006c' }}
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setShowQR(true)
                                }}
                              >
                                <QrCode className="h-3.5 w-3.5 mr-1" />
                                Show QR
                              </Button>
                              {canMarkAsArrived(appointment) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-9 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/20"
                                  onClick={() => handleMarkAsArrived(appointment.id, appointment.backend_id)}
                                >
                                  <Bell className="h-3.5 w-3.5 mr-1 text-emerald-600 animate-pulse" />
                                  I Arrived
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-slate-800 font-bold text-sm">No appointments found</p>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Dialog Box for Appointment Details */}
          {selectedAppointment && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
                <Card className="border-0">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl font-black text-slate-900">Appointment Details</CardTitle>
                        <p className="text-sm font-semibold text-indigo-600 mt-1">National Eye Hospital, Colombo</p>
                      </div>
                      <button
                        onClick={() => setSelectedAppointment(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors border border-slate-100"
                      >
                        <X className="h-5 w-5 text-slate-500" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Appointment ID and Status */}
                    <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Appointment ID</p>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{selectedAppointment.id}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyles(selectedAppointment.status).bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyles(selectedAppointment.status).dot}`}></span>
                        {getAppointmentStatusLabel(selectedAppointment.status)}
                      </span>
                    </div>

                    {/* Doctor Info Card */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: '#02006c' }}>
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedAppointment.doctor}</h3>
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">{selectedAppointment.specialty}</p>
                      </div>
                    </div>

                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-3.5 shadow-sm">
                        <div className="p-2.5 rounded-xl text-white shrink-0" style={{ backgroundColor: '#02006c' }}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scheduled Date</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-3.5 shadow-sm">
                        <div className="p-2.5 rounded-xl text-white shrink-0" style={{ backgroundColor: '#02006c' }}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scheduled Time</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedAppointment.time}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-3.5 shadow-sm">
                        <div className="p-2.5 rounded-xl text-white shrink-0" style={{ backgroundColor: '#02006c' }}>
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Room / Area</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedAppointment.location}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center space-x-3.5 shadow-sm">
                        <div className="p-2.5 rounded-xl text-white shrink-0" style={{ backgroundColor: '#02006c' }}>
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Position</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">Queue #{selectedAppointment.queueNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3">
                      <Button 
                        className="flex-1 text-white font-bold h-11 rounded-xl shadow"
                        style={{ backgroundColor: '#02006c' }}
                        onClick={() => setShowQR(true)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View Reception QR Code
                      </Button>
                      {(selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'allocated') && (
                        <Button 
                          variant="outline"
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold h-11 rounded-xl"
                          onClick={() => handleCancelAppointment(selectedAppointment.id, selectedAppointment.backend_id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Appointment
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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
                <Card className="border-0">
                  <CardHeader className="border-b border-slate-100 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-black text-slate-900">Check-In QR Code</CardTitle>
                        <p className="text-sm font-semibold text-slate-400 mt-0.5">Scan this barcode at clinic desk</p>
                      </div>
                      <button
                        onClick={() => setShowQR(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors border border-slate-100"
                      >
                        <X className="h-5 w-5 text-slate-500" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner flex flex-col items-center justify-center">
                      <div className="w-52 h-52 bg-white flex items-center justify-center mb-4 border border-slate-100 p-2 rounded-xl">
                        {(() => {
                          const raw = selectedAppointment.qrCode || ""
                          const looksLikePath = raw.includes("\\") || raw.includes("/")
                          const payload = looksLikePath || !raw
                            ? `apt:${selectedAppointment.backend_id || selectedAppointment.id}|date:${selectedAppointment.date}|time:${selectedAppointment.time}`
                            : raw
                          return (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`}
                              alt="Check-in QR Code"
                              className="w-full h-full object-contain"
                            />
                          )
                        })()}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Scan at reception</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Appointment ID:</span>
                        <span className="font-extrabold text-slate-800">{selectedAppointment.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Care Provider:</span>
                        <span className="font-bold text-slate-800">{selectedAppointment.doctor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Date & Time:</span>
                        <span className="font-bold text-slate-800">
                          {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} at {selectedAppointment.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 text-white font-bold h-11 rounded-xl"
                        style={{ backgroundColor: '#02006c' }}
                        onClick={() => window.print()}
                      >
                        Print Badge
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 font-bold h-11 rounded-xl"
                        onClick={() => setShowQR(false)}
                      >
                        Close
                      </Button>
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
