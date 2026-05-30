"use client";
import { useState } from "react";
import { QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaffCheckinPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [qrInput, setQrInput] = useState("");

  const startScanner = () => {
    setIsScanning(true);
    setScannerError("");
    setScanMessage("Camera started (simulated)");
  };
  const stopScanner = () => {
    setIsScanning(false);
    setScanMessage("");
  };
  const handleCheckIn = () => {
    setScanMessage(`Patient with appointment ID ${qrInput} marked as arrived!`);
    setQrInput("");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-2 text-slate-700 mb-4">
        <QrCode className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold">QR Code Check-in</h2>
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-emerald-600 text-white">
          <CardTitle className="text-xl">Patient marked as arrived</CardTitle>
          <p className="text-sm text-emerald-50">Scan QR code, upload an image, or enter appointment ID manually.</p>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button onClick={startScanner} className="h-24 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50" variant="outline">
              <span className="flex flex-col items-center gap-2">
                <QrCode className="h-7 w-7" />
                <span>Use Device Camera</span>
              </span>
            </Button>
            <label className="relative">
              <input type="file" accept="image/*" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              <Button className="h-24 w-full bg-white text-blue-700 border border-blue-200 hover:bg-blue-50" variant="outline">
                <span className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-7 w-7" />
                  <span>Upload QR Image</span>
                </span>
              </Button>
            </label>
          </div>
          {isScanning && (
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 text-white">
              <div id="staff-reader" className="min-h-[280px] rounded-lg bg-black" />
              <div className="mt-3 flex justify-end">
                <Button onClick={stopScanner} variant="ghost" className="text-white hover:bg-white/10">
                  Stop camera
                </Button>
              </div>
            </div>
          )}
          {scannerError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{scannerError}</div>}
          {scanMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{scanMessage}</div>}
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">Appointment ID result</span>
            <input
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              placeholder="e.g. APT-1201"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
            />
          </label>
          <Button onClick={handleCheckIn} disabled={!qrInput.trim()} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            Confirm arrival and add to live queue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
