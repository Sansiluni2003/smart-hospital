"use client";
import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialSmsLog = [
  "Queue message sent to +94771234567 for APT-1201.",
];

export default function StaffSmsPage() {
  const [manualSmsNumber, setManualSmsNumber] = useState("");
  const [manualSmsMessage, setManualSmsMessage] = useState("");
  const [smsLog, setSmsLog] = useState(initialSmsLog);

  const simulateSms = () => {
    if (manualSmsNumber && manualSmsMessage) {
      setSmsLog([
        `Manual SMS sent to ${manualSmsNumber}: ${manualSmsMessage}`,
        ...smsLog,
      ]);
      setManualSmsNumber("");
      setManualSmsMessage("");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <MessageSquareText className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">SMS Center</h2>
      </div>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Phone number</span>
              <input
                value={manualSmsNumber}
                onChange={e => setManualSmsNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="+94xxxxxxxxx"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Message</span>
              <textarea
                value={manualSmsMessage}
                onChange={e => setManualSmsMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[110px]"
                placeholder="Queue number, doctor, time, or arrival instructions"
              />
            </label>
          </div>
          <Button onClick={simulateSms} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Send className="mr-2 h-4 w-4" />
            Send SMS
          </Button>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">SMS log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {smsLog.map((entry, index) => (
            <div key={`${index}-${entry}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {entry}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
