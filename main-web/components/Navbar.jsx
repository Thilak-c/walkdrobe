"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Search, Menu, X, User, ChevronLeft, ChevronRight } from "lucide-react";
import SidebarDrawer from "./SidebarDrawer";
import SearchDropdown from "./SearchDropdown";
import MobileSearchModal from "./MobileSearchModal";

// ---------- Promo Bar Component ----------
function PromoBar() {
  const [isVisible, setIsVisible] = useState(true);

  const offers = [
    " Buy 2 Pairs Get Flat ₹400 OFF",
    "Free Delivery for Prepaid Orders",
    "T&C - All offers are only applicable on prepaid orders     "
  ]

  const allOffers = offers.join("  •  •  •  ");

  if (!isVisible) return null;

  return (
    <div className="bg-black text-white relative overflow-hidden">
      <div className="relative py-1.5 flex items-center">
        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap">
            <span className="text-xs font-medium tracking-wide px-4">
              {allOffers}    •    {allOffers}    •     {allOffers}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/20 transition-colors shrink-0"
          aria-label="Close banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 hidden md:block">
      {/* Promo Bar */}
      <PromoBar />
      
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/" className="shrink-0">
              <img src="/logo.png" alt="Walkdrobe" className="h-6" />
            </Link>
          </motion.div>

          {/* Center Navigation */}
          <motion.div 
            className="flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/shop?ct=all" className="text-sm text-gray-600 hover:text-black transition-colors">
              All
            </Link>
            <Link href="/shop?ct=sneakers" className="text-sm text-gray-600 hover:text-black transition-colors">
              Sneakers
            </Link>
            <Link href="/shop?ct=sports" className="text-sm text-gray-600 hover:text-black transition-colors">
              Sports
            </Link>
          </motion.div>

          {/* Right Icons */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
                      className="w-40 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
                      className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg"
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
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
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
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist">
              <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
                {wishlistSummary?.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlistSummary.itemCount > 9 ? "9+" : wishlistSummary.itemCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                {me && cartSummary?.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartSummary.totalItems > 9 ? "9+" : cartSummary.totalItems}
                  </span>
                )}
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
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
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white backdrop-blur-md md:hidden">
        {/* Promo Bar */}
        <PromoBar />
        
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
