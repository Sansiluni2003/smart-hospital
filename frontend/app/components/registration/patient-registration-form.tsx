"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, User, Mail, Phone, MapPin, Calendar, Shield, IdCard } from "lucide-react"
import { saveProfile } from "@/lib/profileStorage"
import { useRouter } from "next/navigation"

interface FormData {
  fullName: string
  dateOfBirth: string
  gender: string
  contactNumber: string
  email: string
  opdId: string
  address: string
  username: string
  password: string
  confirmPassword: string
}

export function PatientRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    email: "",
    opdId: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: ""
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters"
    }
    
    // Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
    } else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 0 || age > 120) {
        newErrors.dateOfBirth = "Please enter a valid date of birth"
      }
    }
    
    // Gender validation
    if (!formData.gender) {
      newErrors.gender = "Gender selection is required"
    }
    
    // Contact Number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required"
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.contactNumber.replace(/\s/g, ""))) {
      newErrors.contactNumber = "Please enter a valid Sri Lankan phone number"
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    // OPD ID validation (unique and required)
    if (!formData.opdId.trim()) {
      newErrors.opdId = "OPD ID is required"
    } else if (formData.opdId.trim().length < 5) {
      newErrors.opdId = "OPD ID must be at least 5 characters"
    }
    
    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Residential address is required"
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Please provide a complete address"
    }
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores"
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
    
    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 800))
      console.log("Registration attempt:", formData)

      // Persist profile locally for demo (exclude password fields)
      const { confirmPassword: _cp, password: _pw, ...profile } = formData
      void _cp
      void _pw
      saveProfile(profile)

  // Navigate to patient profile page
  router.push('/patient/profile')
    } catch (error) {
      console.error("Registration failed:", error)
      alert("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
          Full Name *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <User className="h-4 w-4" />
          </div>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`block w-full pl-9 pr-3 py-2 border ${
              errors.fullName ? "border-red-300" : "border-gray-300"
            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>
        {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
      </div>

      {/* Date of Birth and Gender Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div className="space-y-1">
          <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
            Date of Birth *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={`block w-full pl-9 pr-3 py-2 border ${
                errors.dateOfBirth ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
              disabled={isLoading}
            />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-red-600">{errors.dateOfBirth}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-1">
          <label htmlFor="gender" className="text-sm font-medium text-gray-700">
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className={`block w-full px-3 py-2 border ${
              errors.gender ? "border-red-300" : "border-gray-300"
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
            disabled={isLoading}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
        </div>
      </div>

      {/* Contact Number and Email Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Number */}
        <div className="space-y-1">
          <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
            Contact Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Phone className="h-4 w-4" />
            </div>
            <input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className={`block w-full pl-9 pr-3 py-2 border ${
                errors.contactNumber ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
              placeholder="0771234567 or +94771234567"
              disabled={isLoading}
            />
          </div>
          {errors.contactNumber && <p className="text-xs text-red-600">{errors.contactNumber}</p>}
          <p className="text-xs text-gray-500">For SMS notifications</p>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full pl-9 pr-3 py-2 border ${
                errors.email ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          <p className="text-xs text-gray-500">For email notifications</p>
        </div>
      </div>

      {/* OPD ID */}
      <div className="space-y-1">
        <label htmlFor="opdId" className="text-sm font-medium text-gray-700">
          OPD ID * <span className="text-xs text-blue-600">(Unique identifier)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <IdCard className="h-4 w-4" />
          </div>
          <input
            id="opdId"
            name="opdId"
            type="text"
            value={formData.opdId}
            onChange={handleInputChange}
            className={`block w-full pl-9 pr-3 py-2 border ${
              errors.opdId ? "border-red-300" : "border-gray-300"
            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
            placeholder="Enter your OPD ID"
            disabled={isLoading}
          />
        </div>
        {errors.opdId && <p className="text-xs text-red-600">{errors.opdId}</p>}
        <p className="text-xs text-gray-500">This will be your unique patient identifier</p>
      </div>

      {/* Residential Address */}
      <div className="space-y-1">
        <label htmlFor="address" className="text-sm font-medium text-gray-700">
          Residential Address *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start pointer-events-none text-gray-400">
            <MapPin className="h-4 w-4" />
          </div>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address}
            onChange={handleInputChange}
            className={`block w-full pl-9 pr-3 py-2 border ${
              errors.address ? "border-red-300" : "border-gray-300"
            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none`}
            placeholder="Enter your complete residential address"
            disabled={isLoading}
          />
        </div>
        {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
      </div>

      {/* Username */}
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium text-gray-700">
          Username *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <User className="h-4 w-4" />
          </div>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            className={`block w-full pl-9 pr-3 py-2 border ${
              errors.username ? "border-red-300" : "border-gray-300"
            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
            placeholder="Choose a username"
            disabled={isLoading}
          />
        </div>
        {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
        <p className="text-xs text-gray-500">Letters, numbers, and underscores only</p>
      </div>

      {/* Password and Confirm Password Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Shield className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-9 pr-9 py-2 border ${
                errors.password ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
              placeholder="Create a strong password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Shield className="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`block w-full pl-9 pr-9 py-2 border ${
                errors.confirmPassword ? "border-red-300" : "border-gray-300"
              } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-3 py-2">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
          required
        />
        <label htmlFor="terms" className="text-sm text-gray-700 leading-5">
          I agree to the{" "}
          <button type="button" className="font-medium hover:underline" style={{ color: "#02006c" }}>
            Terms and Conditions
          </button>{" "}
          and{" "}
          <button type="button" className="font-medium hover:underline" style={{ color: "#02006c" }}>
            Privacy Policy
          </button>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        style={{ backgroundColor: "#02006c" }}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Account...
          </div>
        ) : (
          "Create Patient Account"
        )}
      </Button>
    </form>
  )
}