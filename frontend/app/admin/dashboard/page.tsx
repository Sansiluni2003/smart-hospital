import Link from "next/link";

export default function AdminDashboardPage() {
  // Placeholder stats; replace with real data from API/backend
  const stats = [
    { label: "Total Users", value: 1200 },
    { label: "Doctors", value: 45 },
    { label: "Staff", value: 30 },
    { label: "Patients", value: 1125 },
    { label: "Active Appointments", value: 18 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, Admin!</h1>
      <p className="mb-8 text-gray-700">Monitor the overall system, manage users, and oversee hospital operations.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-3xl font-bold text-purple-700">{stat.value}</span>
            <span className="text-gray-600 mt-2">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/register" className="bg-purple-700 text-white rounded-lg p-6 flex flex-col items-center hover:bg-purple-800 transition">
          <span className="text-lg font-semibold mb-2">Register Staff/Doctors</span>
          <span className="text-sm">Add new staff or doctors to the system</span>
        </Link>
        <Link href="/admin/users" className="bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center hover:bg-blue-800 transition">
          <span className="text-lg font-semibold mb-2">Manage Users</span>
          <span className="text-sm">Update or delete user accounts</span>
        </Link>
        <Link href="/admin/dashboard" className="bg-green-700 text-white rounded-lg p-6 flex flex-col items-center hover:bg-green-800 transition">
          <span className="text-lg font-semibold mb-2">System Overview</span>
          <span className="text-sm">View system statistics and activity</span>
        </Link>
      </div>
    </div>
  );
}