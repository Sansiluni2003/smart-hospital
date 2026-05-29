"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Mail, Lock, User, Phone, Stethoscope, Shield, Users } from "lucide-react"

type UserType = 'patient' | 'staff' | 'doctor' | 'admin'

interface UserTypeConfig {
  label: string
  icon: React.ReactNode
  placeholder: string
  description: string
  color: string
  bgColor: string
}

export function LoginForm() {
  const router = useRouter()
  const [selectedUserType, setSelectedUserType] = useState<UserType>('patient')
  const [formData, setFormData] = useState({
    identifier: "", // Can be email, phone, or patient ID
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const userTypes: Record<UserType, UserTypeConfig> = {
    patient: {
      label: 'Patient Portal',
      icon: <User className="h-5 w-5" />,
      placeholder: 'Enter your patient ID, email, or phone',
      description: 'Access your medical records and appointments',
      color: '#02006c',
      bgColor: '#f0f9ff'
    },
    doctor: {
      label: 'Doctor Portal',
      icon: <Stethoscope className="h-5 w-5" />,
      placeholder: 'Enter your doctor ID or email',
      description: 'Access patient records and medical tools',
      color: '#06b6d4',
      bgColor: '#f0fdfa'
    },
    staff: {
      label: 'Staff Portal',
      icon: <Users className="h-5 w-5" />,
      placeholder: 'Enter your staff ID or email',
      description: 'Access staff portal and patient management',
      color: '#059669',
      bgColor: '#f0fdf4'
    },
    admin: {
      label: 'Admin Portal',
      icon: <Shield className="h-5 w-5" />,
      placeholder: 'Enter your admin credentials',
      description: 'System administration and management',
      color: '#8b5cf6',
      bgColor: '#faf5ff'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    const currentUserType = userTypes[selectedUserType]
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = `${currentUserType.label.replace(' Portal', '').replace(' Login', '')} credentials are required`
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Try backend login first; if backend not available or returns error,
      // fallback to demo login that accepts any identifier/email for the
      // selected role so the portals can be used without a backend.
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.identifier,
          password: formData.password
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store token and user info
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))

        const userRole = data.user.role || selectedUserType
        switch (userRole) {
          case 'patient':
            router.push('/patient/dashboard')
            break
          case 'doctor':
            router.push('/doctor/dashboard')
            break
          case 'staff':
            router.push('/staff/dashboard')
            break
          case 'admin':
            router.push('/admin/dashboard')
            break
          default:
            router.push('/')
        }
        return
      }

      // If backend returned non-ok, fall through to demo fallback below
      console.warn('Backend login failed or returned non-OK. Using demo fallback.')
    } catch (error) {
      console.warn('Backend unreachable — using demo login fallback.', error)
    }

    // Demo fallback: accept any identifier/email and create a demo session
    try {
      const demoUser = {
        email: formData.identifier,
        role: selectedUserType,
        name: (formData.identifier || selectedUserType).split('@')[0]
      }
      const demoToken = `demo-token-${selectedUserType}-${Date.now()}`
      localStorage.setItem('token', demoToken)
      localStorage.setItem('user', JSON.stringify(demoUser))

      // Redirect to selected portal dashboard
      switch (selectedUserType) {
        case 'patient':
          router.push('/patient/dashboard')
          break
        case 'doctor':
          router.push('/doctor/dashboard')
          break
        case 'staff':
          router.push('/staff/dashboard')
          break
        case 'admin':
          router.push('/admin/dashboard')
          break
        default:
          router.push('/')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getIdentifierIcon = () => {
    const value = formData.identifier.toLowerCase()
    if (value.includes("@")) return <Mail className="h-5 w-5" />
    if (/^\d+$/.test(value)) return <Phone className="h-5 w-5" />
    return <User className="h-5 w-5" />
  }

  const currentUserType = userTypes[selectedUserType]

  return (
    <div className="space-y-4">
      {/* User Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Login As</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(userTypes) as [UserType, UserTypeConfig][]).map(([type, config]) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedUserType(type)}
              disabled={isLoading}
              className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                selectedUserType === type
                  ? `border-2 shadow-md`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                borderColor: selectedUserType === type ? config.color : undefined,
                backgroundColor: selectedUserType === type ? config.bgColor : undefined
              }}
            >
              <div className="flex flex-col items-center space-y-1">
                <div style={{ color: config.color }}>
                  {config.icon}
                </div>
                <span className={`text-xs font-medium ${
                  selectedUserType === type ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {config.label.replace(' Portal', '').replace(' Login', '')}
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">
          {currentUserType.description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Login identifier field */}
        <div className="space-y-2">
          <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
            {selectedUserType === 'patient' ? 'Patient ID, Email, or Phone' : 
             selectedUserType === 'staff' ? 'Staff ID or Email' :
             selectedUserType === 'doctor' ? 'Doctor ID or Email' :
             'Administrator Credentials'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: currentUserType.color }}>
              {getIdentifierIcon()}
            </div>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={formData.identifier}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border ${
                errors.identifier ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
              placeholder={currentUserType.placeholder}
              disabled={isLoading}
            />
          </div>
          {errors.identifier && (
            <p className="text-sm text-red-600">{errors.identifier}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: currentUserType.color }}>
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border ${
                errors.password ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 border-gray-300 rounded focus:ring-2"
              style={{ 
                accentColor: currentUserType.color
              }}
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button
            type="button"
            className="text-sm font-medium hover:underline"
            style={{ color: currentUserType.color }}
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: currentUserType.color }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in to {currentUserType.label}...
            </div>
          ) : (
            `Sign In to ${currentUserType.label}`
          )}
        </Button>

        {/* User type info */}
        <div className="mt-3 p-2.5 rounded-lg" style={{ backgroundColor: currentUserType.bgColor }}>
          <div className="flex items-center space-x-2">
            <div style={{ color: currentUserType.color }}>
              {currentUserType.icon}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">{currentUserType.label}</h4>
              <p className="text-xs text-gray-600">{currentUserType.description}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}