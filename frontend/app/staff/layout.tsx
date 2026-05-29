"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  QrCode,
  ListChecks,
  MessageSquareText,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  UserCheck,
} from "lucide-react"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/staff/dashboard" },
  { id: "availability", label: "Doctors Availability", icon: CalendarDays, href: "/staff/availability" },
  { id: "appointments", label: "Patient Appointments", icon: ClipboardList, href: "/staff/appointments" },
  { id: "allocation", label: "Queue Allocation", icon: ListChecks, href: "/staff/allocation" },
  { id: "checkin", label: "QR Check-in", icon: QrCode, href: "/staff/checkin" },
  { id: "live-queue", label: "Live Queue", icon: UserCheck, href: "/staff/live-queue" },
  { id: "sms", label: "SMS Center", icon: MessageSquareText, href: "/staff/sms" },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [staffName, setStaffName] = useState("Staff")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    if (user.role !== "staff") {
      router.push("/")
      return
    }

    setStaffName(user.full_name || user.username || user.email || "Staff")
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.href === pathname)
    return currentItem?.label || "Staff Operations"
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white shadow-2xl transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-400/15 text-emerald-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-none">Clinic Staff Portal</p>
              <p className="text-xs text-slate-400 mt-1">Reception & Queue Management</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Signed in as</p>
          <p className="mt-2 text-base font-medium text-white">{staffName}</p>
        </div>

        <nav className="px-4 py-5 space-y-1 overflow-y-auto h-[calc(100vh-13rem)]">
          {navigationItems.map((item) => {
            const IconComponent = item.icon
            const isActive = pathname === item.href || (item.href.startsWith("/staff/dashboard") && pathname === "/staff/dashboard")

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors text-left"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-lg p-2 hover:bg-slate-100">
                <Menu className="h-6 w-6 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{getCurrentPageTitle()}</h1>
                <p className="text-xs text-slate-500">Allocate appointments, manage queue flow, and coordinate arrivals</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2 hover:bg-slate-100 text-slate-500">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                <UserCheck className="h-4 w-4" />
                <span>{staffName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}