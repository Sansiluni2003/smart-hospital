import { Button } from "@/components/ui/button"
import { Hospital } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#02006c" }}>
              <Hospital className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">National Eye Hospital</span>
              <div className="text-xs text-gray-500">Colombo</div>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </a>
            <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium">
              Services
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">
              About Us
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                Login
              </Button>
            </Link>
            <Link href="/patient/register">
              <Button className="text-white hover:opacity-90" style={{ backgroundColor: "#02006c" }}>
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
