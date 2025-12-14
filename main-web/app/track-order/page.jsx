"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import { useGuestOrders } from "@/hooks/useGuestOrders";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { guestOrders, getGuestOrderByNumber } = useGuestOrders();

  const handleSearch = (e) => {
    e.preventDefault();
    setNotFound(false);
    setSearchedOrder(null);

    if (!orderNumber.trim()) {
      alert("Please enter an order number");
      return;
    }

    // Search in guest orders (local storage)
    const order = getGuestOrderByNumber(orderNumber.trim());

    if (order) {
      setSearchedOrder(order);
    } else {
      setNotFound(true);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "confirmed":
        return <Package className="w-6 h-6 text-blue-500" />;
      case "shipped":
        return <Truck className="w-6 h-6 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Package className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 md:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-sm font-light text-gray-600">
            Enter your order number to see the latest status
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., ORD-123456)"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 outline-none transition-all text-sm font-light"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white rounded-xl font-light text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Search className="w-4 h-4" />
              Track
            </button>
          </div>
        </motion.form>

        {/* Order Not Found */}
        {notFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center"
          >
            <p className="text-sm font-light text-red-600">
              Order not found. Please check your order number and try again.
            </p>
          </motion.div>
        )}

        {/* Order Details */}
        {searchedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-light text-gray-900 mb-1">
                  Order #{searchedOrder.orderNumber}
                </h2>
                <p className="text-xs font-light text-gray-600">
                  Placed on{" "}
                  {new Date(searchedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(searchedOrder.status)}
                <span className="text-sm font-light capitalize">
                  {searchedOrder.status}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-base font-light text-gray-900 mb-4">
                Order Items
              </h3>
              <div className="space-y-3">
                {searchedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-light text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs font-light text-gray-600">
                        Size: {item.size} | Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-light text-gray-900">
                      ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-light text-gray-900 mb-4">
                Shipping Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-light text-gray-600 mb-1">Name</p>
                  <p className="font-light text-gray-900">
                    {searchedOrder.shippingDetails.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-600 mb-1">Phone</p>
                  <p className="font-light text-gray-900">
                    {searchedOrder.shippingDetails.phone}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-light text-gray-600 mb-1">
                    Address
                  </p>
                  <p className="font-light text-gray-900">
                    {searchedOrder.shippingDetails.address},{" "}
                    {searchedOrder.shippingDetails.city},{" "}
                    {searchedOrder.shippingDetails.state} -{" "}
                    {searchedOrder.shippingDetails.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-base font-light text-gray-900">
                  Total Amount
                </span>
                <span className="text-xl font-light text-gray-900">
                  {searchedOrder.orderTotal}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Guest Orders */}
        {!searchedOrder && !notFound && guestOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">
              Your Recent Orders
            </h2>
            <div className="space-y-3">
              {guestOrders.slice(0, 5).map((order) => (
                <button
                  key={order.orderNumber}
                  onClick={() => {
                    setOrderNumber(order.orderNumber);
                    setSearchedOrder(order);
                  }}
                  className="w-full bg-white rounded-xl p-4 shadow hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-light text-gray-900">
                        Order #{order.orderNumber}
                      </p>
                      <p className="text-xs font-light text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-xs font-light capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
