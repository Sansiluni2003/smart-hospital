import { FaAward, FaBuilding, FaHeart } from "react-icons/fa"

const values = [
  {
    icon: FaAward,
    title: "Smart Technology",
    description:
      "Advanced queue management and appointment systems that reduce waiting times and improve patient satisfaction through intelligent scheduling.",
  },
  {
    icon: FaBuilding,
    title: "Modern Digital Experience",
    description:
      "Seamless digital platform with real-time updates, contactless check-in, and comprehensive patient portal for enhanced convenience.",
  },
  {
    icon: FaHeart,
    title: "Patient-Centered Care",
    description:
      "Every feature designed with patient comfort in mind - from booking to treatment, we prioritize your time and experience.",
  },
]

const stats = [
  { number: "70%", label: "Reduced Waiting Time" },
  { number: "50,000+", label: "Happy Patients" },
  { number: "24/7", label: "Online Booking" },
  { number: "95%", label: "Patient Satisfaction" },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About Us</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            National Eye Hospital Colombo leads Sri Lanka&apos;s digital healthcare transformation with innovative queue
            management and patient-first technology solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <value.icon size={32} color="#02006c" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-3xl font-bold mb-2" style={{ color: "#02006c" }}>
                {stat.number}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
