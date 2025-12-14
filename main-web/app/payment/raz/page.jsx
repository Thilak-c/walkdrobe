"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Loader2, Lock, CreditCard } from "lucide-react";

export default function RazorpayPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const createOrderMutation = useMutation(api.orders.createOrder);
  const clearCartMutation = useMutation(api.cart.clearCart);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Invalid payment link");
      setIsProcessing(false);
      return;
    }

    try {
      // Decode payment data
      const decoded = JSON.parse(atob(token));
      setPaymentData(decoded);

      // Load Razorpay and initiate payment
      loadRazorpayAndPay(decoded);
    } catch (err) {
      console.error("Error decoding payment data:", err);
      setError("Invalid payment data");
      setIsProcessing(false);
    }
  }, [searchParams]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  const loadRazorpayAndPay = async (data) => {
    try {
      const Razorpay = await loadRazorpayScript();
      if (!Razorpay) {
        throw new Error("Failed to load Razorpay");
      }

      // Map items to order format
      let mappedItems;
      if (data.isDirectPurchase) {
        mappedItems = [
          {
            productId: data.items[0].productId,
            name: data.items[0].productName,
            price: data.items[0].price,
            quantity: data.items[0].quantity,
            size: data.items[0].size,
            image: data.items[0].productImage,
          },
        ];
      } else {
        mappedItems = data.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.productImage,
        }));
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RAMQAuyK0c66gh",
        amount: data.amount,
        currency: data.currency,
        name: "Walkdrobe",
        description: `Order for ${data.customerDetails.fullName}`,
        image: "https://walkdrobe.in/favicon.png",
        order_id: data.orderId,
        prefill: {
          name: data.customerDetails.fullName,
          email: data.customerDetails.email,
          contact: data.customerDetails.phone,
        },
        notes: {
          name: data.customerDetails.fullName,
          email: data.customerDetails.email,
          phone: data.customerDetails.phone,
          address: `${data.customerDetails.address}, ${data.customerDetails.city}, ${data.customerDetails.state} - ${data.customerDetails.pincode}`,
        },
        theme: {
          color: "#000000",
        },
        handler: async function (response) {
          try {
            setIsProcessing(true);

            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              // Determine payment method and amounts based on hybrid or regular payment
              const isHybrid = data.isHybridPayment;
              const paymentMethod = isHybrid ? "hybrid" : "razorpay";
              const paymentStatus = isHybrid ? "partial" : "paid";
              
              // Create order
              const orderResult = await createOrderMutation({
                userId: data.userId || null,
                items: mappedItems,
                shippingDetails: data.customerDetails,
                paymentDetails: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  amount: data.orderTotal,
                  currency: "INR",
                  status: paymentStatus,
                  paidAt: Date.now(),
                  paidBy: data.customerDetails.fullName,
                  paymentMethod: paymentMethod,
                  // Hybrid payment specific fields
                  ...(isHybrid && {
                    upfrontPaid: data.hybridDetails.upfrontAmount,
                    codPending: data.hybridDetails.codAmount,
                    discount: data.hybridDetails.discount,
                    originalTotal: data.hybridDetails.originalTotal,
                  }),
                },
                orderTotal: data.orderTotal,
                status: "confirmed",
              });

              if (orderResult.success) {
                // Send order confirmation email (non-blocking)
                fetch("/api/send-order-confirmation", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userEmail: data.customerDetails.email,
                    userName: data.customerDetails.fullName,
                    orderNumber: orderResult.orderNumber,
                    orderItems: mappedItems,
                    orderTotal: data.orderTotal,
                    shippingDetails: data.customerDetails,
                    paymentDetails: {
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      amount: data.orderTotal,
                      currency: "INR",
                      status: paymentStatus,
                      paidAt: Date.now(),
                      paidBy: data.customerDetails.fullName,
                      paymentMethod: paymentMethod,
                      ...(isHybrid && {
                        upfrontPaid: data.hybridDetails.upfrontAmount,
                        codPending: data.hybridDetails.codAmount,
                        discount: data.hybridDetails.discount,
                      }),
                    },
                  }),
                }).catch((emailError) => {
                  console.error("Error sending order confirmation email:", emailError);
                });

                // Clear cart if not direct purchase
                if (!data.isDirectPurchase && data.userId) {
                  try {
                    await clearCartMutation({ userId: data.userId });
                  } catch (error) {
                    console.error("Error clearing cart:", error);
                  }
                }

                // Redirect to success page on main domain
                window.location.href = `https://walkdrobe.in/order-success?orderNumber=${orderResult.orderNumber}`;
              } else {
                setError("Order creation failed. Please contact support.");
                setIsProcessing(false);
              }
            } else {
              setError("Payment verification failed. Please contact support.");
              setIsProcessing(false);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setError("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Redirect back to checkout with original parameters if direct purchase
            if (data.isDirectPurchase && data.items && data.items.length > 0) {
              const item = data.items[0];
              const params = new URLSearchParams({
                productId: item.productId,
                productName: item.productName,
                productImage: item.productImage,
                price: item.price,
                size: item.size,
                quantity: item.quantity,
                category: item.category || '',
                brand: item.brand || '',
                action: 'buyNow'
              });
              window.location.href = `https://walkdrobe.in/checkout?${params.toString()}`;
            } else {
              // Regular cart checkout
              window.location.href = "https://walkdrobe.in/checkout";
            }
          },
        },
      };

      // Open Razorpay checkout
      const razorpayInstance = new Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        setError("Payment failed. Please try again.");
        setIsProcessing(false);
        setTimeout(() => {
          // Redirect back to checkout with original parameters if direct purchase
          if (data.isDirectPurchase && data.items && data.items.length > 0) {
            const item = data.items[0];
            const params = new URLSearchParams({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              price: item.price,
              size: item.size,
              quantity: item.quantity,
              category: item.category || '',
              brand: item.brand || '',
              action: 'buyNow'
            });
            window.location.href = `https://walkdrobe.in/checkout?${params.toString()}`;
          } else {
            window.location.href = "https://walkdrobe.in/checkout";
          }
        }, 3000);
      });

      razorpayInstance.open();
      setIsProcessing(false);
    } catch (error) {
      console.error("Error loading Razorpay:", error);
      setError("Failed to load payment gateway. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                // Redirect back to checkout with original parameters if direct purchase
                if (paymentData?.isDirectPurchase && paymentData?.items && paymentData.items.length > 0) {
                  const item = paymentData.items[0];
                  const params = new URLSearchParams({
                    productId: item.productId,
                    productName: item.productName,
                    productImage: item.productImage,
                    price: item.price,
                    size: item.size,
                    quantity: item.quantity,
                    category: item.category || '',
                    brand: item.brand || '',
                    action: 'buyNow'
                  });
                  window.location.href = `https://walkdrobe.in/checkout?${params.toString()}`;
                } else {
                  window.location.href = "https://walkdrobe.in/checkout";
                }
              }}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Return to Checkout
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h2>
            <p className="text-gray-600 mb-6">
              {isProcessing
                ? "Initializing secure payment gateway..."
                : "Opening payment window..."}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Please wait...</span>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
