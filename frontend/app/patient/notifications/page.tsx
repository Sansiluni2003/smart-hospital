"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Clock, CheckCircle, Trash2 } from "lucide-react"
import { authFetch } from "@/lib/authFetch"

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
    <div className="space-y-6 p-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #02006c, #1a0066, #3300cc)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-blue-200 mt-1">{visible.length} unread</p>
            </div>
          </div>
          {visible.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDismissed(new Set(notifications.map((n: any) => n.Notification_ID)))}
              className="text-white border-white/40 hover:bg-white/10"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-10 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You&apos;ll receive notifications here when your appointments are confirmed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((n: any) => (
            <Card key={n.Notification_ID} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{n.Message}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(n.Sent_Time)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(n.Notification_ID)}
                    className="text-gray-400 hover:text-red-500 shrink-0 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
