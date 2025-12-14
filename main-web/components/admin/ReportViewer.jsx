"use client";

import React, { useState } from "react";
import { FiX, FiDownload, FiTable, FiBarChart2, FiRefreshCw } from "react-icons/fi";

export default function ReportViewer({ report, onClose }) {
  const [viewMode, setViewMode] = useState("table");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  if (!report || !report.data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="text-center">
            <p className="text-gray-500">No report data available</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = Array.isArray(report.data) ? report.data : [];
  const fields = data.length > 0 ? Object.keys(data[0]) : [];

  // Sorting
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExport = (format) => {
    if (format === "csv") {
      exportToCSV();
    } else if (format === "json") {
      exportToJSON();
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = fields.join(",");
    const rows = data.map(row => 
      fields.map(field => {
        const value = row[field];
        // Escape commas and quotes in CSV
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      // Format numbers with commas
      return value.toLocaleString();
    }
    if (typeof value === "string" && value.includes("@")) {
      // Likely an email, keep it as is (already masked in backend)
      return value;
    }
    return String(value);
  };

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {fields.map((field) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  {field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                  {sortField === field && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {fields.map((field) => (
                <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(row[field])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSummaryView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => {
        const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
        const numericValues = values.filter(val => typeof val === "number" || !isNaN(Number(val)));
        
        let summary = {};
        
        if (numericValues.length > 0) {
          const numbers = numericValues.map(Number);
          summary = {
            count: values.length,
            sum: numbers.reduce((a, b) => a + b, 0),
            avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
          };
        } else {
          summary = {
            count: values.length,
            unique: new Set(values).size,
          };
        }

        return (
          <div key={field} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Count:</span>
                <span className="font-medium">{summary.count}</span>
              </div>
              {summary.sum !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sum:</span>
                    <span className="font-medium">{summary.sum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium">{summary.avg.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium">{summary.min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium">{summary.max}</span>
                  </div>
                </>
              )}
              {summary.unique !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Unique:</span>
                  <span className="font-medium">{summary.unique}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{report.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
              <span>Records: {report.metadata.recordCount.toLocaleString()}</span>
              <span>Time: {report.metadata.generationTime}ms</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiTable className="mr-1" size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "summary"
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiBarChart2 className="mr-1" size={16} />
              Summary
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm"
            >
              <FiDownload className="mr-1" size={16} />
              CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="flex items-center px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm"
            >
              <FiDownload className="mr-1" size={16} />
              JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {data.length === 0 ? (
            <div className="text-center py-12">
              <FiBarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No data available in this report</p>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === "table" ? renderTableView() : renderSummaryView()}
            </div>
          )}
        </div>

        {/* Pagination */}
        {viewMode === "table" && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}