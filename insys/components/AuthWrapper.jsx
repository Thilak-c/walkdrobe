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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4 animate-pulse">
            <Package className="w-8 h-8 text-white" />
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
