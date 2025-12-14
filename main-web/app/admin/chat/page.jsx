"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminChatDashboard from "@/components/admin/AdminChatDashboard";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function AdminChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  const token = getSessionToken();
  const adminUser = useQuery(api.users.adminMeByToken, token ? { token } : "skip");

  // Authentication check
  useEffect(() => {
    if (adminUser === undefined) return; // Still loading
    
    if (!adminUser || !token) {
      // This will be handled by the layout
      return;
    }
  }, [adminUser, token]);

  if (adminUser === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!adminUser || !token) {
    return null; // Layout will handle redirect
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat Support</h1>
        <p className="text-gray-600 mt-1">
          Manage customer conversations and support tickets
        </p>
      </div>

      <AdminChatDashboard
        adminUser={adminUser}
        selectedSessionId={selectedSessionId}
        onSelectSession={setSelectedSessionId}
      />
    </div>
  );
}