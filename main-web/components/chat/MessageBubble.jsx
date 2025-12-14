"use client";

import React from "react";
import { FiUser, FiShield, FiInfo } from "react-icons/fi";

export default function MessageBubble({ message, isOwn }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = () => {
    switch (message.senderType) {
      case "admin":
        return <FiShield size={12} className="text-black" />;
      case "system":
        return <FiInfo size={12} className="text-gray-500" />;
      default:
        return <FiUser size={12} className="text-gray-500" />;
    }
  };

  const getMessageStyles = () => {
    if (message.senderType === "system") {
      return "bg-gray-100 text-gray-600 text-center text-xs py-2 px-3 rounded-lg mx-4";
    }
    
    if (isOwn) {
      return "bg-black text-white ml-8 rounded-lg rounded-br-sm";
    }
    
    return "bg-gray-100 text-gray-900 mr-8 rounded-lg rounded-bl-sm";
  };

  if (message.senderType === "system") {
    return (
      <div className={getMessageStyles()}>
        <div className="flex items-center justify-center gap-1">
          {getMessageIcon()}
          <span>{message.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-md px-3 py-2 ${getMessageStyles()}`}>
        {/* Sender info for non-own messages */}
        {!isOwn && (
          <div className="flex items-center gap-1 mb-1">
            {getMessageIcon()}
            <span className="text-xs font-medium text-gray-600">
              {message.senderName}
            </span>
          </div>
        )}
        
        {/* Message content */}
        <div className="text-sm">
          {message.isDeleted ? (
            <em className="text-gray-400">[Message deleted]</em>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.message}</p>
          )}
        </div>
        
        {/* Timestamp and status */}
        <div className={`flex items-center justify-between mt-1 text-xs ${
          isOwn ? "text-gray-300" : "text-gray-500"
        }`}>
          <span>{formatTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="ml-2 italic">edited</span>
          )}
          {isOwn && (
            <div className="flex items-center gap-1 ml-2">
              {message.isRead ? (
                <span className="text-gray-200">✓✓</span>
              ) : (
                <span className="text-gray-300">✓</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}