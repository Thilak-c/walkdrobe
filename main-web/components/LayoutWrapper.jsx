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

  // Initial loading screen removed: content renders immediately

  // Fetch user data using Convex query (happens in background)
  const user = useQuery(api.users.meByToken, token ? { token } : "skip");

  return (
    // <ConvexProvider client={client}> // Removed ConvexProvider wrapper
    <>
      {/* Render content immediately (initial loading screen removed) */}
      <div>
        {/* <PageViewTracker userId={user?._id} /> */} {/* TEMPORARILY DISABLED */}
        {children}
        <Toaster />
        {/* {!isCheckoutOrAdmin && <HelpChatWidget />} */}
        {/* {!isCheckoutOrAdmin && <Footer />} */}
      </div>
    </>
    // </ConvexProvider> // Removed ConvexProvider wrapper
  );
} 