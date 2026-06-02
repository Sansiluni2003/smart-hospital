/**
 * RealtimeNotifications
 * Drop this anywhere inside a layout. It opens a WebSocket connection,
 * shows toast pop-ups for incoming events, and updates the bell badge count.
 *
 * Usage:
 *   <RealtimeNotifications />
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useWebSocket, type WsEvent } from "@/lib/useWebSocket";

interface ToastItem {
  id: number;
  event: string;
  title: string;
  message: string;
}

const EVENT_ICON: Record<string, string> = {
  appointment_booked:    "📅",
  appointment_allocated: "✅",
  patient_arrived:       "🏥",
  checkin_verified:      "🎫",
  queue_update:          "🔢",
  consultation_started:  "👨‍⚕️",
  sms_sent:              "📱",
};

export default function RealtimeNotifications() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [history, setHistory] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const pushToast = useCallback((evt: WsEvent) => {
    const id = ++idRef.current;
    const item: ToastItem = { id, event: evt.event, title: evt.title, message: evt.message };
    setToasts((p) => [...p, item]);
    setHistory((p) => [item, ...p].slice(0, 50));
    setUnread((n) => n + 1);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 6000);
  }, []);

  useWebSocket(pushToast);

  const dismiss = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <>
      {/* ── Toast stack ── */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white border border-slate-200 shadow-2xl px-4 py-3 text-sm animate-in slide-in-from-top-3 duration-300"
          >
            <span className="text-xl mt-0.5 shrink-0">{EVENT_ICON[t.event] ?? "🔔"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 leading-snug">{t.title}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug line-clamp-3">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 mt-0.5"
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
          {/* backdrop */}
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
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3">
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
