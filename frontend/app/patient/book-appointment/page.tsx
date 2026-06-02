"use client"

import { useState } from "react"
import Link from "next/link"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar, 
  Clock, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Download,
  Share,
  Bell,
  User,
  Phone,
  Stethoscope,
  Heart,
  Eye,
  Building2
} from "lucide-react"
import { authFetch } from "@/lib/authFetch"

interface Appointment {
  id: string
  date: string
  queueNumber: number
  qrCode: string
  status: 'confirmed' | 'pending'
  department: string
  notes?: string
}

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState("")
  const [department, setDepartment] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Get available weekdays (Monday to Friday) for the next 30 days
  const getAvailableWeekdays = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Only include weekdays (Monday = 1, Friday = 5)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: date.toDateString() === today.toDateString()
        })
      }
    }
    return dates
  }

  const availableDates = getAvailableWeekdays()

  const departments = [
    { 
      value: "general", 
      label: "General Consultation",
      icon: Stethoscope,
      bgColor: "bg-blue-50",
      description: "General check-up and consultation"
    },
    { 
      value: "eye-exam", 
      label: "Eye Examination",
      icon: Eye,
      bgColor: "bg-teal-50", 
      description: "Comprehensive eye health examination"
    },
    { 
      value: "surgery", 
      label: "Surgery Consultation",
      icon: Heart,
      bgColor: "bg-blue-50",
      description: "Pre and post-surgery consultation"
    },
    { 
      value: "follow-up", 
      label: "Follow-up Visit",
      icon: Calendar,
      bgColor: "bg-blue-50",
      description: "Follow-up after previous treatment"
    },
    { 
      value: "emergency", 
      label: "Emergency Consultation",
      icon: AlertCircle,
      bgColor: "bg-blue-50",
      description: "Urgent medical attention required"
    }
  ]

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!selectedDate) {
      newErrors.date = "Please select an appointment date"
    }
    
    if (!department) {
      newErrors.department = "Please select a department"
    }
    
    if (!reason.trim()) {
      newErrors.reason = "Please provide a reason for your visit"
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Please provide more details (at least 10 characters)"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateQRData = (appointmentId: string, date: string, queueNumber: number) => {
    // Generate simple QR code data for easy scanning
    return `${appointmentId}-${queueNumber}`
  }

  const handleBookAppointment = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // Get patient_id from localStorage user object
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      const user = JSON.parse(userStr);
      const patient_id = user.patient_id || user.Patient_ID;
      if (!patient_id) throw new Error('Patient ID not found');

      // Prepare payload for backend
      const payload = {
        ClinicID: 1, // ✅ Correct
        AppointmentDate: selectedDate,
        Notes: reason
      };

      // Use authFetch and real backend endpoint
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/patients/${patient_id}/book-appointment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const detail = err?.detail;
        const message = Array.isArray(detail)
          ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ')
          : typeof detail === 'string'
            ? detail
            : 'Failed to book appointment';
        throw new Error(message);
      }

      const data = await response.json();
      // Map backend response to frontend Appointment type
      const appointmentId = `APT-${data.Appointment_ID}`;
      const queueNumber = data.Queue_Number || 1;
      const qrData = data.QR_code || generateQRData(appointmentId, selectedDate, queueNumber);
      const newAppointment: Appointment = {
        id: appointmentId,
        date: data.AppointmentDate || selectedDate,
        queueNumber,
        qrCode: qrData,
        status: data.Status || 'confirmed',
        department,
        notes: reason
      };
      setBookedAppointment(newAppointment);
      setSelectedDate("");
      setDepartment("");
      setReason("");
    } catch (error: any) {
      console.error("Booking failed:", error);
      alert(error.message || "Failed to book appointment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadQR = () => {
    if (!bookedAppointment) return
    
    // Create a canvas to render QR code as image
    const qrElement = document.querySelector('[data-testid="qr-code"]') as HTMLElement
    if (qrElement) {
      // Convert SVG to image and download
      const svg = qrElement.querySelector('svg')
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `appointment-qr-${bookedAppointment.id}.png`
              link.click()
            }
          })
        }
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
      }
    }
  }

  const handleShareAppointment = () => {
    if (!bookedAppointment) return
    
    const shareData = {
      title: 'Hospital Appointment Confirmation',
      text: `Appointment booked for ${new Date(bookedAppointment.date).toLocaleDateString()} - Queue #${bookedAppointment.queueNumber}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Appointment: ${shareData.text}`)
      alert('Appointment details copied to clipboard!')
    }
  }

  if (bookedAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Success Header */}
          <div className="mb-8 text-center bg-white rounded-2xl shadow-lg border-0 p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full shadow-lg bg-green-500">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Appointment Confirmed!
            </h1>
            <p className="text-gray-600 text-lg mb-6">Your appointment has been successfully booked</p>
            <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <span className="text-gray-700 font-medium">Booking Reference: <span className="font-bold text-green-700">{bookedAppointment.id}</span></span>
            </div>
          </div>

          {/* Enhanced Appointment Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Main Details Card */}
            <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-xl font-bold flex items-center" style={{ color: '#02006c' }}>
                  <Calendar className="h-6 w-6 mr-3" />
                  Appointment Details
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">National Eye Hospital, Colombo</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Hospital Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">National Eye Hospital</h3>
                        <p className="text-sm text-gray-600">Colombo • Department of Eye Examination</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Date</p>
                          <p className="text-gray-700 font-medium">{new Date(bookedAppointment.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                      </div>
                    </div>
                    
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Time Slot</p>
                          <p className="text-gray-700 font-medium">8:00 AM - 4:00 PM</p>
                          <p className="text-xs text-gray-600 mt-1 flex items-center">
                            <Bell className="h-3 w-3 mr-1" />
                            SMS confirmation coming
                          </p>
                        </div>
                      </div>
                    </div>
                    
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Department</p>
                          <p className="text-gray-700 font-medium">{departments.find(d => d.value === bookedAppointment.department)?.label}</p>
                        </div>
                      </div>
                    </div>
                    
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#02006c' }}>
                          #{bookedAppointment.queueNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Queue Position</p>
                          <p className="text-gray-700 font-medium">You are #{bookedAppointment.queueNumber} in queue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Doctor Information */}
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                          <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Assigned Doctor</h4>
                          <p className="text-gray-700">Dr. Sarah Johnson</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" style={{ color: '#02006c' }}>Specialist</p>
                        <p className="text-xs text-gray-600">15+ years experience</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                      <CheckCircle className="h-4 w-4 mr-2" style={{ color: '#02006c' }} />
                      <span className="font-semibold" style={{ color: '#02006c' }}>Confirmed & Ready</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-xl font-bold flex items-center justify-center" style={{ color: '#02006c' }}>
                  <QrCode className="h-6 w-6 mr-3" />
                  Your QR Code
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">Show at reception</p>
              </CardHeader>
              <CardContent className="p-6 text-center">
                  <div className="bg-gray-50 p-6 rounded-xl mb-6 border-2 border-dashed border-blue-300" data-testid="qr-code">
                  <QRCode 
                    value={bookedAppointment.qrCode || "TEST-QR-CODE"} 
                    size={160}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 160 160`}
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
                  <p className="text-xs text-gray-600 font-mono">{bookedAppointment.qrCode}</p>
                </div>
                <p className="text-sm text-gray-600 mb-6">Present this QR code at hospital reception for quick check-in</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleDownloadQR}
                    variant="outline"
                    className="border-2 text-gray-700 hover:bg-gray-50 font-medium py-3"
                    style={{ borderColor: '#02006c' }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                  <Button 
                    onClick={handleShareAppointment}
                    className="text-white font-medium py-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#02006c' }}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Information */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-xl font-bold flex items-center" style={{ color: '#02006c' }}>
                <AlertCircle className="h-6 w-6 mr-3" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: '#02006c' }}>SMS Confirmation</h4>
                      <p className="text-sm text-gray-700">You will receive SMS and email notifications with your exact appointment time based on doctor availability and patient count.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                      <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: '#02006c' }}>QR Code Check-in</h4>
                      <p className="text-sm text-gray-700">Bring your QR code (printed or on phone) to the hospital reception for quick check-in.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: '#02006c' }}>Arrival Time</h4>
                      <p className="text-sm text-gray-700">Please arrive 15 minutes before your confirmed appointment time for registration.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#02006c' }}>
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: '#02006c' }}>Changes & Cancellation</h4>
                      <p className="text-sm text-gray-700">Contact the hospital at least 2 hours before your appointment for any changes or cancellations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/patient/appointments" className="block">
              <Button className="w-full py-4 text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-90" style={{
                backgroundColor: "#02006c"
              }}>
                <Calendar className="h-5 w-5 mr-3" />
                View All Appointments
              </Button>
            </Link>
            <Link href="/patient/dashboard" className="block">
              <Button variant="outline" className="w-full py-4 font-semibold text-lg rounded-lg border-2 hover:bg-gray-50 transition-all duration-200" style={{
                borderColor: "#02006c",
                color: "#02006c"
              }}>
                <ArrowLeft className="h-5 w-5 mr-3" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-4">
                  <Calendar className="h-5 w-5 mr-2" style={{ color: "#02006c" }} />
                  <span className="text-sm font-medium" style={{ color: "#02006c" }}>Online Appointment Booking</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                  Schedule Your Visit
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-6">
                  Book your appointment at <span className="font-bold" style={{ color: "#02006c" }}>National Eye Hospital, Colombo</span> and get instant confirmation with queue number and QR code.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <QrCode className="w-6 h-6 flex-shrink-0" style={{ color: "#02006c" }} />
                    <div>
                      <div className="font-semibold text-gray-900">Instant Queue Number</div>
                      <div className="text-sm text-gray-600">Get your QR code immediately</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Bell className="w-6 h-6 flex-shrink-0" style={{ color: "#02006c" }} />
                    <div>
                      <div className="font-semibold text-gray-900">SMS Notification</div>
                      <div className="text-sm text-gray-600">Exact timing sent to you</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-md rounded-2xl h-full">
                <CardContent className="p-8 pt-12">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
                      <Clock className="h-8 w-8" style={{ color: "#02006c" }} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Clinic Hours</h3>
                    <p className="text-lg text-gray-600 mb-2">Monday to Sunday</p>
                    <div className="text-3xl font-bold" style={{ color: "#02006c" }}>8:00 AM - 4:00 PM</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl mx-2">
                    <p className="text-sm text-gray-600 text-center">
                      Open every day for your convenience
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Appointment Form - Full Width */}
        <div className="w-full">
          <Card className="bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-md rounded-2xl">
              <CardHeader className="p-8 border-b border-gray-100">
                <CardTitle className="text-3xl font-bold text-gray-900 flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4">
                    <Stethoscope className="h-6 w-6" style={{ color: "#02006c" }} />
                  </div>
                  Appointment Details
                </CardTitle>
                <p className="text-lg text-gray-600 mt-2">Fill in the information below to schedule your visit</p>
              </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Date Selection */}
            <div className="space-y-6">
              <label className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5" style={{ color: "#02006c" }} />
                </div>
                Select Date *
              </label>
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
                  {availableDates.slice(0, 12).map((date) => {
                    const isSelected = selectedDate === date.value
                    const dateObj = new Date(date.value)
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNumber = dateObj.getDate()
                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' })
                    
                    return (
                      <div
                        key={date.value}
                        onClick={() => {
                          setSelectedDate(date.value)
                          if (errors.date) {
                            setErrors(prev => ({ ...prev, date: "" }))
                          }
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 text-center ${
                          isSelected 
                            ? 'text-white shadow-xl' 
                            : 'bg-white text-gray-700 hover:shadow-md'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={isSelected ? { backgroundColor: "#02006c" } : {}}
                      >
                        <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                          {dayName}
                        </div>
                        <div className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {dayNumber}
                        </div>
                        <div className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                          {monthName}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-600 font-medium flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Available all week • 8:00 AM - 4:00 PM
                  </p>
                </div>
              </div>
              {errors.date && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">{errors.date}</p>
                </div>
              )}
            </div>

            {/* Department Selection */}
            <div className="space-y-6">
              <label className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                  <Stethoscope className="h-5 w-5" style={{ color: "#02006c" }} />
                </div>
                Choose Department *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((dept) => {
                  const IconComponent = dept.icon
                  const isSelected = department === dept.value
                  return (
                    <div
                      key={dept.value}
                      onClick={() => {
                        setDepartment(dept.value)
                        if (errors.department) {
                          setErrors(prev => ({ ...prev, department: "" }))
                        }
                      }}
                      className={`bg-white hover:shadow-xl transition-all duration-500 border-0 shadow-md group hover:-translate-y-1 relative overflow-hidden rounded-2xl cursor-pointer ${
                        isSelected 
                          ? 'shadow-xl scale-105 ring-4 ring-blue-100' 
                          : ''
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={isSelected ? { backgroundColor: "#f8faff" } : {}}
                    >
                      <div className="p-6 flex items-start space-x-4">
                        <div className={`w-16 h-16 rounded-2xl ${dept.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                          <IconComponent className="h-8 w-8" style={{ color: "#02006c" }} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-2 transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-900 group-hover:text-gray-900'}`}>
                            {dept.label}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {dept.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-6 w-6" style={{ color: "#02006c" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {errors.department && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">{errors.department}</p>
                </div>
              )}
            </div>

            {/* Reason for Visit */}
            <div className="space-y-6">
              <label className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                  <User className="h-5 w-5" style={{ color: "#02006c" }} />
                </div>
                Reason for Visit *
              </label>
              <div className="bg-gray-50 rounded-2xl p-6">
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value)
                    if (errors.reason) {
                      setErrors(prev => ({ ...prev, reason: "" }))
                    }
                  }}
                  rows={5}
                  className={`block w-full px-5 py-4 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 resize-none bg-white transition-all duration-300 text-gray-800 placeholder-gray-500`}
                  style={{
                    borderColor: errors.reason ? "#ef4444" : "#e5e7eb"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#02006c"
                    e.target.style.boxShadow = "0 0 0 4px rgba(2, 0, 108, 0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.reason ? "#ef4444" : "#e5e7eb"
                    e.target.style.boxShadow = "none"
                  }}
                  placeholder="Please describe your symptoms or reason for the appointment in detail..."
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-gray-600 font-medium flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Minimum 10 characters required
                  </p>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                    reason.length >= 10 ? 'text-white bg-blue-600' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {reason.length}/10
                  </span>
                </div>
              </div>
              {errors.reason && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600 font-medium">{errors.reason}</p>
                </div>
              )}
            </div>

            {/* Book Button */}
            <div className="pt-8">
              <Button
                onClick={handleBookAppointment}
                disabled={isLoading || !selectedDate || !department || reason.length < 10}
                className={`w-full py-6 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none ${
                  isLoading || !selectedDate || !department || reason.length < 10 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: isLoading || !selectedDate || !department || reason.length < 10 ? "#94a3b8" : "#02006c" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mr-4"></div>
                    <span className="animate-pulse text-xl">Booking Your Appointment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Calendar className="h-7 w-7 mr-4" />
                    <span>Book My Appointment</span>
                    {selectedDate && department && reason.length >= 10 && (
                      <CheckCircle className="h-6 w-6 ml-4 text-green-300" />
                    )}
                  </div>
                )}
              </Button>
              {(!selectedDate || !department || reason.length < 10) && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 rounded-lg shadow-sm" style={{ borderColor: "#02006c" }}>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-3" style={{ color: "#02006c" }} />
                    <p className="text-gray-700 font-medium">
                      Please complete all required fields to book your appointment
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
