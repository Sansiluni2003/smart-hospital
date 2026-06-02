"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Edit2, Save, X, CheckCircle, AlertCircle
} from "lucide-react"
import { authFetch } from "@/lib/authFetch"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export default function PatientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [editData, setEditData] = useState({ Name: "", Phone_No: "", Address: "", DateOfBirth: "" })

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) { router.push("/login"); return }
    const user = JSON.parse(userStr)
    if (user.Role !== "Patient") { router.push("/"); return }
    fetchProfile(user.Patient_ID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchProfile = async (patientId: number) => {
    setLoading(true)
    try {
      const res = await authFetch(`${apiUrl}/api/v1/patients/${patientId}`)
      if (res.status === 401) { router.push("/login"); return }
      if (!res.ok) throw new Error("Failed to load profile")
      const data = await res.json()
      setProfile(data)
      setEditData({ Name: data.Name || "", Phone_No: data.Phone_No || "", Address: data.Address || "", DateOfBirth: data.DateOfBirth || "" })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const res = await authFetch(`${apiUrl}/api/v1/patients/${profile.Patient_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).detail || "Failed to update profile")
      }
      const updated = await res.json()
      setProfile(updated)
      setMessage({ type: "success", text: "Profile updated successfully!" })
      setEditing(false)
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: "#02006c" }} />
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #02006c, #1a0066, #3300cc)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.Name}</h1>
                <p className="text-blue-200 mt-1">OPD ID: {profile.OPD_Id}</p>
                <p className="text-blue-300 text-sm">{profile.Email}</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-blue-200">Patient ID</p>
              <p className="font-medium text-lg">#{profile.Patient_ID}</p>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg flex items-center ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
            {message.text}
          </div>
        )}

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" style={{ color: "#02006c" }} /> Personal Information
              </CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: "#02006c" }}>
                    <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditData({ Name: profile.Name || "", Phone_No: profile.Phone_No || "", Address: profile.Address || "", DateOfBirth: profile.DateOfBirth || "" }) }}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><User className="h-4 w-4" /> Full Name</label>
                {editing ? (
                  <input type="text" value={editData.Name} onChange={(e) => setEditData({ ...editData, Name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{profile.Name}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><Mail className="h-4 w-4" /> Email</label>
                <p className="text-gray-900 font-medium">{profile.Email}</p>
                <p className="text-xs text-gray-400">Email cannot be changed here</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><Phone className="h-4 w-4" /> Phone Number</label>
                {editing ? (
                  <input type="tel" value={editData.Phone_No} onChange={(e) => setEditData({ ...editData, Phone_No: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.Phone_No || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><Calendar className="h-4 w-4" /> Date of Birth</label>
                {editing ? (
                  <input type="date" value={editData.DateOfBirth} onChange={(e) => setEditData({ ...editData, DateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.DateOfBirth ? new Date(profile.DateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1"><MapPin className="h-4 w-4" /> Address</label>
                {editing ? (
                  <input type="text" value={editData.Address} onChange={(e) => setEditData({ ...editData, Address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.Address || "—"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2" style={{ color: "#02006c" }} /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">OPD ID</p>
                <p className="text-gray-900 font-medium mt-1">{profile.OPD_Id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${profile.is_active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {profile.is_active ? "Active" : "Pending Activation"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Change Password</p>
                <Button variant="outline" size="sm" className="mt-1" onClick={() => router.push("/patient/settings")}>
                  Go to Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
