"use client";
import { useState } from "react";
import { UserCheck, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type LiveQueueEntry = {
  queueNumber: number;
  patientName: string;
  doctorName: string;
  appointmentId: string;
  status: string;
};

const initialLiveQueue: LiveQueueEntry[] = [
  { queueNumber: 1, patientName: "Nishan A.", doctorName: "Dr. Anura Perera", appointmentId: "APT-1201", status: "Now serving" },
];

export default function StaffLiveQueuePage() {
  const [queueFilter, setQueueFilter] = useState("");
  const liveQueue = initialLiveQueue;
  const filteredLiveQueue = liveQueue.filter(
    (entry) =>
      entry.patientName.toLowerCase().includes(queueFilter.toLowerCase()) ||
      entry.doctorName.toLowerCase().includes(queueFilter.toLowerCase()) ||
      entry.appointmentId.toLowerCase().includes(queueFilter.toLowerCase())
  );
  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <UserCheck className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">Live Queue Management</h2>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={queueFilter}
          onChange={e => setQueueFilter(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-slate-900"
          placeholder="Search patient, doctor, or appointment"
        />
      </div>
      <div className="grid gap-4">
        {filteredLiveQueue.map((entry) => (
          <Card key={entry.appointmentId} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Queue #</p>
                <p className="text-2xl font-semibold text-emerald-700">{entry.queueNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">{entry.patientName}</p>
                <p className="text-sm text-slate-500">{entry.appointmentId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                <p className="font-medium text-slate-900">{entry.doctorName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="font-medium text-slate-900">{entry.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
