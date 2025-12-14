"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function InitPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  const token = getSessionToken();
  const adminUser = useQuery(api.users.adminMeByToken, token ? { token } : "skip");
  const createSampleTemplates = useMutation(api.sampleTemplates.createSampleTemplates);

  const handleCreateSamples = async () => {
    if (!adminUser) return;

    setIsCreating(true);
    setMessage("");

    try {
      const result = await createSampleTemplates({ adminUserId: adminUser._id });
      setMessage("Sample templates created successfully! You can now go back to the analytics dashboard.");
    } catch (error) {
      console.error("Failed to create sample templates:", error);
      setMessage("Failed to create sample templates. They may already exist.");
    } finally {
      setIsCreating(false);
    }
  };

  if (adminUser === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!adminUser || !token) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Initialize Reporting System</h1>
        
        <p className="text-gray-600 mb-6">
          This will create sample report templates to get you started with the analytics system. 
          You can customize or delete these templates later.
        </p>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Sample templates include:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Sales Performance Report - Revenue and order analysis</li>
            <li>Product Inventory Report - Stock levels and product data</li>
            <li>Customer Analytics Report - User registration and activity</li>
            <li>Product Reviews Report - Rating trends and feedback</li>
            <li>Cart Abandonment Report - Shopping behavior analysis</li>
            <li>Daily Sales Summary - Quick daily performance overview</li>
          </ul>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-md ${
            message.includes("successfully") 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleCreateSamples}
            disabled={isCreating}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Templates...
              </>
            ) : (
              "Create Sample Templates"
            )}
          </button>

          <a
            href="/admin/analytics"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Analytics
          </a>
        </div>
      </div>
    </div>
  );
}