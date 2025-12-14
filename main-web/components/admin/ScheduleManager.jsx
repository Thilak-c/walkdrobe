"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  FiPlus, 
  FiCalendar, 
  FiClock, 
  FiMail, 
  FiPlay, 
  FiPause,
  FiTrash2,
  FiEdit,
  FiUsers
} from "react-icons/fi";

export default function ScheduleManager({ adminUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get scheduled reports (placeholder - would need to implement the query)
  // const scheduledReports = useQuery(api.scheduledReports.getScheduledReports);

  // Mock data for demonstration
  const scheduledReports = [
    {
      _id: "1",
      name: "Weekly Sales Report",
      description: "Comprehensive sales analysis sent every Monday",
      schedule: {
        frequency: "weekly",
        cronExpression: "0 9 * * 1",
        timezone: "UTC",
      },
      parameters: {
        recipients: ["manager@company.com", "sales@company.com"],
        formats: ["pdf", "csv"],
      },
      isActive: true,
      lastRun: "2024-01-15T09:00:00Z",
      nextRun: "2024-01-22T09:00:00Z",
      runCount: 12,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      _id: "2",
      name: "Daily Inventory Check",
      description: "Stock levels and low inventory alerts",
      schedule: {
        frequency: "daily",
        cronExpression: "0 8 * * *",
        timezone: "UTC",
      },
      parameters: {
        recipients: ["inventory@company.com"],
        formats: ["csv"],
      },
      isActive: true,
      lastRun: "2024-01-21T08:00:00Z",
      nextRun: "2024-01-22T08:00:00Z",
      runCount: 45,
      createdAt: "2023-12-01T00:00:00Z",
    },
    {
      _id: "3",
      name: "Monthly Customer Report",
      description: "Customer analytics and growth metrics",
      schedule: {
        frequency: "monthly",
        cronExpression: "0 10 1 * *",
        timezone: "UTC",
      },
      parameters: {
        recipients: ["ceo@company.com", "marketing@company.com"],
        formats: ["pdf"],
      },
      isActive: false,
      lastRun: "2024-01-01T10:00:00Z",
      nextRun: "2024-02-01T10:00:00Z",
      runCount: 3,
      createdAt: "2023-11-01T00:00:00Z",
    },
  ];

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case "daily": return "🌅";
      case "weekly": return "📅";
      case "monthly": return "🗓️";
      case "custom": return "⚙️";
      default: return "📊";
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
  };

  const formatNextRun = (nextRun) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffHours = Math.ceil((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `in ${diffDays} days`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Scheduled Reports</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automate report generation and delivery
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <FiPlus className="mr-2" size={16} />
          Schedule Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <FiPlay className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-semibold text-gray-900">
                {scheduledReports.filter(r => r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <FiPause className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paused</p>
              <p className="text-xl font-semibold text-gray-900">
                {scheduledReports.filter(r => !r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FiMail className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Runs</p>
              <p className="text-xl font-semibold text-gray-900">
                {scheduledReports.reduce((sum, r) => sum + r.runCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <FiUsers className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipients</p>
              <p className="text-xl font-semibold text-gray-900">
                {new Set(scheduledReports.flatMap(r => r.parameters.recipients)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">All Scheduled Reports</h4>
          </div>
          
          <div className="divide-y divide-gray-200">
            {scheduledReports.map((report) => (
              <div key={report._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="text-2xl mr-4 mt-1">
                      {getFrequencyIcon(report.schedule.frequency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-medium text-gray-900">{report.name}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.isActive)}`}>
                          {report.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-500">
                          <FiCalendar className="mr-2" size={14} />
                          <span className="capitalize">{report.schedule.frequency}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <FiClock className="mr-2" size={14} />
                          <span>Next: {formatNextRun(report.nextRun)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <FiMail className="mr-2" size={14} />
                          <span>{report.parameters.recipients.length} recipients</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="text-xs text-gray-500">
                          Formats: {report.parameters.formats.join(", ").toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Runs: {report.runCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {report.lastRun ? new Date(report.lastRun).toLocaleDateString() : "Never"}
                        </div>
                      </div>

                      {/* Recipients */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Recipients:</div>
                        <div className="flex flex-wrap gap-1">
                          {report.parameters.recipients.map((email, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Schedule"
                    >
                      <FiEdit size={16} />
                    </button>
                    
                    <button
                      className={`p-2 transition-colors ${
                        report.isActive 
                          ? "text-gray-400 hover:text-orange-600" 
                          : "text-gray-400 hover:text-green-600"
                      }`}
                      title={report.isActive ? "Pause Schedule" : "Resume Schedule"}
                    >
                      {report.isActive ? <FiPause size={16} /> : <FiPlay size={16} />}
                    </button>
                    
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Schedule"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
          <p className="text-gray-500 mb-4">
            Set up automated report generation and delivery to save time
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Schedule Your First Report
          </button>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Schedule New Report</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="text-center py-8">
              <FiCalendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">Report scheduling form coming soon!</p>
              <p className="text-sm text-gray-400">
                This feature will allow you to set up automated report generation with custom schedules, 
                recipient lists, and delivery preferences.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}