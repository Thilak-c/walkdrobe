"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import FooterSimple from "@/components/FooterSimple";
import { 
  Heart, 
  Trash2, 
  Package,
  ShoppingCart,
  ArrowLeft,
  Lock,
  Check
} from "lucide-react";
import ProductCard from "@/components/ProductCard";

// Stagger parent container
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    }
  }
};

// Item transition
const cardBlockVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 130, damping: 17 }
  }
};

export default function WishlistPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Get user data
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  
  useEffect(() => {
    if (me) {
      setIsLoggedIn(true);
    } else if (token && !me) {
      setIsLoggedIn(false);
    }
  }, [me, token]);

  // Wishlist and cart data
  const userWishlist = useQuery(api.wishlist.getUserWishlist, me ? { userId: me._id } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");
  
  // Mutations
  const removeFromWishlistMutation = useMutation(api.wishlist.removeFromWishlist);
  const clearWishlistMutation = useMutation(api.wishlist.clearWishlist);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const result = await removeFromWishlistMutation({ 
        userId: me._id, 
        productId 
      });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || "Failed to remove item");
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) return;
    
    try {
      const result = await clearWishlistMutation({ userId: me._id });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || "Failed to clear wishlist");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex flex-col font-poppins text-slate-900">
        <header className="p-4 flex items-center justify-between max-w-sm w-full mx-auto">
          <motion.button 
            onClick={() => router.back()} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 rounded-xl cursor-pointer shadow-3xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 select-none">Wishlist Access</span>
          <div className="w-8"></div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-xs w-full max-w-sm mx-auto text-center space-y-6"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-slate-100">
              <Lock className="w-7 h-7 text-slate-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Login Required</h2>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wide leading-relaxed">
                Log in to your account to save wardrobe items, sync across devices, and purchase from your personal wishlist.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Log In
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!userWishlist) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center font-poppins">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-xs font-semibold">Loading your wishlist...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 font-poppins text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Spacer headers */}
      <div className="h-16 sm:h-20 xl:h-24"></div>
      <div className="xl:hidden mb-12">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-xs w-full ml-auto"
          >
            <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center space-x-2 text-[10px] sm:text-xs">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-extrabold">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md sm:max-w-4xl mx-auto px-4 py-4 sm:py-10">
        {/* Simplified Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1 flex items-center gap-1.5">
              <Heart className="w-5.5 h-5.5 text-rose-500 fill-rose-500 animate-pulse shrink-0" />
              <span>My Wishlist</span>
            </h1>
            <p className="text-gray-400 text-[10px] sm:text-xs font-semibold tracking-wide">
              Wardrobe items you saved for later lookup.
            </p>
          </div>
          
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="p-2 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        </div>

        {userWishlist.items && userWishlist.items.length > 0 ? (
          <div className="space-y-4">
            {/* Header Actions Ledger */}
            <div className="flex items-center justify-between bg-white border border-slate-100 p-3.5 rounded-2xl shadow-3xs text-[10px] sm:text-xs font-bold">
              <span className="text-slate-400 tracking-wide font-semibold">
                Saved Items Ledger: <strong className="text-slate-800 font-extrabold">{userWishlist.itemCount} Product{userWishlist.itemCount !== 1 ? "s" : ""}</strong>
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearWishlist}
                className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-700 font-black uppercase tracking-wider cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Ledger</span>
              </motion.button>
            </div>
            
            {/* Wishlist Items 2-Column Mobile Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              {userWishlist.items.map((item, index) => (
                <motion.div
                  key={item._id}
                  variants={cardBlockVariants}
                  className="relative group border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-xs transition-shadow duration-200"
                >
                  {/* Standard Product Card */}
                  <ProductCard
                    img={item.productImage}
                    name={item.productName}
                    category={item.category}
                    price={item.price}
                    productId={item.productId}
                    className="w-full border-0 shadow-none hover:shadow-none p-0"
                  />
                  
                  {/* Delete Icon Overlay - Always visible on mobile, hover on desktop */}
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "#fff5f5" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/95 backdrop-blur-xs rounded-full shadow-md hover:bg-rose-50/50 transition-all z-10 block opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer border border-slate-100"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-650" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Quick Actions Footer Panel */}
            <motion.div
              variants={cardBlockVariants}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="text-center sm:text-left">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Quick Ledger Actions</h3>
                <p className="text-slate-450 text-[10px] font-semibold leading-relaxed">Proceed to browse products or inspect cart.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/" className="grow sm:grow-0">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Continue Shop</span>
                  </motion.button>
                </Link>
                
                {cartSummary && cartSummary.totalItems > 0 && (
                  <Link href="/cart" className="grow sm:grow-0">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>View Cart ({cartSummary.totalItems})</span>
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Empty Wishlist State */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 bg-white rounded-2xl border border-slate-100 p-6 space-y-5"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
              <Heart className="w-7 h-7 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-gray-900 mb-1">Your wishlist is empty</h2>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-relaxed font-semibold">
                Start building your wardrobe list by saving products you love! You can retrieve saved items later and purchase them when ready.
              </p>
            </div>
            <Link href="/" className="inline-block">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Start Shopping</span>
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>

      <FooterSimple />
    </div>
  );
}