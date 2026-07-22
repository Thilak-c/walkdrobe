"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Footer from "@/components/home/Footer";
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
  CreditCard, 
  Package,
  Loader2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const cardBlockVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 130, damping: 17 }
  }
};

export default function TrackOrderPage() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Call convex query reactively by orderNumber only
  const orderResult = useQuery(
    api.orders.trackOrder,
    activeQuery ? { orderNumber: activeQuery } : "skip"
  );

  useEffect(() => {
    if (activeQuery) {
      setLoading(false);
      if (orderResult === null) {
        setError("No order found with this Order Number. Please check and try again.");
      } else if (orderResult) {
        setError("");
      }
    }
  }, [orderResult, activeQuery]);

  const handleTrack = (e) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();
    if (!cleanId) {
      setError("Please enter your Order Number");
      return;
    }
    
    setLoading(true);
    setError("");
    setActiveQuery(cleanId);
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return 1;
      case "confirmed":
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
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
      case "confirmed":
      case "processing": return "bg-blue-50 text-blue-700 border-blue-200 font-bold";
      case "shipped":
      case "out_for_delivery": return "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold";
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200 font-black";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      default: return "bg-slate-100 text-slate-700 border-slate-200 font-bold";
    }
  };

  const renderStepper = (status) => {
    const currentStep = getStatusStep(status);

    if (currentStep === -1) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-rose-900 font-inter">Order Cancelled</h4>
            <p className="text-xs text-rose-700 font-medium font-inter mt-0.5">This shipment has been cancelled. Please contact support if you need assistance.</p>
          </div>
        </div>
      );
    }

    const stepsList = [
      { label: "Placed", icon: ShoppingBag },
      { label: "Processing", icon: Package },
      { label: "Shipped", icon: Truck },
      { label: "Delivered", icon: CheckCircle }
    ];

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest font-inter">Delivery Status</h4>
        <div className="relative py-2 px-1">
          {/* Progress Bar Line */}
          <div className="absolute top-[20px] left-8 right-8 h-1 bg-slate-100 -z-0">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${Math.max(0, (currentStep - 1) / 3) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-full bg-neutral-900"
            />
          </div>

          <div className="flex justify-between items-start relative z-10">
            {stepsList.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isActive = currentStep === stepNum;
              const Icon = step.icon;

              return (
                <div key={idx} className="flex flex-col items-center shrink-0 w-16">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-neutral-900 border-neutral-900 text-white shadow-xs" 
                        : isActive 
                          ? "bg-white border-neutral-900 text-neutral-900 shadow-md ring-4 ring-neutral-900/10" 
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3px]" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-extrabold mt-2 text-center tracking-tight font-inter ${
                    isActive ? "text-neutral-900" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100vh] min-h-dvh bg-slate-50/50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <div className="h-16 sm:h-20 xl:h-24"></div>
        <div className="xl:hidden mb-8">
          <NavbarMobile />
        </div>
        <div className="hidden xl:block">
          <Navbar />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 w-full flex-1 flex flex-col justify-start">
          {/* Header */}
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-inter">
              Track Your Order
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1 font-inter">
              Enter your Order Number to see real-time package updates and delivery details.
            </p>
          </div>

          {/* Form - ONLY Order Number */}
          <form onSubmit={handleTrack} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 mb-6">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 font-inter">
                Order Number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="e.g., ORD1784748869882KINH3"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-neutral-900 rounded-xl text-xs font-black tracking-wider text-slate-900 outline-none transition-all font-mono placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-center bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-bold font-inter"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all disabled:opacity-75 cursor-pointer font-inter"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Track Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Results */}
          {orderResult && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {/* Stepper Pipeline */}
              {renderStepper(orderResult.status)}

              {/* Order Overview Card */}
              <motion.div 
                variants={cardBlockVariants}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 font-mono">
                        #{orderResult.orderNumber}
                      </h3>
                      <button 
                        onClick={() => handleCopy(orderResult.orderNumber)}
                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Copy Order Number"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium font-inter mt-0.5">
                      Placed on {new Date(orderResult.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${getStatusBadgeStyles(orderResult.status)} font-inter shrink-0`}>
                    {orderResult.status}
                  </span>
                </div>

                {/* Expected Delivery Date */}
                {orderResult.estimatedDeliveryDate && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-inter">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Expected Delivery:</span>
                    </div>
                    <span className="font-extrabold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {new Date(orderResult.estimatedDeliveryDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}

                {/* Shiprocket Live Tracking details if present */}
                {orderResult.shiprocketDetails?.awbCode && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs font-inter">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Courier Partner:</span>
                      <span className="font-bold text-slate-900">{orderResult.shiprocketDetails.courierName || "Shiprocket"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">AWB Tracking Code:</span>
                      <span className="font-mono font-bold text-slate-900 select-all">{orderResult.shiprocketDetails.awbCode}</span>
                    </div>
                    {orderResult.shiprocketDetails.trackingUrl && (
                      <a
                        href={orderResult.shiprocketDetails.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
                      >
                        <span>Live Courier Tracking</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Items Card */}
              <motion.div 
                variants={cardBlockVariants}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-inter border-b border-slate-100 pb-3">
                  Items in Order ({orderResult.items?.length || 0})
                </h3>

                <div className="space-y-2.5">
                  {orderResult.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <div className="w-12 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900 font-inter">{item.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium font-inter">Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-100 pt-3 font-inter">
                  <span>Order Invoice Total:</span>
                  <span className="font-mono text-base">₹{orderResult.orderTotal?.toFixed(2)}</span>
                </div>
              </motion.div>

              {/* Address Card */}
              {orderResult.shippingDetails && (
                <motion.div 
                  variants={cardBlockVariants}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs font-inter"
                >
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    Delivery Address
                  </h3>
                  <p className="font-bold text-slate-900 pt-1">{orderResult.shippingDetails.fullName}</p>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {orderResult.shippingDetails.address}, {orderResult.shippingDetails.city}<br />
                    {orderResult.shippingDetails.state} - {orderResult.shippingDetails.pincode}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
