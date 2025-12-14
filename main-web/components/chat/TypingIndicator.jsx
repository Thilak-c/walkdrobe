"use client";

import React from "react";

export default function TypingIndicator({ senderName = "Support" }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-xs lg:max-w-md px-3 py-2 bg-gray-100 text-gray-900 mr-8 rounded-lg rounded-bl-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{senderName} is typing</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}