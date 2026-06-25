"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { QrCode, Upload, X, CheckCircle2, AlertCircle, User, Hash, CalendarDays, ListOrdered, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ArrivalInfo {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  patient_opd: string;
  appointment_date: string;
  queue?: { queueNumber?: number; status?: string } | null;
}

interface AppointmentRow {
  Appointment_ID: number;
  Patient_ID: number;
  ClinicID: number;
  AppointmentDate: string;
  AppointmentTime?: string | null;
  Status: string;
}

interface PatientRow {
  Patient_ID: number;
  Name: string;
  OPD_Id?: string;
}

interface ExpectedPatient {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  patient_opd: string;
  appointment_date: string;
  appointment_time?: string | null;
  status: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ── Toast component ────────────────────────────────────────────────────────────
function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
            t.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StaffCheckinPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [isScanning, setIsScanning] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [clinicId, setClinicId] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [arrivedList, setArrivedList] = useState<ArrivalInfo[]>([]);
  const [expectedList, setExpectedList] = useState<ExpectedPatient[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [refreshingLists, setRefreshingLists] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const hasScannedRef = useRef(false);
  const toastIdRef = useRef(0);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const pushToast = (type: "success" | "error", message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Camera cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const loadSideLists = useCallback(async (silent = false) => {
    if (!clinicId.trim()) {
      setExpectedList([]);
      setArrivedList([]);
      return;
    }

    if (silent) setRefreshingLists(true);
    else setLoadingLists(true);

    try {
      const [liveQueueRes, appointmentsRes, patientsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/v1/staff/clinic-staff/live-queue/${encodeURIComponent(clinicId)}`),
        authFetch(`${apiUrl}/api/v1/appointments/`),
        authFetch(`${apiUrl}/api/v1/patients/`),
      ]);

      const liveQueueData = liveQueueRes.ok ? (await liveQueueRes.json()) as Array<Record<string, unknown>> : [];
      const appointments = appointmentsRes.ok ? (await appointmentsRes.json()) as AppointmentRow[] : [];
      const patients = patientsRes.ok ? (await patientsRes.json()) as PatientRow[] : [];

      const patientById = new Map<number, PatientRow>();
      patients.forEach((p) => patientById.set(p.Patient_ID, p));

      const arrivedFromServer: ArrivalInfo[] = liveQueueData
        .filter((item) => String(item.date ?? "") === todayIso)
        .map((item) => {
          const appointmentIdNum = Number(item.appointment_id ?? 0);
          const patientIdNum = Number(item.patient_id ?? 0);
          const p = patientById.get(patientIdNum);
          return {
            appointment_id: appointmentIdNum,
            patient_id: patientIdNum,
            patient_name: String(item.patientName ?? p?.Name ?? `Patient #${patientIdNum}`),
            patient_opd: String(p?.OPD_Id ?? ""),
            appointment_date: String(item.date ?? todayIso),
            queue: {
              queueNumber: Number(item.queueNumber ?? 0) || undefined,
              status: String(item.status ?? "Waiting"),
            },
          };
        })
        .filter((row) => row.appointment_id > 0)
        .sort((a, b) => (b.queue?.queueNumber ?? 0) - (a.queue?.queueNumber ?? 0));

      const checkedInAppointmentIds = new Set(arrivedFromServer.map((a) => a.appointment_id));
      const expected: ExpectedPatient[] = appointments
        .filter((a) => String(a.ClinicID) === clinicId)
        .filter((a) => String(a.AppointmentDate) === todayIso)
        .filter((a) => {
          const status = String(a.Status || "").toLowerCase();
          return status.includes("allocated") || status.includes("arrived");
        })
        .filter((a) => !checkedInAppointmentIds.has(a.Appointment_ID))
        .map((a) => {
          const p = patientById.get(a.Patient_ID);
          return {
            appointment_id: a.Appointment_ID,
            patient_id: a.Patient_ID,
            patient_name: p?.Name || `Patient #${a.Patient_ID}`,
            patient_opd: p?.OPD_Id || "",
            appointment_date: String(a.AppointmentDate),
            appointment_time: a.AppointmentTime || null,
            status: String(a.Status),
          };
        })
        .sort((a, b) => a.appointment_id - b.appointment_id);

      setArrivedList(arrivedFromServer);
      setExpectedList(expected);
    } catch (error) {
      console.error("Failed to load check-in side lists:", error);
    } finally {
      setLoadingLists(false);
      setRefreshingLists(false);
    }
  }, [apiUrl, clinicId, todayIso]);

  useEffect(() => {
    void loadSideLists();
  }, [loadSideLists]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadSideLists(true);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [loadSideLists]);

  // ── Start scanner after <video> is in DOM ────────────────────────────────────
  useEffect(() => {
    if (!isScanning || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (!controlsRef.current) controlsRef.current = controls;
        if (result && !hasScannedRef.current) {
          hasScannedRef.current = true;
          void handleQrPayload(result.getText());
        }
        if (err && (err as Error).name !== "NotFoundException") {
          pushToast("error", "Camera read error. Please try again.");
        }
      })
      .catch((err: unknown) => {
        pushToast("error", err instanceof Error ? err.message : "Could not access camera.");
        setIsScanning(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  // ── Check-in handler (shared for QR and manual) ──────────────────────────────
  const processArrival = async (url: string, options: RequestInit): Promise<void> => {
    setSubmitting(true);
    try {
      const response = await authFetch(url, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { detail?: string }).detail || "Verification failed");
      }
      const info = data as ArrivalInfo;

      // Optimistic local update before the sync refresh.
      setArrivedList((prev) => {
        const exists = prev.findIndex((a) => a.appointment_id === info.appointment_id);
        if (exists !== -1) {
          const updated = [...prev];
          updated[exists] = info;
          return updated;
        }
        return [info, ...prev];
      });
      setExpectedList((prev) => prev.filter((row) => row.appointment_id !== info.appointment_id));

      const qNum = info.queue?.queueNumber;
      pushToast(
        "success",
        qNum
          ? `${info.patient_name} checked in — Queue #${qNum}`
          : `${info.patient_name} checked in successfully`
      );
      void loadSideLists(true);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQrPayload = async (payload: string) => {
    stopScanner();
    await processArrival(`${apiUrl}/api/v1/staff/clinic-staff/verify-arrival-qr/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
  };

  const handleCheckIn = async () => {
    if (!appointmentId.trim()) return;
    const id = appointmentId.trim();
    setAppointmentId("");
    await processArrival(
      `${apiUrl}/api/v1/staff/clinic-staff/verify-arrival/?appointment_id=${encodeURIComponent(id)}`,
      { method: "POST" }
    );
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const reader = new BrowserMultiFormatReader();
      const objectUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(objectUrl);
      URL.revokeObjectURL(objectUrl);
      await handleQrPayload(result.getText());
    } catch {
      pushToast("error", "Unable to read QR image. Please try another image.");
    } finally {
      event.target.value = "";
    }
  };

  const startScanner = () => {
    hasScannedRef.current = false;
    setIsScanning(true);
  };

  const handleSelectExpected = (row: ExpectedPatient) => {
    setAppointmentId(String(row.appointment_id));
    if (!isScanning) startScanner();
    pushToast("success", `Selected ${row.patient_name}. Now scan their QR to verify arrival.`);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 text-slate-700 mb-6">
          <QrCode className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">QR Code Check-in</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left: scanner card ─────────────────────────────────────── */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-emerald-600 text-white py-4 px-5">
              <CardTitle className="text-lg">Verify Patient Arrival</CardTitle>
              <p className="text-xs text-emerald-100 mt-0.5">
                Scan QR code or enter the appointment ID to check in a patient.
              </p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Camera / upload buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={isScanning ? stopScanner : startScanner}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-5 text-sm font-medium transition-colors ${
                    isScanning
                      ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <QrCode className="h-7 w-7" />
                  {isScanning ? "Stop Camera" : "Use Device Camera"}
                </button>

                <label className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-white py-5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Upload className="h-7 w-7" />
                  Upload QR Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Camera preview */}
              {isScanning && (
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                  <video ref={videoRef} className="w-full object-cover" style={{ minHeight: 240 }} muted playsInline />
                  <p className="text-center text-xs text-slate-400 py-2">
                    Hold the QR code steady in front of the camera
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <div className="flex-1 h-px bg-slate-200" />
                or enter appointment ID manually
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Manual ID input */}
              <div className="space-y-2">
                <label htmlFor="appt-id" className="text-sm font-medium text-slate-700">
                  Appointment ID
                </label>
                <input
                  id="appt-id"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleCheckIn(); }}
                  placeholder="e.g. 1201"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button
                onClick={() => void handleCheckIn()}
                disabled={!appointmentId.trim() || submitting}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 h-11"
              >
                {submitting ? "Verifying…" : "Confirm Arrival & Add to Queue"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Right: arrived patients panel ─────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Today Check-in Monitor</h3>
                <p className="text-xs text-slate-500">Clinic-wise list for quick QR verification</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadSideLists(true)} disabled={refreshingLists || loadingLists}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshingLists ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs text-slate-600">
                  <span className="font-medium">Clinic ID</span>
                  <input
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="text-xs text-slate-500 flex items-end">Date: {todayIso}</div>
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Expected Patients (Click then Scan)
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                    {expectedList.length}
                  </span>
                </h4>

                {loadingLists ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading expected patients...</div>
                ) : expectedList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-slate-400 text-sm text-center">
                    No expected patients for check-in.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                    {expectedList.map((a) => (
                      <button
                        key={`expected-${a.appointment_id}`}
                        onClick={() => handleSelectExpected(a)}
                        className="text-left rounded-xl border border-blue-200 bg-white p-3 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">{a.patient_name}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">APT-{a.appointment_id}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">OPD: {a.patient_opd || "-"}</p>
                        <p className="text-xs text-slate-500 mt-1">{a.appointment_date} {a.appointment_time || ""}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Arrived / Checked-In
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5">
                    {arrivedList.length}
                  </span>
                </h4>

                {loadingLists ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading arrived patients...</div>
                ) : arrivedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-slate-400 text-sm gap-2">
                    <User className="h-8 w-8 opacity-30" />
                    No arrivals yet today
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[420px] pr-1">
                    {arrivedList.map((a) => (
                      <div
                        key={`arrived-${a.appointment_id}`}
                        className="rounded-xl border border-emerald-200 bg-white shadow-sm p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                              {a.patient_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{a.patient_name}</p>
                              <p className="text-xs text-slate-400">OPD: {a.patient_opd}</p>
                            </div>
                          </div>
                          {a.queue?.queueNumber && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-xs font-bold px-3 py-1">
                              <ListOrdered className="h-3 w-3" />
                              #{a.queue.queueNumber}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>Appt&nbsp;<strong>#{a.appointment_id}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>Patient ID&nbsp;<strong>{a.patient_id}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            <span>{a.appointment_date}</span>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {a.queue?.status ? String(a.queue.status).replaceAll("_", " ") : "Arrived"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

