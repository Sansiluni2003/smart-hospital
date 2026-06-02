"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Home, 
  Clock, 
  Calendar, 
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Activity,
  Bell
} from "lucide-react"
import RealtimeNotifications from "@/components/RealtimeNotifications"

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/doctor/dashboard' },
  { id: 'queue', label: 'Patient Queue', icon: Clock, href: '/doctor/queue' },
  { id: 'consultation', label: 'Consultation', icon: Stethoscope, href: '/doctor/consultation' },
  { id: 'schedule', label: 'My Schedule', icon: Calendar, href: '/doctor/schedule' },
  { id: 'profile', label: 'My Profile', icon: Settings, href: '/doctor/profile' },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctorName, setDoctorName] = useState("Doctor")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const role = String(user?.Role || user?.role || '').toLowerCase()
      if (role !== 'doctor') {
        router.push('/')
        return
      }
      setDoctorName(user.Name || user.full_name || user.username || user.Email || user.email || "Doctor")
    } else {
      router.push('/login')
    }
  }, [router])

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => item.href === pathname)
    return currentItem?.label || 'Dashboard'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-lg" style={{ backgroundColor: "#02006c" }}>
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Doctor Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: "#02006c" } : {}}
                >
                  <IconComponent className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  {getCurrentPageTitle()}
                </h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100 relative">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <Activity className="h-4 w-4" style={{ color: "#02006c" }} />
                  <span className="text-sm font-medium text-gray-900">{doctorName}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <RealtimeNotifications />
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
