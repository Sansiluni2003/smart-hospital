"use client";

import { useEffect, useState } from "react";
import { Bell, RefreshCw, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

type LiveQueueEntry = {
  queueNumber: number;
  patientName: string;
  doctorName: string;
  appointmentId: string;
  status: string;
  date?: string | null;
  time?: string | null;
};

export default function StaffLiveQueuePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [queueFilter, setQueueFilter] = useState("");
  const [clinicId, setClinicId] = useState("1");
  const [liveQueue, setLiveQueue] = useState<LiveQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLiveQueue = async (silent = false) => {
    if (!clinicId) {
      setLiveQueue([]);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/v1/staff/clinic-staff/live-queue/${encodeURIComponent(clinicId)}`);
      setLiveQueue(response.ok ? await response.json() : []);
    } catch (error) {
      console.error("Failed to load live queue:", error);
      setLiveQueue([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLiveQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const filteredLiveQueue = liveQueue.filter(
    (entry) =>
      entry.patientName.toLowerCase().includes(queueFilter.toLowerCase()) ||
      entry.doctorName.toLowerCase().includes(queueFilter.toLowerCase()) ||
      entry.appointmentId.toLowerCase().includes(queueFilter.toLowerCase()),
  );

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Bell className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">Live Queue</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadLiveQueue(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Clinic ID</span>
            <input
              value={clinicId}
              onChange={(event) => setClinicId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Search</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={queueFilter}
                onChange={(event) => setQueueFilter(event.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="Patient, doctor, appointment"
              />
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 text-sm text-slate-500">Loading live queue...</CardContent>
          </Card>
        ) : filteredLiveQueue.length > 0 ? (
          filteredLiveQueue.map((entry) => (
            <Card key={entry.appointmentId} className="border-slate-200 shadow-sm">
              <CardContent className="p-5 grid gap-3 md:grid-cols-5">
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
                  <p className="text-xs uppercase tracking-wide text-slate-500">Schedule</p>
                  <p className="font-medium text-slate-900">{entry.date || "Date pending"}</p>
                  <p className="text-sm text-slate-500">{entry.time || "Time pending"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <p className="font-medium text-emerald-700">{entry.status}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 text-sm text-slate-500">No live queue entries found.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
