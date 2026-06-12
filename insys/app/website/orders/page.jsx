"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Filter,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  IndianRupee,
  Copy,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Calendar,
  X,
  Package,
  Store,
  ChevronLeft,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

const statusColors = {
  pending: {
    bg: "bg-amber-50 border-amber-200 text-amber-700",
    glow: "shadow-amber-100",
    badge: "bg-amber-500",
    text: "text-amber-700"
  },
  confirmed: {
    bg: "bg-blue-50 border-blue-200 text-blue-700",
    glow: "shadow-blue-100",
    badge: "bg-blue-500",
    text: "text-blue-700"
  },
  shipped: {
    bg: "bg-purple-50 border-purple-200 text-purple-700",
    glow: "shadow-purple-100",
    badge: "bg-purple-500",
    text: "text-purple-700"
  },
  delivered: {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    glow: "shadow-emerald-100",
    badge: "bg-emerald-500",
    text: "text-emerald-700"
  },
  cancelled: {
    bg: "bg-rose-50 border-rose-200 text-rose-700",
    glow: "shadow-rose-100",
    badge: "bg-rose-500",
    text: "text-rose-700"
  }
};

const statusIcons = {
  pending: Clock,
  confirmed: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle
};

export default function WebsiteOrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [customTrackingMsg, setCustomTrackingMsg] = useState("");
  const [customTrackingLoc, setCustomTrackingLoc] = useState("");
  const [customTrackingStatus, setCustomTrackingStatus] = useState("processing");
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  // Check if logged into insys
  const [isInsysAuth, setIsInsysAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("insys_auth");
    if (auth) {
      const authData = JSON.parse(auth);
      setIsInsysAuth(authData.isLoggedIn);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch orders with optional filters
  const orders = useQuery(api.orders.getOrdersWithFilters, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    searchQuery: debouncedSearch || undefined,
    limit: 100
  });

  // Fetch real-time statistics
  const stats = useQuery(api.orders.getOrderStats) || {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    todayOrders: 0
  };

  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const addDeliveryUpdate = useMutation(api.orders.addDeliveryUpdate);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: {
        background: "#0f172a",
        color: "#fff",
        borderRadius: "10px",
      }
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatus({ orderId, status: newStatus, updatedBy: "Admin Portal" });
      toast.success(`Order status updated to ${newStatus}`, {
        style: {
          background: "#0f172a",
          color: "#fff",
          borderRadius: "10px"
        }
      });
      // Update local state if the drawer is viewing this order
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAddTrackingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !customTrackingMsg.trim()) return;

    setIsSubmittingTracking(true);
    try {
      const res = await addDeliveryUpdate({
        orderId: selectedOrder._id,
        status: customTrackingStatus,
        message: customTrackingMsg,
        location: customTrackingLoc || undefined,
        updatedBy: "Admin"
      });

      if (res.success) {
        toast.success("Delivery update logged successfully!");
        setCustomTrackingMsg("");
        setCustomTrackingLoc("");
        // Reload order detail in drawer
        setSelectedOrder(prev => ({
          ...prev,
          status: customTrackingStatus,
          deliveryDetails: [
            ...(prev.deliveryDetails || []),
            res.deliveryUpdate
          ]
        }));
      }
    } catch (err) {
      toast.error(`Error adding update: ${err.message}`);
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleOpenDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Show login required message if not authenticated to insys
  if (!isInsysAuth) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h2>
            <p className="text-slate-500 mb-6 text-sm">Please log in to your inventory system account to manage website orders.</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm font-semibold"
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
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-blue-500 tracking-widest text-[10px] font-bold uppercase mb-1">Website Store</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Customer Orders</h1>
              <p className="text-slate-500 text-sm mt-1">Monitor sales performance, tracking updates, and order fulfillment in real-time.</p>
            </div>
          
          </div>

          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              {
                label: "All Orders",
                value: stats.total || 0,
                icon: ShoppingBag,
                color: "text-slate-600",
                bgColor: "bg-slate-500/10"
              },
              {
                label: "Pending Checks",
                value: stats.pending || 0,
                icon: Clock,
                color: "text-amber-500",
                bgColor: "bg-amber-500/10"
              },
              {
                label: "Confirmed / Paid",
                value: stats.confirmed || 0,
                icon: Package,
                color: "text-blue-500",
                bgColor: "bg-blue-500/10"
              },
              {
                label: "In Transit",
                value: stats.shipped || 0,
                icon: Truck,
                color: "text-purple-500",
                bgColor: "bg-purple-500/10"
              },
              {
                label: "Total Sales Value",
                value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`,
                icon: IndianRupee,
                color: "text-emerald-600 font-bold",
                bgColor: "bg-emerald-500/10",
                fullWidth: true
              }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${
                    stat.fullWidth ? "col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold mt-4 tracking-tight text-slate-800`}>
                    {stat.value}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </div>
              );
            })}
          </div>

          {/* Filters & Search Row */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-3 sm:p-5 shadow-sm mb-4 sm:mb-6 flex flex-col md:flex-row items-center gap-3 sm:gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search order ID, client name, pincode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-sm focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Orders" },
                { id: "pending", label: "Pending" },
                { id: "confirmed", label: "Confirmed" },
                { id: "shipped", label: "Shipped" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" }
              ].map((btn) => {
                const isActive = statusFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setStatusFilter(btn.id)}
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

          {/* Orders Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            {!orders ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Synchronizing with system database...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Orders Found</h3>
                <p className="text-slate-500 text-xs mt-1">There are no orders matching your current query criteria.</p>
              </div>
            ) : (
              <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4">Order Details</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items / Qty</th>
                      <th className="px-6 py-4 text-right">Payment</th>
                      <th className="px-6 py-4 text-center">Fulfillment Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const StatusIcon = statusIcons[order.status] || Clock;
                      const styleConfig = statusColors[order.status] || statusColors.pending;
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-sm tracking-tight hover:underline cursor-pointer" onClick={() => handleOpenDrawer(order)}>
                                    {order.orderNumber}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(order.orderNumber, "Order ID")}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            <div className="text-slate-800 font-medium text-sm">
                              {order.shippingDetails?.fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                              {order.shippingDetails?.city}, {order.shippingDetails?.state}
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2.5 overflow-hidden">
                                {order.items?.slice(0, 3).map((item, idx) => (
                                  <img
                                    key={idx}
                                    src={item.image}
                                    alt={item.name}
                                    className="inline-block h-8 w-8 rounded-lg ring-2 ring-white object-cover bg-slate-50 border border-slate-100"
                                  />
                                ))}
                              </div>
                              <div>
                                <span className="text-xs text-slate-700 font-bold">
                                  {order.items?.length || 0} product{order.items?.length !== 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  total quantity: {order.items?.reduce((sum, item) => sum + item.quantity, 0)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4.5 text-right">
                             {order.paymentDetails?.paymentMethod === "cod" ? (
                               <div className="space-y-0.5">
                                 <div className="font-extrabold text-slate-850 text-sm">
                                   ₹{order.orderTotal?.toLocaleString("en-IN")}
                                 </div>
                                 <div className="text-[10px] font-semibold text-emerald-600">
                                   Paid: ₹{(order.paymentDetails?.codCharge || 200).toLocaleString("en-IN")}
                                 </div>
                                 <div className="text-[10px] font-bold text-amber-700">
                                   Due: ₹{(order.paymentDetails?.remainingCOD || (order.orderTotal - 200)).toLocaleString("en-IN")}
                                 </div>
                                 <span className="inline-block text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md mt-0.5">
                                   COD Split
                                 </span>
                               </div>
                             ) : (
                               <>
                                 <div className="font-extrabold text-slate-800 text-sm">
                                   ₹{order.orderTotal?.toLocaleString("en-IN")}
                                 </div>
                                 <div className="mt-0.5">
                                   <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded-md">
                                     {order.paymentDetails?.paymentMethod || "prepaid"}
                                   </span>
                                 </div>
                               </>
                             )}
                           </td>

                          <td className="px-6 py-4.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm select-none justify-center min-w-[110px] bg-white">
                              <span className={`w-1.5 h-1.5 rounded-full ${styleConfig.badge}`} />
                              <span className={styleConfig.text}>{order.status}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Fast status updater dropdown */}
                              <select
                                value={order.status}
                                disabled={updatingOrderId === order._id}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className="px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium focus:outline-none cursor-pointer focus:ring-1 focus:ring-slate-900 transition-colors"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => handleOpenDrawer(order)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all border border-slate-100 hover:border-slate-200 shadow-sm"
                                title="Full Order Info"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Order Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {orders.map((order) => {
                  const styleConfig = statusColors[order.status] || statusColors.pending;
                  return (
                    <div key={order._id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-[13px] cursor-pointer" onClick={() => handleOpenDrawer(order)}>{order.orderNumber}</span>
                            <button onClick={() => copyToClipboard(order.orderNumber, "Order ID")} className="text-slate-400 hover:text-slate-600"><Copy className="w-3 h-3" /></button>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold bg-white">
                          <span className={`w-1.5 h-1.5 rounded-full ${styleConfig.badge}`} />
                          <span className={styleConfig.text}>{order.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{order.shippingDetails?.fullName}</p>
                          <p className="text-[10px] text-slate-400">{order.shippingDetails?.city}, {order.shippingDetails?.state}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="font-extrabold text-slate-800 text-sm">₹{order.orderTotal?.toLocaleString("en-IN")}</p>
                          {order.paymentDetails?.paymentMethod === "cod" ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[9px] font-semibold text-emerald-650">Paid: ₹{(order.paymentDetails?.codCharge || 200).toLocaleString("en-IN")}</span>
                              <span className="text-[9px] font-bold text-amber-700">Due: ₹{(order.paymentDetails?.remainingCOD || (order.orderTotal - 200)).toLocaleString("en-IN")}</span>
                              <span className="text-[7px] font-black uppercase bg-amber-50 text-amber-700 px-1 rounded border border-amber-200">COD Split</span>
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">{order.paymentDetails?.paymentMethod || "prepaid"}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-2 overflow-hidden items-center">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <img key={idx} src={item.image} alt={item.name} className="inline-block h-7 w-7 rounded-lg ring-2 ring-white object-cover bg-slate-50" />
                          ))}
                          <span className="text-[10px] text-slate-400 ml-2">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select value={order.status} disabled={updatingOrderId === order._id} onChange={(e) => handleStatusChange(order._id, e.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-medium focus:outline-none cursor-pointer">
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button onClick={() => handleOpenDrawer(order)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-100"><Eye className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modern Sliding Drawer Modal */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay backdrop */}
          <div
            onClick={handleCloseDrawer}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 border-l border-slate-150 animate-slideLeft">
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Interactive Sheet</span>
                  <h2 className="text-xl font-bold tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-7">
                {/* Visual Status Indicator Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                  statusColors[selectedOrder.status]?.bg || "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      {(() => {
                        const Icon = statusIcons[selectedOrder.status] || Clock;
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Current Pipeline Status</p>
                      <p className="text-sm font-bold capitalize mt-0.5">{selectedOrder.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

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

                {/* Purchased Items List */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                      <ShoppingBag className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Ordered Items ({selectedOrder.items?.length})</h3>
                    </div>
                    <span className="text-xs text-slate-400">Total item units: {selectedOrder.items?.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>

                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors p-3.5 rounded-2xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-white border shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs tracking-tight truncate">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">SIZE: {item.size}</span>
                            <span>QTY: {item.quantity}</span>
                            <span>PRICE: ₹{item.price}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 text-sm block">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shiprocket Link if available */}
                {selectedOrder.shiprocketDetails?.awbCode && (
                  <div className="p-4 bg-blue-50 border border-blue-150 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Shiprocket Logistic Integration</p>
                        <p className="text-xs text-slate-800 font-bold mt-0.5">AWB: {selectedOrder.shiprocketDetails.awbCode}</p>
                      </div>
                    </div>
                    <a
                      href={selectedOrder.shiprocketDetails.trackingUrl || `https://shiprocket.co/tracking/${selectedOrder.shiprocketDetails.awbCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-200 transition-all cursor-pointer"
                    >
                      <span>Track Shipment</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Delivery Timeline / Tracking Logs */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-slate-800 font-bold text-sm mb-5 flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-slate-500" />
                    <span>Fulfillment Logs Timeline</span>
                  </h3>

                  <div className="relative pl-6 border-l border-slate-200 space-y-6 ml-3">
                    {/* Stepper Timeline Points */}
                    {selectedOrder.deliveryDetails?.map((detail, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[30px] top-1 bg-white p-1 rounded-full border-2 border-slate-900 ring-4 ring-white">
                          <CheckCircle2 className="w-3 h-3 text-slate-900" />
                        </span>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-800 text-xs tracking-tight capitalize">
                              {detail.status?.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(detail.timestamp).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{detail.message}</p>
                          {detail.location && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-semibold border">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{detail.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty Timeline Fallback */}
                    {(!selectedOrder.deliveryDetails || selectedOrder.deliveryDetails.length === 0) && (
                      <div className="text-xs text-slate-400 py-2 italic pl-2">
                        No shipping updates logged yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Custom Status Log Form */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-slate-800 font-bold text-sm mb-4">Add Fulfillment Log Update</h3>
                  <form onSubmit={handleAddTrackingUpdate} className="space-y-3 bg-slate-50/70 p-4 border rounded-2xl shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Timeline Step</label>
                        <select
                          value={customTrackingStatus}
                          onChange={(e) => setCustomTrackingStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800"
                        >
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out For Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current Hub Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Patna Hub"
                          value={customTrackingLoc}
                          onChange={(e) => setCustomTrackingLoc(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Update Message</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Package has arrived at sorting facility."
                        value={customTrackingMsg}
                        onChange={(e) => setCustomTrackingMsg(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingTracking || !customTrackingMsg.trim()}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingTracking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Logging...</span>
                        </>
                      ) : (
                        <span>Log Progress Step</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
