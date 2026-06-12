"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import FooterSimple from "@/components/FooterSimple";
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
  User,
  Filter,
  ChevronDown,
  ChevronRight,
  Phone
} from "lucide-react";

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

export default function OrdersPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

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

  // Format date helpers
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDetailedDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders
  const filteredOrders =
    userOrders?.filter((order) => {
      const matchesStatus =
        selectedStatus === "all" || order.status === selectedStatus;
      const matchesSearch =
        searchQuery === "" ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesStatus && matchesSearch;
    }) || [];

  // Clean, premium, glowing monochrome status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-amber-750 bg-amber-50/50 border border-amber-100/60 font-semibold";
      case "confirmed":
        return "text-blue-750 bg-blue-50/50 border border-blue-100/60 font-semibold";
      case "shipped":
        return "text-indigo-750 bg-indigo-50/50 border border-indigo-100/60 font-semibold";
      case "delivered":
        return "text-emerald-750 bg-emerald-50/50 border border-emerald-100/60 font-black";
      case "cancelled":
        return "text-rose-750 bg-rose-50/50 border border-rose-100/60 font-semibold";
      default:
        return "text-slate-700 bg-slate-50 border border-slate-100/80";
    }
  };

  // Get delivery status icon for detailed checkpoints
  const getDeliveryStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "order_placed":
        return <Calendar className="w-3 h-3 text-blue-500" />;
      case "processing":
        return <Package className="w-3 h-3 text-amber-500" />;
      case "shipped":
      case "out_for_delivery":
        return <Truck className="w-3 h-3 text-indigo-500" />;
      case "delivered":
        return <Check className="w-3 h-3 text-emerald-500 font-bold" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center p-4 sm:p-6 font-poppins">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm w-full bg-white border border-slate-100 rounded-2xl p-6 shadow-xs"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-slate-100">
            <User className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1.5">Welcome Back!</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              Sign in to view your wardrobe order history and track deliveries in real time.
            </p>
          </div>
          <motion.button 
            onClick={() => router.push("/login")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-slate-950 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Sign In
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 font-poppins antialiased text-slate-900">
      {/* Top spacers */}
      <div className="h-16 sm:h-20 xl:h-24"></div>
      <div className="xl:hidden mb-12">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <div className="max-w-md mx-auto px-4 py-4 sm:py-10">
        {/* Simplified Sleek Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">My Orders</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs font-semibold tracking-wide">
              Manage and track recent wardrobe dispatches.
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

        {!userOrders ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 font-semibold text-xs">Loading orders...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ultra-Compact Search & Filter Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100/80 p-3 sm:p-4 shadow-xs space-y-2.5"
            >
              <div className="flex gap-2 items-center">
                <div className="relative grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search order number or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 focus:bg-white hover:border-slate-300 focus:border-slate-800 rounded-xl text-xs transition-all font-poppins focus:outline-none placeholder-slate-400"
                  />
                </div>
                
                <motion.button 
                  onClick={() => setShowFilters(!showFilters)}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 cursor-pointer ${
                    showFilters || selectedStatus !== "all" 
                      ? "bg-slate-950 border-slate-950 text-white" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Horizontal Scroll Pill Filters */}
              <AnimatePresence>
                {(showFilters || selectedStatus !== "all") && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 pr-2 no-scrollbar scroll-smooth">
                      {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                            selectedStatus === status 
                              ? "bg-slate-950 border-slate-950 text-white shadow-2xs" 
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filtering results summary */}
              <div className="flex items-center justify-between text-[10px] text-slate-450 border-t border-slate-50 pt-2 font-semibold tracking-wide">
                <span>
                  Found <strong className="text-slate-800 font-extrabold">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? "order" : "orders"}
                </span>
                {(searchQuery || selectedStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedStatus("all");
                    }}
                    className="text-slate-500 hover:text-slate-900 underline font-black uppercase tracking-wider"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </motion.div>

            {/* Zero state matches */}
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <ShoppingBag className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-1">
                  {searchQuery || selectedStatus !== "all"
                    ? "No match found"
                    : "No orders placed yet"}
                </h3>
                <p className="text-[10px] text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed font-semibold">
                  {searchQuery || selectedStatus !== "all"
                    ? "Try adjusting search query filters to look up different dispatches."
                    : "Your order ledger is empty. Explore and place your first purchase!"}
                </p>
                <motion.button
                  onClick={() => router.push("/shop")}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                >
                  Explore Collection
                </motion.button>
              </motion.div>
            ) : (
              /* Staggered Orders Cards List */
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3.5"
              >
                {filteredOrders.map((order, idx) => (
                  <OrderCard 
                    key={order._id}
                    order={order}
                    index={idx}
                    isExpanded={expandedOrder === order._id}
                    onToggleExpand={() =>
                      setExpandedOrder(
                        expandedOrder === order._id ? null : order._id
                      )
                    }
                    formatDate={formatDate}
                    formatDetailedDate={formatDetailedDate}
                    getStatusColor={getStatusColor}
                    getDeliveryStatusIcon={getDeliveryStatusIcon}
                    router={router}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <FooterSimple />
    </div>
  );
}

// Micro-Sized Sleek Order Card Component
function OrderCard({ 
  order, 
  index, 
  isExpanded, 
  onToggleExpand, 
  formatDate, 
  formatDetailedDate, 
  getStatusColor, 
  getDeliveryStatusIcon,
  router,
}) {
  const handleCardClick = (e) => {
    // Navigate on tap of non-interactive areas
    router.push(`/orders/${order.orderNumber}`);
  };

  return (
    <motion.div
      variants={cardBlockVariants}
      className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200 shadow-3xs overflow-hidden"
    >
      {/* Top Header info */}
      <div 
        className="p-3.5 sm:p-5 cursor-pointer space-y-3" 
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Order Identification</span>
            <span className="font-mono font-extrabold text-slate-800 text-[11px] sm:text-xs">
              #{order.orderNumber}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] uppercase tracking-wider shrink-0 ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Portraited Apparel Mini-Thumbnails & Cost summary */}
        <div className="flex items-center gap-3.5 py-1">
          {/* Overlapping Clothes Aspect Ratio Cards (Aspect ratio 3:4 is standard portrait visual apparel ratio) */}
          <div className="flex -space-x-3.5 shrink-0">
            {order.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="w-10 h-13 border-2 border-white rounded-lg overflow-hidden bg-slate-50 shadow-2xs relative z-10"
                style={{ zIndex: 10 - idx }}
              >
                <img
                  src={item.image || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "/placeholder.jpg" }}
                />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-10 h-13 border-2 border-white rounded-lg bg-slate-100 flex items-center justify-center shadow-2xs text-slate-500 font-extrabold text-[9px] shrink-0 relative z-0">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Core Description block */}
          <div className="grow min-w-0 space-y-0.5">
            <p className="text-[11px] font-extrabold text-slate-850 truncate leading-snug">
              {order.items[0]?.name}
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
              {order.items.length} {order.items.length === 1 ? "Product" : "Products"}
              {order.items.length > 1 && ` • +${order.items.length - 1} more`}
            </p>
          </div>

          {/* Pricing indicator */}
          <div className="text-right shrink-0 space-y-0.5">
            {order.paymentDetails?.paymentMethod === "cod" ? (
              <>
                <span className="text-[8px] text-emerald-650 font-bold uppercase tracking-wider block leading-none">COD Advance Paid</span>
                <span className="text-xs font-black text-emerald-700 font-mono leading-none block">₹{order.paymentDetails.codCharge?.toFixed(2) || "200.00"}</span>
                <span className="text-[7px] text-amber-700 font-bold uppercase tracking-wider block leading-none mt-0.5">COD Due: ₹{order.paymentDetails.remainingCOD?.toFixed(2) || (order.orderTotal - 200).toFixed(2)}</span>
              </>
            ) : (
              <>
                <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block leading-none">Paid</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono leading-none block">₹{order.orderTotal?.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer actions row */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-1 text-[10px]">
          <div className="flex items-center gap-1 text-slate-400 font-semibold tracking-wide">
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span>{formatDate(order.createdAt)}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex items-center gap-1 border border-slate-200/80 text-slate-500 hover:text-slate-850 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest active:scale-95 transition-all bg-white hover:bg-slate-50/50 cursor-pointer shrink-0"
          >
            <span>{isExpanded ? "Hide Drawer" : "Quick View"}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded Quick view details panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/30"
          >
            <div className="p-3.5 space-y-4 text-xs">
              {/* Product detailed list */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Purchased Products</h4>
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100/60 shadow-3xs">
                      <div className="w-7 h-9 rounded-md overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
                        <img
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/placeholder.jpg" }}
                        />
                      </div>
                      <div className="grow min-w-0">
                        <h5 className="font-extrabold text-slate-800 text-[10px] truncate leading-tight">{item.name}</h5>
                        <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          Size: {item.size || "Free"} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[10px] font-bold text-slate-700">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics & Payment */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Method Payment summary */}
                {order.paymentDetails && (
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment summary</h4>
                    <div className="bg-white rounded-xl border border-slate-100/60 p-3 space-y-1.5 text-[10px] font-semibold text-slate-500 shadow-3xs">
                      <div className="flex justify-between items-center">
                        <span>Method</span>
                        <span className="font-extrabold text-slate-800 uppercase">{order.paymentDetails.paymentMethod || "prepaid"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status</span>
                        {order.paymentDetails.paymentMethod === "cod" ? (
                          <span className="font-extrabold text-amber-600 uppercase flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-amber-500" />
                            <span>COD Confirmed</span>
                          </span>
                        ) : (
                          <span className="font-extrabold text-emerald-600 uppercase flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Paid</span>
                          </span>
                        )}
                      </div>
                      {order.paymentDetails.paymentMethod === "cod" ? (
                        <>
                           <div className="flex justify-between items-center text-emerald-600">
                             <span>Online Advance Paid</span>
                             <span className="font-mono font-bold">₹{order.paymentDetails.codCharge?.toFixed(2) || "200.00"}</span>
                           </div>
                           <div className="flex justify-between items-center text-amber-700">
                             <span>COD Due on Delivery</span>
                             <span className="font-mono font-bold">₹{order.paymentDetails.remainingCOD?.toFixed(2) || (order.orderTotal - 200).toFixed(2)}</span>
                           </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-50 text-[10px] sm:text-[11px] font-black text-slate-900">
                          <span>Amount Paid</span>
                          <span className="font-mono">₹{order.paymentDetails.amount?.toFixed(2) || order.orderTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery checklogs */}
                {order.deliveryDetails && order.deliveryDetails.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recent checkpoints</h4>
                    <div className="bg-white rounded-xl border border-slate-100/60 p-3 space-y-2.5 shadow-3xs">
                      {order.deliveryDetails
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 2)
                        .map((detail, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-[9px] leading-tight">
                            <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                              {getDeliveryStatusIcon(detail.status)}
                            </div>
                            <div className="min-w-0 grow">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-extrabold text-slate-800 capitalize truncate">
                                  {detail.status?.replace("_", " ")}
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold shrink-0">
                                  {formatDate(detail.timestamp)}
                                </span>
                              </div>
                              <p className="text-slate-550 leading-normal mt-0.5 font-medium">{detail.message}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View Full invoice action button */}
              <div className="pt-1 flex justify-end">
                <motion.button 
                  onClick={() => router.push(`/orders/${order.orderNumber}`)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Full Invoice & Live Track</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}