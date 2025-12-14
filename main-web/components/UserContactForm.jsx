"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiUser, FiMail, FiPhone, FiMessageSquare, FiSend } from "react-icons/fi";

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Support" },
  { value: "product", label: "Product Question" },
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Payment" },
  { value: "return", label: "Returns & Exchanges" },
];

export default function UserContactForm({ user, onStartChat }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    category: "general",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createChatSession = useMutation(api.chatSessions.createChatSession);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please describe how we can help you";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Please provide more details (at least 10 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const guestInfo = user ? undefined : {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
      };

      const result = await createChatSession({
        userId: user?._id,
        guestInfo,
        category: formData.category,
        initialMessage: formData.message.trim(),
      });

      // Start the chat with the new session
      onStartChat(result.sessionId, guestInfo);
    } catch (error) {
      console.error("Failed to create chat session:", error);
      setErrors({ submit: "Failed to start chat. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900 text-sm">Start a Conversation</h3>
        <p className="text-xs text-gray-600 mt-1">
          Tell us how we can help you today
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiUser className="inline mr-1" size={12} />
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Your full name"
              disabled={!!user?.name}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiMail className="inline mr-1" size={12} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="your@email.com"
              disabled={!!user?.email}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Field (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiPhone className="inline mr-1" size={12} />
              Phone (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Your phone number"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FiMessageSquare className="inline mr-1" size={12} />
              How can we help? *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none ${
                errors.message ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Please describe your question or issue..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.message ? (
                <p className="text-xs text-red-600">{errors.message}</p>
              ) : (
                <div />
              )}
              <span className="text-xs text-gray-400">
                {formData.message.length}/500
              </span>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting Chat...
              </>
            ) : (
              <>
                <FiSend size={14} />
                Start Chat
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}