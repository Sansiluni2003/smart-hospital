"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Clock, CheckCircle, Trash2 } from "lucide-react"
import { authFetch } from "@/lib/authFetch"
import { useWebSocket } from "@/lib/useWebSocket" // 🌟 Import your custom WebSocket hook

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) { router.push("/login"); return }
    const user = JSON.parse(userStr)
    if (user.Role !== "Patient") { router.push("/"); return }
    fetchNotifications(user.Patient_ID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchNotifications = async (patientId: number) => {
    setLoading(true)
    try {
      const res = await authFetch(`${apiUrl}/api/v1/patients/${patientId}/notifications`)
      if (res.status === 401) { router.push("/login"); return }
      if (res.ok) setNotifications(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // 🌟 Listen to WebSocket messages and append newly received notifications in real-time
  useWebSocket(
    useCallback((evt) => {
      // Build a notification schema object matching the database payload
      const liveNotification = {
        Notification_ID: Date.now() + Math.random(), // Unique temporary key
        Message: evt.message,
        Sent_Time: new Date().toISOString(),
        isNew: true // Highlight flag for the popup animation
      };

      // Prepend to the notifications array so it appears at the top instantly
      setNotifications((prev) => [liveNotification, ...prev]);
    }, [])
  );

  const dismiss = (id: number) => setDismissed(prev => new Set(prev).add(id))

  const visible = notifications.filter((n: any) => !dismissed.has(n.Notification_ID))

  const formatTime = (ts: string | null) => {
    if (!ts) return ""
    try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }
    catch { return ts }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: "#02006c" }} />
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #02006c, #1a0066, #3300cc)" }}>
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 animate-pulse">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-blue-200 mt-1 font-medium">{visible.length} unread alerts</p>
            </div>
          </div>
          {visible.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDismissed(new Set(notifications.map((n: any) => n.Notification_ID)))}
              className="text-white border-white/40 hover:bg-white/10 transition-all font-semibold rounded-xl"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {visible.length === 0 ? (
        <Card className="border-0 shadow-md rounded-2xl bg-white">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">You'll receive notifications here when your appointment status changes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((n: any) => {
            const isNew = n.isNew;
            return (
              <Card 
                key={n.Notification_ID} 
                className={`border-0 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden rounded-xl ${
                  isNew 
                    ? "bg-blue-50/70 border-l-4 border-blue-500 animate-in slide-in-from-top-4 fade-in duration-500" 
                    : "bg-white"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Bouncing Bell icon for live items */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isNew ? 'bg-blue-100' : 'bg-blue-50'}`}>
                        <Bell className={`h-4 w-4 text-blue-600 ${isNew ? 'animate-bounce' : ''}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">
                            {n.Message}
                          </p>
                          {isNew && (
                            <span className="shrink-0 bg-blue-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 font-medium pt-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatTime(n.Sent_Time)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismiss(n.Notification_ID)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50/50 shrink-0 p-1.5 h-8 w-8 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
}
