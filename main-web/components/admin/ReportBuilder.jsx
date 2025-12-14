"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiX, FiPlay, FiSave, FiFilter, FiCalendar } from "react-icons/fi";

export default function ReportBuilder({ adminUser, onClose, onReportGenerated }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportName, setReportName] = useState("");
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Get available templates
  const templates = useQuery(api.reportTemplates.getReportTemplates);
  
  // Generate report mutation
  const generateReport = useMutation(api.reportGenerator.generateReport);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setReportName(`${template.name} - ${new Date().toLocaleDateString()}`);
    
    // Initialize filters with default values
    const initialFilters = {};
    template.filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        initialFilters[filter.name] = filter.defaultValue;
      }
    });
    setFilters(initialFilters);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateReport({
        templateId: selectedTemplate._id,
        name: reportName.trim(),
        parameters: {
          filters,
          dateRange,
          limit: 1000, // Default limit
        },
      });

      onReportGenerated({ 
        _id: result.reportInstanceId,
        name: reportName,
        status: "completed"
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFilterInput = (filter) => {
    const value = filters[filter.name] || "";

    switch (filter.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            placeholder={filter.label}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(filter.name, Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            placeholder={filter.label}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="">Select {filter.label}</option>
            {filter.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange(filter.name, selectedValues);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            size={Math.min(filter.options?.length || 3, 5)}
          >
            {filter.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            placeholder={filter.label}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Report</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!selectedTemplate ? (
            /* Template Selection */
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Report Template</h3>
              
              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                          {template.category}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {template.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No report templates available</p>
                  <p className="text-sm text-gray-400 mt-1">Contact your administrator to create templates</p>
                </div>
              )}
            </div>
          ) : (
            /* Report Configuration */
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Templates
              </button>

              {/* Report Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter report name"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline mr-1" size={14} />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              {selectedTemplate.filters && selectedTemplate.filters.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    <FiFilter className="inline mr-1" size={14} />
                    Filters
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.filters.map((filter) => (
                      <div key={filter.name}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {filter.label}
                          {filter.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFilterInput(filter)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedTemplate.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Category: {selectedTemplate.category}</span>
                  <span>Type: {selectedTemplate.type}</span>
                  <span>Fields: {selectedTemplate.fields.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={!reportName.trim() || isGenerating}
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FiPlay className="mr-2" size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}