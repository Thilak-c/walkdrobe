"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
// import getConvexClient from "../convexClient"; // Removed import
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Toaster } from "react-hot-toast";
import HelpChatWidget from "./HelpChatWidget";
// import Footer from "../ components/footer";
// import PageViewTracker from "./PageViewTracker"; // TEMPORARILY DISABLED

export default function LayoutWrapper({ children }) {
  const [token, setToken] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const pathname = usePathname();
  // const { client, ConvexProvider } = getConvexClient(); // Removed destructuring

  // Check if current page is checkout or admin
  const isCheckoutOrAdmin = pathname?.startsWith('/checkout') || pathname?.startsWith('/admin');

  // Fetch session token on client side
  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Check if we should show loading screen (only once per session)
  useEffect(() => {
    try {
      const hasShown = sessionStorage.getItem('initialLoadingShown');
      if (!hasShown) {
        setShowLoading(true);

        // Show for 3 seconds minimum
        const timer = setTimeout(() => {
          sessionStorage.setItem('initialLoadingShown', 'true');
          setShowLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    } catch (e) {
      // SessionStorage unavailable - don't show loading
      console.error('SessionStorage unavailable:', e);
    }
  }, []);

  // Fetch user data using Convex query (happens in background)
  const user = useQuery(api.users.meByToken, token ? { token } : "skip");

  return (
    // <ConvexProvider client={client}> // Removed ConvexProvider wrapper
    <>
      {/* Render content in background while loading */}
      <div style={{ visibility: showLoading ? 'hidden' : 'visible' }}>
        {/* <PageViewTracker userId={user?._id} /> */} {/* TEMPORARILY DISABLED */}
        {children}
        <Toaster />
        {/* {!isCheckoutOrAdmin && <HelpChatWidget />} */}
        {/* {!isCheckoutOrAdmin && <Footer />} */}
      </div>

      {/* Loading screen overlay */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground"
          >
            <motion.img
              src="/logo.png"
              alt="Loading Logo"
              className="w-32 h-32 mb-4 object-contain opacity-80"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1,
                ease: "easeOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
    // </ConvexProvider> // Removed ConvexProvider wrapper
  );
} 