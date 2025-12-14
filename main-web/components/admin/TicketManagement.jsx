"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiX, FiTag, FiClock, FiUser, FiSave, FiStar } from "react-icons/fi";

export default function TicketManagement({ sessionId, adminUser, onClose }) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [customerSatisfaction, setCustomerSatisfaction] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get support tickets for this session
  const tickets = useQuery(
    api.supportTickets.getSupportTickets,
    { limit: 10 }
  );

  // Find the ticket for this session
  const currentTicket = tickets?.find(ticket => ticket.sessionId === sessionId);

  // Get ticket statistics
  const ticketStats = useQuery(
    api.supportTickets.getTicketStats,
    { adminId: adminUser._id, timeframe: "week" }
  );

  // Mutations
  const updateTicket = useMutation(api.supportTickets.updateTicket);
  const assignTicket = useMutation(api.supportTickets.assignTicket);

  const handleStatusUpdate = async (newStatus) => {
    if (!currentTicket) return;

    setIsUpdating(true);
    try {
      await updateTicket({
        ticketId: currentTicket._id,
        status: newStatus,
        resolutionNotes: newStatus === "resolved" ? resolutionNotes : undefined,
        customerSatisfaction: newStatus === "closed" ? customerSatisfaction : undefined,
      });
    } catch (error) {
      console.error("Failed to update ticket:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityUpdate = async (newPriority) => {
    if (!currentTicket) return;

    setIsUpdating(true);
    try {
      await updateTicket({
        ticketId: currentTicket._id,
        priority: newPriority,
      });
    } catch (error) {
      console.error("Failed to update priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentTicket) return;

    setIsUpdating(true);
    try {
      await assignTicket({
        ticketNumber: currentTicket.ticketNumber,
        assignedTo: adminUser._id,
        assignedBy: adminUser._id,
      });
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiTag className="text-blue-500" size={18} />
          <h3 className="font-medium text-gray-900">Support Ticket</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTicket ? (
          <>
            {/* Ticket Info */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {currentTicket.ticketNumber}
                </h4>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTicket.status)}`}>
                    {currentTicket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentTicket.priority)}`}>
                    {currentTicket.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Subject:</span>
                  <p className="text-gray-600 mt-1">{currentTicket.subject}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{currentTicket.description}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600 ml-2 capitalize">{currentTicket.category}</span>
                </div>

                <div className="flex items-center gap-1 text-gray-500">
                  <FiClock size={12} />
                  <span>Created: {formatDate(currentTicket.createdAt)}</span>
                </div>

                {currentTicket.assignedTo && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <FiUser size={12} />
                    <span>Assigned to: {adminUser.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <h5 className="font-medium text-gray-900">Actions</h5>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={isUpdating || currentTicket.status === "in_progress"}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("resolved")}
                    disabled={isUpdating || currentTicket.status === "resolved"}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("closed")}
                    disabled={isUpdating || currentTicket.status === "closed"}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Priority Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={currentTicket.priority}
                  onChange={(e) => handlePriorityUpdate(e.target.value)}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignment */}
              {!currentTicket.assignedTo && (
                <div>
                  <button
                    onClick={handleAssignToMe}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiUser size={14} />
                    Assign to Me
                  </button>
                </div>
              )}

              {/* Resolution Notes */}
              {(currentTicket.status === "in_progress" || currentTicket.status === "resolved") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about the resolution..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
              )}

              {/* Customer Satisfaction */}
              {currentTicket.status === "resolved" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Satisfaction (Optional)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setCustomerSatisfaction(rating)}
                        className={`p-1 rounded transition-colors ${
                          rating <= customerSatisfaction
                            ? "text-yellow-500"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      >
                        <FiStar size={16} fill={rating <= customerSatisfaction ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <FiTag size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No ticket found for this session</p>
          </div>
        )}

        {/* Statistics */}
        {ticketStats && (
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-3">Your Stats (This Week)</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">{ticketStats.total}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">{ticketStats.resolved}</div>
                <div className="text-gray-600">Resolved</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-bold text-yellow-600">{ticketStats.inProgress}</div>
                <div className="text-gray-600">In Progress</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-600">{ticketStats.avgResolutionTime}h</div>
                <div className="text-gray-600">Avg Time</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}