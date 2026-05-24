"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import FooterSimple from "@/components/FooterSimple";
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Calendar, 
  Truck, 
  AlertCircle, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Copy, 
  Check, 
  User, 
  CreditCard, 
  Home, 
  Phone, 
  Package 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Stagger parent container
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    }
  }
};

// Item transition
const cardBlockVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 16 }
  }
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic query states
  const [searchParams, setSearchParams] = useState({ orderNumber: "", phone: "" });

  // Call convex query reactively
  const orderResult = useQuery(
    api.orders.trackOrder,
    (searchParams.orderNumber || searchParams.phone) ? searchParams : "skip"
  );

  // Sync convex query results to UI state
  useEffect(() => {
    if (searchParams.orderNumber || searchParams.phone) {
      setLoading(false);
      if (orderResult === null) {
        setError("Order not found. Please check your Order ID or Phone Number.");
        setTracking(null);
      } else if (orderResult) {
        setTracking(orderResult);
        setError("");
      }
    }
  }, [orderResult, searchParams]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!orderId && !phone) {
      setError("Please enter an Order ID or Phone Number");
      return;
    }
    
    setLoading(true);
    setError("");
    setTracking(null);
    
    // Simulate brief lookup delay to enjoy the premium loading skeleton states
    setTimeout(() => {
      setSearchParams({
        orderNumber: orderId.trim() || undefined,
        phone: phone.trim() || undefined
      });
    }, 450);
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return 1;
      case "processing": return 2;
      case "shipped":
      case "out_for_delivery": return 3;
      case "delivered": return 4;
      case "cancelled": return -1;
      default: return 1;
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-amber-50 text-amber-700 border-amber-100/80 shadow-xs";
      case "processing": return "bg-blue-50 text-blue-700 border-blue-100/80 shadow-xs";
      case "shipped":
      case "out_for_delivery": return "bg-indigo-50 text-indigo-700 border-indigo-100/80 shadow-xs";
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-100/80 shadow-xs";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-100/80 shadow-xs";
      default: return "bg-slate-50 text-slate-700 border-slate-100/80 shadow-xs";
    }
  };

  const renderStepper = () => {
    if (!tracking) return null;
    const currentStep = getStatusStep(tracking.status);

    if (currentStep === -1) {
      return (
        <motion.div 
          variants={cardBlockVariants}
          className="bg-rose-50/40 border border-rose-100 rounded-xl p-3.5 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
          <div>
            <h4 className="text-xs font-bold text-rose-800">Order Cancelled</h4>
            <p className="text-[10px] text-rose-500 mt-0.5">This shipment has been cancelled. Please contact support if you believe this is an error.</p>
          </div>
        </motion.div>
      );
    }

    const stepsList = [
      { label: "Placed", icon: ShoppingBag },
      { label: "Processing", icon: Package },
      { label: "Shipped", icon: Truck },
      { label: "Delivered", icon: CheckCircle }
    ];

    return (
      <motion.div 
        variants={cardBlockVariants}
        className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-4"
      >
        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Consignment Pipeline</h4>
        <div className="relative py-2 px-1">
          {/* Progress Line */}
          <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-slate-100 -z-10">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="h-full bg-slate-900"
            />
          </div>

          <div className="flex justify-between items-start">
            {stepsList.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isActive = currentStep === stepNum;
              const Icon = step.icon;

              return (
                <div key={idx} className="flex flex-col items-center shrink-0 w-14 sm:w-16">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08 * idx, type: "spring" }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-slate-900 border-slate-900 text-white" 
                        : isActive 
                          ? "bg-white border-slate-900 text-slate-900 shadow-md shadow-slate-900/10 ring-4 ring-slate-900/5" 
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </motion.div>
                  <span className={`text-[9px] font-bold mt-2 text-center tracking-tight transition-all duration-300 ${
                    isActive ? "text-slate-900" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/40 font-poppins text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      <div className="h-16 sm:h-20 xl:h-24"></div>
      <div className="xl:hidden mb-12">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <div className="max-w-md mx-auto px-4 py-6 sm:py-12">
        {/* Compact Header */}
        <div className="text-center sm:text-left mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-1 font-poppins">
            Track Order
          </h1>
          <p className="text-gray-400 text-[11px] sm:text-xs font-semibold tracking-wide">
            Enter details to inspect shipment consignment status.
          </p>
        </div>

        {/* Sleek Form */}
        <form onSubmit={handleTrack} className="bg-white border border-slate-100/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 mb-5">
          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., ORD1779642503185CE6EO"
              className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-50/50 focus:bg-white border border-slate-200/60 hover:border-slate-300 focus:border-slate-800 rounded-xl text-xs focus:outline-none transition-all font-mono"
            />
          </div>
          
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-100"></div>
            <span className="shrink mx-3 text-gray-300 text-[8px] font-extrabold uppercase tracking-widest">or</span>
            <div className="grow border-t border-slate-100"></div>
          </div>
          
          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 8008439762"
              className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-50/50 focus:bg-white border border-slate-200/60 hover:border-slate-300 focus:border-slate-800 rounded-xl text-xs focus:outline-none transition-all font-mono"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 items-center bg-rose-50 border border-rose-100/50 rounded-xl p-2.5 text-[10px] text-rose-600 font-bold leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Track details</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Sleek Compact Timeline with Premium Framer Animations */}
        <AnimatePresence mode="wait">
          {/* Skeleton Shimmer Loading Placeholder */}
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5"
            >
              {/* Header skeleton */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="space-y-1.5 grow w-2/3">
                  <div className="h-2 w-12 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-slate-100/80 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse shrink-0" />
              </div>
              
              {/* Stepper skeleton */}
              <div className="space-y-3">
                <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="flex justify-between items-center gap-1.5 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 grow">
                      <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                      <div className="h-1.5 w-8 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Items skeleton */}
              <div className="space-y-3 pt-1">
                <div className="h-2 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="flex items-center gap-3 p-3 border border-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="space-y-1.5 grow">
                    <div className="h-2.5 w-28 bg-slate-100 rounded animate-pulse" />
                    <div className="h-2 w-16 bg-slate-50/80 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Timeline skeleton */}
              <div className="space-y-3 pt-1">
                <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="pl-5 border-l border-slate-100 space-y-4 ml-2.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="relative space-y-1.5">
                      <div className="absolute -left-[23px] top-1 w-2 h-2 rounded-full bg-slate-100 animate-pulse border-2 border-white ring-2 ring-slate-100" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
                      <div className="h-2 w-48 bg-slate-50/80 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Loaded Tracking Details */}
          {tracking && !loading && (
            <motion.div
              key={tracking._id}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Header Details Card */}
              <motion.div
                variants={cardBlockVariants}
                className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5 relative overflow-hidden"
              >
                <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">consignment record</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate leading-none">
                        {tracking.orderNumber}
                      </h3>
                      <motion.button 
                        onClick={() => handleCopy(tracking.orderNumber)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1 hover:bg-slate-50 border border-slate-100 rounded-md shrink-0 active:scale-95 transition-colors cursor-pointer"
                        title="Copy tracking code"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase select-none shrink-0 ${getStatusBadgeStyles(tracking.status)}`}>
                    {tracking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Placement Date</span>
                    <p className="font-extrabold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(tracking.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Method of Payment</span>
                    <p className="font-extrabold text-slate-700 inline-flex items-center gap-1 justify-end">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span className="uppercase">{tracking.paymentMethod || "Prepaid"}</span>
                    </p>
                  </div>
                </div>

                {tracking.paymentMethod === "cod" && (
                  <div className="grid grid-cols-2 gap-3 text-[10px] pt-2.5 border-t border-slate-50 mt-1">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-emerald-650 uppercase tracking-wider block">COD Fee Paid Online</span>
                      <p className="font-mono font-extrabold text-emerald-700">₹{tracking.paymentDetails?.codCharge?.toFixed(2) || "100.00"}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[8px] font-bold text-amber-750 uppercase tracking-wider block">COD Due on Delivery</span>
                      <p className="font-mono font-extrabold text-amber-800">₹{tracking.paymentDetails?.remainingCOD?.toFixed(2) || (tracking.orderTotal - 100).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Visual Pipeline Stepper */}
              {renderStepper()}

              {/* Purchased Items Grid */}
              {tracking.items && tracking.items.length > 0 && (
                <motion.div 
                  variants={cardBlockVariants} 
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Items Ordered ({tracking.items.length})</span>
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-900">
                      Total: ₹{tracking.orderTotal?.toFixed(2)}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50 space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                    {tracking.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 pt-2.5 first:pt-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                          <img 
                            src={item.image || "/placeholder.jpg"} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "/placeholder.jpg" }}
                          />
                        </div>
                        <div className="grow min-w-0">
                          <h5 className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 truncate leading-snug">{item.name}</h5>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {item.size && (
                              <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded uppercase">
                                Size: {item.size}
                              </span>
                            )}
                            <span className="text-[8px] text-slate-400 font-semibold">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-[11px] font-black text-slate-800 font-mono">₹{item.price?.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Granular Tracking Log Timeline */}
              <motion.div 
                variants={cardBlockVariants}
                className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4"
              >
                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Logistics Dispatch Log</h4>
                
                <div className="relative pl-5 border-l border-slate-100 space-y-4.5 ml-2.5">
                  {tracking.deliveryDetails?.map((detail, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="relative"
                    >
                      {idx === 0 ? (
                        <span className="absolute -left-[24px] top-1.5 bg-white p-0.5 rounded-full border border-slate-900 ring-2 ring-slate-900/10">
                          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-ping" />
                        </span>
                      ) : (
                        <span className="absolute -left-[24px] top-1.5 bg-white p-0.5 rounded-full border border-slate-200 ring-2 ring-white">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </span>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-850 text-[11px] sm:text-xs tracking-tight capitalize leading-none">
                            {detail.status?.replace("_", " ")}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                            {new Date(detail.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short"
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">{detail.message}</p>
                        {detail.location && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] text-slate-400 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                            <span>{detail.location}</span>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Default order placed step if empty */}
                  {(!tracking.deliveryDetails || tracking.deliveryDetails.length === 0) && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative"
                    >
                      <span className="absolute -left-[24px] top-1.5 bg-white p-0.5 rounded-full border border-slate-900 ring-2 ring-slate-950/10">
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-ping" />
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900 text-[11px] sm:text-xs tracking-tight">Order Placed</span>
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                            {new Date(tracking.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short"
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">Your order has been verified and is prepared for shipping.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Destination Address Card */}
              {tracking.shippingDetails && (
                <motion.div 
                  variants={cardBlockVariants} 
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-2.5"
                >
                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Shipping Destination</span>
                  </h4>
                  <div className="text-[10.5px] sm:text-xs text-slate-600 space-y-0.5 font-medium leading-relaxed">
                    <p className="font-extrabold text-slate-800">{tracking.shippingDetails.name}</p>
                    <p className="truncate">{tracking.shippingDetails.addressLine1}</p>
                    {tracking.shippingDetails.addressLine2 && <p className="truncate">{tracking.shippingDetails.addressLine2}</p>}
                    <p>{tracking.shippingDetails.city}, {tracking.shippingDetails.state} - {tracking.shippingDetails.postalCode}</p>
                    {tracking.shippingDetails.phone && (
                      <p className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-semibold">
                        <Phone className="w-3 h-3 text-slate-300" />
                        <span>{tracking.shippingDetails.phone}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Live Shiprocket Link */}
              {tracking.shiprocketDetails?.awbCode && (
                <motion.div 
                  variants={cardBlockVariants}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md shadow-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Shiprocket Logistics Partner</p>
                    <p className="text-[10px] sm:text-xs text-white font-extrabold mt-0.5 truncate font-mono">AWB: {tracking.shiprocketDetails.awbCode}</p>
                  </div>
                  <motion.a
                    href={tracking.shiprocketDetails.trackingUrl || `https://shiprocket.co/tracking/${tracking.shiprocketDetails.awbCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    <span>Track Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Help Widget */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-1">Need Assistance?</h3>
          <p className="text-gray-400 text-[10px] mb-3 leading-relaxed">
            Can't find your order consignment? Get in touch with our customer support representatives.
          </p>
          <div className="flex gap-2">
            <a href="tel:9122583392" className="px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
              Call Support
            </a>
            <a href="https://wa.me/919122583392" target="_blank" rel="noopener noreferrer" className="px-3.5 py-1.5 bg-white border border-slate-200 text-gray-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
}
