"use client";
import { useState, useCallback } from "react";
import { MessageSquareText, Send, Bell, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authFetch } from "@/lib/authFetch";
import { useWebSocket, type WsEvent } from "@/lib/useWebSocket";

interface LogEntry {
  id: number;
  time: string;
  text: string;
  source: "manual" | "realtime";
  event?: string;
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

let _id = 0;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function StaffSmsPage() {
  const [manualSmsNumber, setManualSmsNumber] = useState("");
  const [manualSmsMessage, setManualSmsMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  const addLog = (text: string, source: "manual" | "realtime", event?: string) => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog((p) => [{ id: ++_id, time: now, text, source, event }, ...p].slice(0, 100));
  };

  // Listen for real-time events from the WebSocket
  const handleWsEvent = useCallback((evt: WsEvent) => {
    setConnected(true);
    addLog(`[${evt.title}] ${evt.message}`, "realtime", evt.event);
  }, []);

  useWebSocket(handleWsEvent);

  const sendSms = async () => {
    if (!manualSmsNumber.trim() || !manualSmsMessage.trim()) return;
    setSending(true);
    try {
      const res = await authFetch(`${apiUrl}/api/v1/staff/clinic-staff/send-sms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: manualSmsNumber.trim(), message: manualSmsMessage.trim() }),
      });
      if (res.ok) {
        addLog(`SMS sent to ${manualSmsNumber.trim()}: ${manualSmsMessage.trim()}`, "manual", "sms_sent");
        setManualSmsNumber("");
        setManualSmsMessage("");
      } else {
        const d = await res.json().catch(() => ({}));
        addLog(`Failed to send SMS: ${(d as { detail?: string }).detail || res.statusText}`, "manual");
      }
    } catch (e) {
      addLog(`Error: ${e instanceof Error ? e.message : "Unknown error"}`, "manual");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <MessageSquareText className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold">SMS Center & Activity Feed</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          <Wifi className="h-3.5 w-3.5" />
          {connected ? "Live" : "Connecting…"}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual SMS sender */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-800">Send Manual SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-1.5 block text-sm text-slate-700">
              <span className="font-medium">Phone number</span>
              <input
                value={manualSmsNumber}
                onChange={e => setManualSmsNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+94xxxxxxxxx or 07xxxxxxxx"
              />
            </label>
            <label className="space-y-1.5 block text-sm text-slate-700">
              <span className="font-medium">Message</span>
              <textarea
                value={manualSmsMessage}
                onChange={e => setManualSmsMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Queue number, doctor, time, or arrival instructions…"
              />
            </label>
            <Button
              onClick={sendSms}
              disabled={!manualSmsNumber.trim() || !manualSmsMessage.trim() || sending}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending…" : "Send SMS"}
            </Button>
          </CardContent>
        </Card>

        {/* Activity / notification feed */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              Live Activity Feed
            </CardTitle>
            {log.length > 0 && (
              <button onClick={() => setLog([])} className="text-xs text-slate-400 hover:text-slate-600">
                Clear
              </button>
            )}
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                Waiting for events…
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                {log.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 ${
                      entry.source === "realtime"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{EVENT_ICON[entry.event ?? ""] ?? (entry.source === "realtime" ? "🔔" : "📱")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="leading-snug break-words">{entry.text}</p>
                      <p className="text-slate-400 mt-0.5">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

