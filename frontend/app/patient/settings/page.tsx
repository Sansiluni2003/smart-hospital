"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
      <Card>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Profile settings section coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}