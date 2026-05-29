"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Calendar, 
  User, 
  Stethoscope, 
  Pill, 
  ClipboardList,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  TestTube,
  Thermometer
} from "lucide-react"

interface Prescription {
  medicine: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface LabTest {
  testName: string
  result: string
  normalRange: string
  status: 'normal' | 'abnormal' | 'pending'
}

interface OPDVisit {
  id: string
  visitDate: string
  visitTime: string
  doctor: string
  specialty: string
  chiefComplaint: string
  diagnosis: string
  vitalSigns: {
    bloodPressure: string
    temperature: string
    pulse: string
    weight: string
  }
  prescriptions: Prescription[]
  labTests: LabTest[]
  followUpDate?: string
  notes: string
}

export default function HistoryPage() {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)

  // Mock data for previous OPD visits
  const opdVisits: OPDVisit[] = [
    {
      id: "OPD001",
      visitDate: "2024-12-10",
      visitTime: "10:30 AM",
      doctor: "Dr. Sarah Wilson",
      specialty: "Ophthalmology",
      chiefComplaint: "Blurred vision and eye strain",
      diagnosis: "Myopia (Nearsightedness) - Progressive",
      vitalSigns: {
        bloodPressure: "120/80 mmHg",
        temperature: "98.6°F",
        pulse: "72 bpm",
        weight: "68 kg"
      },
      prescriptions: [
        {
          medicine: "Lubricating Eye Drops",
          dosage: "1-2 drops",
          frequency: "4 times daily",
          duration: "30 days",
          instructions: "Apply in both eyes. Use before screen time."
        },
        {
          medicine: "Vision Plus Tablets",
          dosage: "1 tablet",
          frequency: "Once daily",
          duration: "90 days",
          instructions: "Take after meals with water"
        },
        {
          medicine: "Anti-glare Glasses",
          dosage: "As needed",
          frequency: "Daily use",
          duration: "Continuous",
          instructions: "Wear during computer work and reading"
        }
      ],
      labTests: [
        {
          testName: "Visual Acuity Test",
          result: "20/40 (Right), 20/50 (Left)",
          normalRange: "20/20",
          status: "abnormal"
        },
        {
          testName: "Intraocular Pressure",
          result: "15 mmHg",
          normalRange: "10-21 mmHg",
          status: "normal"
        },
        {
          testName: "Retinal Examination",
          result: "Normal retina, no abnormalities",
          normalRange: "Normal",
          status: "normal"
        }
      ],
      followUpDate: "2025-01-10",
      notes: "Patient advised to reduce screen time. Recommended 20-20-20 rule (every 20 minutes, look at something 20 feet away for 20 seconds). Follow up in 1 month for vision reassessment."
    },
    {
      id: "OPD002",
      visitDate: "2024-11-15",
      visitTime: "02:15 PM",
      doctor: "Dr. Michael Chen",
      specialty: "Ophthalmology",
      chiefComplaint: "Eye irritation and redness",
      diagnosis: "Conjunctivitis (Pink Eye) - Allergic",
      vitalSigns: {
        bloodPressure: "118/78 mmHg",
        temperature: "98.4°F",
        pulse: "68 bpm",
        weight: "67 kg"
      },
      prescriptions: [
        {
          medicine: "Antihistamine Eye Drops",
          dosage: "1 drop",
          frequency: "3 times daily",
          duration: "14 days",
          instructions: "Apply in affected eye. Avoid contact with dropper tip."
        },
        {
          medicine: "Cold Compress",
          dosage: "As needed",
          frequency: "3-4 times daily",
          duration: "Until symptoms improve",
          instructions: "Apply for 10 minutes to reduce swelling"
        }
      ],
      labTests: [
        {
          testName: "Allergy Screening",
          result: "Positive for dust mites",
          normalRange: "Negative",
          status: "abnormal"
        }
      ],
      followUpDate: "2024-11-29",
      notes: "Allergic conjunctivitis confirmed. Patient advised to minimize allergen exposure. Keep environment clean and dust-free. Completed treatment successfully."
    },
    {
      id: "OPD003",
      visitDate: "2024-10-05",
      visitTime: "11:00 AM",
      doctor: "Dr. Sarah Wilson",
      specialty: "Ophthalmology",
      chiefComplaint: "Routine eye checkup",
      diagnosis: "Healthy eyes - Routine examination",
      vitalSigns: {
        bloodPressure: "122/80 mmHg",
        temperature: "98.6°F",
        pulse: "70 bpm",
        weight: "66.5 kg"
      },
      prescriptions: [
        {
          medicine: "Multivitamin with Lutein",
          dosage: "1 tablet",
          frequency: "Once daily",
          duration: "90 days",
          instructions: "Take with breakfast for eye health maintenance"
        }
      ],
      labTests: [
        {
          testName: "Visual Acuity Test",
          result: "20/30 (Both eyes)",
          normalRange: "20/20",
          status: "normal"
        },
        {
          testName: "Color Vision Test",
          result: "Normal color perception",
          normalRange: "Normal",
          status: "normal"
        }
      ],
      followUpDate: "2025-04-05",
      notes: "Annual eye examination completed. No significant issues found. Continue with healthy eye care practices. Next routine checkup in 6 months."
    }
  ]

  const toggleVisit = (visitId: string) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200'
      case 'abnormal': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical History</h1>
            <p className="text-sm text-gray-600 mt-1">Your complete OPD visit records and prescriptions</p>
          </div>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{opdVisits.length}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Calendar className="h-6 w-6" style={{ color: '#02006c' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prescriptions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {opdVisits.reduce((acc, visit) => acc + visit.prescriptions.length, 0)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lab Tests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {opdVisits.reduce((acc, visit) => acc + visit.labTests.length, 0)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <TestTube className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    {new Date(opdVisits[0]?.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OPD Visit Records */}
        <div className="space-y-4">
          {opdVisits.map((visit) => (
            <Card key={visit.id} className="border-0 shadow-md">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleVisit(visit.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full" style={{ backgroundColor: '#02006c' }}>
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {visit.diagnosis}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(visit.visitDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })} • {visit.visitTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {visit.doctor} - {visit.specialty}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedVisit === visit.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {expandedVisit === visit.id && (
                <CardContent className="p-6 border-t border-gray-200 space-y-6">
                  {/* Visit Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chief Complaint */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" style={{ color: '#02006c' }} />
                        Chief Complaint
                      </h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {visit.chiefComplaint}
                      </p>
                    </div>

                    {/* Vital Signs */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Thermometer className="h-4 w-4" style={{ color: '#02006c' }} />
                        Vital Signs
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Blood Pressure</p>
                          <p className="text-sm font-medium text-gray-900">{visit.vitalSigns.bloodPressure}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Temperature</p>
                          <p className="text-sm font-medium text-gray-900">{visit.vitalSigns.temperature}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Pulse</p>
                          <p className="text-sm font-medium text-gray-900">{visit.vitalSigns.pulse}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">Weight</p>
                          <p className="text-sm font-medium text-gray-900">{visit.vitalSigns.weight}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prescriptions */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Pill className="h-4 w-4" style={{ color: '#02006c' }} />
                      Prescriptions ({visit.prescriptions.length})
                    </h3>
                    <div className="space-y-3">
                      {visit.prescriptions.map((prescription, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{prescription.medicine}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                                <div>
                                  <p className="text-xs text-gray-600">Dosage</p>
                                  <p className="font-medium text-gray-900">{prescription.dosage}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Frequency</p>
                                  <p className="font-medium text-gray-900">{prescription.frequency}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Duration</p>
                                  <p className="font-medium text-gray-900">{prescription.duration}</p>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs text-gray-600">Instructions</p>
                                <p className="text-sm text-gray-900 mt-1">{prescription.instructions}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lab Tests */}
                  {visit.labTests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TestTube className="h-4 w-4" style={{ color: '#02006c' }} />
                        Laboratory Tests ({visit.labTests.length})
                      </h3>
                      <div className="space-y-2">
                        {visit.labTests.map((test, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{test.testName}</h4>
                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-600">Result</p>
                                    <p className="font-medium text-gray-900">{test.result}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600">Normal Range</p>
                                    <p className="font-medium text-gray-900">{test.normalRange}</p>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(test.status)}`}>
                                {test.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctor&apos;s Notes */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: '#02006c' }} />
                      Doctor&apos;s Notes
                    </h3>
                    <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      {visit.notes}
                    </p>
                  </div>

                  {/* Follow-up */}
                  {visit.followUpDate && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">Follow-up Scheduled</p>
                          <p className="text-sm text-green-700">
                            {new Date(visit.followUpDate).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Report
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Prescription
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}