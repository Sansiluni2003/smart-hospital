import { LoginForm } from "@/components/login/login-form"
import { Hospital, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header with back button */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Button>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#02006c" }}>
                <Hospital className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">National Eye Hospital</span>
                <div className="text-xs text-gray-500">Colombo</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main login content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <div className="w-full max-w-2xl mt-8 mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-2 rounded-full" style={{ backgroundColor: "#02006c" }}>
                  <Hospital className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2 text-sm">Sign in to access your patient portal</p>
            </div>
            
            <LoginForm />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/patient/register" className="font-medium hover:underline" style={{ color: "#02006c" }}>
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}