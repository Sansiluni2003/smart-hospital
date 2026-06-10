/**
 * RealtimeNotifications
 * Role-Aware Notifications Component.
 * Automatically handles history seeding, live WebSocket alerts, and routing
 * based on the authenticated user's role (Staff, Patient, or Doctor).
 *
 * Usage:
 *   <RealtimeNotifications userRole="Staff" profileId={3} />
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWebSocket, type WsEvent } from "@/lib/useWebSocket";
import { authFetch } from "@/lib/authFetch";



interface ToastItem {
  id: number;
  event: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

interface RealtimeNotificationsProps {
  userRole?: "Staff" | "Patient" | "Doctor";
  profileId?: number; // Patient_ID or Doctor_ID if applicable
}

const EVENT_ICON: Record<string, string> = {
  appointment_booked:        "📅",
  allocation_pending:        "⏳",
  appointment_allocated:     "✅",
  patient_arrived:           "🏥",
  checkin_verified:          "🎫",
  patient_account_activated: "🟢",
  queue_update:              "🔢",
  consultation_started:      "👨‍⚕️",
  sms_sent:                  "📱",
};

export default function RealtimeNotifications({ userRole = "Staff", profileId }: RealtimeNotificationsProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [history, setHistory] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const router = useRouter();

  // Dynamic Routing Logic based on User Role and Event Payload
  const getEventRoute = useCallback((event: string, data?: Record<string, any>): string => {
    const params = new URLSearchParams();
    if (data && Object.keys(data).length > 0) {
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          params.append(key, String(val));
        }
      });
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";

    // ── Staff Routing ──
    if (userRole === "Staff") {
      switch (event) {
        case "appointment_booked":
        case "allocation_pending":
          return `/staff/allocation${queryStr}`;
        case "appointment_allocated":
          return `/staff/appointments${queryStr}`;
        case "patient_arrived":
        case "checkin_verified":
          return `/staff/checkin${queryStr}`;
        case "queue_update":
        case "consultation_started":
          return `/staff/live-queue${queryStr}`;
        case "patient_account_activated":
          return `/staff/patient-accounts${queryStr}`;
        case "sms_sent":
          return `/staff/sms${queryStr}`;
        default:
          return `/staff/dashboard${queryStr}`;
      }
    }

    // ── Patient Routing ──
    if (userRole === "Patient") {
      switch (event) {
        case "appointment_booked":
        case "appointment_allocated":
          return `/patient/appointments${queryStr}`;
        case "patient_arrived":
        case "checkin_verified":
        case "queue_update":
        case "consultation_started":
          return `/patient/queue${queryStr}`;
        case "patient_account_activated":
          return `/patient/dashboard${queryStr}`;
        default:
          return `/patient/dashboard${queryStr}`;
      }
    }

    // ── Doctor Routing ──
    if (userRole === "Doctor") {
      switch (event) {
        case "patient_arrived":
        case "queue_update":
        case "consultation_started":
          return `/doctor/me/queue${queryStr}`;
        default:
          return `/doctor/me/dashboard${queryStr}`;
      }
    }

    return "/";
  }, [userRole]);

  // Click handler that navigates to the respective page and clears active toast
  const handleNotificationClick = useCallback((item: ToastItem) => {
    const targetRoute = getEventRoute(item.event, item.data);
    router.push(targetRoute);
    setToasts((prev) => prev.filter((t) => t.id !== item.id));
    setDrawerOpen(false);
  }, [router, getEventRoute]);

  const pushToast = useCallback((evt: WsEvent) => {
    const id = ++idRef.current;
    const item: ToastItem = { 
      id, 
      event: evt.event, 
      title: evt.title, 
      message: evt.message, 
      data: evt.data 
    };
    setToasts((p) => [...p, item]);
    setHistory((p) => [item, ...p].slice(0, 50));
    setUnread((n) => n + 1);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 6000);
  }, []);

  // Safe History Fetch targeting Role-Specific endpoints
  const loadStoredNotifications = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let historyUrl = "";

      if (userRole === "Staff") {
        historyUrl = `${apiUrl}/api/v1/staff/clinic-staff/notifications/?limit=25`;
      } else if (userRole === "Patient" && profileId) {
        historyUrl = `${apiUrl}/api/v1/patients/${profileId}/notifications`;
      } else {
        return; // Doctor or non-configured roles fall back purely to live WS
      }

      const response = await authFetch(historyUrl);
      if (!response.ok) return;

      const items = (await response.json()) as Array<{
        id: number;
        event: string;
        title: string;
        message: string;
        data?: Record<string, any>;
      }>;

      if (items.length === 0) return;

      const seededHistory = items.map((item) => ({
        id: item.id,
        event: item.event,
        title: item.title,
        message: item.message,
        data: item.data,
      }));

      setHistory(seededHistory);
      setUnread(seededHistory.length);

      // Flash only the most recent notification as a toast
      seededHistory.slice(0, 3).forEach((item) => {
        const toastId = ++idRef.current;
        setToasts((prev) => [...prev, { ...item, id: toastId }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 6000);
      });
    } catch {
      // live websocket fallback
    }
  }, [userRole, profileId]);

  useWebSocket(pushToast);

  useEffect(() => {
    void loadStoredNotifications();
  }, [loadStoredNotifications]);

  const dismiss = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <>
      {/* ── Toast stack ── */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => handleNotificationClick(t)}
            className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white border border-slate-200 shadow-2xl px-4 py-3 text-sm animate-in slide-in-from-top-3 duration-300 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all"
          >
            <span className="text-xl mt-0.5 shrink-0">{EVENT_ICON[t.event] ?? "🔔"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 leading-snug">{t.title}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug line-clamp-3">{t.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stops routing navigation
                dismiss(t.id);
              }}
              className="shrink-0 text-slate-400 hover:text-slate-700 mt-0.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Bell button (fixed, bottom-right) ── */}
      <button
        onClick={() => { setDrawerOpen(true); setUnread(0); }}
        className="fixed bottom-6 right-6 z-[9998] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Notification drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[9997] flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-80 bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                history.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-lg shrink-0 mt-0.5">{EVENT_ICON[n.event] ?? "🔔"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
