"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Clock, Info, CheckCircle, Trash2, CheckSquare } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning'
  read: boolean
}

interface AppointmentData {
  id: number
  doctor_name: string
  specialty: string
  appointment_date: string
  appointment_time: string
  status: string
  queue_number: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    fetchNotifications()
  }, [router])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/appointments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const staticNotifications: Notification[] = [
        {
          id: "welcome",
          title: "Welcome to Smart Hospital System",
          message: "Welcome to the National Eye Hospital queue management portal. You can book appointments, view your live queue position, and access your profile here.",
          time: "Just now",
          type: "info",
          read: false
        },
        {
          id: "general-camp",
          title: "Free Eye Checkup Camp",
          message: "National Eye Hospital Colombo is hosting a free community eye checkup campaign this Sunday from 8:00 AM to 2:00 PM at the main auditorium.",
          time: "2 hours ago",
          type: "info",
          read: false
        }
      ]

      if (response.ok) {
        const appointments: AppointmentData[] = await response.json()
        const todayStr = new Date().toISOString().split('T')[0]
        const todayApts = appointments.filter((a: AppointmentData) => a.appointment_date === todayStr && a.status === 'scheduled')
        
        todayApts.forEach((apt: AppointmentData) => {
          staticNotifications.unshift({
            id: `apt-today-${apt.id}`,
            title: "Appointment Reminder Today",
            message: `Reminder: You have an appointment today with Dr. ${apt.doctor_name} (${apt.specialty}) at ${apt.appointment_time}. Please ensure you arrive 15 minutes early and check in.`,
            time: "Today",
            type: "warning",
            read: false
          })
        })

        const completedApts = appointments.filter((a: AppointmentData) => a.status === 'completed')
        completedApts.forEach((apt: AppointmentData) => {
          staticNotifications.push({
            id: `apt-comp-${apt.id}`,
            title: "Consultation Completed",
            message: `Your consultation with Dr. ${apt.doctor_name} on ${apt.appointment_date} has been marked as completed. You can view your record in Medical History.`,
            time: "Past",
            type: "success",
            read: true
          })
        })
      }

      setNotifications(staticNotifications)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <Clock className="h-5 w-5 text-amber-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white'
    switch (type) {
      case 'success':
        return 'bg-green-50/40 border-l-4 border-green-500'
      case 'warning':
        return 'bg-amber-50/40 border-l-4 border-amber-500'
      default:
        return 'bg-blue-50/40 border-l-4 border-blue-500'
    }
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-gray-700" />
              Notifications
            </h2>
            <p className="text-sm text-gray-600 mt-1">Stay updated with appointments and hospital alerts</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#02006c' }}></div>
              <p className="text-gray-500">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card 
                key={n.id} 
                className={`border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 ${getBgColor(n.type, n.read)}`}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2 rounded-full bg-gray-100 flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-base font-bold text-gray-900 ${!n.read ? 'font-extrabold' : ''}`}>
                        {n.title}
                      </h4>
                      <span className="text-xs text-gray-500 font-medium">{n.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteNotification(n.id)}
                    className="text-gray-400 hover:text-red-600 rounded-full h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Notifications</h3>
              <p className="text-gray-600 mt-1">You are all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}