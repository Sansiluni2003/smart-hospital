"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authFetch } from "@/lib/authFetch"
import { 
  Stethoscope, User, FileText, CheckCircle, 
  AlertCircle, Pill, MessageSquare, Save, History, Upload, Paperclip, CalendarDays, MapPin, Phone, IdCard
} from "lucide-react"

interface ActiveConsultation {
  queue_id: number
  appointment_id: number
  queue_number: number
  patient_id: number
  patient_name: string
  chiefComplaint: string
  contact: string
  email: string
  address: string
  opd_id: string
  date_of_birth: string | null
  appointment_time: string | null
}

interface MedicalRecord {
  Record_ID: number
  ConsultationNotes?: string | null
  Prescription?: string | null
  RecordDate?: string | null
}

interface AttachmentItem {
  filename: string
  display_name: string
  category: string
  uploaded_at: number
  size: number
  url: string
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
  const [historyRecords, setHistoryRecords] = useState<MedicalRecord[]>([])
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachmentCategory, setAttachmentCategory] = useState("prescription")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    const role = String(user?.Role || user?.role || '').toLowerCase()
    if (role !== 'doctor') {
      router.push('/')
      return
    }
    fetchActivePatient()
    const interval = setInterval(() => {
      fetchActivePatient(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1
    }
    return age
  }

  const fetchActivePatient = async (silent = false) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/queue`)

      if (response.ok) {
        const data = await response.json()
        const consulting = data.find((p: { status: string }) => p.status === 'in-consultation')
        
        if (consulting) {
          const nextPatient = {
            queue_id: consulting.queue_id,
            appointment_id: consulting.appointment_id,
            queue_number: consulting.queue_number,
            patient_id: consulting.patient_id,
            patient_name: consulting.patient_name,
            chiefComplaint: consulting.notes || "No consultation notes yet.",
            contact: consulting.phone || "Not provided",
            email: consulting.email || "Not provided",
            address: consulting.address || "Not provided",
            opd_id: consulting.opd_id || "Not provided",
            date_of_birth: consulting.date_of_birth || null,
            appointment_time: consulting.appointment_time || null,
          }
          setActivePatient(nextPatient)

          const [historyResponse, attachmentResponse] = await Promise.all([
            authFetch(`${apiUrl}/api/v1/doctors/doctor/me/patients/${consulting.patient_id}/medical-records`),
            authFetch(`${apiUrl}/api/v1/doctors/doctor/me/appointments/${consulting.appointment_id}/attachments`),
          ])

          setHistoryRecords(historyResponse.ok ? await historyResponse.json() : [])
          setAttachments(attachmentResponse.ok ? await attachmentResponse.json() : [])
        } else {
          setActivePatient(null)
          setHistoryRecords([])
          setAttachments([])
        }
      }
    } catch (e) {
      if (!silent) {
        console.error(e)
      }
    }
  }

  const handleUploadAttachment = async () => {
    if (!activePatient || !selectedFile) return
    setUploading(true)
    setMessage({ type: "", text: "" })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', attachmentCategory)

      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/appointments/${activePatient.appointment_id}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to upload attachment')
      }

      setSelectedFile(null)
      setMessage({ type: 'success', text: 'Attachment uploaded successfully.' })
      await fetchActivePatient(true)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to upload attachment'
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setUploading(false)
    }
  }

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient) return
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await authFetch(`${apiUrl}/api/v1/doctors/doctor/me/appointments/${activePatient.appointment_id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ConsultationNotes: prescription.diagnosis,
          Prescription: prescription.medications,
          AppointmentNotes: prescription.notes,
        })
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
          <Button variant="outline" size="sm" onClick={() => { void fetchActivePatient() }}>
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
                      <span className="text-gray-500">Patient ID:</span>
                      <span className="font-medium text-gray-900">#{activePatient.patient_id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">OPD ID:</span>
                      <span className="font-medium text-gray-900">{activePatient.opd_id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Age:</span>
                      <span className="font-medium text-gray-900">{calculateAge(activePatient.date_of_birth) ?? 'N/A'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Appointment Time:</span>
                      <span className="font-medium text-gray-900">{activePatient.appointment_time || 'Pending'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">{activePatient.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-medium text-gray-900">{activePatient.contact}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-700">
                    <p className="mb-1 flex items-center font-semibold text-gray-900">
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      Address
                    </p>
                    <p>{activePatient.address}</p>
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

              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                    <History className="h-4 w-4 mr-2 text-blue-700" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 max-h-[360px] overflow-y-auto">
                  {historyRecords.length === 0 ? (
                    <p className="text-sm text-gray-500">No previous medical records found for this patient.</p>
                  ) : (
                    historyRecords.map((record) => (
                      <div key={record.Record_ID} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">{record.RecordDate ? new Date(record.RecordDate).toLocaleString() : 'Recorded consultation'}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Diagnosis</p>
                        <p className="text-sm text-gray-700">{record.ConsultationNotes || 'Not recorded'}</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">Prescription</p>
                        <p className="text-sm text-gray-700">{record.Prescription || 'Not recorded'}</p>
                      </div>
                    ))
                  )}
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
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-700" />
                    Consultation Record & Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSavePrescription} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start gap-3">
                        <IdCard className="mt-0.5 h-4 w-4 text-blue-700" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Patient Reference</p>
                          <p className="text-sm font-semibold text-gray-900">#{activePatient.patient_id} / {activePatient.opd_id}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-blue-700" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Appointment Slot</p>
                          <p className="text-sm font-semibold text-gray-900">{activePatient.appointment_time || 'Pending time'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:col-span-2">
                        <Phone className="mt-0.5 h-4 w-4 text-blue-700" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</p>
                          <p className="text-sm font-semibold text-gray-900">{activePatient.contact} • {activePatient.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Stethoscope className="h-4 w-4 mr-1 text-gray-500" />
                        Diagnosis / Clinical Assessment
                      </label>
                      <textarea
                        value={prescription.diagnosis}
                        onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-28"
                        placeholder="Describe the medical evaluation and diagnosis..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Pill className="h-4 w-4 mr-1 text-gray-500" />
                        Prescription / Medications
                      </label>
                      <textarea
                        value={prescription.medications}
                        onChange={(e) => setPrescription({ ...prescription, medications: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-28"
                        placeholder="Enter medications, dosage, duration, and prescription instructions..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                        Consultation Notes / Follow-up Advice
                      </label>
                      <textarea
                        value={prescription.notes}
                        onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:outline-none h-24"
                        placeholder="Enter notes, referral information, or follow-up advice..."
                      />
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                          <Paperclip className="h-4 w-4 mr-2 text-blue-700" />
                          Upload Prescription / Medical Files
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Attach scanned prescriptions, reports, or related consultation documents for this patient.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-center">
                        <input
                          type="file"
                          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                        />
                        <select
                          value={attachmentCategory}
                          onChange={(event) => setAttachmentCategory(event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                        >
                          <option value="prescription">Prescription</option>
                          <option value="medical_record">Medical Record</option>
                          <option value="report">Report</option>
                        </select>
                        <Button type="button" variant="outline" onClick={handleUploadAttachment} disabled={!selectedFile || uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {attachments.length === 0 ? (
                          <p className="text-sm text-gray-500">No uploaded files for this consultation yet.</p>
                        ) : (
                          attachments.map((attachment) => {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
                            return (
                              <a
                                key={attachment.filename}
                                href={`${apiUrl}${attachment.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                <div>
                                  <p className="font-semibold text-gray-900">{attachment.display_name}</p>
                                  <p className="text-xs text-gray-500">{attachment.category} • {(attachment.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <span className="text-xs font-medium text-blue-700">Open</span>
                              </a>
                            )
                          })
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="w-full text-white py-6 font-semibold"
                      style={{ backgroundColor: '#02006c' }}
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {saving ? "Saving consultation..." : "Save Record & End Consultation"}
                    </Button>
                  </form>
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
