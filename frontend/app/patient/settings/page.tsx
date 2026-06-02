"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Bell, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Laptop } from "lucide-react"
import { authFetch } from "@/lib/authFetch"

export default function SettingsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [notifPrefs, setNotifPrefs] = useState({
    appointments: true,
    queue: true,
    general: false
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
    }
  }, [router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: "", text: "" })

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setIsLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" })
      setIsLoading(false)
      return
    }

    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/v1/patients/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CurrentPassword: formData.currentPassword, NewPassword: formData.newPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).detail || "Failed to update password")
      }
      setMessage({ type: "success", text: "Password updated successfully!" })
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to update password"
      setMessage({ type: "error", text: errMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotifToggle = (key: keyof typeof notifPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your account settings, password, and system preferences</p>
        </div>

        {/* Theme Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Laptop className="h-5 w-5 mr-2 text-blue-700" />
              Theme Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Display Theme</p>
                <p className="text-sm text-gray-600">Toggle between Light, Dark, or System mode</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Preferences */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-700" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <p className="font-semibold text-gray-900">Appointment Updates</p>
                <p className="text-sm text-gray-600">Get notified when appointment is booked, rescheduled, or cancelled</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.appointments}
                onChange={() => handleNotifToggle('appointments')}
                className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900 accent-[#02006c]" 
              />
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <p className="font-semibold text-gray-900">Queue Approaching Alerts</p>
                <p className="text-sm text-gray-600">Receive alerts when you are next or when there are 2 patients ahead</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.queue}
                onChange={() => handleNotifToggle('queue')}
                className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900 accent-[#02006c]" 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">General Announcements</p>
                <p className="text-sm text-gray-600">Receive alerts about hospital programs, camps, and general health tips</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.general}
                onChange={() => handleNotifToggle('general')}
                className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900 accent-[#02006c]" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-blue-700" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {message.text && (
              <div className={`p-4 mb-4 rounded-lg flex items-center ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full md:w-auto text-white px-6 font-semibold"
                style={{ backgroundColor: '#02006c' }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}