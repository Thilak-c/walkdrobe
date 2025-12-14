"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiCopy,
  FiFilter,
  FiSearch
} from "react-icons/fi";

export default function TemplateManager({ adminUser, onCreateReport }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get templates and categories
  const templates = useQuery(api.reportTemplates.getReportTemplates);
  const categories = useQuery(api.reportTemplates.getReportCategories);

  // Mutations
  const deleteTemplate = useMutation(api.reportTemplates.deleteReportTemplate);

  // Filter templates
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory && template.isActive;
  }) || [];

  const handleDeleteTemplate = async (templateId) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate({ templateId });
      } catch (error) {
        console.error("Failed to delete template:", error);
        alert("Failed to delete template. Please try again.");
      }
    }
  };

  const getTemplateIcon = (category) => {
    switch (category) {
      case "sales": return "💰";
      case "orders": return "📦";
      case "products": return "🛍️";
      case "customers": return "👥";
      case "inventory": return "📊";
      case "marketing": return "📈";
      default: return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Report Templates</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage and organize your report templates
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <FiPlus className="mr-2" size={16} />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">All Categories</option>
              {categories?.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template._id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTemplateIcon(template.category)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCreateReport(template._id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Create Report"
                  >
                    <FiEye size={16} />
                  </button>
                  {(adminUser.role === "admin" || adminUser.role === "super_admin" || template.createdBy === adminUser._id) && (
                    <>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit Template"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Template"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Template Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Template Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{template.fields.length} fields</span>
                <span>{template.filters.length} filters</span>
                <span className="capitalize">{template.type}</span>
              </div>

              {/* Template Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onCreateReport(template._id)}
                  className="flex-1 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Use Template
                </button>
                <button
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  title="Duplicate Template"
                >
                  <FiCopy size={14} />
                </button>
              </div>

              {/* Permissions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Permissions:</span>
                  <div className="flex gap-1">
                    {template.permissions.map(permission => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory ? "No templates found" : "No templates yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first report template"
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {categories && categories.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-4">Template Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div key={category.name} className="text-center">
                <div className="text-2xl mb-2">{getTemplateIcon(category.name)}</div>
                <div className="text-lg font-semibold text-gray-900">{category.count}</div>
                <div className="text-sm text-gray-500 capitalize">{category.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Create New Template</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Template creation form coming soon!</p>
              <p className="text-sm text-gray-400">
                This feature will allow you to create custom report templates with drag-and-drop field configuration.
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