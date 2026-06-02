"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, User, Stethoscope, Pill, ChevronDown, ChevronUp, ClipboardList } from "lucide-react"
import { authFetch } from "@/lib/authFetch"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export default function HistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) { router.push("/login"); return }
    const user = JSON.parse(userStr)
    if (user.Role !== "Patient") { router.push("/"); return }
    fetchRecords(user.Patient_ID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchRecords = async (patientId: number) => {
    setLoading(true)
    try {
      const res = await authFetch(`${apiUrl}/api/v1/patients/${patientId}/medical-records`)
      if (res.status === 401) { router.push("/login"); return }
      if (res.ok) setRecords(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: "#02006c" }} />
          <p className="text-gray-500">Loading medical history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #02006c, #1a0066, #3300cc)" }}>
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical History</h1>
            <p className="text-blue-200 mt-1">{records.length} consultation record{records.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-10 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No medical records found</p>
            <p className="text-sm text-gray-400 mt-1">Your consultation notes and prescriptions will appear here after each visit</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((r: any) => (
            <Card key={r.Record_ID} className="border-0 shadow-md overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === r.Record_ID ? null : r.Record_ID)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#02006c" }}>
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{r.Doctor_Name || "Doctor"}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {r.AppointmentDate || r.RecordDate?.split(" ")[0] || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.Prescription && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                      <Pill className="h-3 w-3" /> Prescription
                    </span>
                  )}
                  {expandedId === r.Record_ID ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </div>

              {expandedId === r.Record_ID && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                  {r.ConsultationNotes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Consultation Notes</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">{r.ConsultationNotes}</p>
                    </div>
                  )}
                  {r.Prescription && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">Prescription</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-200 whitespace-pre-wrap">{r.Prescription}</p>
                    </div>
                  )}
                  {!r.ConsultationNotes && !r.Prescription && (
                    <p className="text-sm text-gray-400 italic">No detailed notes available for this visit.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
