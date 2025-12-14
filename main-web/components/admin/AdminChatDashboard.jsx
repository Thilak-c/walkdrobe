"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiSearch, FiFilter, FiMessageSquare, FiClock, FiUser, FiMail } from "react-icons/fi";
import ChatSessionView from "./ChatSessionView";

export default function AdminChatDashboard({ adminUser, selectedSessionId, onSelectSession }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get active chat sessions
  const activeSessions = useQuery(api.chatSessions.getActiveChatSessions);
  
  // Get admin's assigned sessions
  const assignedSessions = useQuery(
    api.chatSessions.getAssignedChatSessions,
    { adminId: adminUser._id }
  );

  // Get unread messages for notifications
  const unreadMessages = useQuery(
    api.chatMessages.getAdminUnreadMessages,
    { adminId: adminUser._id }
  );

  // Filter sessions based on search and filters
  const filteredSessions = React.useMemo(() => {
    let sessions = activeSessions || [];
    
    // Apply status filter
    if (statusFilter === "assigned") {
      sessions = assignedSessions || [];
    } else if (statusFilter !== "all") {
      sessions = sessions.filter(session => session.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      sessions = sessions.filter(session => session.priority === priorityFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sessions = sessions.filter(session => 
        session.sessionId.toLowerCase().includes(term) ||
        session.userInfo?.name?.toLowerCase().includes(term) ||
        session.userInfo?.email?.toLowerCase().includes(term) ||
        session.guestInfo?.name?.toLowerCase().includes(term) ||
        session.guestInfo?.email?.toLowerCase().includes(term) ||
        session.category?.toLowerCase().includes(term) ||
        session.lastMessage?.message?.toLowerCase().includes(term)
      );
    }

    return sessions.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }, [activeSessions, assignedSessions, statusFilter, priorityFilter, searchTerm]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getUnreadCount = (sessionId) => {
    const sessionUnread = unreadMessages?.find(group => 
      group.session.sessionId === sessionId
    );
    return sessionUnread?.messages.length || 0;
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
      {/* Sessions List */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiFilter size={16} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="waiting">Waiting</option>
                  <option value="assigned">My Assigned</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No chat sessions found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? "Try adjusting your search" : "New conversations will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSessions.map((session) => {
                const unreadCount = getUnreadCount(session.sessionId);
                const isSelected = selectedSessionId === session.sessionId;
                
                return (
                  <div
                    key={session._id}
                    onClick={() => onSelectSession(session.sessionId)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {session.userInfo ? (
                            <FiUser size={14} className="text-blue-500" />
                          ) : (
                            <FiMail size={14} className="text-gray-500" />
                          )}
                          <span className="font-medium text-sm text-gray-900">
                            {session.userInfo?.name || session.guestInfo?.name || "Guest User"}
                          </span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(session.priority)}`}>
                          {session.priority}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      {session.userInfo?.email || session.guestInfo?.email}
                    </div>

                    <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {session.lastMessage?.message || "No messages yet"}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{session.category}</span>
                      <div className="flex items-center gap-1">
                        <FiClock size={12} />
                        <span>{formatTimeAgo(session.lastMessageAt)}</span>
                      </div>
                    </div>

                    {session.assignedAdmin && (
                      <div className="text-xs text-blue-600 mt-1">
                        Assigned to: {session.assignedAdmin.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1">
        {selectedSessionId ? (
          <ChatSessionView
            sessionId={selectedSessionId}
            adminUser={adminUser}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiMessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">
                Choose a chat session from the list to start helping customers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}