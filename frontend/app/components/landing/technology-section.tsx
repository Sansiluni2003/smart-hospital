import { CheckCircle } from "lucide-react"

const features = [
  {
    title: "QR Code Check-in",
    description: "Contactless arrival confirmation using secure QR codes generated after appointment booking.",
  },
  {
    title: "Real-time Notifications",
    description: "Stay updated with SMS and alerts about appointments, queue status, and service availability.",
  },
  {
    title: "Digital Medical Records",
    description: "Secure, accessible digital storage of consultation notes, prescriptions, and medical history.",
  },
]

export function TechnologySection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Advanced Healthcare Technology</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Experience the future of healthcare management with our cutting-edge digital platform designed
              specifically for the National Eye Hospital.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img src="https://www.pickcel.com/blog/images/og/ways-to-use-qr-codes-on-digital-signage-fb.jpg" alt="Advanced medical technology" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}
