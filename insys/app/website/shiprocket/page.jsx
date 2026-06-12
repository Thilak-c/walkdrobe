"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Truck,
  SlidersHorizontal,
  Scale,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  Info,
  ChevronRight,
  TrendingUp,
  Boxes,
  ArrowRightLeft,
  XCircle,
  Clock,
  User,
  CreditCard,
  MapPin,
  ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";

// Status styles for Shiprocket order state
const shiprocketStatusStyles = {
  created: {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    badge: "bg-emerald-500",
    text: "Created"
  },
  failed: {
    bg: "bg-rose-50 border-rose-200 text-rose-700",
    badge: "bg-rose-500",
    text: "Failed"
  },
  retrying: {
    bg: "bg-amber-50 border-amber-200 text-amber-700",
    badge: "bg-amber-500",
    text: "Retrying"
  },
  none: {
    bg: "bg-slate-50 border-slate-200 text-slate-500",
    badge: "bg-slate-400",
    text: "Not Integrated"
  }
};

export default function ShiprocketPage() {
  const [isInsysAuth, setIsInsysAuth] = useState(false);
  
  // Settings Form state
  const [length, setLength] = useState(15);
  const [breadth, setBreadth] = useState(10);
  const [height, setHeight] = useState(5);
  const [weight, setWeight] = useState(0.5);
  const [codAdvance, setCodAdvance] = useState(200);
  const [codAllowCoupons, setCodAllowCoupons] = useState(true);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Operations state
  const [retryingOrderNumber, setRetryingOrderNumber] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'active', 'failed', 'none'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Authenticate user
  useEffect(() => {
    const auth = localStorage.getItem("insys_auth");
    if (auth) {
      const authData = JSON.parse(auth);
      setIsInsysAuth(authData.isLoggedIn);
    }
  }, []);

  // Convex DB operations
  const currentConfig = useQuery(api.shiprocketConfig.getConfig);
  const orders = useQuery(api.orders.getOrdersWithShiprocket);
  const updateConfigMutation = useMutation(api.shiprocketConfig.updateConfig);

  // Pre-populate settings form when currentConfig is fetched
  useEffect(() => {
    if (currentConfig) {
      setLength(currentConfig.length);
      setBreadth(currentConfig.breadth);
      setHeight(currentConfig.height);
      setWeight(currentConfig.weight);
      setCodAdvance(currentConfig.codAdvance !== undefined ? currentConfig.codAdvance : 200);
      setCodAllowCoupons(currentConfig.codAllowCoupons !== undefined ? currentConfig.codAllowCoupons : true);
    }
  }, [currentConfig]);

  // Calculate dynamic volumetric weight: (L * B * H) / 5000
  const volumetricWeight = ((length * breadth * height) / 5000).toFixed(3);

  // Handle configuration update
  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setIsUpdatingConfig(true);
    try {
      await updateConfigMutation({
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        weight: parseFloat(weight),
        codAdvance: parseFloat(codAdvance),
        codAllowCoupons: Boolean(codAllowCoupons),
      });
      toast.success("Shiprocket packaging configurations updated!", {
        style: {
          background: "#0f172a",
          color: "#fff",
          borderRadius: "12px",
        }
      });
    } catch (error) {
      toast.error(`Failed to update configurations: ${error.message}`);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Handle manual order creation / retry
  const handleRetryCreateOrder = async (orderNumber) => {
    setRetryingOrderNumber(orderNumber);
    const loadingToast = toast.loading(`Initiating order ${orderNumber} in Shiprocket...`);
    try {
      const response = await fetch("/api/auto-shiprocket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber }),
      });

      const data = await response.json();
      
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(`Shiprocket order created! AWB: ${data.awbCode || "Assigned"}`, {
          duration: 5000,
          style: {
            background: "#0f172a",
            color: "#fff",
            borderRadius: "12px",
          }
        });
      } else {
        toast.error(`Shiprocket failed: ${data.error || "Unknown error occurred"}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Fulfillment trigger failed: ${error.message}`);
    } finally {
      setRetryingOrderNumber(null);
    }
  };

  // Filter orders lists based on tabs
  const filteredOrders = orders?.filter(order => {
    if (filterType === "all") return true;
    if (filterType === "active") return !!order.shiprocketDetails?.shiprocketOrderId;
    if (filterType === "failed") return order.shiprocketDetails?.status === "failed";
    if (filterType === "none") return !order.shiprocketDetails?.shiprocketOrderId;
    return true;
  });

  // Access Gate Authentication Guard
  if (!isInsysAuth) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h2>
            <p className="text-slate-500 mb-6 text-sm">Please log in to your inventory system account to view Shiprocket operations.</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-blue-500 tracking-widest text-[10px] font-bold uppercase mb-1">Logistics Engine</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Shiprocket Operations</h1>
              <p className="text-slate-500 text-sm mt-1">Configure default packaging dimensions, dead weights, and monitor real-time order sync.</p>
            </div>
          </div>

          {/* Configuration and Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Dynamic Volumetric Weight Calculator (Metric Card) */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between lg:col-span-1 border border-slate-800">
              <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Logistics Weight</span>
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Scale className="w-5 h-5 text-blue-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-300">Target Volumetric Weight</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold tracking-tight">{volumetricWeight}</span>
                  <span className="text-slate-400 font-semibold text-lg">Kg</span>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-5 mt-6 space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Current L × B × H</span>
                  <span className="font-mono text-white font-bold">{length} × {breadth} × {height} cm</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-slate-400" /> Min Dead Weight</span>
                  <span className="font-mono text-white font-bold">{weight} Kg</span>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-[10px] text-slate-400 leading-relaxed border border-slate-700/30 flex gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Calculated automatically as: <code>(Length × Breadth × Height) / 5000</code>. Couriers charge based on the greater of Volumetric Weight vs Dead Weight.</span>
                </div>
              </div>
            </div>

            {/* Config Form Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-4 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-blue-500" />
                <h3>Packaging Default Dimensions</h3>
              </div>

              <form onSubmit={handleUpdateConfig} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      value={length}
                      onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-sm focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Breadth (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      value={breadth}
                      onChange={(e) => setBreadth(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-sm focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      value={height}
                      onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-sm focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Min Dead Wt. (Kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      required
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-sm focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* COD Customization Settings */}
                <div className="border-t border-slate-100 pt-5 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">COD Policy Configuration</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">COD Advance Payment (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={codAdvance}
                        onChange={(e) => setCodAdvance(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-sm focus:outline-none transition-all font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Amount customers pay online to place a COD order. Set to 0 to disable advance payment (Free COD).</p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Allow Coupons on COD</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Allow usage of promotional discount codes for Cash on Delivery checkout</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCodAllowCoupons(!codAllowCoupons)}
                          className={`w-11 h-6 rounded-full transition-all relative outline-none flex items-center cursor-pointer ${
                            codAllowCoupons ? "bg-slate-900" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`block w-4.5 h-4.5 bg-white rounded-full shadow-md transition-all absolute ${
                              codAllowCoupons ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 pt-4 mt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingConfig}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingConfig ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Update Configurations</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sync Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "All Web Orders",
                value: orders?.length || 0,
                icon: Boxes,
                color: "text-slate-600",
                bgColor: "bg-slate-500/10"
              },
              {
                label: "AWB Generated",
                value: orders?.filter(o => o.hasShiprocketOrder).length || 0,
                icon: CheckCircle2,
                color: "text-emerald-600",
                bgColor: "bg-emerald-500/10"
              },
              {
                label: "Pending Sync",
                value: orders?.filter(o => !o.hasShiprocketOrder && o.status !== 'cancelled').length || 0,
                icon: Clock,
                color: "text-amber-500",
                bgColor: "bg-amber-500/10"
              },
              {
                label: "Sync Errors",
                value: orders?.filter(o => o.shiprocketDetails?.status === "failed").length || 0,
                icon: XCircle,
                color: "text-rose-500",
                bgColor: "bg-rose-500/10"
              }
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-xl font-bold mt-3 text-slate-800">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Filters & Orders List */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-3 sm:p-5 shadow-sm mb-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider self-start sm:self-center">Fulfillment Sync Monitor</h3>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Orders" },
                { id: "active", label: "Synced with AWB" },
                { id: "none", label: "Pending Setup" },
                { id: "failed", label: "Failed Pipeline" }
              ].map((btn) => {
                const isActive = filterType === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setFilterType(btn.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Log Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-12">
            {!orders ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Loading Order Sync Metrics...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Orders in Queue</h3>
                <p className="text-slate-500 text-xs mt-1">There are no orders that match this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4">Order Details</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4 text-center">Integration State</th>
                      <th className="px-6 py-4">Shiprocket Info</th>
                      <th className="px-6 py-4 text-center">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                      const shState = order.shiprocketDetails?.shiprocketOrderId 
                        ? "created" 
                        : (order.shiprocketDetails?.status === "failed" ? "failed" : "none");
                      const style = shiprocketStatusStyles[shState];
                      
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group text-slate-700">
                          <td className="px-6 py-4.5">
                            <span className="font-extrabold text-slate-900 text-sm hover:underline cursor-pointer block" onClick={() => setSelectedOrder(order)}>
                              {order.orderNumber}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                              <span className="font-bold text-slate-800">₹{order.orderTotal?.toLocaleString("en-IN")}</span>
                              {order.paymentDetails?.paymentMethod === "cod" ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded font-mono text-[9px] font-extrabold">COD Split (₹{order.paymentDetails?.codCharge || 200} Paid)</span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded font-mono text-[9px] font-extrabold">Prepaid</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            <div className="text-slate-800 font-bold text-xs">{order.shippingDetails?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{order.shippingDetails?.city}, PIN {order.shippingDetails?.pincode}</div>
                          </td>

                          <td className="px-6 py-4.5 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold select-none justify-center min-w-[110px] ${style.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.badge}`} />
                              <span>{style.text}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            {order.shiprocketDetails?.shiprocketOrderId ? (
                              <div className="text-xs space-y-1">
                                <p><span className="text-slate-400 font-medium">AWB Code:</span> <code className="font-bold text-slate-800">{order.shiprocketDetails.awbCode || "Assigning..."}</code></p>
                                <p><span className="text-slate-400 font-medium">Courier:</span> <span className="font-semibold text-slate-700 capitalize">{order.shiprocketDetails.courierName || "Standard logistics"}</span></p>
                              </div>
                            ) : order.shiprocketDetails?.status === "failed" ? (
                              <div className="text-rose-600 text-xs flex gap-1.5 items-center max-w-[280px]">
                                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                                <span className="line-clamp-2 leading-relaxed" title={order.shiprocketDetails.error}>
                                  {order.shiprocketDetails.error || "Integration setup encountered a critical failure."}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Awaiting sync trigger</span>
                            )}
                          </td>

                          <td className="px-6 py-4.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Trigger Sync / Retry Button */}
                              {(!order.shiprocketDetails?.shiprocketOrderId || order.shiprocketDetails?.status === "failed") ? (
                                <button
                                  onClick={() => handleRetryCreateOrder(order.orderNumber)}
                                  disabled={retryingOrderNumber === order.orderNumber || order.status === "cancelled"}
                                  className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-800 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit"
                                  title="Send to Shiprocket"
                                >
                                  {retryingOrderNumber === order.orderNumber ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  )}
                                  <span>{order.shiprocketDetails?.status === "failed" ? "Retry Sync" : "Sync Order"}</span>
                                </button>
                              ) : (
                                <a
                                  href={order.shiprocketDetails.trackingUrl || `https://shiprocket.co/tracking/${order.shiprocketDetails.awbCode}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 bg-blue-50 border border-blue-150 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  <span>Track</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all border border-slate-100 hover:border-slate-200 shadow-sm"
                                title="Inspect Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Sliding Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay backdrop */}
          <div
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 border-l border-slate-150 animate-slideLeft">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Operational Inspect</span>
                  <h2 className="text-xl font-bold tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-7">
                
                {/* Integration Details Banner */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Pipeline Status</h4>
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    selectedOrder.shiprocketDetails?.shiprocketOrderId 
                      ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
                      : (selectedOrder.shiprocketDetails?.status === "failed" ? "bg-rose-50 border-rose-150 text-rose-800" : "bg-slate-50 border-slate-200 text-slate-600")
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm">
                        <Truck className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-[10px] opacity-75 uppercase font-bold tracking-wider">Shiprocket Sync State</p>
                        <p className="text-sm font-extrabold capitalize mt-0.5">
                          {selectedOrder.shiprocketDetails?.shiprocketOrderId ? "Order Generated Successfully" : (selectedOrder.shiprocketDetails?.status === "failed" ? "Sync Attempt Failed" : "Awaiting Sync Trigger")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics Metadata */}
                {selectedOrder.shiprocketDetails?.shiprocketOrderId && (
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm border-b border-slate-150 pb-2.5">
                      <Boxes className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Shiprocket Logistics Info</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-1">Shiprocket Order ID</span>
                        <span className="font-bold text-slate-800 font-mono text-sm">{selectedOrder.shiprocketDetails.shiprocketOrderId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-1">Shipment ID</span>
                        <span className="font-bold text-slate-800 font-mono text-sm">{selectedOrder.shiprocketDetails.shipmentId || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-1">AWB Tracking Number</span>
                        <span className="font-bold text-slate-800 font-mono text-sm">{selectedOrder.shiprocketDetails.awbCode || "Assigned by courier"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-1">Courier Vendor</span>
                        <span className="font-bold text-slate-800 text-sm capitalize">{selectedOrder.shiprocketDetails.courierName || "N/A"}</span>
                      </div>
                    </div>

                    {selectedOrder.shiprocketDetails.trackingUrl && (
                      <div className="border-t border-slate-200/50 pt-3 mt-1 flex justify-end">
                        <a
                          href={selectedOrder.shiprocketDetails.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-200 transition-all cursor-pointer"
                        >
                          <span>Open Tracking Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Box if Sync Failed */}
                {selectedOrder.shiprocketDetails?.status === "failed" && (
                  <div className="bg-rose-50 border border-rose-150 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                      <h3>Error Logs Description</h3>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed font-mono bg-white/70 p-3 rounded-xl border border-rose-100 overflow-x-auto">
                      {selectedOrder.shiprocketDetails.error}
                    </p>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          handleRetryCreateOrder(selectedOrder.orderNumber);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>Force Sync Retry</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid Info: Customer & Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info Box */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-4">
                      <User className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Client Information</h3>
                    </div>
                    <div className="text-xs space-y-2.5 text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-medium">Customer Name</span>
                        <span className="font-semibold text-slate-800 text-sm">{selectedOrder.shippingDetails?.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Email Address</span>
                        <a href={`mailto:${selectedOrder.shippingDetails?.email}`} className="text-blue-600 hover:underline">
                          {selectedOrder.shippingDetails?.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Contact Phone</span>
                        <a href={`tel:${selectedOrder.shippingDetails?.phone}`} className="text-slate-800 font-semibold hover:underline">
                          {selectedOrder.shippingDetails?.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-4">
                      <CreditCard className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Financials & Settlement</h3>
                    </div>
                    <div className="text-xs space-y-2.5 text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-medium">Settlement Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                          selectedOrder.paymentDetails?.status === "completed" || selectedOrder.paymentDetails?.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedOrder.paymentDetails?.status === "partial"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }`}>
                          {selectedOrder.paymentDetails?.status || "pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Gateway Payment Method</span>
                        <span className="font-semibold text-slate-800 uppercase text-xs">{selectedOrder.paymentDetails?.paymentMethod || "cod"}</span>
                      </div>
                      {selectedOrder.paymentDetails?.paymentMethod === "cod" ? (
                        <>
                          <div>
                            <span className="text-slate-400 block font-medium">Online Upfront Fee Paid</span>
                            <span className="font-extrabold text-emerald-600 text-sm">₹{selectedOrder.paymentDetails?.codCharge?.toLocaleString("en-IN") || "200.00"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Cash Due on Delivery</span>
                            <span className="font-extrabold text-amber-700 text-sm">₹{selectedOrder.paymentDetails?.remainingCOD?.toLocaleString("en-IN") || (selectedOrder.orderTotal - 200).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Grand Total Value</span>
                            <span className="font-extrabold text-slate-900 text-sm">₹{selectedOrder.orderTotal?.toLocaleString("en-IN")}</span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-slate-400 block font-medium">Order Total Paid</span>
                          <span className="font-extrabold text-slate-900 text-base">₹{selectedOrder.orderTotal?.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address Details */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-3">
                    <MapPin className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Delivery Destination Address</h3>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <p className="text-slate-800 font-semibold leading-relaxed text-sm">
                      {selectedOrder.shippingDetails?.fullName}
                    </p>
                    <p className="leading-relaxed">
                      {selectedOrder.shippingDetails?.flatNo && `${selectedOrder.shippingDetails?.flatNo}, `}
                      {selectedOrder.shippingDetails?.area && `${selectedOrder.shippingDetails?.area}, `}
                      {selectedOrder.shippingDetails?.landmark && `Near ${selectedOrder.shippingDetails?.landmark}, `}
                      {selectedOrder.shippingDetails?.address}
                    </p>
                    <p className="font-bold text-slate-800">
                      {selectedOrder.shippingDetails?.city}, {selectedOrder.shippingDetails?.state} - {selectedOrder.shippingDetails?.pincode}
                    </p>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">{selectedOrder.shippingDetails?.country || "India"}</p>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                      <ShoppingBag className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Ordered Items ({selectedOrder.items?.length})</h3>
                    </div>
                    <span className="text-xs text-slate-400">Total item units: {selectedOrder.items?.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-white border shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs tracking-tight truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">SIZE: {item.size} • QTY: {item.quantity}</p>
                        </div>
                        <div className="text-right font-extrabold text-slate-900 text-sm">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
