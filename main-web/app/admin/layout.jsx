"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FiMenu, FiX, FiHome, FiPackage,FiMessageSquare,FiMail, FiUpload, FiUsers, FiFileText, FiBarChart2, FiLogOut, FiShield, FiTrash2, FiMessageCircle, FiBell } from "react-icons/fi";



const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const token = getSessionToken();
  const adminUser = useQuery(api.users.adminMeByToken, token ? { token } : "skip");
  const signOut = useMutation(api.users.signOut);

  // Authentication check
  useEffect(() => {
    if (adminUser === undefined) return; // Still loading
    
    if (!adminUser || !token) {
      // No valid admin session, redirect to admin login
      router.push("/admin-login");
      return;
    }
  }, [adminUser, token, router]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (adminUser === undefined) {
        // If still loading after 10 seconds, redirect to login
        router.push("/login");
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [adminUser, router]);

  // Show loading while checking authentication
  if (adminUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show login redirect message if not authenticated
  if (!adminUser || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-500">
        <div className="text-center space-y-4">
          <FiShield size={48} className="text-red-900 mx-auto" />
          <h2 className="text-xl font-bold text-black">Access Denied</h2>
          <p className="text-gray-900">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut({ sessionToken: token });
      document.cookie = "sessionToken=; Path=/; SameSite=Lax; Max-Age=0";
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      document.cookie = "sessionToken=; Path=/; SameSite=Lax; Max-Age=0";
      router.push("/admin/login");
    }
  };
  const navLinks = [
    { label: "Dashboard", href: "/admin", icon: <FiHome /> },
    { label: "Products", href: "/admin/products", icon: <FiPackage /> },
    { label: "Upload Product", href: "/admin/upload", icon: <FiUpload /> },
    { label: "Orders", href: "/admin/orders", icon: <FiFileText /> },
    { label: "Users", href: "/admin/users", icon: <FiUsers /> },
    { label: "Chat Support", href: "/admin/chat", icon: <FiMessageCircle /> },
    // { label: "Analytics & Reports", href: "/admin/analytics", icon: <FiBarChart2 /> },
    { label: "Email Notifications", href: "/admin/notifications", icon: <FiBell /> },
    { label: "Contacts", href: "/admin/contacts", icon: <FiMail /> },

     { label: "Suggestions", href: "/admin/suggestions", icon: <FiMessageSquare /> },
  ];

  // Add trash link for super admins only
  const allNavLinks = adminUser?.role === "super_admin" 
    ? [...navLinks, { label: "Trash", href: "/admin/trash", icon: <FiTrash2 /> }]
    : navLinks;

  return (
    <div className="flex min-h-screen font-sans text-gray-900 bg-gray-50">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-6 transform md:translate-x-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 z-50`}>
        
        {/* Mobile header */}
        <div className="flex justify-between items-center mb-8 md:hidden">
          <span className="font-bold text-2xl">Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-900">
            <FiX size={28} />
          </button>
        </div>

        {/* Nav links */}
        <ul className="space-y-4">
          {allNavLinks.map(link => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-800"
              >
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin Info */}
        <div className="mt-auto pt-6 space-y-3">
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">Logged in as</p>
            <p className="font-medium text-sm">{adminUser.name}</p>
            <p className="text-xs text-gray-600">
              {adminUser.role === "super_admin" ? "Super Admin" : "Admin"}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col  transition-all duration-300">
        
        {/* Top Navbar */}
        <nav className="flex items-center justify-between bg-white shadow-md px-6 py-4 sticky top-0 z-40">
          <button className="md:hidden text-gray-900" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={28} />
          </button>
          <span className="font-bold text-2xl text-gray-900">Admin Panel</span>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{adminUser.name}</p>
              <p className="text-xs text-gray-600">
                {adminUser.role === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-shadow shadow-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
