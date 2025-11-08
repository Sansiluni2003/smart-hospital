import { Button } from "@/components/ui/button";
import { Calendar, Clock, QrCode } from "lucide-react";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight text-balance">
              Skip the Wait, <span style={{ color: "#02006c" }}>Book Smart</span>
            </h1>
            <p className="text-lg text-gray-600 mt-6 leading-relaxed">
              Experience hassle-free healthcare at National Eye Hospital Colombo. Our smart queue and appointment
              management system reduces waiting times and improves your patient experience with real-time updates and
              seamless booking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                className="px-6 py-3 text-base text-white hover:opacity-90"
                style={{ backgroundColor: "#02006c" }}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment Now
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 text-base hover:bg-blue-50 bg-transparent"
                style={{ borderColor: "#02006c", color: "#02006c" }}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Join Smart Queue
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#02006c" }} />
                <span>Reduce waiting time by 70%</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: "#02006c" }} />
                <span>24/7 online booking</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/smiling-doctor-K6obLNRvSmeAL3aj8tebOciHbjmrch.png" alt="Professional doctor" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}
