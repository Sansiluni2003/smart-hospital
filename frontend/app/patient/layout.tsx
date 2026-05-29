"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Calendar, 
  Clock, 
  FileText, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X,
  Hospital,
  Plus
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const navigationItems = [
  { id: 'overview', label: 'Dashboard', icon: Home, href: '/patient/dashboard' },
  { id: 'book-appointment', label: 'Book Appointment', icon: Plus, href: '/patient/book-appointment' },
  { id: 'appointments', label: 'My Appointments', icon: Calendar, href: '/patient/appointments' },
  { id: 'queue', label: 'Queue Status', icon: Clock, href: '/patient/queue' },
  { id: 'history', label: 'Medical History', icon: FileText, href: '/patient/history' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/patient/notifications' },
  { id: 'profile', label: 'My Profile', icon: User, href: '/patient/profile' },
  
]

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Pages that should not have the navigation layout
  const noLayoutPages = ['/patient/register', '/patient/login']
  const shouldShowLayout = !noLayoutPages.includes(pathname)

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => item.href === pathname)
    return currentItem?.label || 'Dashboard'
  }

  // If it's a no-layout page (register/login), render children without sidebar
  if (!shouldShowLayout) {
    return <>{children}</>
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
              <Hospital className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Patient Portal</span>
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
            <Link 
              href="/login"
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Link>
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
                <ThemeToggle />
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <Bell className="h-5 w-5 text-gray-500" />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
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
