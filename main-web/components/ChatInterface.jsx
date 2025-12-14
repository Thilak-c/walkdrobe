"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiSend, FiRefreshCw } from "react-icons/fi";
import MessageBubble from "./chat/MessageBubble";
import TypingIndicator from "./chat/TypingIndicator";

export default function ChatInterface({ sessionId, user, guestInfo, onNewChat }) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get messages for this session
  const messages = useQuery(
    api.chatMessages.getSessionMessages,
    sessionId ? { sessionId, limit: 50 } : "skip"
  );

  // Get latest messages for real-time updates
  const latestMessages = useQuery(
    api.chatMessages.getLatestMessages,
    sessionId && lastMessageTime ? { sessionId, since: lastMessageTime } : "skip"
  );

  // Send message mutation
  const sendMessage = useMutation(api.chatMessages.sendMessage);
  const markAsRead = useMutation(api.chatMessages.markMessagesAsRead);

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

  // Mark messages as read when component mounts or new messages arrive
  useEffect(() => {
    if (sessionId && (messages?.length > 0 || latestMessages?.length > 0)) {
      markAsRead({
        sessionId,
        readerId: user?._id,
        readerType: "user",
      }).catch(console.error);
    }
  }, [sessionId, messages, latestMessages, user, markAsRead]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !sessionId) return;

    const messageText = message.trim();
    setMessage("");
    setIsTyping(false);

    try {
      const senderName = user?.name || guestInfo?.name || "User";
      
      const result = await sendMessage({
        sessionId,
        senderId: user?._id,
        senderType: "user",
        senderName,
        message: messageText,
      });

      // Update last message time
      setLastMessageTime(result.createdAt);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Could add toast notification here
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    // Could add typing indicator logic here
  };

  const allMessages = [...(messages || []), ...(latestMessages || [])];
  const uniqueMessages = allMessages.filter((msg, index, arr) => 
    arr.findIndex(m => m._id === msg._id) === index
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user?.name || guestInfo?.name || "Guest User"}
          </p>
          <p className="text-xs text-gray-500">
            Session: {sessionId?.slice(-8)}
          </p>
        </div>
        <button
          onClick={onNewChat}
          className="text-xs text-gray-600 hover:text-black flex items-center gap-1"
        >
          <FiRefreshCw size={12} />
          New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {uniqueMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <FiSend className="mx-auto mb-2" size={24} />
            <p>Start a conversation with our support team!</p>
          </div>
        ) : (
          <>
            {uniqueMessages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={msg.senderType === "user"}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={16} />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1">
          {message.length}/500 characters
        </p>
      </div>
    </div>
  );
}