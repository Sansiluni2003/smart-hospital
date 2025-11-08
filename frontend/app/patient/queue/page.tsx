"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QueueInfo {
  currentPosition: number
  totalInQueue: number
  estimatedWaitTime: number
  doctorStatus: 'available' | 'delayed' | 'on_break'
  currentlyConsulting: number
}

const mockQueueInfo: QueueInfo = {
  currentPosition: 3,
  totalInQueue: 12,
  estimatedWaitTime: 25,
  doctorStatus: 'available',
  currentlyConsulting: 1
}

export default function QueuePage() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Queue Status</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Live Queue Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full border-8 border-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">#{mockQueueInfo.currentPosition}</div>
                  <div className="text-sm text-gray-600">Your Position</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{mockQueueInfo.totalInQueue}</div>
                <div className="text-sm text-gray-600">Total in Queue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{mockQueueInfo.estimatedWaitTime} min</div>
                <div className="text-sm text-gray-600">Estimated Wait</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">#{mockQueueInfo.currentlyConsulting}</div>
                <div className="text-sm text-gray-600">Currently Consulting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Available</div>
                <div className="text-sm text-gray-600">Doctor Status</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queue Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((position) => {
              const isCurrentlyConsulting = position === mockQueueInfo.currentlyConsulting
              const isCompleted = position < mockQueueInfo.currentlyConsulting
              const isCurrentPatient = position === mockQueueInfo.currentPosition
              
              return (
                <div key={position} className={`flex items-center space-x-3 p-3 rounded-lg ${
                  isCurrentlyConsulting ? 'bg-red-50 border border-red-200' :
                  isCompleted ? 'bg-green-50 border border-green-200' :
                  isCurrentPatient ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrentlyConsulting ? 'bg-red-600 text-white' :
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrentPatient ? 'bg-blue-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCurrentlyConsulting ? '👨‍⚕️' : position}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isCurrentlyConsulting ? 'text-red-900' :
                        isCurrentPatient ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {isCurrentlyConsulting ? 'Currently Consulting' :
                         isCurrentPatient ? 'You are here' : 
                         `Patient ${position}`}
                      </span>
                      <span className={`text-sm font-medium ${
                        isCurrentlyConsulting ? 'text-red-600' :
                        isCompleted ? 'text-green-600' :
                        isCurrentPatient ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {isCurrentlyConsulting ? 'IN CONSULTATION' :
                         isCompleted ? 'Completed' :
                         isCurrentPatient ? 'Your Turn Coming Up' :
                         'Waiting'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}