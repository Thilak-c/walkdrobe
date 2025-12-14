"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiArrowLeft, FiClock, FiEye, FiMousePointer, FiSmartphone } from "react-icons/fi";

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;

  // Fetch session details
  const sessionDetails = useQuery(api.analytics.getSessionDetails, { sessionId });

  if (!sessionDetails) {
    return (
      <div className="min-h-screen w-full bg-gray-100 p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading user activity...</p>
      </div>
    );
  }

  const { session, activities } = sessionDetails;

  // Calculate stats
  const pageViews = activities.filter(a => a.activityType === 'page_view').length;
  const actions = activities.filter(a => a.activityType === 'action').length;
  const sessionDuration = Math.floor(session.sessionDuration / 1000 / 60); // minutes

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft /> Back to Analytics
        </button>
        <h1 className="text-3xl font-bold">User Activity Details</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">User</p>
            <p className="text-lg font-semibold">
              {session.userId ? `User ${session.userId.slice(-8)}` : 'GUEST'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Location</p>
            <p className="text-lg font-semibold">
              {session.city ? `${session.city}, ${session.country}` : 'Unknown'}
            </p>
            {session.postal && (
              <p className="text-sm text-gray-500">PIN: {session.postal}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Device</p>
            <p className="text-lg font-semibold capitalize">{session.deviceType}</p>
            <p className="text-sm text-gray-500">{session.browser} • {session.os}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Session Started</p>
            <p className="text-lg font-semibold">
              {new Date(session.sessionStart).toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(session.sessionStart).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Session Duration"
          value={`${sessionDuration}m`}
          icon={<FiClock size={20} />}
          color="bg-blue-500"
        />
        <StatsCard
          title="Page Views"
          value={pageViews}
          icon={<FiEye size={20} />}
          color="bg-green-500"
        />
        <StatsCard
          title="Actions"
          value={actions}
          icon={<FiMousePointer size={20} />}
          color="bg-purple-500"
        />
        <StatsCard
          title="Current Page"
          value={session.currentPage.split('/').pop() || 'Home'}
          icon={<FiSmartphone size={20} />}
          color="bg-orange-500"
          small
        />
      </div>

      {/* Activity Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div
                key={activity._id}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.activityType === 'page_view' ? 'bg-blue-500' :
                    activity.activityType === 'action' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`} />
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Activity details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      activity.activityType === 'page_view' ? 'bg-blue-100 text-blue-700' :
                      activity.activityType === 'action' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.activityType.replace('_', ' ').toUpperCase()}
                    </span>
                    {activity.actionType && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {activity.actionType}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{activity.page}</p>
                  {activity.duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {Math.floor(activity.duration / 1000)}s
                    </p>
                  )}
                  {activity.actionData && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre className="text-gray-600 overflow-x-auto">
                        {JSON.stringify(activity.actionData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No activities recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color, small }) {
  return (
    <div className="p-4 rounded-xl shadow-md bg-white">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-600">{title}</p>
        <div className={`${color} text-white p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className={`${small ? 'text-lg' : 'text-2xl'} font-bold truncate`}>
        {value}
      </p>
    </div>
  );
}
