"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Clock,
  Eye,
  Search,
  ShoppingBag,
  User,
  Filter,
  ChevronDown,
  ChevronRight,
  Phone,
  Star
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

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

  // Get status styling - Clean monochrome
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-gray-800 bg-gray-50 border border-gray-200";
      case "confirmed":
        return "text-white bg-gray-700 border border-gray-700";
      case "shipped":
        return "text-white bg-gray-900 border border-gray-900";
      case "delivered":
        return "text-gray-900 bg-gray-100 border border-gray-300 font-semibold";
      case "cancelled":
        return "text-gray-600 bg-gray-50 border border-gray-200";
      default:
        return "text-gray-700 bg-gray-50 border border-gray-200";
    }
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = (status) => {
    switch (status) {
      case "order_placed":
        return <Calendar className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "out_for_delivery":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <Check className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-200">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-sm text-gray-600">
              Sign in to view your order history and track deliveries
            </p>
          </div>
          <button 
            onClick={() => router.push("/login")}
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:block">Back</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Orders</h1>
            </div>
            
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!userOrders ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">Loading your orders...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Results Info */}
              <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {filteredOrders.length}
                    </span>{" "}
                    {filteredOrders.length === 1 ? "order" : "orders"}
                    {searchQuery || selectedStatus !== "all" ? " found" : ""}
                  </p>
                  {(searchQuery || selectedStatus !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedStatus("all");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center py-12 sm:py-16"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery || selectedStatus !== "all"
                    ? "No orders match your search"
                    : "No orders yet"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto px-4">
                  {searchQuery || selectedStatus !== "all"
                    ? "Try adjusting your search criteria or browse all orders"
                    : "Start shopping to see your order history here"}
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-black text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Start Shopping
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredOrders.map((order, index) => (
                  <OrderCard 
                    key={order._id}
                    order={order}
                    index={index}
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced Order Card Component
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Main Card Content */}
      <div className="p-4 sm:p-6 cursor-pointer" onClick={() => router.push(`/orders/${order.orderNumber}`)}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
          {/* Order Info */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                #{order.orderNumber}
              </h3>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide w-fit ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Ordered {formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span className="font-semibold text-gray-900">₹{order.orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">{isExpanded ? "Less" : "Quick View"}</span>
              <span className="sm:hidden">{isExpanded ? "Less" : "More"}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-4 mt-4 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="w-[100px]  border-2 border-white rounded-lg overflow-hidden"
                >
                  <img
                    src={item.image || "/products/placeholder.jpg"}
                    alt={item.name}
                    width={80}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white rounded-lg bg-gray-200 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    +{order.items.length - 3}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.items.length} item{order.items.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-500">
                {order.items[0]?.name}{order.items.length > 1 && ` and ${order.items.length - 1} more`}
              </p>
            </div>
          </div>

          {order.estimatedDeliveryDate && (
            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-500">Expected delivery</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(order.estimatedDeliveryDate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-gray-200 bg-gray-50"
          >
            <div className="p-4 sm:p-6 space-y-6">
              {/* Detailed Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Items Ordered</h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="w-[100px] rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || "/products/placeholder.jpg"}
                          alt={item.name}
                          width={80}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1 text-sm text-gray-600">
                          <span>Size: {item.size}</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Info */}
                {order.paymentDetails && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Payment Successful</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-semibold">₹{order.paymentDetails.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Method</span>
                            <span className="capitalize">{order.paymentDetails.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid by</span>
                            <span>{order.paymentDetails.paidBy}</span>
                          </div>
                          {order.paymentDetails.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date</span>
                              <span>{formatDate(order.paymentDetails.paidAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Tracking */}
                {order.deliveryDetails && order.deliveryDetails.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Order Tracking</h4>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="space-y-4">
                        {order.deliveryDetails
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .slice(0, 3)
                          .map((detail, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                              {getDeliveryStatusIcon(detail.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
                                <p className="font-medium text-gray-900 capitalize text-sm">
                                  {detail.status.replace("_", " ")}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatDate(detail.timestamp)}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">{detail.message}</p>
                              {detail.location && (
                                <p className="text-gray-500 text-xs mt-1">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {detail.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}