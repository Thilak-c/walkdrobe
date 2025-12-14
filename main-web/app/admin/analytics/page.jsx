"use client";

import { useRouter } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Analytics Temporarily Disabled</h1>
          <p className="text-gray-600 mb-6">
            The analytics dashboard is currently under maintenance. Please check back later.
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/*
ORIGINAL CODE - UNCOMMENT TO RESTORE:

"use client";

import Link from "next/link";
import { FiUsers, FiEye, FiMap } from "react-icons/fi";
import { CreditCard } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Select an analytics category to view</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/analytics/page-views"
            className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition flex flex-col items-center gap-4 border-2 border-transparent hover:border-purple-500"
          >
            <div className="bg-purple-500 text-white p-4 rounded-full">
              <FiEye className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Page Views</h2>
              <p className="text-gray-500 text-sm mt-1">Track page views and visitor trends</p>
            </div>
          </Link>

          <Link
            href="/admin/analytics/payment-details"
            className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition flex flex-col items-center gap-4 border-2 border-transparent hover:border-green-500"
          >
            <div className="bg-green-500 text-white p-4 rounded-full">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <p className="text-gray-500 text-sm mt-1">Payment methods and revenue analytics</p>
            </div>
          </Link>

          <Link
            href="/admin/analytics/user-activity"
            className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition flex flex-col items-center gap-4 border-2 border-transparent hover:border-orange-500"
          >
            <div className="bg-orange-500 text-white p-4 rounded-full">
              <FiUsers className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">User Activity</h2>
              <p className="text-gray-500 text-sm mt-1">Real-time user sessions and actions</p>
            </div>
          </Link>

          <Link
            href="/admin/analytics/map"
            className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition flex flex-col items-center gap-4 border-2 border-transparent hover:border-blue-500"
          >
            <div className="bg-blue-500 text-white p-4 rounded-full">
              <FiMap className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">View Map</h2>
              <p className="text-gray-500 text-sm mt-1">Geographic distribution of users</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
*/
