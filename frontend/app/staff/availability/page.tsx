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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  if (s === "available")
    return { label: "Available", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "booked")
    return { label: "Booked", cls: "bg-amber-100 text-amber-700" };
  if (s === "unavailable")
    return { label: "Unavailable", cls: "bg-slate-100 text-slate-600" };
  return {
    label: status ?? "Available",
    cls: "bg-emerald-100 text-emerald-700",
  };
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
          `${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(
            dateStr
          )}&clinic_id=${encodeURIComponent(clinicId)}`
        );
        setDoctors(res.ok ? await res.json() : []);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
        setRefreshing(false);
      }
    },
    [apiUrl, clinicId]
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
            `${apiUrl}/api/v1/staff/clinic-staff/available-doctors/?date=${encodeURIComponent(
              d
            )}&clinic_id=${encodeURIComponent(clinicId)}`
          );
          if (res.ok) {
            const data: DoctorAvailability[] = await res.json();
            if (data.length > 0) map[d] = data.length;
          }
        } catch {
          /* ignore */
        }
      })
    );
    setMonthDotMap(map);
  }, [apiUrl, clinicId, viewYear, viewMonth]);

  useEffect(() => {
    void fetchDoctors(selectedDate);
  }, [selectedDate, fetchDoctors]);

  useEffect(() => {
    void fetchMonthDots();
  }, [fetchMonthDots]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-emerald-700" />
          <h2 className="text-xl font-bold text-slate-800">
            Doctor Availability
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 font-medium">Clinic</label>
            <input
              type="number"
              min={1}
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => void fetchDoctors(selectedDate, true)}
            className="h-10"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid Layout Increased: Changed from 320px to 420px/480px on large screens */}
      <div className="grid gap-8 lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr]">
        
        {/* ── Calendar card ── */}
        <Card className="border-slate-200 shadow-sm self-start">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {/* Increased month label size */}
              <span className="text-lg font-bold text-slate-800">
                {monthLabel}
              </span>
              <button
                onClick={nextMonth}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 text-center">
              {DAY_HEADERS.map((d) => (
                // Increased header text size and padding
                <div
                  key={d}
                  className="py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Increased gap between rows */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
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
                    onClick={() => {
                      setSelectedDate(cellDate);
                      setViewYear(cellDate.getFullYear());
                      setViewMonth(cellDate.getMonth());
                    }}
                    className={[
                      // Increased button size (h-12 w-12) and font size (text-base)
                      "relative mx-auto flex h-12 w-12 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-full text-base font-medium transition-all",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-md scale-105"
                        : isToday
                        ? "border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                        : isPast
                        ? "text-slate-300 cursor-not-allowed"
                        : dotCount > 0
                        ? "text-slate-700 hover:bg-emerald-50 font-semibold"
                        : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {day}
                    {dotCount > 0 && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                        {Array.from({ length: Math.min(dotCount, 3) }).map(
                          (_, i) => (
                            <span
                              key={i}
                              // Increased dot size
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSelected ? "bg-white/90" : "bg-emerald-500"
                              }`}
                            />
                          )
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Adjusted legend spacing */}
            <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 space-y-2.5 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm">
                  1
                </span>
                Selected date
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500 bg-white" />
                Today
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 w-5 justify-center">
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
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <p className="text-xl font-bold text-slate-900">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Click a date on the calendar to browse schedules
                </p>
              </div>
              {!loadingDoctors && doctors.length > 0 && (
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-100">
                    <Stethoscope className="h-4 w-4" />
                    {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-100">
                    <Users className="h-4 w-4" />
                    {doctors.reduce(
                      (s, d) =>
                        s + Math.max(0, d.maxPatients - d.bookedPatients),
                      0
                    )}{" "}
                    slots free
                  </span>
                </div>
              )}
            </div>

            {loadingDoctors ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="rounded-full bg-slate-50 p-6 border border-slate-100">
                  <X className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">
                  No doctors scheduled
                </h3>
                <p className="text-base text-slate-500 max-w-sm">
                  There are no doctors available for this specific date. Dates
                  with available doctors are marked with green dots on the
                  calendar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {doctors.map((doc) => {
                  const pct = Math.min(
                    doc.maxPatients > 0
                      ? (doc.bookedPatients / doc.maxPatients) * 100
                      : 0,
                    100
                  );
                  const barColor = capacityColor(
                    doc.bookedPatients,
                    doc.maxPatients
                  );
                  const badge = statusBadge(
                    doc.status,
                    doc.bookedPatients,
                    doc.maxPatients
                  );

                  return (
                    <div
                      key={doc.scheduleId}
                      className="flex flex-wrap items-center gap-6 py-5 hover:bg-slate-50/50 transition-colors rounded-xl px-2 -mx-2"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 shadow-sm border border-emerald-200">
                        {doc.doctorName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-[10rem] flex-1">
                        <p className="text-lg font-semibold text-slate-900">
                          {doc.doctorName}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          {doc.specialty || "General Practice"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {doc.time}
                      </div>
                      <div className="w-40 space-y-1.5">
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                          <span>Booked</span>
                          <span>
                            {doc.bookedPatients} / {doc.maxPatients}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${badge.cls}`}
                      >
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
