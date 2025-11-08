"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Activity
} from "lucide-react"

interface Appointment {
  id: string
  date: string
  time: string
  doctor: string
  specialty: string
  queueNumber: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  location: string
}

const mockAppointments: Appointment[] = [
  {
    id: "A001",
    date: "2025-10-15",
    time: "10:00 AM",
    doctor: "Dr. Sarah Wilson",
    specialty: "Ophthalmology",
    queueNumber: 5,
    status: "upcoming",
    location: "Room 201"
  },
  {
    id: "A002", 
    date: "2025-09-28",
    time: "2:00 PM",
    doctor: "Dr. Michael Chen",
    specialty: "Retinal Surgery",
    queueNumber: 3,
    status: "completed",
    location: "Room 105"
  },
  {
    id: "A003",
    date: "2025-10-20",
    time: "11:30 AM", 
    doctor: "Dr. Emily Johnson",
    specialty: "Eye Examination",
    queueNumber: 2,
    status: "upcoming",
    location: "Room 203"
  }
]

export default function AppointmentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const filteredAppointments = mockAppointments.filter(appointment => {
    if (filterStatus === 'all') return true
    return appointment.status === filterStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'ongoing': return <Activity className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500 text-white'
      case 'completed': return 'bg-green-500 text-white'
      case 'cancelled': return 'bg-red-500 text-white'
      case 'ongoing': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-8">
          <p className="text-gray-600">
            Manage your upcoming and past appointments
          </p>
        </div>

        {/* Action Bar */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'all', label: 'All', count: mockAppointments.length },
                  { key: 'upcoming', label: 'Upcoming', count: mockAppointments.filter(a => a.status === 'upcoming').length },
                  { key: 'completed', label: 'Completed', count: mockAppointments.filter(a => a.status === 'completed').length },
                  { key: 'cancelled', label: 'Cancelled', count: mockAppointments.filter(a => a.status === 'cancelled').length }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterStatus(filter.key)}
                    className={`px-5 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      filterStatus === filter.key
                        ? 'text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-md'
                    }`}
                    style={filterStatus === filter.key ? { backgroundColor: '#02006c' } : {}}
                  >
                    {filter.label} <span className="ml-2 text-sm">({filter.count})</span>
                  </button>
                ))}
              </div>
              
              {/* Book New Appointment Button */}
              <Button 
                className="text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#02006c' }}
                onClick={() => window.location.href = '/patient/book-appointment'}
              >
                <Plus className="h-5 w-5 mr-3" />
                Book New Appointment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Grid */}
        <div className="grid gap-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-xl transition-all duration-200 border-0 bg-white shadow-lg hover:scale-[1.02]">
                <CardContent className="p-0">
                  {/* Header Bar */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#02006c' }}>
                          {appointment.id.slice(-2)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Appointment {appointment.id}</h4>
                          <p className="text-sm text-gray-600">National Eye Hospital, Colombo</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0">
                      {/* Doctor Information */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <User className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{appointment.doctor}</h3>
                          <p className="text-blue-600 font-medium mb-3">{appointment.specialty}</p>
                          
                          {/* Information Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 rounded bg-blue-600">
                                  <Calendar className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-blue-600 font-medium">Date</p>
                                  <p className="text-sm font-semibold text-blue-900">
                                    {new Date(appointment.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 rounded bg-green-600">
                                  <Clock className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-green-600 font-medium">Time</p>
                                  <p className="text-sm font-semibold text-green-900">{appointment.time}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 rounded bg-purple-600">
                                  <MapPin className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-purple-600 font-medium">Location</p>
                                  <p className="text-sm font-semibold text-purple-900">{appointment.location}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-orange-600">
                                  #{appointment.queueNumber}
                                </div>
                                <div>
                                  <p className="text-xs text-orange-600 font-medium">Queue</p>
                                  <p className="text-sm font-semibold text-orange-900">Position #{appointment.queueNumber}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-3 lg:ml-6">
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 text-gray-700 hover:bg-gray-50 font-medium"
                            style={{ borderColor: '#02006c' }}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            View QR Code
                          </Button>
                          <Button 
                            size="sm"
                            className="text-white font-medium hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#02006c' }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                        {appointment.status === 'upcoming' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Appointment
                          </Button>
                        )}
                        
                        {/* Additional Info Badge */}
                        {appointment.status === 'upcoming' && (
                          <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                            <p className="text-xs text-green-700 font-medium">Ready for check-in</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-12 text-center">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No {filterStatus !== 'all' ? filterStatus : ''} appointments found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {filterStatus === 'all' 
                    ? "Ready to take charge of your health? Schedule your first appointment with our expert medical team." 
                    : `You don't have any ${filterStatus} appointments at the moment.`}
                </p>
                <Button 
                  className="text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
                  style={{ backgroundColor: '#02006c' }}
                  onClick={() => window.location.href = '/patient/book-appointment'}
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Book Your {filterStatus === 'all' ? 'First' : 'Next'} Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}