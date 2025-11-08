"use client"

import { useEffect, useState } from 'react'
import { getProfile, saveProfile, PatientProfile } from '@/lib/profileStorage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, IdCard, Mail, MapPin, Phone, User, Edit2, X, Check } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<PatientProfile | null>(null)

  useEffect(() => {
    let loadedProfile = getProfile()
    
    // If no profile exists, create a demo profile for testing
    if (!loadedProfile) {
      loadedProfile = {
        fullName: "John Doe",
        dateOfBirth: "1990-01-15",
        gender: "male",
        contactNumber: "0771234567",
        email: "johndoe@example.com",
        opdId: "OPD2024001",
        address: "123 Main Street, Colombo 07, Sri Lanka",
        username: "johndoe",
        createdAt: new Date().toISOString()
      }
      saveProfile(loadedProfile)
    }
    
    setProfile(loadedProfile)
    setEditForm(loadedProfile)
  }, [])

  const handleEdit = () => {
    setEditForm({ ...profile! })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditForm({ ...profile! })
    setIsEditing(false)
  }

  const handleSave = () => {
    if (editForm) {
      saveProfile(editForm)
      setProfile(editForm)
      setIsEditing(false)
    }
  }

  const handleInputChange = (field: keyof PatientProfile, value: string) => {
    setEditForm(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Unable to load profile data. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        {!isEditing ? (
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} style={{ backgroundColor: "#02006c" }} className="text-white">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <User className="h-3 w-3 mr-1" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm?.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.fullName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm?.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.dateOfBirth}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <User className="h-3 w-3 mr-1" />
                Gender
              </label>
              {isEditing ? (
                <select
                  value={editForm?.gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 capitalize">{profile.gender}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <IdCard className="h-3 w-3 mr-1" />
                OPD ID
              </label>
              <p className="text-sm text-gray-900 font-mono">{profile.opdId}</p>
              {isEditing && <p className="text-xs text-gray-500">Cannot be changed</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm?.contactNumber || ''}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0771234567 or +94771234567"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.contactNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.email}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Residential Address
              </label>
              {isEditing ? (
                <textarea
                  value={editForm?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter your complete residential address"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.address}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 flex items-center">
              <User className="h-3 w-3 mr-1" />
              Username
            </label>
            <p className="text-sm text-gray-900">{profile.username}</p>
            {isEditing && <p className="text-xs text-gray-500">Username cannot be changed</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
