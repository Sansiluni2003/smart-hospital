"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Hospital, QrCode, Download } from "lucide-react"

interface Patient {
  id: string
  name: string
  opdId: string
  email: string
  phone: string
  profileImage?: string
}

const mockPatient: Patient = {
  id: "P001",
  name: "John Doe",
  opdId: "OPD2024001",
  email: "john.doe@email.com",
  phone: "+94 77 123 4567"
}

export default function CardPage() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Digital Patient Card</h2>
      <Card>
        <CardContent className="p-6">
          <div className="max-w-md mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Hospital className="h-6 w-6" />
                <span className="font-semibold">National Eye Hospital</span>
              </div>
              <QrCode className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{mockPatient.name}</h3>
              <p className="text-blue-100">Patient ID: {mockPatient.opdId}</p>
              <p className="text-blue-100">{mockPatient.phone}</p>
              <p className="text-blue-100">{mockPatient.email}</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Digital Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}