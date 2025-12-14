"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiSend, FiUser, FiMail, FiPhone, FiTag, FiClock, FiUserCheck } from "react-icons/fi";
import MessageBubble from "../chat/MessageBubble";
import TicketManagement from "./TicketManagement";

export default function ChatSessionView({ sessionId, adminUser }) {
  const [message, setMessage] = useState("");
  const [showTicketPanel, setShowTicketPanel] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get session details
  const session = useQuery(
    api.chatSessions.getChatSession,
    sessionId ? { sessionId } : "skip"
  );

  // Get messages for this session
  const messages = useQuery(
    api.chatMessages.getSessionMessages,
    sessionId ? { sessionId, limit: 100 } : "skip"
  );

  // Get latest messages for real-time updates
  const latestMessages = useQuery(
    api.chatMessages.getLatestMessages,
    sessionId && lastMessageTime ? { sessionId, since: lastMessageTime } : "skip"
  );

  // Get support ticket for this session
  const ticket = useQuery(
    api.supportTickets.getSupportTickets,
    { limit: 1 }
  );

  // Mutations
  const sendMessage = useMutation(api.chatMessages.sendMessage);
  const markAsRead = useMutation(api.chatMessages.markMessagesAsRead);
  const updateSessionStatus = useMutation(api.chatSessions.updateChatSessionStatus);
  const assignTicket = useMutation(api.supportTickets.assignTicket);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestMessages]);

  // Update last message time when messages load
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1];
      setLastMessageTime(latest.createdAt);
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (sessionId && (messages?.length > 0 || latestMessages?.length > 0)) {
      markAsRead({
        sessionId,
        readerId: adminUser._id,
        readerType: "admin",
      }).catch(console.error);
    }
  }, [sessionId, messages, latestMessages, adminUser._id, markAsRead]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !sessionId) return;

    const messageText = message.trim();
    setMessage("");

    try {
      const result = await sendMessage({
        sessionId,
        senderId: adminUser._id,
        senderType: "admin",
        senderName: adminUser.name || "Support",
        message: messageText,
      });

      setLastMessageTime(result.createdAt);

      // Auto-assign session to this admin if not assigned
      if (session && !session.assignedTo) {
        await updateSessionStatus({
          sessionId,
          assignedTo: adminUser._id,
          status: "active",
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleAssignToMe = async () => {
    if (!session) return;

    try {
      await updateSessionStatus({
        sessionId,
        assignedTo: adminUser._id,
        status: "active",
      });
    } catch (error) {
      console.error("Failed to assign session:", error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!session) return;

    try {
      await updateSessionStatus({
        sessionId,
        status: newStatus,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!session) return;

    try {
      await updateSessionStatus({
        sessionId,
        priority: newPriority,
      });
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const allMessages = [...(messages || []), ...(latestMessages || [])];
  const uniqueMessages = allMessages.filter((msg, index, arr) => 
    arr.findIndex(m => m._id === msg._id) === index
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const userInfo = session.userInfo || session.guestInfo;

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {userInfo?.name || "Guest User"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {userInfo?.email && (
                    <div className="flex items-center gap-1">
                      <FiMail size={12} />
                      <span>{userInfo.email}</span>
                    </div>
                  )}
                  {userInfo?.phone && (
                    <div className="flex items-center gap-1">
                      <FiPhone size={12} />
                      <span>{userInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status Dropdown */}
              <select
                value={session.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="waiting">Waiting</option>
                <option value="closed">Closed</option>
              </select>

              {/* Priority Dropdown */}
              <select
                value={session.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Assign Button */}
              {!session.assignedTo && (
                <button
                  onClick={handleAssignToMe}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <FiUserCheck size={12} />
                  Assign to Me
                </button>
              )}

              {/* Ticket Panel Toggle */}
              <button
                onClick={() => setShowTicketPanel(!showTicketPanel)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <FiTag size={12} />
                Ticket
              </button>
            </div>
          </div>

          {/* Session Info */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Session: {sessionId.slice(-8)}</span>
            <span className="capitalize">Category: {session.category}</span>
            {session.assignedAdmin && (
              <span>Assigned to: {session.assignedAdmin.name}</span>
            )}
            <div className="flex items-center gap-1">
              <FiClock size={10} />
              <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {uniqueMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages in this conversation yet.</p>
            </div>
          ) : (
            <>
              {uniqueMessages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.senderType === "admin"}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiSend size={16} />
              Send
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1">
            {message.length}/1000 characters
          </p>
        </div>
      </div>

      {/* Ticket Management Panel */}
      {showTicketPanel && (
        <div className="w-80 border-l bg-gray-50">
          <TicketManagement
            sessionId={sessionId}
            adminUser={adminUser}
            onClose={() => setShowTicketPanel(false)}
          />
        </div>
      )}
    </div>
  );
}