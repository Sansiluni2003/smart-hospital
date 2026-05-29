"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, 
  Edit2, Save, X, CheckCircle, AlertCircle
} from "lucide-react"

interface ProfileData {
  id: number
  username: string
  email: string
  role: string
  created_at: string
  patient_id: number
  opd_id: string
  full_name: string
  date_of_birth: string
  gender: string
  contact_number: string
  address: string
}

export default function PatientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editData, setEditData] = useState({
    full_name: '',
    contact_number: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role !== 'patient') {
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
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

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
          full_name: data.full_name || '',
          contact_number: data.contact_number || '',
          email: data.email || '',
          address: data.address || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/patients/${profile.patient_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setEditing(false)
        fetchProfile()
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        throw new Error(data.message || 'Failed to update profile')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: '#02006c' }}></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="border-0 shadow-md max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">Failed to load profile</p>
            <Button className="mt-4" onClick={fetchProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #02006c, #1a0066, #3300cc)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-blue-200 mt-1">OPD ID: {profile.opd_id}</p>
                <p className="text-blue-300 text-sm">@{profile.username}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-blue-200">Member Since</p>
              <p className="font-medium">
                {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
            {message.text}
          </div>
        )}

        {/* Personal Information */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" style={{ color: '#02006c' }} />
                Personal Information
              </CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: '#02006c' }}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditData({
                    full_name: profile.full_name, contact_number: profile.contact_number,
                    email: profile.email, address: profile.address
                  })}}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-1" /> Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#02006c' } as React.CSSProperties}
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{profile.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1" /> Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1" /> Contact Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={editData.contact_number}
                    onChange={(e) => setEditData({ ...editData, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.contact_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> Date of Birth
                </label>
                <p className="text-gray-900 font-medium">
                  {new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <p className="text-gray-900 font-medium capitalize">{profile.gender}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Shield className="h-4 w-4 mr-1" /> OPD ID
                </label>
                <p className="text-gray-900 font-medium font-mono">{profile.opd_id}</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> Address
                </label>
                {editing ? (
                  <textarea
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none resize-none h-20"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2" style={{ color: '#02006c' }} />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-gray-900 font-medium">@{profile.username}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-gray-900 font-medium">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Patient ID</label>
                <p className="text-gray-900 font-medium font-mono">{profile.opd_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
