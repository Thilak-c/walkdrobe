"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Settings, ChevronDown, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function UserNavigation() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  if (!token || !me) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-gray-700 rounded-full transition-all delay-200 hover:border-t-2 hover:border-r-2 border-black/5 bg-transparent  hover:shadow-[10px_-10px_15px_rgba(0,0,0,0.15)] px-2 hover:text-gray-900 px- py-2 -md text-sm font-medium -colors"
        >
          <img className="w-7" src="/user.png" alt="" />
        </Link>
      
      </div>
    );
  }



  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
       {me.photoUrl ? (
          <img
            src={me.photoUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-4 h-4 black" />
          </div>
        )}
        <span className="hidden md:block">{me.name || "User"}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="  fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-48 py-2 z-20 border overflow-hidden bg-white/100 backdrop-blur-md shadow-lg rounded-xl origin-top-right"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{me.name || "User"}</p>
                <p className="text-xs text-gray-500">{me.email}</p>
              </div>
              
              <Link
                href="/orders"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </Link>
              
              <Link
                href="/user/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              
              <Link
                href="/user/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              
              <div className="border-t border-gray-100 my-1" />
              
            
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 