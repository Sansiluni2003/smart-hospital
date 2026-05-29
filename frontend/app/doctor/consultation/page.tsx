"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Stethoscope, User, FileText, CheckCircle, 
  AlertCircle, Pill, MessageSquare, Save, History
} from "lucide-react"

interface ActiveConsultation {
  queue_id: number
  appointment_id: number
  queue_number: number
  patient_name: string
  age: number
  gender: string
  chiefComplaint: string
  contact: string
}

export default function DoctorConsultationPage() {
  const router = useRouter()
  const [activePatient, setActivePatient] = useState<ActiveConsultation | null>(null)
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    medications: "",
    notes: ""
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'doctor') {
      router.push('/')
      return
    }
    fetchActivePatient()
  }, [router])

  const fetchActivePatient = async () => {
    try {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      
      const user = JSON.parse(userStr)
      const doctorId = user.doctor_id || 1

      const response = await fetch(`http://localhost:5000/api/queue/live/${doctorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const consulting = data.find((p: { status: string }) => p.status === 'in-consultation')
        
        if (consulting) {
          // Add extra mock details for presentation
          setActivePatient({
            queue_id: consulting.queue_id,
            appointment_id: consulting.appointment_id,
            queue_number: consulting.queue_number,
            patient_name: consulting.patient_name,
            age: 20 + (consulting.queue_id % 50),
            gender: consulting.queue_id % 2 === 0 ? "Male" : "Female",
            chiefComplaint: "Blurry vision, sensitivity to light, and eye fatigue after screen time.",
            contact: `+94 77 ${1000000 + (consulting.queue_id * 12345) % 9000000}`
          })
        } else {
          setActivePatient(null)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient) return
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      // In a full EHR integration, we'd POST the prescription to /api/prescriptions or update appointment notes
      // We will simulate saving and complete the queue entry status
      const token = localStorage.getItem('token')
      
      // Update queue status to completed
      const response = await fetch(`http://localhost:5000/api/queue/${activePatient.queue_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Prescription saved and consultation marked as completed!" })
        setPrescription({ diagnosis: "", medications: "", notes: "" })
        setTimeout(() => {
          setMessage({ type: "", text: "" })
          fetchActivePatient()
        }, 2000)
      } else {
        const err = await response.json()
        throw new Error(err.message || "Failed to update consultation status")
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "An error occurred"
      setMessage({ type: "error", text: errMsg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Stethoscope className="h-6 w-6 mr-2 text-blue-700" />
              Live Consultation
            </h1>
            <p className="text-sm text-gray-600 mt-1">Write prescriptions and manage active consultations</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchActivePatient}>
            Check Active Queue
          </Button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 animate-in fade-in' : 'bg-red-50 text-red-700 border border-red-200 animate-in fade-in'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
            {message.text}
          </div>
        )}

        {activePatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Patient info summary & Chief Complaint */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-700" />
                    Patient Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{activePatient.patient_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Queue ID: #{activePatient.queue_number}</p>
                  </div>
                  <div className="text-xs space-y-2 border-t pt-3">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Age:</span>
                      <span className="font-medium text-gray-900">{activePatient.age} years</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Gender:</span>
                      <span className="font-medium text-gray-900 capitalize">{activePatient.gender}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium text-gray-900">{activePatient.contact}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                    Chief Complaint
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed italic bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                    &quot;{activePatient.chiefComplaint}&quot;
                  </p>
                </CardContent>
              </Card>

              {/* Consultation Info helper */}
              <div className="bg-blue-50 border border-blue-150 rounded-xl p-4 text-sm text-blue-900">
                <p className="font-semibold flex items-center mb-1">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-blue-700" />
                  Prescribing Tips
                </p>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Always confirm patient allergies before writing down medications. Saving the prescription automatically updates the queue entry to completed.
                </p>
              </div>
            </div>

            {/* Right: Electronic Health Record & Prescription writing */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-700" />
                    Consultation Record & Prescription
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setHistoryOpen(!historyOpen)}>
                    <History className="h-4 w-4 mr-1" />
                    {historyOpen ? "Close History" : "View History"}
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {historyOpen ? (
                    <div className="space-y-4 py-2 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="font-semibold text-gray-800 border-b pb-1">Past Records (Simulated)</h4>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                        <p className="text-xs text-gray-500">2026-02-15 • Dr. Sarah Wilson</p>
                        <p className="text-sm font-semibold text-gray-900">Diagnosis: Astigmatism & Myopia</p>
                        <p className="text-sm text-gray-600">Prescription: Cyl -0.50 Axis 180 (Daily wear lenses)</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                        <p className="text-xs text-gray-500">2025-08-10 • Dr. Sarah Wilson</p>
                        <p className="text-sm font-semibold text-gray-900">Diagnosis: Dry Eye Syndrome</p>
                        <p className="text-sm text-gray-600">Prescription: TearDrops eye drops 10ml, 3 times daily</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePrescription} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Stethoscope className="h-4 w-4 mr-1 text-gray-500" />
                          Diagnosis / Clinical Assessment
                        </label>
                        <textarea
                          value={prescription.diagnosis}
                          onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-24"
                          placeholder="Describe the medical evaluation and diagnosis..."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Pill className="h-4 w-4 mr-1 text-gray-500" />
                          Medications & Dosage
                        </label>
                        <textarea
                          value={prescription.medications}
                          onChange={(e) => setPrescription({ ...prescription, medications: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-28"
                          placeholder="Example: TearDrops Eye Drops - 1 drop in each eye 3 times daily for 2 weeks."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                          Advice / Follow-up Notes
                        </label>
                        <textarea
                          value={prescription.notes}
                          onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-20"
                          placeholder="Enter patient advice, referral note, or when to follow up..."
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={saving}
                        className="w-full text-white py-6 font-semibold"
                        style={{ backgroundColor: '#02006c' }}
                      >
                        <Save className="h-5 w-5 mr-2" />
                        {saving ? "Saving consultation..." : "Save Record & Complete"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-16 text-center">
              <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Patient in Consultation</h3>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                Go to the <span className="font-semibold text-blue-700 cursor-pointer hover:underline" onClick={() => router.push('/doctor/queue')}>Patient Queue</span> to call the next patient and activate the consultation interface.
              </p>
              <Button 
                className="mt-6 text-white" 
                style={{ backgroundColor: '#02006c' }}
                onClick={() => router.push('/doctor/queue')}
              >
                Go to Queue
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
