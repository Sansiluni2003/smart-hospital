"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type User = {
  UserID: number;
  Email: string;
  Role: "Patient" | "Doctor" | "Staff" | "Admin";
  Status?: "Pending" | "Active";
};

type Appointment = {
  Appointment_ID: number;
  Status?: string;
};

type ReportType = "appointments" | "arrival-completion" | "doctor-workload" | "queue-wait";

const getToday = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboardPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<{ total_users?: number; total_doctors?: number; total_staff?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportType, setReportType] = useState<ReportType>("appointments");
  const [reportStart, setReportStart] = useState(getToday());
  const [reportEnd, setReportEnd] = useState(getToday());
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportRows, setReportRows] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setError("Admin login is required. Please log in again.");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.Role !== "Admin") {
        setError("Only admin users can access this page.");
        router.push("/login");
        return;
      }
    } catch {
      setError("Invalid session. Please log in again.");
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usersRes, summaryRes, appointmentsRes] = await Promise.all([
          authFetch(`${apiUrl}/api/v1/admin/admin/users/`),
          authFetch(`${apiUrl}/api/v1/admin/admin/report/`),
          authFetch(`${apiUrl}/api/v1/appointments/`),
        ]);

        if (usersRes.status === 401 || summaryRes.status === 401) {
          setError("Session expired or invalid token. Please log in again as Admin.");
          router.push("/login");
          return;
        }

        if (usersRes.status === 403 || summaryRes.status === 403) {
          setError("Only Admin role can access dashboard analytics.");
          router.push("/login");
          return;
        }

        if (!usersRes.ok || !summaryRes.ok) {
          throw new Error("Failed to load dashboard summary.");
        }

        const usersData = await usersRes.json();
        const summaryData = await summaryRes.json();
        const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : [];

        setUsers(usersData);
        setSummary(summaryData);
        setAppointments(appointmentsData);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiUrl, router]);

  const stats = useMemo(() => {
    const patients = users.filter((user) => user.Role === "Patient").length;
    const pendingPatients = users.filter((user) => user.Role === "Patient" && user.Status === "Pending").length;
    const activeAppointments = appointments.filter((appointment) => {
      const status = String(appointment.Status || "").toLowerCase();
      return !["completed", "cancelled", "skipped"].includes(status);
    }).length;

    return [
      { label: "Total Users", value: summary?.total_users ?? users.length },
      { label: "Doctors", value: summary?.total_doctors ?? users.filter((user) => user.Role === "Doctor").length },
      { label: "Staff", value: summary?.total_staff ?? users.filter((user) => user.Role === "Staff").length },
      { label: "Patients", value: patients },
      { label: "Pending Patients", value: pendingPatients },
      { label: "Active Appointments", value: activeAppointments },
    ];
  }, [appointments, summary, users]);

  const reportColumns = useMemo(() => {
    if (reportRows.length === 0) return [] as string[];
    return Object.keys(reportRows[0]);
  }, [reportRows]);

  const handleGenerateReport = async () => {
    if (!reportStart || !reportEnd) {
      setReportError("Please select both start and end dates.");
      return;
    }

    if (reportStart > reportEnd) {
      setReportError("Start date must be before end date.");
      return;
    }

    setReportLoading(true);
    setReportError(null);
    setReportRows([]);

    try {
      const url = `${apiUrl}/api/v1/reports/reports/${reportType}?start=${reportStart}&end=${reportEnd}`;
      const response = await authFetch(url);

      if (response.status === 401) {
        setReportError("Session expired or invalid token. Please log in again as Admin.");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setReportError("Only Admin role can generate operational reports.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate report.");
      }

      const data = await response.json();
      const rows = Array.isArray(data)
        ? data.map((item) => ({ ...item }))
        : [{ ...data }];

      setReportRows(rows);
    } catch (err: any) {
      setReportError(err?.message || "Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Welcome, Admin</h1>
        <p className="text-gray-700">Monitor real-time system metrics, manage accounts, and generate operational reports.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-3" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <span className="text-3xl font-bold text-purple-700">{stat.value}</span>
                <span className="text-gray-600 mt-2">{stat.label}</span>
              </div>
            ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Operational Reports</h2>
          <p className="text-sm text-gray-600 mt-1">Generate date-based reports for appointments, arrivals, doctor workload, and queue performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value as ReportType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="appointments">Appointment Counts</option>
              <option value="arrival-completion">Arrival/Completion</option>
              <option value="doctor-workload">Doctor Workload</option>
              <option value="queue-wait">Queue Wait Times</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={reportStart}
              onChange={(event) => setReportStart(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={reportEnd}
              onChange={(event) => setReportEnd(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="w-full bg-green-700 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reportLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        {reportError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{reportError}</p>}

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {reportColumns.length > 0 ? (
                  reportColumns.map((column) => (
                    <th key={column} className="px-4 py-2 text-left text-sm font-semibold text-gray-700 capitalize">
                      {column.replaceAll("_", " ")}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Result</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reportRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500">Generate a report to view results.</td>
                </tr>
              ) : (
                reportRows.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    {reportColumns.map((column) => (
                      <td key={column} className="px-4 py-2 text-sm text-gray-700">
                        {typeof row[column] === "object" && row[column] !== null
                          ? JSON.stringify(row[column])
                          : String(row[column] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/register" className="bg-purple-700 text-white rounded-lg p-6 flex flex-col items-center hover:bg-purple-800 transition">
          <span className="text-lg font-semibold mb-2">Register Staff/Doctors</span>
          <span className="text-sm">Create new staff or doctor accounts instantly.</span>
        </Link>
        <Link href="/admin/users" className="bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center hover:bg-blue-800 transition">
          <span className="text-lg font-semibold mb-2">Manage Users</span>
          <span className="text-sm">Review and remove doctor/staff accounts using live data.</span>
        </Link>
      </div>
    </div>
  );
}