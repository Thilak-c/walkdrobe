"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  History,
  Settings,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
  LogOut,
  Globe,
  Store,
  Receipt,
  Trash2,
  Upload,
  TrendingDown,
  ShoppingCart,
  Tag,
  Bell,
  User,
  Shield,
  Check,
  CheckCircle2,
  Cpu,
  SlidersHorizontal
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Footwear Categories
const footwearCategories = [
  { href: "/products?category=Sneakers", label: "Sneakers", icon: Package, description: "Casual sneakers" },
  { href: "/products?category=Sports", label: "Sports", icon: Package, description: "Sports footwear" },
  { href: "/products", label: "All Footwear", icon: Package, description: "View all products" },
];

// Offline Shop Navigation
const offlineNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Overview & stats" },
  { href: "/billing", label: "Billing", icon: Receipt, description: "Create & print bills" },
  { href: "/add-product", label: "Add Product", icon: PlusCircle, description: "New inventory item" },
  { href: "/products", label: "All Products", icon: Package, description: "Manage inventory" },
  { href: "/import", label: "Import", icon: Upload, description: "Bulk import products" },
  { href: "/alerts", label: "Low Stock", icon: AlertTriangle, description: "Items to restock" },
  { href: "/dead-stock", label: "Dead Stock", icon: TrendingDown, description: "No sales products" },
  { href: "/history", label: "History", icon: History, description: "Stock movements" },
  { href: "/trash", label: "Trash", icon: Trash2, description: "Deleted products" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Preferences" },
];

// Website Store Navigation
const websiteNavItems = [
  { href: "/website", label: "Dashboard", icon: LayoutDashboard, description: "Website overview" },
  { href: "/website/orders", label: "Orders", icon: ShoppingCart, description: "Customer orders" },
  { href: "/website/coupons", label: "Coupons", icon: Tag, description: "Discount codes" },
  { href: "/website/add-product", label: "Add Product", icon: PlusCircle, description: "Add to website" },
  { href: "/website/products", label: "All Products", icon: Package, description: "Website inventory" },
  { href: "/website/import", label: "Import", icon: Upload, description: "Bulk import products" },
  { href: "/website/alerts", label: "Low Stock", icon: AlertTriangle, description: "Items to restock" },
  { href: "/website/dead-stock", label: "Dead Stock", icon: TrendingDown, description: "No sales products" },
  { href: "/website/history", label: "History", icon: History, description: "Stock movements" },
  { href: "/website/trash", label: "Trash", icon: Trash2, description: "Deleted products" },
  { href: "/website/settings", label: "Settings", icon: Settings, description: "Preferences" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeType, setStoreType] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [cModeOpen, setCModeOpen] = useState(false);
  
  // Auto-expand C-Mode accordion if browsing advanced pages
  useEffect(() => {
    if (!storeType) return;
    const navItems = storeType === "website" ? websiteNavItems : offlineNavItems;
    const coreHrefs = storeType === "website"
      ? ["/website", "/website/orders", "/website/coupons", "/website/add-product", "/website/products"]
      : ["/", "/billing", "/add-product", "/products"];
    const isCurrentAdvanced = navItems.some(item => !coreHrefs.includes(item.href) && pathname === item.href);
    if (isCurrentAdvanced) {
      setCModeOpen(true);
    }
  }, [pathname, storeType]);
  
  // Header Actions Toolbar States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "system",
      title: "New System Mod Active",
      message: "Order fulfillment systems & product dashboards upgraded.",
      time: "Just now",
      unread: true
    },
    {
      id: 2,
      type: "order",
      title: "Order #WD-2049 Received",
      message: "Prepaid order verified & locked for UK 43 Sports Shoe.",
      time: "10m ago",
      unread: true
    },
    {
      id: 3,
      type: "stock",
      title: "Low Stock Warning",
      message: "Sneakers in Black UK 44 are running low (2 units left).",
      time: "1h ago",
      unread: false
    }
  ]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const authData = localStorage.getItem("insys_auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setStoreType(parsed.storeType);
      } catch (e) { }
    }
  }, []);

  const handleSwitchStore = (newType) => {
    const authData = localStorage.getItem("insys_auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      parsed.storeType = newType;
      localStorage.setItem("insys_auth", JSON.stringify(parsed));
      setStoreType(newType);
      setShowSwitcher(false);
      toast.success(`Switched to ${newType === "website" ? "Website Store" : "Offline Shop"}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("insys_auth");
    toast.success("Logged out");
    router.push("/login");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success("All marked as read");
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow cursor-pointer"
      >
        <Menu size={22} className="text-slate-700" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-slate-100
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 p-1">
                <img src="/logo.png" alt="Walkdrobe Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 font-poppins">Walkdrobe</h1>
                <p className="text-[10px] text-slate-400 tracking-widest font-extrabold">INVENTORY</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Store Type Badge - Clickable */}
          {storeType && (
            <div className="mt-4 relative">
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl transition-all border cursor-pointer hover:shadow-md ${
                  storeType === "website"
                    ? "bg-blue-50 border-blue-150"
                    : "bg-emerald-50 border-emerald-150"
                }`}
              >
                <div className="flex items-center gap-2">
                  {storeType === "website" ? (
                    <Globe size={16} className="text-blue-500" />
                  ) : (
                    <Store size={16} className="text-emerald-500" />
                  )}
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    storeType === "website" ? "text-blue-600" : "text-emerald-600"
                  }`}>
                    {storeType === "website" ? "Website Store" : "Offline Shop"}
                  </span>
                </div>
                <ChevronRight size={14} className={`transition-transform ${showSwitcher ? "rotate-90" : ""} ${
                  storeType === "website" ? "text-blue-400" : "text-emerald-400"
                }`} />
              </button>

              {/* Dropdown Switcher */}
              {showSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10 animate-fadeIn">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                    Switch Store Mode
                  </p>
                  <button
                    onClick={() => handleSwitchStore("website")}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      storeType === "website" ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <Globe size={18} className="text-blue-500" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-700">Website Store</p>
                      <p className="text-[10px] text-slate-400">walkdrobe.in</p>
                    </div>
                    {storeType === "website" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSwitchStore("offline")}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      storeType === "offline" ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <Store size={18} className="text-emerald-500" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-700">Offline Shop</p>
                      <p className="text-[10px] text-slate-400">Patna Store</p>
                    </div>
                    {storeType === "offline" && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-none">
          {/* Footwear Categories Section */}


          {/* Main Navigation */}
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3.5 mb-2.5 mt-6">
            {storeType === "website" ? "Website Operations" : "Offline Operations"}
          </p>
          
          {/* Render Core Items (Show Forever) */}
          {(() => {
            const navItems = storeType === "website" ? websiteNavItems : offlineNavItems;
            const coreHrefs = storeType === "website"
              ? ["/website", "/website/orders", "/website/coupons", "/website/add-product", "/website/products"]
              : ["/", "/billing", "/add-product", "/products"];
            
            const coreItems = navItems.filter(item => coreHrefs.includes(item.href));
            const advancedItems = navItems.filter(item => !coreHrefs.includes(item.href));

            return (
              <>
                <div className="space-y-1">
                  {coreItems.map((item, idx) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          group flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200
                          ${isActive
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "text-slate-600 hover:bg-slate-50"
                          }
                        `}
                      >
                        <div className={`
                          p-2 rounded-xl transition-colors
                          ${isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"}
                        `}>
                          <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-extrabold ${isActive ? "text-white" : "text-slate-700"}`}>
                            {item.label}
                          </p>
                          <p className={`text-[10px] font-medium leading-normal ${isActive ? "text-white/70" : "text-slate-400"}`}>
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight size={14} className="text-white/50" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Collapsible C-Mode Tools fold */}
                {advancedItems.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setCModeOpen(!cModeOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer border ${
                        cModeOpen 
                          ? "bg-slate-50 border-slate-250 text-slate-800" 
                          : "bg-white border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                      } font-extrabold text-xs`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SlidersHorizontal size={14} className={cModeOpen ? "text-slate-800 animate-spin-slow" : "text-slate-400"} />
                        <span>Advanced Utilities</span>
                      </div>
                      <ChevronRight size={13} className={`transition-transform duration-200 ${cModeOpen ? "rotate-90 text-slate-700" : "text-slate-400"}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {cModeOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-1 mt-1.5 pl-2 border-l border-slate-100 ml-4.5"
                        >
                          {advancedItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                  group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                                  ${isActive
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                  }
                                `}
                              >
                                <Icon size={14} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
                                <div className="flex-1">
                                  <p className={`text-[11px] font-bold ${isActive ? "text-white" : "text-slate-700"}`}>
                                    {item.label}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            );
          })()}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <a
            href="https://walkdrobe.in/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all group"
          >
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
              <ExternalLink size={16} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700">Storefront Admin</p>
              <p className="text-[10px] text-slate-400">walkdrobe.in</p>
            </div>
          </a>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-2xl transition-all group cursor-pointer"
          >
            <div className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
              <LogOut size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold">Sign Out</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Global Top Navbar Actions Toolbar */}
      <div className="fixed top-4 right-4 lg:right-8 z-40 flex items-center gap-3 animate-fadeIn">
        {/* Pulsating Connectivity Beacon */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm text-[10px] font-bold text-slate-600">
          <Cpu className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>SYS SYNC</span>
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center text-slate-600 hover:text-slate-800 cursor-pointer relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 flex flex-col"
              >
                {/* Popover Header */}
                <div className="px-4.5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Logs</h4>
                    <p className="text-sm font-extrabold tracking-tight mt-0.5">Notifications</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                </div>

                {/* Popover Body List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs italic">
                      No notifications logged.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 flex gap-3 transition-colors hover:bg-slate-50/50 ${
                          item.unread ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              {item.unread && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />}
                              {item.title}
                            </span>
                            <span className="text-[9px] text-slate-400 whitespace-nowrap">{item.time}</span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{item.message}</p>
                        </div>
                        <button
                          onClick={() => clearNotification(item.id)}
                          className="p-1 text-slate-300 hover:text-slate-600 transition-colors h-fit cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
              AD
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
              >
                {/* Popover User Header */}
 
                {/* Popover Actions List */}
                <div className="p-2 space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Access Role: Admin</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all text-xs font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
