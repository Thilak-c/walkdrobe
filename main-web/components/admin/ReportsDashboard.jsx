"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiUsers, 
  FiShoppingCart, 
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiDownload,
  FiPlus,
  FiEye
} from "react-icons/fi";
import ReportBuilder from "./ReportBuilder";
import ReportViewer from "./ReportViewer";
import TemplateManager from "./TemplateManager";
import ScheduleManager from "./ScheduleManager";

export default function ReportsDashboard({ adminUser, activeTab, onTabChange }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  // Get report templates
  const reportTemplates = useQuery(api.reportTemplates.getReportTemplates);
  
  // Get user's recent reports
  const recentReports = useQuery(
    api.reportGenerator.getUserReportInstances,
    { limit: 10 }
  );

  // Get report categories
  const categories = useQuery(api.reportTemplates.getReportCategories);

  // Sample analytics data (would come from actual analytics functions)
  const analyticsData = {
    totalOrders: 1234,
    totalRevenue: 45678.90,
    totalCustomers: 567,
    totalProducts: 89,
    ordersGrowth: 12.5,
    revenueGrowth: 8.3,
    customersGrowth: 15.2,
    productsGrowth: 5.1,
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FiShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <FiTrendingUp className="text-green-500 mr-1" size={16} />
            <span className="text-sm text-green-600">+{analyticsData.ordersGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analyticsData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <FiDollarSign className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <FiTrendingUp className="text-green-500 mr-1" size={16} />
            <span className="text-sm text-green-600">+{analyticsData.revenueGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <FiUsers className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <FiTrendingUp className="text-green-500 mr-1" size={16} />
            <span className="text-sm text-green-600">+{analyticsData.customersGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalProducts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <FiPackage className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <FiTrendingUp className="text-green-500 mr-1" size={16} />
            <span className="text-sm text-green-600">+{analyticsData.productsGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowReportBuilder(true)}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <FiPlus className="mr-2" size={20} />
            <span className="font-medium">Create New Report</span>
          </button>
          
          <button
            onClick={() => onTabChange("templates")}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <FiBarChart2 className="mr-2" size={20} />
            <span className="font-medium">Browse Templates</span>
          </button>
          
          <button
            onClick={() => onTabChange("scheduled")}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <FiCalendar className="mr-2" size={20} />
            <span className="font-medium">Schedule Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
          <button
            onClick={() => onTabChange("reports")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View All
          </button>
        </div>
        
        {recentReports && recentReports.length > 0 ? (
          <div className="space-y-3">
            {recentReports.slice(0, 5).map((report) => (
              <div key={report._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FiBarChart2 className="text-gray-400 mr-3" size={16} />
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Generated {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === "completed" ? "bg-green-100 text-green-800" :
                    report.status === "failed" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {report.status}
                  </span>
                  {report.status === "completed" && (
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <FiEye size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiBarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No reports generated yet</p>
            <p className="text-sm mt-1">Create your first report to get started</p>
          </div>
        )}
      </div>

      {/* Report Categories */}
      {categories && categories.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div key={category.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 capitalize">{category.name}</p>
                <p className="text-sm text-gray-500">{category.count} templates</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">All Reports</h3>
        <button
          onClick={() => setShowReportBuilder(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <FiPlus className="mr-2" size={16} />
          New Report
        </button>
      </div>

      {recentReports && recentReports.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === "completed" ? "bg-green-100 text-green-800" :
                        report.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.metadata.recordCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {report.status === "completed" && (
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-black hover:text-gray-700 mr-3"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <FiBarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first report</p>
          <button
            onClick={() => setShowReportBuilder(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Report
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Main Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "reports" && renderReports()}
      {activeTab === "templates" && (
        <TemplateManager 
          adminUser={adminUser}
          onCreateReport={(templateId) => {
            setShowReportBuilder(true);
          }}
        />
      )}
      {activeTab === "scheduled" && (
        <ScheduleManager adminUser={adminUser} />
      )}

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <ReportBuilder
          adminUser={adminUser}
          onClose={() => setShowReportBuilder(false)}
          onReportGenerated={(report) => {
            setShowReportBuilder(false);
            setSelectedReport(report);
          }}
        />
      )}

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}