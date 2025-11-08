import { Facebook, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Section - Hospital Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">National Eye Hospital </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Advanced healthcare management platform providing seamless appointment booking, queue management, and digital medical records for better patient care.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Middle Section - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Patient Portal</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Book Appointment</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Queue Status</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Medical Records</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Made with Readdy</a></li>
            </ul>
          </div>

          {/* Right Section - Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>National Eye Hospital</p>
              <p>Colombo, Sri Lanka</p>
              <p>+94 11 269 4444</p>
              <p>info@eyehospital.lk</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 National Eye Hospital Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
  