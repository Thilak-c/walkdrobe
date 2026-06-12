"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Home, ShoppingBag, Package, Calendar, MapPin, CreditCard, Truck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const colors = ["#22c55e", "#3b82f6", "#ef4444", "#eab308", "#a855f7", "#ec4899", "#14b8a6"];
const confettiCount = 70;
const confettiParticles = Array.from({ length: confettiCount }).map((_, i) => {
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 220 + 100;
  return {
    id: i,
    x: Math.cos(angle) * velocity,
    y: Math.sin(angle) * velocity - 140, // Parabolas start with an upward thrust
    scale: Math.random() * 0.65 + 0.35,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.12,
    rotate: Math.random() * 720,
    duration: Math.random() * 1.6 + 1.4,
  };
});

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
    <div className="min-h-screen bg-linear-to-br from-green-50/70 via-white to-green-50/70 py-10 relative overflow-hidden">
      {/* Background celebration floaters */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-green-100/30 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-emerald-100/30 rounded-full blur-xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="text-center space-y-6"
        >
          {/* Success Icon with Concentric Ripples and Confetti */}
          <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
            {/* Concentric sonar pulses */}
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.6, opacity: 0.7 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{
                  delay: index * 0.35,
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full border border-green-200/40 bg-green-50/15 pointer-events-none"
              />
            ))}

            {/* Checkmark bounce */}
            <motion.div
              initial={{ scale: 0, rotate: -60 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 280, 
                damping: 14,
                delay: 0.15 
              }}
              className="w-18 h-18 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200 z-10 relative"
            >
              <Check className="w-9 h-9 text-white stroke-[3.5px]" />
            </motion.div>

            {/* Mathematically-driven Confetti shooting out */}
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{ 
                  x: p.x, 
                  y: [0, p.y, p.y + 160], // parabolic path
                  scale: [0, p.scale, 0], // scale pop
                  opacity: [1, 1, 0],     // fade out
                  rotate: p.rotate
                }}
                transition={{ 
                  delay: p.delay,
                  duration: p.duration,
                  ease: "easeOut"
                }}
                style={{ 
                  backgroundColor: p.color,
                  width: `${Math.random() * 8 + 5}px`,
                  height: `${Math.random() * 12 + 6}px`,
                  borderRadius: Math.random() > 0.45 ? "50%" : "2px"
                }}
                className="absolute w-2.5 h-2.5 z-0 pointer-events-none"
              />
            ))}
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 font-sans">
              {order?.paymentDetails?.paymentMethod === "cod" ? "Order Confirmed!" : "Payment Successful!"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              {order?.paymentDetails?.paymentMethod === "cod"
                ? `Your Cash on Delivery order has been registered successfully. You have paid ₹${order.paymentDetails.codCharge || 200} advance from this order value, and we are making the order in the Shiprocket. The remaining ₹${(order.paymentDetails.remainingCOD || (order.orderTotal - 200)).toFixed(2)} will be collected on delivery.`
                : "Your order has been placed successfully. You will receive a confirmation email shortly."}
            </p>
            {orderNumber && (
              <div className="inline-block bg-green-50 border border-green-150 rounded-full px-4 py-1 mt-1">
                <p className="text-xs font-bold text-green-700">
                  Order Number: {orderNumber}
                </p>
              </div>
            )}
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3 block">
              Redirecting to home page in {countdown} seconds...
            </p>
          </div>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-xs"
            >
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-700" />
                Order Details
              </h2>
              
              <div className="space-y-2.5 text-left text-xs text-slate-650">
                {/* Order Info */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" /> Status
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] capitalize">
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
                  </span>
                  <span className="font-semibold text-slate-800">{formatDate(order.createdAt)}</span>
                </div>
                
                <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery Address
                  </span>
                  <span className="font-semibold text-slate-800 leading-relaxed pl-5">
                    {order.shippingDetails.address}, {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}
                  </span>
                </div>

                {/* Payment Info */}
                {order.paymentDetails && (
                  <div className="flex flex-col gap-1 py-1.5 border-b border-slate-100/80">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Details
                    </span>
                    <span className="font-semibold text-slate-800 leading-relaxed pl-5">
                      {order.paymentDetails.paymentMethod === "cod" ? (
                        <>
                          COD Advance Paid: <span className="text-emerald-600 font-bold">₹{(order.paymentDetails.codCharge || 200).toFixed(2)}</span> paid online (Razorpay)
                        </>
                      ) : (
                        <>
                          Paid <span className="text-slate-800 font-bold">₹{order.orderTotal.toFixed(2)}</span> online via <span className="capitalize">{order.paymentDetails.paymentMethod}</span>
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Estimated Delivery */}
                {order.estimatedDeliveryDate && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100/80">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" /> Expected Delivery
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                      {formatDeliveryDate(order.estimatedDeliveryDate)}
                    </span>
                  </div>
                )}
                
                {/* Order Items */}
                <div className="border-t border-slate-100 pt-3.5 mt-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                    Order Items ({order.items.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                        {item.image && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200/60 bg-white shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3.5 mt-3.5 space-y-2 text-xs">
                    {order.paymentDetails?.paymentMethod === "cod" && (
                      <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-2.5 space-y-1.5 mb-2.5">
                        <div className="flex justify-between text-slate-650">
                          <span>Online Advance Paid:</span>
                          <span className="font-bold text-emerald-650 font-mono">₹{(order.paymentDetails.codCharge || 200).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>COD Balance Due at Doorstep:</span>
                          <span className="font-extrabold text-amber-700 font-mono">₹{(order.paymentDetails.remainingCOD || (order.orderTotal - 200)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-100/60 pt-2.5 mt-1">
                      <span>Total Invoice Value:</span>
                      <span className="text-slate-900 font-mono font-extrabold">
                        ₹{order.orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Tracking */}
                {order.deliveryDetails && order.deliveryDetails.length > 0 && (
                  <div className="border-t border-slate-100 pt-3.5 mt-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-700" />
                      Delivery Tracking
                    </h3>
                    <div className="space-y-2">
                      {order.deliveryDetails
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((detail, index) => (
                        <div key={index} className="flex items-start space-x-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-semibold capitalize">{detail.status.replace('_', ' ')}</p>
                            <p className="text-gray-600 text-[11px]">{detail.message}</p>
                            {detail.location && (
                              <p className="text-gray-500 text-[10px]">Location: {detail.location}</p>
                            )}
                            <p className="text-gray-400 text-[9px] font-mono mt-0.5">{formatDate(detail.timestamp)}</p>
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
          <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
            <button
              onClick={() => {
                if (!hasNavigated) {
                  setHasNavigated(true);
                  router.push('/');
                }
              }}
              disabled={hasNavigated}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:bg-slate-600 transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Home className="w-3.5 h-3.5" />
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
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:bg-emerald-400 transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Orders</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 