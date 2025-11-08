import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Stethoscope, Users, Settings } from "lucide-react"

const portals = [
  {
    icon: User,
    title: "Patient Portal",
    description: "Book appointments, join smart queue, and track your healthcare journey.",
    buttonText: "Patient Login",
    color: "#02006c",
    bgColor: "bg-blue-50",
  },
  {
    icon: Stethoscope,
    title: "Doctor Portal",
    description: "Manage appointments, view queue status, and patient consultations.",
    buttonText: "Doctor Login",
    color: "#0891b2",
    bgColor: "bg-cyan-50",
  },
  {
    icon: Users,
    title: "Staff Portal",
    description: "Verify patients, manage hospital queues, and coordinate care.",
    buttonText: "Staff Login",
    color: "#059669",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Settings,
    title: "Admin Portal",
    description: "Manage system users, queue settings, and generate reports.",
    buttonText: "Admin Login",
    color: "#7c3aed",
    bgColor: "bg-violet-50",
  },
]

export function PortalSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Access Your Smart Healthcare Portal</h2>
          <p className="text-lg text-gray-600">
            Choose your role to access the appropriate dashboard and manage your healthcare experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {portals.map((portal, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div
                  className={`w-16 h-16 rounded-full ${portal.bgColor} flex items-center justify-center mx-auto mb-4`}
                >
                  <portal.icon className="w-8 h-8" style={{ color: portal.color }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{portal.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{portal.description}</p>
                <Button className="w-full text-white hover:opacity-90 mt-auto" style={{ backgroundColor: portal.color }}>
                  {portal.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
