"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Package } from "lucide-react";

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/login") {
      setIsChecking(false);
      return;
    }

    // Check auth from localStorage
    const authData = localStorage.getItem("insys_auth");
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Must have both isLoggedIn AND storeType selected
        if (parsed.isLoggedIn && parsed.storeType) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
      } catch (e) {
        // Invalid auth data
      }
    }

    // Not authenticated, redirect to login
    router.push("/login");
  }, [pathname, router]);

  // Show loading while checking auth
  if (isChecking && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-slate-100 rounded-3xl mb-4 animate-bounce p-2 shadow-sm">
            <img src="/logo.png" alt="Walkdrobe Logo" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // On login page, just render children
  if (pathname === "/login") {
    return children;
  }

  // Authenticated, render children
  if (isAuthenticated) {
    return children;
  }

  // Fallback loading
  return null;
}
