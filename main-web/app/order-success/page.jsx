"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Home, ShoppingBag, Package, Calendar, MapPin } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  const orderNumber = searchParams.get('orderNumber');
  
  // Get order details if order number is available
  const order = useQuery(
    api.orders.getOrderByNumber, 
    orderNumber ? { orderNumber } : "skip"
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1 && !hasNavigated) {
          setHasNavigated(true);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
          router.push('/');
          }, 100);
          return 0;
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, hasNavigated]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDeliveryDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-center space-y-4"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-sm text-gray-600">
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </p>
            {orderNumber && (
              <p className="text-sm font-semibold text-green-600">
                Order Number: {orderNumber}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Redirecting to home page in {countdown} seconds...
            </p>
          </div>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <h2 className="text-base font-bold text-gray-900 mb-3">Order Details</h2>
              
              <div className="space-y-2 text-left">
                {/* Order Info */}
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>Order Status: <span className="font-semibold text-green-600 capitalize">{order.status}</span></span>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Order Date: <span className="font-semibold">{formatDate(order.createdAt)}</span></span>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Address: <span className="font-semibold">{order.shippingDetails.address}, {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</span></span>
                </div>

                {/* Payment Info */}
                {order.paymentDetails && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Paid by: <span className="font-semibold">{order.paymentDetails.paidBy}</span> via <span className="font-semibold capitalize">{order.paymentDetails.paymentMethod}</span></span>
                  </div>
                )}

                {/* Estimated Delivery */}
                {order.estimatedDeliveryDate && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span>Expected Delivery: <span className="font-semibold text-blue-600">{formatDeliveryDate(order.estimatedDeliveryDate)}</span></span>
                  </div>
                )}
                
                {/* Order Items */}
                <div className="border-t border-gray-200 pt-3">
                  <h3 className="font-semibold text-xs text-gray-900 mb-2">Order Items ({order.items.length})</h3>
                  <div className="space-y-1">
                                         {order.items.map((item, index) => (
                       <div key={index} className="flex justify-between items-center text-xs">
                         <span className="text-gray-600">{item.name} (Size: {item.size}) x {item.quantity}</span>
                         <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                       </div>
                     ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{order.orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Tracking */}
                {order.deliveryDetails && order.deliveryDetails.length > 0 && (
                  <div className="border-t border-gray-200 pt-3">
                    <h3 className="font-semibold text-xs text-gray-900 mb-2 flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>Delivery Tracking</span>
                    </h3>
                    <div className="space-y-2">
                      {order.deliveryDetails
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((detail, index) => (
                        <div key={index} className="flex items-start space-x-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium capitalize">{detail.status.replace('_', ' ')}</p>
                            <p className="text-gray-600">{detail.message}</p>
                            {detail.location && (
                              <p className="text-gray-500 text-[10px]">Location: {detail.location}</p>
                            )}
                            <p className="text-gray-400 text-[10px]">{formatDate(detail.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3">
            <button
              onClick={() => {
                if (!hasNavigated) {
                  setHasNavigated(true);
                  router.push('/');
                }
              }}
              disabled={hasNavigated}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-3 h-3" />
              <span>Go Home</span>
            </button>
            
            <button
              onClick={() => {
                if (!hasNavigated) {
                  setHasNavigated(true);
                  router.push('/orders');
                }
              }}
              disabled={hasNavigated}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>View Orders</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-500">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 