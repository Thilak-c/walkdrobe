"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Clock,
  Search,
  ShoppingBag,
  Filter,
  ChevronDown,
  ChevronRight,
  Mail,
  Loader2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  RefreshCcw
} from "lucide-react";

// Stagger parent container
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    }
  }
};

const cardBlockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 140, damping: 18 }
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Email Login/Verify State for unauthenticated users
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpStep, setOtpStep] = useState("input"); // 'input' | 'otp' | 'verified'
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const createSessionForEmailMutation = useMutation(api.auth.createSessionForEmail);
  const claimGuestOrdersMutation = useMutation(api.orders.claimGuestOrders);

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

  // Get user orders
  const userOrders = useQuery(
    api.orders.getUserOrders,
    me ? { userId: me._id } : "skip"
  );

  // Query to verify if any orders exist for the entered email address
  const hasOrdersForEmail = useQuery(
    api.orders.checkOrdersExistByEmail,
    emailInput && emailInput.trim().includes("@") ? { email: emailInput.trim().toLowerCase() } : "skip"
  );

  // Handle direct OTP send for quick order lookup / login
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setAuthError("Please enter a valid email address");
      return;
    }

    setIsSendingOtp(true);
    setAuthError("");

    // Verify if orders exist for this email address before sending OTP
    if (hasOrdersForEmail === false) {
      setAuthError("No orders found for this email address.");
      setIsSendingOtp(false);
      return;
    }

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || "Failed to send verification code");
      } else {
        setOtpStep("otp");
        setAuthSuccess(`Verification code sent to ${cleanEmail}`);
      }
    } catch (err) {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpInput || otpInput.length < 4) {
      setAuthError("Please enter the complete verification code");
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError("");

    try {
      const cleanEmail = emailInput.trim().toLowerCase();
      const verifyRes = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: otpInput.trim() }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setAuthError(verifyData.message || "Invalid verification code");
        setIsVerifyingOtp(false);
        return;
      }

      const sessionRes = await createSessionForEmailMutation({ email: cleanEmail });
      if (sessionRes.success) {
        document.cookie = `sessionToken=${encodeURIComponent(sessionRes.sessionToken)}; path=/; max-age=${30 * 24 * 60 * 60}`;
        setToken(sessionRes.sessionToken);
        setIsLoggedIn(true);

        if (sessionRes.userId) {
          await claimGuestOrdersMutation({
            userId: sessionRes.userId,
            email: cleanEmail,
          });
        }
      } else {
        setAuthError(sessionRes.message || "Login failed");
      }
    } catch (err) {
      setAuthError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Format date helpers
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter orders
  const filteredOrders =
    userOrders?.filter((order) => {
      const matchesStatus =
        selectedStatus === "all" || order.status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.some((item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesStatus && matchesSearch;
    }) || [];

  // Clean, high contrast status badge mapper
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200 font-bold";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200 font-bold";
      case "shipped":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200 font-bold";
    }
  };

  return (
    <div className="min-h-screen min-h-[100vh] min-h-dvh bg-slate-50/50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        {/* Navigation bar */}
        <div className="h-16 sm:h-20 xl:h-24"></div>
        <div className="xl:hidden mb-8">
          <NavbarMobile />
        </div>
        <div className="hidden xl:block">
          <Navbar />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 w-full flex-1 flex flex-col justify-start">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-inter">
                My Orders
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1 font-inter">
                Track status and manage your wardrobe deliveries
              </p>
            </div>
            
       
          </div>

          {/* Unauthenticated view - 1-Click Email Login */}
          {!isLoggedIn ? (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-8 shadow-lg text-left"
            >
              <div className="flex items-center gap-2 mb-3">
             
                <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900 font-inter">
                  Access Your Order History
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium mb-5 leading-relaxed font-inter">
                Enter your email address to instantly view all past orders, live delivery tracking, and invoice details.
              </p>

              {otpStep === "input" && (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-neutral-900 outline-none font-inter"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 font-inter"
                    >
                      {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP Code</>}
                    </button>
                  </div>
                  {authError && <p className="text-rose-600 text-xs font-bold mt-1 font-inter">{authError}</p>}
                </form>
              )}

              {otpStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <p className="text-xs font-bold text-emerald-700 font-inter">{authSuccess}</p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="ENTER 6-DIGIT CODE"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black tracking-widest text-slate-900 focus:bg-white focus:border-neutral-900 outline-none uppercase font-inter"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 font-inter"
                    >
                      {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & View Orders</>}
                    </button>
                  </div>
                  {authError && <p className="text-rose-600 text-xs font-bold mt-1 font-inter">{authError}</p>}
                </form>
              )}
            </motion.div>
          ) : !userOrders ? (
            /* Loading State */
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-neutral-900 animate-spin" />
                <span className="text-slate-600 font-bold text-xs font-inter">Loading your orders...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search & Status Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
      

                {/* Filter Pill Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar scroll-smooth">
                  {["all", "confirmed", "shipped", "delivered", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer font-inter ${
                        selectedStatus === status 
                          ? "bg-neutral-900 text-white shadow-xs" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zero State */}
              {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <ShoppingBag className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1 font-inter">
                    {searchQuery || selectedStatus !== "all" ? "No matching orders found" : "No orders yet"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed font-semibold font-inter">
                    {searchQuery || selectedStatus !== "all" 
                      ? "Try searching for a different order number or clear your status filters."
                      : "When you place an order, it will appear here with live tracking updates."}
                  </p>
                  <button
                    onClick={() => router.push("/shop")}
                    className="bg-neutral-900 hover:bg-black text-white px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer font-inter"
                  >
                    Start Shopping
                  </button>
                </motion.div>
              ) : (
                /* Orders List */
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {filteredOrders.map((order) => (
                    <OrderCardItem 
                      key={order._id}
                      order={order}
                      isExpanded={expandedOrder === order._id}
                      onToggleExpand={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      formatDate={formatDate}
                      getStatusBadge={getStatusBadge}
                      router={router}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Order Card Component
function OrderCardItem({ 
  order, 
  isExpanded, 
  onToggleExpand, 
  formatDate, 
  getStatusBadge,
  router,
}) {
  const isCOD = order.paymentDetails?.paymentMethod === "cod";
  const advanceAmount = order.paymentDetails?.advanceAmount || 200;
  const remainingCOD = order.paymentDetails?.remainingCOD !== undefined ? order.paymentDetails.remainingCOD : Math.max(0, (order.orderTotal || 0) - advanceAmount);

  return (
    <motion.div
      variants={cardBlockVariants}
      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-xs overflow-hidden"
    >
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-inter">Order Number</span>
          <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
            #{order.orderNumber}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${getStatusBadge(order.status)} font-inter`}>
          {order.status}
        </span>
      </div>

      {/* Product Thumbnails & Summary */}
      <div 
        className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => router.push(`/orders/${order.orderNumber}`)}
      >
        <div className="flex items-center gap-4">
          {/* Item Images Preview */}
          <div className="flex -space-x-3 shrink-0">
            {order.items?.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="w-12 h-14 border-2 border-white rounded-xl overflow-hidden bg-slate-100 shadow-xs relative"
                style={{ zIndex: 10 - idx }}
              >
                <img
                  src={item.image || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                />
              </div>
            ))}
            {order.items?.length > 3 && (
              <div className="w-12 h-14 border-2 border-white rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-extrabold text-xs shrink-0 relative">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Item Description */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate font-inter">
              {order.items?.[0]?.name}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-inter">
              {order.items?.length} {order.items?.length === 1 ? "Item" : "Items"}
              {order.items?.length > 1 && ` • +${order.items.length - 1} more`}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 font-inter">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Pricing */}
          <div className="text-right shrink-0">
            {isCOD ? (
              <>
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block font-inter">₹{advanceAmount} Paid Online</span>
                <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block font-inter">COD Due: ₹{remainingCOD.toFixed(2)}</span>
                <span className="text-[10px] font-black text-slate-900 font-mono block">
                  Total: ₹{order.orderTotal?.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-inter">Total Paid</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                  ₹{order.orderTotal?.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-inter"
        >
          <span>{isExpanded ? "Hide Details" : "Quick View"}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <button
          onClick={() => router.push(`/orders/${order.orderNumber}`)}
          className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer font-inter transition-all"
        >
          <span>Track Order</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Quick View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-200 bg-white p-4 space-y-4"
          >
            {/* Items list */}
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 font-inter">Items in Order</h5>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div className="w-10 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-inter">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium font-inter">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-inter pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Delivery Address</span>
                <p className="font-semibold text-slate-800 leading-relaxed text-xs">
                  {order.shippingDetails?.fullName}<br />
                  {order.shippingDetails?.address}, {order.shippingDetails?.city}<br />
                  {order.shippingDetails?.state} - {order.shippingDetails?.pincode}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Payment Breakdown</span>
                <div className="space-y-1 font-medium text-slate-700">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold capitalize text-slate-900">{order.paymentDetails?.paymentMethod || "Prepaid"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{order.orderTotal?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}