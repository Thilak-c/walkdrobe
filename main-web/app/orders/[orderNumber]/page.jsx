"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
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
  User,
  Copy,
  AlertCircle,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function SingleOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber;

  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      if (match) setToken(decodeURIComponent(match[1]));
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const order = useQuery(
    api.orders.getOrderByNumber,
    orderNumber ? { orderNumber } : "skip"
  );

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      showToastMsg("Order ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDetailedDate = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (order === undefined) {
    return (
      <div className="min-h-screen min-h-[100vh] min-h-dvh bg-slate-50/50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-bold text-xs font-inter">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen min-h-[100vh] min-h-dvh bg-slate-50/50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900 font-inter">Order Not Found</h2>
          <p className="text-xs text-slate-500 font-medium font-inter">
            We couldn't locate order #{orderNumber}. Please check the order number or view your orders list.
          </p>
          <button 
            onClick={() => router.push("/orders")}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all cursor-pointer font-inter"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const isCOD = order.paymentDetails?.paymentMethod === "cod";
  const remainingCOD = order.paymentDetails?.remainingCOD !== undefined ? order.paymentDetails.remainingCOD : order.orderTotal;

  return (
    <div className="min-h-screen min-h-[100vh] min-h-dvh bg-slate-50/50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div>
        {/* Navigation header */}
        <div className="h-16 sm:h-20 xl:h-24"></div>
        <div className="xl:hidden mb-8">
          <NavbarMobile />
        </div>
        <div className="hidden xl:block">
          <Navbar />
        </div>

        {/* Toast notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold font-inter"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/orders")}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer font-inter"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
              <span>Back to Orders</span>
            </button>

            <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${getStatusBadge(order.status)} font-inter`}>
              {order.status}
            </span>
          </div>

          {/* Order Overview Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Order Receipt</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                    #{order.orderNumber}
                  </h2>
                  <button 
                    onClick={copyOrderNumber} 
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-all cursor-pointer"
                    title="Copy Order ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1 font-inter">
                  Placed on {formatDetailedDate(order.createdAt)}
                </p>
              </div>

              {/* Cost indicator */}
              <div className="sm:text-right">
                {isCOD ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 font-inter block">COD Balance Due</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-800 font-mono block">
                      ₹{remainingCOD.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter block">Total Paid</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono block">
                      ₹{order.orderTotal.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Delivery Estimate */}
            {order.estimatedDeliveryDate && (
              <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-blue-950 font-inter text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Expected Delivery Date:</span>
                </div>
                <span className="font-extrabold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {formatDate(order.estimatedDeliveryDate)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Grid Layout: Items & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Purchased Items Card */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-inter flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    Purchased Items ({order.items.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all">
                      <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-inter">{item.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-inter">
                          Size: <span className="font-bold text-slate-800">{item.size || "Free"}</span> • Qty: <span className="font-bold text-slate-800">{item.quantity}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ₹{item.price.toLocaleString("en-IN")} each
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-slate-900 font-mono block">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Totals */}
                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-inter text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-bold font-mono text-slate-800">
                      ₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  {isCOD && order.paymentDetails?.codCharge > 0 && (
                    <div className="flex justify-between text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-bold">
                      <span>COD Reservation Paid Online:</span>
                      <span className="font-mono">₹{order.paymentDetails.codCharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{order.orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Checkpoints & Tracking */}
              {order.deliveryDetails && order.deliveryDetails.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-inter flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Truck className="w-4 h-4 text-slate-600" />
                    Delivery Timeline
                  </h3>

                  <div className="space-y-3 pt-1">
                    {order.deliveryDetails
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((detail, idx) => (
                        <div key={idx} className="flex gap-3 items-start text-xs font-inter">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
                          </div>
                          <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 capitalize">
                                {detail.status?.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDate(detail.timestamp)}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs mt-1 font-medium leading-relaxed">{detail.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-5">
              {/* Delivery Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-inter flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  Delivery Address
                </h3>

                <div className="space-y-2 text-xs font-inter text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-900">{order.shippingDetails?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-medium">{order.shippingDetails?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium truncate">{order.shippingDetails?.email}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <Home className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <p className="font-medium text-slate-800 leading-relaxed">
                        {order.shippingDetails?.address}, {order.shippingDetails?.city}<br />
                        {order.shippingDetails?.state} - {order.shippingDetails?.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-inter flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  Payment Details
                </h3>

                <div className="space-y-2 text-xs font-inter">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Payment Method:</span>
                    <span className="font-black capitalize text-slate-900">{order.paymentDetails?.paymentMethod || "Prepaid"}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Payment Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] uppercase">
                      {order.paymentDetails?.status || "Paid"}
                    </span>
                  </div>

                  {order.paymentDetails?.razorpayOrderId && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 font-medium">Razorpay ID:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 select-all truncate max-w-[130px]">
                        {order.paymentDetails.razorpayOrderId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
