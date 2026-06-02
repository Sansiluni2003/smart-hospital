"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

type DoctorAvailability = {
  doctorId: number;
  doctorName: string;
  specialty?: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  bookedPatients: number;
  scheduleId: number;
  status?: string;
};

function localDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function capacityColor(booked: number, max: number) {
  const pct = max > 0 ? booked / max : 0;
  if (pct >= 1) return "bg-red-500";
  if (pct >= 0.75) return "bg-amber-400";
  return "bg-emerald-500";
}

function statusBadge(status?: string, booked?: number, max?: number) {
  const full = (booked ?? 0) >= (max ?? 1);
  if (full) return { label: "Full", cls: "bg-red-100 text-red-700" };
  const s = (status || "available").toLowerCase();
  if (s === "available") return { label: "Available", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "booked") return { label: "Booked", cls: "bg-amber-100 text-amber-700" };
  if (s === "unavailable") return { label: "Unavailable", cls: "bg-slate-100 text-slate-600" };
  return { label: status ?? "Available", cls: "bg-emerald-100 text-emerald-700" };
}

export default function StaffAvailabilityPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [clinicId, setClinicId] = useState("1");
  const [doctors, setDoctors] = useState<DoctorAvailability[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [monthDotMap, setMonthDotMap] = useState<Record<string, number>>({});

  const fetchDoctors = useCallback(
    async (date: Date, silent = false) => {
      if (!silent) setLoadingDoctors(true);
      else setRefreshing(true);
      try {
        const dateStr = localDateStr(date);
        const res = await authFetch(
          `${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(dateStr)}&clinic_id=${encodeURIComponent(clinicId)}`,
        );
        setDoctors(res.ok ? await res.json() : []);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
        setRefreshing(false);
      }
    },
    [apiUrl, clinicId],
  );

  const fetchMonthDots = useCallback(async () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const map: Record<string, number> = {};
    const dates: string[] = [];
    const cur = new Date(firstDay);
    while (cur <= lastDay) {
      dates.push(localDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    await Promise.all(
      dates.map(async (d) => {
        try {
          const res = await authFetch(
            `${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(d)}&clinic_id=${encodeURIComponent(clinicId)}`,
          );
          if (res.ok) {
            const data: DoctorAvailability[] = await res.json();
            if (data.length > 0) map[d] = data.length;
          }
        } catch { /* ignore */ }
      }),
    );
    setMonthDotMap(map);
  }, [apiUrl, clinicId, viewYear, viewMonth]);

  useEffect(() => { void fetchDoctors(selectedDate); }, [selectedDate, fetchDoctors]);
  useEffect(() => { void fetchMonthDots(); }, [fetchMonthDots]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-slate-800">Doctor Availability</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Clinic</label>
            <input
              type="number"
              min={1}
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-center"
            />
          </div>
          <Button variant="outline" size="sm" disabled={refreshing}
            onClick={() => void fetchDoctors(selectedDate, true)}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Calendar card ── */}
        <Card className="border-slate-200 shadow-sm self-start">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={prevMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
              <button onClick={nextMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`b${idx}`} />;
                const cellDate = new Date(viewYear, viewMonth, day);
                cellDate.setHours(0, 0, 0, 0);
                const dateStr = localDateStr(cellDate);
                const isToday = isSameDay(cellDate, today);
                const isSelected = isSameDay(cellDate, selectedDate);
                const dotCount = monthDotMap[dateStr] ?? 0;
                const isPast = cellDate < today && !isToday;
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => { setSelectedDate(cellDate); setViewYear(cellDate.getFullYear()); setViewMonth(cellDate.getMonth()); }}
                    className={[
                      "relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-full text-sm font-medium transition-all",
                      isSelected ? "bg-emerald-600 text-white shadow-md scale-105" :
                      isToday ? "border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50" :
                      isPast ? "text-slate-300 cursor-not-allowed" :
                      dotCount > 0 ? "text-slate-700 hover:bg-emerald-50 font-semibold" :
                      "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {day}
                    {dotCount > 0 && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {Array.from({ length: Math.min(dotCount, 3) }).map((_, i) => (
                          <span key={i}
                            className={`h-1 w-1 rounded-full ${isSelected ? "bg-white/70" : "bg-emerald-500"}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white">1</span>
                Selected date
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500" />
                Today
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Doctors available
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Doctor panel ── */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Click a date on the calendar to browse</p>
              </div>
              {!loadingDoctors && doctors.length > 0 && (
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <Users className="h-3.5 w-3.5" />
                    {doctors.reduce((s, d) => s + Math.max(0, d.maxPatients - d.bookedPatients), 0)} slots free
                  </span>
                </div>
              )}
            </div>

            {loadingDoctors ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="rounded-full bg-slate-100 p-5">
                  <X className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">No doctors scheduled on this day</p>
                <p className="text-sm text-slate-400 max-w-xs">
                  Dates with available doctors are marked with green dots on the calendar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {doctors.map((doc) => {
                  const pct = Math.min(doc.maxPatients > 0 ? (doc.bookedPatients / doc.maxPatients) * 100 : 0, 100);
                  const barColor = capacityColor(doc.bookedPatients, doc.maxPatients);
                  const badge = statusBadge(doc.status, doc.bookedPatients, doc.maxPatients);
                  return (
                    <div key={doc.scheduleId} className="flex flex-wrap items-center gap-4 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {doc.doctorName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-[8rem] flex-1">
                        <p className="font-semibold text-slate-900">{doc.doctorName}</p>
                        <p className="text-sm text-slate-500">{doc.specialty || "General"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {doc.time}
                      </div>
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Booked</span>
                          <span>{doc.bookedPatients}/{doc.maxPatients}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
