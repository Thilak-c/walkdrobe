"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiMessageCircle, FiX, FiMinus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ChatInterface from "./ChatInterface";
import UserContactForm from "./UserContactForm";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function HelpChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showContactForm, setShowContactForm] = useState(true);
  const [guestInfo, setGuestInfo] = useState(null);

  const token = getSessionToken();
  const user = useQuery(api.users.meByToken, token ? { token } : "skip");

  // Check for existing active session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("helpChatSessionId");
    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
      setShowContactForm(false);
    }
  }, []);

  // Save session ID to localStorage when created
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("helpChatSessionId", currentSessionId);
    }
  }, [currentSessionId]);

  const handleStartChat = (sessionId, userInfo = null) => {
    setCurrentSessionId(sessionId);
    setGuestInfo(userInfo);
    setShowContactForm(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Don't clear session - allow resuming
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setGuestInfo(null);
    setShowContactForm(true);
    localStorage.removeItem("helpChatSessionId");
  };

  const toggleWidget = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? 48 : 384
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              height: { duration: 0.3 }
            }}
            className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between p-3 bg-black text-white rounded-t-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isOpen ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiMessageCircle size={18} />
                </motion.div>
                <span className="font-medium text-sm">Help & Support</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: isMinimized ? 0 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiMinus size={16} />
                  </motion.div>
                </motion.button>
                <motion.button
                  onClick={handleCloseChat}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={16} />
                </motion.button>
              </div>
            </motion.div>

            {/* Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 320 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col overflow-hidden"
                >
                  {showContactForm && !currentSessionId ? (
                    <UserContactForm
                      user={user}
                      onStartChat={handleStartChat}
                    />
                  ) : (
                    <ChatInterface
                      sessionId={currentSessionId}
                      user={user}
                      guestInfo={guestInfo}
                      onNewChat={handleNewChat}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={toggleWidget}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
            className="fixed bottom-4 right-4 w-14 h-14 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center z-50"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3 
              }}
            >
              <FiMessageCircle size={24} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}