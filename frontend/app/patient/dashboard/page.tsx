"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, AlertCircle, CheckCircle } from "lucide-react"

interface Patient {
  id: string
  name: string
  opdId: string
  email: string
  phone: string
}

interface QueueInfo {
  currentPosition: number
  totalInQueue: number
  estimatedWaitTime: number
  currentlyConsulting: number
}

const mockPatient: Patient = {
  id: "P001",
  name: "John Doe",
  opdId: "OPD2024001",
  email: "john.doe@email.com",
  phone: "+94 77 123 4567"
}

const mockQueueInfo: QueueInfo = {
  currentPosition: 3,
  totalInQueue: 12,
  estimatedWaitTime: 25,
  currentlyConsulting: 1
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {mockPatient.name}</h1>
              <p className="text-gray-600">Patient ID: {mockPatient.opdId}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today&apos;s Date</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Queue Alert Banner */}
      {mockQueueInfo.currentPosition - mockQueueInfo.currentlyConsulting <= 2 && (
        <div className={`rounded-lg p-4 border-l-4 ${
          mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
            ? 'bg-red-50 border-red-400' 
            : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex items-center">
            <AlertCircle className={`h-5 w-5 mr-3 ${
              mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
                ? 'text-red-500' 
                : 'text-yellow-500'
            }`} />
            <div>
              <p className={`font-medium ${
                mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
                  ? 'text-red-800' 
                  : 'text-yellow-800'
              }`}>
                {mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
                  ? 'You\'re Next!' 
                  : 'Get Ready!'}
              </p>
              <p className={`text-sm ${
                mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
                  ? 'text-red-700' 
                  : 'text-yellow-700'
              }`}>
                {mockQueueInfo.currentPosition === mockQueueInfo.currentlyConsulting + 1 
                  ? 'Patient #' + mockQueueInfo.currentlyConsulting + ' is currently consulting. Please be ready!' 
                  : `Only ${mockQueueInfo.currentPosition - mockQueueInfo.currentlyConsulting - 1} patient(s) ahead of you.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Appointment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Today&apos;s Appointment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Appointment Confirmed</span>
                </div>
                <p className="text-gray-700">Dr. Sarah Wilson - Ophthalmology</p>
                <p className="text-sm text-gray-600">10:00 AM • Room 201 • Queue #5</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Position in Queue</p>
                <p className="text-2xl font-bold text-green-600">#3</p>
                <p className="text-sm text-gray-500">~25 min wait</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Book Appointment</h3>
            <p className="text-sm text-gray-600">Schedule your next visit</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">View Queue</h3>
            <p className="text-sm text-gray-600">Check your queue status</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <User className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Digital Card</h3>
            <p className="text-sm text-gray-600">Access your patient card</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}