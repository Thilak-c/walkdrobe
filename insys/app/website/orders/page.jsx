"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, Truck, CheckCircle, XCircle, Clock, Search, Filter, Eye, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusIcons = {
  pending: Clock,
  confirmed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function WebsiteOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = useQuery(api.orders.getOrdersWithFilters, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    searchQuery: search || undefined,
    limit: 100,
  }) || [];

  const stats = useQuery(api.orders.getOrderStats) || {};
  const updateStatus = useMutation(api.orders.updateOrderStatus);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateStatus({ orderId, status: newStatus, updatedBy: "Admin" });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">

          {/* Header */}
          <div className="mb-6">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">WEBSITE STORE</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage customer orders</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total", value: stats.total || 0, color: "bg-gray-100" },
              { label: "Pending", value: stats.pending || 0, color: "bg-yellow-100" },
              { label: "Confirmed", value: stats.confirmed || 0, color: "bg-blue-100" },
              { label: "Shipped", value: stats.shipped || 0, color: "bg-purple-100" },
              { label: "Delivered", value: stats.delivered || 0, color: "bg-green-100" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.color} p-4 rounded-xl`}>
                <p className="text-xs text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                return (
                  <div key={order._id} className="bg-white rounded-xl border p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${statusColors[order.status]}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{order.shippingDetails?.fullName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">₹{order.orderTotal?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="px-3 py-1.5 border rounded-lg text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>


      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-medium mb-2">Customer Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.shippingDetails?.fullName}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.shippingDetails?.email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.shippingDetails?.phone}</p>
                  <p><span className="text-gray-500">Address:</span> {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city}, {selectedOrder.shippingDetails?.state} - {selectedOrder.shippingDetails?.pincode}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-2">Items ({selectedOrder.items?.length})</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="font-medium mb-2">Payment</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                  <p><span className="text-gray-500">Status:</span> {selectedOrder.paymentDetails?.status}</p>
                  <p><span className="text-gray-500">Method:</span> {selectedOrder.paymentDetails?.paymentMethod || "N/A"}</p>
                  <p className="text-lg font-bold mt-2">Total: ₹{selectedOrder.orderTotal?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
