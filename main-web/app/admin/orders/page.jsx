"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  FileText,
  Send,
  Archive,
  Users,
  Settings,
  BarChart3
} from "lucide-react";

const ORDER_STATUSES = [
  { value: "all", label: "All Orders", color: "gray", count: 0 },
  { value: "pending", label: "Pending", color: "yellow", count: 0 },
  { value: "confirmed", label: "Confirmed", color: "blue", count: 0 },
  { value: "shipped", label: "Shipped", color: "purple", count: 0 },
  { value: "delivered", label: "Delivered", color: "green", count: 0 },
  { value: "cancelled", label: "Cancelled", color: "red", count: 0 },
];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  confirmed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function AdminOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list, grid, compact
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, orderTotal, status
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [emailSearch, setEmailSearch] = useState("");

  // Queries
  const orderStats = useQuery(api.orders.getOrderStats);
  const orders = useQuery(api.orders.getOrdersWithFilters, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    searchQuery: searchQuery || undefined,
    emailSearch: emailSearch || undefined,
    startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
    endDate: dateRange.end ? new Date(dateRange.end).getTime() : undefined,
    limit: 100,
  });

  // Mutations
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
  const bulkUpdateStatus = useMutation(api.orders.bulkUpdateOrderStatus);
  const cancelOrder = useMutation(api.orders.cancelOrder);
  const addDeliveryUpdate = useMutation(api.orders.addDeliveryUpdate);

  // Update status counts
  useEffect(() => {
    if (orderStats) {
      ORDER_STATUSES.forEach(status => {
        if (status.value === "all") {
          status.count = orderStats.total;
        } else {
          status.count = orderStats[status.value] || 0;
        }
      });
    }
  }, [orderStats]);

  // Format helpers
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    const IconComponent = STATUS_ICONS[status] || Clock;
    return <IconComponent className="w-4 h-4" />;
  };

  // Handlers
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      const result = await updateOrderStatus({
        orderId,
        status: newStatus,
        updatedBy: "admin"
      });

      console.log("Status update result:", result);
      console.log("Result keys:", Object.keys(result));
      console.log("Has orderDetails?", "orderDetails" in result);
      console.log("orderDetails value:", result.orderDetails);

      // Send email notification to customer (non-blocking)
      if (result.success && result.orderDetails) {
        console.log("Sending email to:", result.orderDetails.customerEmail);
        fetch("/api/send-order-status-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.orderDetails),
        })
          .then(response => response.json())
          .then(data => console.log("Email sent:", data))
          .catch((error) => {
            console.error("Error sending status update email:", error);
          });
      } else {
        console.log("No order details to send email");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) return;

    try {
      setIsLoading(true);
      await bulkUpdateStatus({
        orderIds: selectedOrders,
        status: newStatus,
        updatedBy: "admin"
      });
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error bulk updating status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      setIsLoading(true);
      await cancelOrder({
        orderId,
        reason,
        updatedBy: "admin"
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders?.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders?.map(order => order._id) || []);
    }
  };

  const handleExport = () => {
    // Export functionality
    const csvContent = "data:text/csv;charset=utf-8," +
      "Order Number,Customer Name,Email,Phone,Status,Total,Date\n" +
      orders?.map(order =>
        `${order.orderNumber},${order.shippingDetails.fullName},${order.shippingDetails.email},${order.shippingDetails.phone},${order.status},${order.orderTotal},${formatDate(order.createdAt)}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!orderStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.todayOrders}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order number..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder="Search by user email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Order Date</option>
                  <option value="orderTotal">Order Total</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setEmailSearch("");
                  setDateRange({ start: "", end: "" });
                  setSortBy("createdAt");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${selectedStatus === status.value
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {getStatusIcon(status.value)}
                {status.label}
                <span className={`ml-1 py-0.5 px-2 rounded-full text-xs ${status.value === "all"
                  ? "bg-gray-100 text-gray-600"
                  : STATUS_COLORS[status.value] || "bg-gray-100 text-gray-600"
                  }`}>
                  {status.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Update Status</option>
                  <option value="confirmed">Confirm</option>
                  <option value="shipped">Ship</option>
                  <option value="delivered">Mark Delivered</option>
                  <option value="cancelled">Cancel</option>
                </select>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="divide-y divide-gray-200">
          {orders?.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => handleSelectOrder(order._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>

                    {/* User Information */}
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{order.shippingDetails.fullName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{order.shippingDetails.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{order.shippingDetails.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{formatCurrency(order.orderTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedOrder === order._id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Order Details */}
              <AnimatePresence>
                {expandedOrder === order._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-6"
                  >
                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Customer Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Name:</span>
                            <span className="text-sm font-medium text-gray-900">{order.shippingDetails.fullName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium text-gray-900">{order.shippingDetails.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Phone:</span>
                            <span className="text-sm font-medium text-gray-900">{order.shippingDetails.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Location:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {order.shippingDetails.city}, {order.shippingDetails.state}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Order Date:</span>
                            <span className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Payment:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {order.paymentDetails.status} ({order.paymentDetails.paymentMethod || 'Razorpay'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={item.image}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                              <p className="text-sm text-gray-500">Total: {formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Shipping Address
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-gray-900">{order.shippingDetails.fullName}</p>
                          <p className="text-gray-600">{order.shippingDetails.address}</p>
                          <p className="text-gray-600">
                            {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}
                          </p>
                          <p className="text-gray-600">{order.shippingDetails.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {order.status !== "cancelled" && (
                          <button
                            onClick={() => {
                              const reason = prompt("Cancellation reason:");
                              if (reason) handleCancelOrder(order._id, reason);
                            }}
                            className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">Order Total</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(order.orderTotal)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {orders?.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}