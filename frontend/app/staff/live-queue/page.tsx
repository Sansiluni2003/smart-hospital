"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, RefreshCw, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";
import { useWebSocket, type WsEvent } from "@/lib/useWebSocket";

type LiveQueueEntry = {
  queueNumber: number;
  patientName: string;
  doctorName: string;
  appointmentId: string;
  appointment_id?: number;
  doctor_id?: number | null;
  status: string;
  date?: string | null;
  time?: string | null;
};

type DoctorGroup = {
  key: string;
  doctorName: string;
  doctorId: number | null;
  entries: LiveQueueEntry[];
};

const LIVE_STATUSES = new Set(["Allocated", "Arrived", "In_Progress", "In Progress", "Waiting"]);

function normalizeStatus(status: string): string {
  return String(status || "")
    .replaceAll("_", " ")
    .trim();
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function statusPriority(status: string): number {
  const normalized = normalizeStatus(status).toLowerCase();
  if (normalized === "in progress") return 0;
  if (normalized === "arrived") return 1;
  if (normalized === "allocated") return 2;
  if (normalized === "waiting") return 3;
  return 9;
}

export default function StaffLiveQueuePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [queueFilter, setQueueFilter] = useState("");
  const [clinicId, setClinicId] = useState("1");
  const [liveQueue, setLiveQueue] = useState<LiveQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadLiveQueue = useCallback(async (silent = false) => {
    if (!clinicId) {
      setLiveQueue([]);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/v1/staff/clinic-staff/live-queue/${encodeURIComponent(clinicId)}`);
      const data = response.ok ? ((await response.json()) as LiveQueueEntry[]) : [];
      setLiveQueue(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to load live queue:", error);
      setLiveQueue([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, clinicId]);

  useEffect(() => {
    void loadLiveQueue();
  }, [clinicId]);

  useEffect(() => {
    // Poll as a fallback so queue movement updates even when no websocket event is emitted.
    const intervalId = window.setInterval(() => {
      void loadLiveQueue(true);
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [loadLiveQueue]);

  useWebSocket((evt: WsEvent) => {
    if (["checkin_verified", "queue_update", "consultation_started", "patient_arrived", "appointment_allocated"].includes(evt.event)) {
      void loadLiveQueue(true);
    }
  });

  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const todaysEntries = useMemo(() => {
    return liveQueue
      .filter((entry) => entry.date === todayIso)
      .filter((entry) => LIVE_STATUSES.has(entry.status))
      .sort((a, b) => {
        const byDoctor = (a.doctorName || "").localeCompare(b.doctorName || "");
        if (byDoctor !== 0) return byDoctor;
        const byPriority = statusPriority(a.status) - statusPriority(b.status);
        if (byPriority !== 0) return byPriority;
        return (a.queueNumber || 0) - (b.queueNumber || 0);
      });
  }, [liveQueue, todayIso]);

  const filteredLiveQueue = useMemo(() => {
    const needle = queueFilter.trim().toLowerCase();
    if (!needle) return todaysEntries;
    return todaysEntries.filter((entry) =>
      entry.patientName.toLowerCase().includes(needle) ||
      entry.doctorName.toLowerCase().includes(needle) ||
      entry.appointmentId.toLowerCase().includes(needle),
    );
  }, [queueFilter, todaysEntries]);

  const doctorGroups = useMemo<DoctorGroup[]>(() => {
    const grouped = new Map<string, DoctorGroup>();
    for (const entry of filteredLiveQueue) {
      const doctorId = typeof entry.doctor_id === "number" ? entry.doctor_id : null;
      const doctorName = entry.doctorName || "Unassigned Doctor";
      const key = `${doctorId ?? "unknown"}-${doctorName}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.entries.push(entry);
      } else {
        grouped.set(key, { key, doctorName, doctorId, entries: [entry] });
      }
    }

    const result = Array.from(grouped.values());
    result.forEach((group) => {
      group.entries.sort((a, b) => {
        const byPriority = statusPriority(a.status) - statusPriority(b.status);
        if (byPriority !== 0) return byPriority;
        return (a.queueNumber || 0) - (b.queueNumber || 0);
      });
    });

    result.sort((a, b) => {
      const aId = a.doctorId ?? Number.MAX_SAFE_INTEGER;
      const bId = b.doctorId ?? Number.MAX_SAFE_INTEGER;
      if (aId !== bId) return aId - bId;
      return a.doctorName.localeCompare(b.doctorName);
    });
    return result;
  }, [filteredLiveQueue]);

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Bell className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">Today Live Queue By Doctor</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadLiveQueue(true)} disabled={refreshing || loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 text-sm text-slate-600 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-emerald-700" />
          Showing live queue for today ({todayIso}) in clinic {clinicId || "-"}
          {lastUpdated ? ` | last updated ${lastUpdated}` : ""}
        </CardContent>
      </Card>

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
        ) : doctorGroups.length > 0 ? (
          doctorGroups.map((group) => (
            <Card key={group.key} className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Doctor Queue</p>
                    <p className="text-base font-semibold text-slate-900">{group.doctorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Doctor ID</p>
                    <p className="text-sm font-medium text-slate-700">{group.doctorId ?? "N/A"}</p>
                  </div>
                </div>

                <div className="divide-y">
                  {group.entries.map((entry) => {
                    const entryKey = `${entry.appointment_id ?? entry.appointmentId}-${entry.queueNumber}-${entry.status}`;
                    return (
                      <div key={entryKey} className="p-5 grid gap-3 md:grid-cols-5">
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
                          <p className="font-medium text-emerald-700">{normalizeStatus(entry.status)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 text-sm text-slate-500">
              No live queue entries found for today in this clinic.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
