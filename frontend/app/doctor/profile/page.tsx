"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch } from "@/lib/authFetch"
import { User, Lock, Mail, Phone, Shield, Clock, CheckCircle, AlertCircle, Save } from "lucide-react"

interface DoctorProfile {
  Doctor_ID: number
  UserID: number
  Name: string
  Email: string
  Speciality: string
  Phone_No: string
  AverageConsultationMinutes?: number | null
  CreatedAt?: string | null
}

export default function DoctorSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    Name: '',
    Speciality: '',
    Phone_No: '',
    Email: '',
  })
  const [consultationMinutes, setConsultationMinutes] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const role = String(user?.Role || user?.role || '').toLowerCase()
      if (role !== 'doctor') {
        router.push('/')
        return
      }
    } else {
      router.push('/login')
      return
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchProfile = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/profile`)

      if (response.status === 401 || response.status === 422) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditData({
          Name: data.Name || '',
          Speciality: data.Speciality || '',
          Phone_No: data.Phone_No || '',
          Email: data.Email || '',
        })
        setConsultationMinutes(String(data.AverageConsultationMinutes || ''))
      }
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update profile')
      }
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.Name = updatedProfile.Name
        user.Email = updatedProfile.Email
        localStorage.setItem('user', JSON.stringify(user))
      }

      setMessage({ type: 'success', text: 'Profile changes saved successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update profile'
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setSaving(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CurrentPassword: passwordForm.currentPassword,
          NewPassword: passwordForm.newPassword,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update password')
      }
      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update password'
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: '#02006c' }}></div>
          <p className="text-gray-500">Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage doctor credentials, specialization and preferences</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" style={{ color: '#02006c' }} />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={editData.Name}
                    onChange={(e) => setEditData({ ...editData, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Specialty</label>
                  <input
                    type="text"
                    value={editData.Speciality}
                    onChange={(e) => setEditData({ ...editData, Speciality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={editData.Phone_No}
                    onChange={(e) => setEditData({ ...editData, Phone_No: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editData.Email}
                    onChange={(e) => setEditData({ ...editData, Email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Average Consultation Minutes
                  </label>
                  <p className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium">
                    {consultationMinutes || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-750 mb-2 block flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-gray-400" />
                    Account Created
                  </label>
                  <p className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm">
                    {profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="text-white mt-4" style={{ backgroundColor: '#02006c' }}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2" style={{ color: '#02006c' }} />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <Button type="submit" disabled={saving} className="text-white" style={{ backgroundColor: '#02006c' }}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
