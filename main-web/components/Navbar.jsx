"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Search, Menu, X, User } from "lucide-react";
import SidebarDrawer from "./SidebarDrawer";
import SearchDropdown from "./SearchDropdown";
import MobileSearchModal from "./MobileSearchModal";

// ---------- Desktop Navbar ----------
export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Auth
  const [token, setToken] = useState(null);
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
    setToken(match ? decodeURIComponent(match[1]) : null);
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");
  const wishlistSummary = useQuery(api.wishlist.getWishlistSummary, me ? { userId: me._id } : "skip");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  return (
    <nav className="z-50 fixed top-0 left-0 right-0 hidden md:block">
      <div className="max-w-7xl mx-auto px- py-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-gray-100"
        >
          
          {/* Left: Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link href="/" className="shrink-0">
              <img src="/logo.png" alt="Walkdrobe" className="h-6" />
            </Link>
          </motion.div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-8">
            {[
              { label: "ALL", link: "all" },
              { label: "SNEAKERS", link: "sneakers" },
              { label: "SPORTS", link: "sports" }
            ].map((item, idx) => (
              <motion.div 
                key={item.label} 
                className="flex items-center gap-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
              >
                {idx > 0 && <span className="text-gray-300">|</span>}
                <Link
                  href={`/shop?ct=${item.link}`}
                  className="text-gray-800 font-medium tracking-wide hover:text-black transition-colors text-sm"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right: Icons */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.form 
                    key="search-form"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSearchSubmit} 
                    className="flex items-center overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-40 px-3 py-1.5 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
                      className="ml-2 p-1.5 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.button
                    key="search-btn"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => setSearchOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Search className="w-5 h-5 text-gray-700" />
                  </motion.button>
                )}
              </AnimatePresence>
              {searchOpen && searchTerm.length >= 2 && (
                <SearchDropdown
                  searchTerm={searchTerm}
                  isOpen={true}
                  onClose={() => setSearchOpen(false)}
                />
              )}
            </div>

            {/* User */}
            <Link href={me ? "/account" : "/login"}>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-5 h-5 text-gray-700" />
              </button>
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart className="w-5 h-5 text-gray-700" />
                {wishlistSummary?.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlistSummary.itemCount > 9 ? "9+" : wishlistSummary.itemCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {me && cartSummary?.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartSummary.totalItems > 9 ? "9+" : cartSummary.totalItems}
                  </span>
                )}
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </nav>
  );
}

// ---------- Mobile Navbar ----------
export function NavbarMobile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Auth
  const [token, setToken] = useState(null);
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
    setToken(match ? decodeURIComponent(match[1]) : null);
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");

  return (
    <>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <img src="/logo.png" alt="Walkdrobe" className="h-5" />
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link href="/cart">
              <button className="relative p-2 hover:bg-gray-100 rounded-full">
                <ShoppingBag className="w-5 h-5" />
                {me && cartSummary?.totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartSummary.totalItems > 9 ? "9+" : cartSummary.totalItems}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <MobileSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Sidebar */}
      <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} width="w-[80%]" />
    </>
  );
}
