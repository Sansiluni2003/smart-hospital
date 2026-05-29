import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Bell, QrCode, Headphones, ArrowRight, CheckCircle, FileText, Users } from "lucide-react"

const services = [
  {
    icon: Users,
    title: "Smart Queue Management",
    description:
      "Our intelligent queue system reduces your waiting time by up to 70%. Get real-time updates on your position and estimated wait time through SMS notifications.",
     color: "#02006c",
    bgColor: "bg-blue-50",
    ctaText: "Join Smart Queue",
    popular: true,
  },
  {
    icon: Calendar,
    title: "Easy Online Booking",
    description:
      "Book your eye care appointments 24/7 from anywhere. Choose your preferred doctor, date, and time slot in just a few clicks with instant confirmation.",
     color: "#02006c",
    bgColor: "bg-teal-50",
    ctaText: "Book Now",
    popular: false,
  },
  {
    icon: QrCode,
    title: "Contactless Check-in",
    description:
      "Simply scan your QR code when you arrive. No paperwork, no waiting in registration lines. Quick, safe, and completely paperless registration process.",
     color: "#02006c",
    bgColor: "bg-emerald-50",
    ctaText: "Learn More",
    popular: false,
  },
  {
    icon: Bell,
    title: "Live Notifications",
    description:
      "Stay informed with real-time updates about your appointment. Get notified via SMS and email when it's time to head to the hospital with progress alerts.",
     color: "#02006c",
    bgColor: "bg-purple-50",
    ctaText: "Enable Alerts",
    popular: false,
  },
  {
    icon: FileText,
    title: "Secure Digital Records",
    description:
      "Access your medical records, prescriptions, and test results securely online. Your complete health information is always at your fingertips with cloud storage.",
     color: "#02006c",
    bgColor: "bg-orange-50",
    ctaText: "View Records",
    popular: false,
  },
  {
    icon: Headphones,
    title: "24/7 Patient Support",
    description:
      "Get help when you need it most. Our multilingual patient support team is available around the clock to assist with bookings, technical issues, and inquiries.",
     color: "#02006c",
    bgColor: "bg-pink-50",
    ctaText: "Get Help",
    popular: false,
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full mb-6 shadow-lg">
            <svg
              className="w-10 h-10"
               style={{ color: "#02006c" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">Smart Healthcare Services</h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            Experience the future of healthcare with our innovative digital platform designed to make your visit faster,
            easier, and more comfortable than ever before.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Trusted by 50,000+ patients</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Average 70% time savings</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
               className={`bg-white hover:shadow-2xl transition-all duration-500 border-0 shadow-md group hover:-translate-y-2 relative overflow-hidden h-full flex flex-col rounded-2xl ${
                 service.popular ? "shadow-xl scale-105" : ""
               }`}
               style={service.popular ? { "--tw-ring-color": "#02006c" + "30" } as React.CSSProperties : {}}
            >
              {service.popular && (
                <div
                  className="absolute top-4 right-4 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg"
                  style={{ backgroundColor: "#02006c" }}
                >
                  Most Popular
                </div>
              )}

               <CardContent className="p-8 pt-12 flex-1 flex flex-col text-center">
                 <div className="flex justify-center mb-6 -mt-8">
                   <div
                     className={`w-20 h-20 rounded-2xl ${service.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                   >
                     <service.icon className="w-10 h-10" style={{ color: service.color }} />
                   </div>
                 </div>

                 <h3 className="text-2xl font-bold text-gray-900 mb-4 transition-colors group-hover:text-[#02006c]">
                  {service.title}
                </h3>

                <p className="text-gray-600 mb-8 leading-relaxed text-base flex-grow">{service.description}</p>

                <Button
                  className="w-full transition-all duration-300 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105"
                  style={{ backgroundColor: service.color }}
                >
                  {service.ctaText}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-3xl p-10 shadow-xl max-w-3xl mx-auto border border-blue-100">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Experience Better Healthcare?</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied patients who have already made the switch to our smart healthcare system and
              saved hours of waiting time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-white hover:opacity-90 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                 style={{ backgroundColor: "#02006c" }}
              >
                Book Your First Appointment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-semibold px-8 py-4 rounded-xl border-2 hover:bg-blue-50 transition-all bg-transparent"
                 style={{ borderColor: "#02006c" + "30" }}
              >
                 <span style={{ color: "#02006c" }}>Watch Demo Video</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
