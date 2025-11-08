"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Medical history section coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}