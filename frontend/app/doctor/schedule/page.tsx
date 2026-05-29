"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  status: 'confirmed' | 'pending' | 'completed'
}

export default function DoctorSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [newSlot, setNewSlot] = useState({
    day: '',
    startTime: '',
    endTime: '',
    maxPatients: 10
  })

  // Mock weekly availability
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([
    { id: '1', day: 'Monday', startTime: '09:00', endTime: '12:00', maxPatients: 12, status: 'available' },
    { id: '2', day: 'Monday', startTime: '14:00', endTime: '17:00', maxPatients: 10, status: 'available' },
    { id: '3', day: 'Wednesday', startTime: '09:00', endTime: '12:00', maxPatients: 12, status: 'available' },
    { id: '4', day: 'Wednesday', startTime: '14:00', endTime: '16:00', maxPatients: 8, status: 'available' },
    { id: '5', day: 'Friday', startTime: '09:00', endTime: '13:00', maxPatients: 15, status: 'available' },
  ])

  // Mock appointments for the week
  const weekAppointments: { [key: string]: Appointment[] } = {
    'Monday': [
      { id: '1', patientName: 'John Doe', time: '09:30', type: 'Follow-up', status: 'confirmed' },
      { id: '2', patientName: 'Jane Smith', time: '10:00', type: 'New', status: 'confirmed' },
      { id: '3', patientName: 'Robert Johnson', time: '14:30', type: 'Regular', status: 'pending' },
    ],
    'Wednesday': [
      { id: '4', patientName: 'Emily Davis', time: '09:00', type: 'Follow-up', status: 'confirmed' },
      { id: '5', patientName: 'Michael Brown', time: '10:30', type: 'New', status: 'confirmed' },
    ],
    'Friday': [
      { id: '6', patientName: 'Sarah Wilson', time: '09:30', type: 'Regular', status: 'confirmed' },
      { id: '7', patientName: 'David Lee', time: '11:00', type: 'Follow-up', status: 'pending' },
    ]
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const getWeekDates = () => {
    const curr = new Date(currentWeek)
    const first = curr.getDate() - curr.getDay() + 1
    return daysOfWeek.map((day, index) => {
      const date = new Date(curr.setDate(first + index))
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
    if (newSlot.day && newSlot.startTime && newSlot.endTime) {
      const slot: TimeSlot = {
        id: Date.now().toString(),
        day: newSlot.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        maxPatients: newSlot.maxPatients,
        status: 'available'
      }
      setWeeklySchedule([...weeklySchedule, slot])
      setNewSlot({ day: '', startTime: '', endTime: '', maxPatients: 10 })
      setShowAddSlot(false)
    }
  }

  const handleDeleteSlot = (id: string) => {
    setWeeklySchedule(weeklySchedule.filter(slot => slot.id !== id))
  }

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot)
  }

  const handleSaveEdit = () => {
    if (editingSlot) {
      setWeeklySchedule(weeklySchedule.map(slot => 
        slot.id === editingSlot.id ? editingSlot : slot
      ))
      setEditingSlot(null)
    }
  }

  const getSlotsForDay = (day: string) => {
    return weeklySchedule.filter(slot => slot.day === day).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    )
  }

  const getAppointmentsForDay = (day: string) => {
    return weekAppointments[day] || []
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
            <Button variant="outline" size="sm">
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Day</label>
                  <select
                    value={editingSlot ? editingSlot.day : newSlot.day}
                    onChange={(e) => editingSlot 
                      ? setEditingSlot({...editingSlot, day: e.target.value})
                      : setNewSlot({...newSlot, day: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
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
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingSlot ? 'Save Changes' : 'Add Slot'}
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
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {weekDates.map((dayInfo, index) => {
            const slots = getSlotsForDay(dayInfo.day)
            const appointments = getAppointmentsForDay(dayInfo.day)
            const isToday = dayInfo.fullDate.toDateString() === new Date().toDateString()
            
            return (
              <Card 
                key={index} 
                className={`border-0 shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''}`}
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
                                  : apt.status === 'pending'
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
                    {Object.values(weekAppointments).flat().length}
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
