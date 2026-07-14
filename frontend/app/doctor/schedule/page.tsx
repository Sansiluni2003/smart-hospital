"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch } from "@/lib/authFetch"
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download
} from "lucide-react"

interface TimeSlot {
  id: string
  day: string
  availableDate: string
  startTime: string
  endTime: string
  maxPatients: number
  status: 'available' | 'booked' | 'unavailable'
}

interface Appointment {
  id: string
  patientName: string
  time: string
  type: string
  status: string
  date: string
}

export default function DoctorSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    maxPatients: 10
  })
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([])
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    fetchWeekData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek])

  const getWeekBounds = (sourceDate: Date) => {
    const start = new Date(sourceDate)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const toDateOnly = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const fetchWeekData = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const doctorId = user?.Doctor_ID || user?.doctor_id
      const { start, end } = getWeekBounds(currentWeek)

      const [scheduleResponse, appointmentsResponse] = await Promise.all([
        authFetch(`${apiUrl}/api/v1/doctors/doctor/me/schedule?start_date=${toDateOnly(start)}&end_date=${toDateOnly(end)}`),
        authFetch(`${apiUrl}/api/v1/appointments/`),
      ])

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json()
        setWeeklySchedule(scheduleData.map((slot: { ScheduleID: number; AvailableDate: string; StartTime: string; EndTime: string; Status: string; max_patients: number }) => ({
          id: String(slot.ScheduleID),
          day: new Date(slot.AvailableDate).toLocaleDateString('en-US', { weekday: 'long' }),
          availableDate: slot.AvailableDate,
          startTime: String(slot.StartTime).slice(0, 5),
          endTime: String(slot.EndTime).slice(0, 5),
          maxPatients: slot.max_patients || 10,
          status: String(slot.Status || 'available').toLowerCase() === 'available' ? 'available' : 'unavailable',
        })))
      }

      if (appointmentsResponse.ok) {
        const appointmentData = await appointmentsResponse.json()
        const filteredAppointments = appointmentData
          .filter((item: { Doctor_ID?: number; DoctorID?: number; AppointmentDate?: string }) => (item.Doctor_ID || item.DoctorID) === doctorId)
          .filter((item: { AppointmentDate?: string }) => {
            if (!item.AppointmentDate) return false
            const appointmentDate = new Date(item.AppointmentDate)
            return appointmentDate >= start && appointmentDate <= end
          })
          .map((item: { Appointment_ID: number; AppointmentDate?: string; AppointmentTime?: string; PatientName?: string; patient_name?: string; Patient_ID?: number; Status?: string; Notes?: string | null }) => ({
            id: String(item.Appointment_ID),
            patientName: item.PatientName || item.patient_name || `Patient #${item.Patient_ID || item.Appointment_ID}`,
            time: String(item.AppointmentTime || '00:00').slice(0, 5),
            type: item.Notes || 'Appointment',
            status: String(item.Status || 'scheduled').toLowerCase(),
            date: item.AppointmentDate || '',
          }))
        setWeekAppointments(filteredAppointments)
      }
    } catch (error) {
      console.error('Failed to fetch doctor schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDates = () => {
    const { start } = getWeekBounds(currentWeek)
    return daysOfWeek.map((day, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return {
        day,
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date
      }
    })
  }

  const weekDates = getWeekDates()

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const handleAddSlot = () => {
    void saveNewSlot()
  }

  const saveNewSlot = async () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) return
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AvailableDate: newSlot.date,
          StartTime: newSlot.startTime,
          EndTime: newSlot.endTime,
          max_patients: newSlot.maxPatients,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create schedule slot')
      }

      setNewSlot({ date: '', startTime: '', endTime: '', maxPatients: 10 })
      setShowAddSlot(false)
      fetchWeekData()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/schedule/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete schedule slot')
      }
      fetchWeekData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot)
  }

  const handleSaveEdit = async () => {
    if (editingSlot) {
      setSaving(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
        const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/schedule/${editingSlot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            AvailableDate: editingSlot.availableDate,
            StartTime: editingSlot.startTime,
            EndTime: editingSlot.endTime,
            max_patients: editingSlot.maxPatients,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to update schedule slot')
        }
        setEditingSlot(null)
        fetchWeekData()
      } catch (error) {
        console.error(error)
      } finally {
        setSaving(false)
      }
    }
  }

  const getSlotsForDay = (dayDate: Date) => {
    const dayKey = toDateOnly(dayDate)
    return weeklySchedule.filter(slot => slot.availableDate === dayKey).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    )
  }

  const getAppointmentsForDay = (dayDate: Date) => {
    const dayKey = toDateOnly(dayDate)
    return weekAppointments.filter((appointment) => appointment.date === dayKey)
  }

  const handleExport = () => {
    const data = JSON.stringify({ weeklySchedule, weekAppointments }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `doctor-schedule-${toDateOnly(new Date())}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your availability and view appointments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              className="text-white"
              style={{ backgroundColor: '#02006c' }}
              onClick={() => setShowAddSlot(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </div>

        {/* Add/Edit Time Slot Modal */}
        {(showAddSlot || editingSlot) && (
          <Card className="border-2" style={{ borderColor: '#02006c' }}>
            <CardHeader className="bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAddSlot(false)
                    setEditingSlot(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={editingSlot ? editingSlot.availableDate : newSlot.date}
                    onChange={(e) => editingSlot
                      ? setEditingSlot({...editingSlot, availableDate: e.target.value, day: new Date(e.target.value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })})
                      : setNewSlot({...newSlot, date: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Patients</label>
                  <input
                    type="number"
                    value={editingSlot ? editingSlot.maxPatients : newSlot.maxPatients}
                    onChange={(e) => editingSlot
                      ? setEditingSlot({...editingSlot, maxPatients: parseInt(e.target.value)})
                      : setNewSlot({...newSlot, maxPatients: parseInt(e.target.value)})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</label>
                  <input
                    type="time"
                    value={editingSlot ? editingSlot.startTime : newSlot.startTime}
                    onChange={(e) => editingSlot
                      ? setEditingSlot({...editingSlot, startTime: e.target.value})
                      : setNewSlot({...newSlot, startTime: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">End Time</label>
                  <input
                    type="time"
                    value={editingSlot ? editingSlot.endTime : newSlot.endTime}
                    onChange={(e) => editingSlot
                      ? setEditingSlot({...editingSlot, endTime: e.target.value})
                      : setNewSlot({...newSlot, endTime: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  className="flex-1 text-white"
                  style={{ backgroundColor: '#02006c' }}
                  onClick={editingSlot ? handleSaveEdit : handleAddSlot}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : editingSlot ? 'Save Changes' : 'Add Slot'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowAddSlot(false)
                    setEditingSlot(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Navigation */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900">
                  {weekDates[0].month} {weekDates[0].date} - {weekDates[6].month} {weekDates[6].date}, {currentWeek.getFullYear()}
                </h2>
                <p className="text-sm text-gray-600">Weekly Schedule</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar View */}
        {loading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#02006c' }}></div>
              <p className="text-gray-500">Loading schedule...</p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {weekDates.map((dayInfo, index) => {
            const slots = getSlotsForDay(dayInfo.fullDate)
            const appointments = getAppointmentsForDay(dayInfo.fullDate)
            const isToday = dayInfo.fullDate.toDateString() === new Date().toDateString()
            
            return (
              <Card 
                key={index} 
                className={`border-0 shadow-md cursor-pointer ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => {
                  setNewSlot({ date: toDateOnly(dayInfo.fullDate), startTime: '', endTime: '', maxPatients: 10 })
                  setEditingSlot(null)
                  setShowAddSlot(true)
                }}
              >
                <CardHeader className={`p-4 text-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'} border-b`}>
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                      {dayInfo.day}
                    </p>
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {dayInfo.date}
                    </div>
                    <p className="text-xs text-gray-500">{dayInfo.month}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {slots.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No slots</p>
                    </div>
                  ) : (
                    <>
                      {/* Available Time Slots */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Available Slots
                        </p>
                        {slots.map(slot => (
                          <div 
                            key={slot.id}
                            className="bg-green-50 border border-green-200 p-2 rounded text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-green-900">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditSlot(slot)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-green-700">Max: {slot.maxPatients} patients</p>
                          </div>
                        ))}
                      </div>

                      {/* Appointments */}
                      {appointments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700">Appointments</p>
                          {appointments.map(apt => (
                            <div 
                              key={apt.id}
                              className={`p-2 rounded text-xs border ${
                                apt.status === 'confirmed' 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : apt.status === 'pending' || apt.status === 'allocated'
                                  ? 'bg-orange-50 border-orange-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <p className="font-semibold text-gray-900">{apt.time}</p>
                              <p className="text-gray-700">{apt.patientName}</p>
                              <p className="text-gray-600 text-[10px]">{apt.type}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Slots</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{weeklySchedule.length}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Clock className="h-6 w-6" style={{ color: '#02006c' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {weekAppointments.length}
                  </p>
                  <p className="text-xs text-gray-600">Appointments</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Max Capacity</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {weeklySchedule.reduce((sum, slot) => sum + slot.maxPatients, 0)}
                  </p>
                  <p className="text-xs text-gray-600">Patients/week</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {weeklySchedule.filter(s => s.status === 'available').length}
                  </p>
                  <p className="text-xs text-gray-600">Active slots</p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
