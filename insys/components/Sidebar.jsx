"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";


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



  useEffect(() => {
    const authData = localStorage.getItem("insys_auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setStoreType(parsed.storeType);
        // Website store is now enabled - no more under construction
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
      >
        <Menu size={22} className="text-gray-700" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-gray-100
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 font-poppins">Walkdrobe</h1>
                <p className="text-xs text-gray-400 tracking-wider">INVENTORY</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Store Type Badge - Clickable */}
          {storeType && (
            <div className="mt-4 relative">
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all hover:shadow-md cursor-pointer ${storeType === "website" ? "bg-blue-50 hover:bg-blue-100" : "bg-emerald-50 hover:bg-emerald-100"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {storeType === "website" ? (
                    <Globe size={16} className="text-blue-500" />
                  ) : (
                    <Store size={16} className="text-emerald-500" />
                  )}
                  <span className={`text-xs font-medium ${storeType === "website" ? "text-blue-600" : "text-emerald-600"
                    }`}>
                    {storeType === "website" ? "Website Store" : "Offline Shop"}
                  </span>
                </div>
                <ChevronRight size={14} className={`transition-transform ${showSwitcher ? "rotate-90" : ""} ${storeType === "website" ? "text-blue-400" : "text-emerald-400"
                  }`} />
              </button>

              {/* Dropdown Switcher */}
              {showSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-3 py-2 bg-gray-50">
                    Switch Store
                  </p>
                  <button
                    onClick={() => handleSwitchStore("website")}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors ${storeType === "website" ? "bg-blue-50" : ""
                      }`}
                  >
                    <Globe size={18} className="text-blue-500" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Website Store</p>
                      <p className="text-[10px] text-gray-400">walkdrobe.in</p>
                    </div>
                    {storeType === "website" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSwitchStore("offline")}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors ${storeType === "offline" ? "bg-emerald-50" : ""
                      }`}
                  >
                    <Store size={18} className="text-emerald-500" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">Offline Shop</p>
                      <p className="text-[10px] text-gray-400">Patna Store</p>
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-3 mb-3">
            {storeType === "website" ? "Website Store" : "Offline Shop"}
          </p>
          {(storeType === "website" ? websiteNavItems : offlineNavItems).map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                    : "text-gray-600 hover:bg-gray-50"
                  }
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200"}
                `}>
                  <Icon size={18} className={isActive ? "text-white" : "text-gray-500"} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700"}`}>
                    {item.label}
                  </p>
                  <p className={`text-[11px] ${isActive ? "text-white/70" : "text-gray-400"}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <ChevronRight size={16} className="text-white/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <a
            href="https://walkdrobe.in/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all group"
          >
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
              <ExternalLink size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Admin Panel</p>
              <p className="text-[11px] text-gray-400">walkdrobe.in</p>
            </div>
          </a>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
          >
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <LogOut size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Logout</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
