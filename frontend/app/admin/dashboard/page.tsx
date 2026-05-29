"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, LogOut, Shield } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "doctor",
    fullName: "",
    contactNumber: "",
    specialty: ""
  })
  const [message, setMessage] = useState({ type: "", text: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [adminName, setAdminName] = useState("")
  const [users, setUsers] = useState<{full_name: string; role: string; username: string; email: string}[]>([])

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.status === 401 || response.status === 422) {
        handleLogout()
        return
      }
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role !== 'admin') {
        router.push('/')
      } else {
        setAdminName(user.username)
        fetchUsers()
      }
    } else {
      router.push('/login')
    }
  }, [router, fetchUsers])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/admin/register-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.status === 401 || response.status === 422) {
        handleLogout()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || data.msg || 'Registration failed')
      }

      setMessage({ type: "success", text: data.message })
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "doctor",
        fullName: "",
        contactNumber: "",
        specialty: ""
      })
      fetchUsers()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Admin Portal</span>
                <div className="text-xs text-gray-500">System Management</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Welcome, Admin {adminName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Staff & Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Form */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-purple-700" />
                Register New Staff / Doctor
              </CardTitle>
            </CardHeader>
          <CardContent className="p-6">
            {message.text && (
              <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role *</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="staff">Clinic Staff</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange}
                    placeholder="e.g. Dr. John Smith"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Username *</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange}
                    placeholder="e.g. jsmith"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    placeholder="e.g. john@hospital.com"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Number *</label>
                  <input 
                    type="tel" 
                    name="contactNumber" 
                    value={formData.contactNumber} 
                    onChange={handleChange}
                    placeholder="e.g. 0771234567"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                {formData.role === 'doctor' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Specialty *</label>
                    <input 
                      type="text" 
                      name="specialty" 
                      value={formData.specialty} 
                      onChange={handleChange}
                      placeholder="e.g. Ophthalmology"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      required={formData.role === 'doctor'}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-medium"
                >
                  {isLoading ? 'Registering...' : `Register ${formData.role === 'doctor' ? 'Doctor' : 'Staff'} Account`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-700" />
              Registered Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{u.username}</td>
                        <td className="px-6 py-4 text-gray-700">{u.email}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No personnel found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
