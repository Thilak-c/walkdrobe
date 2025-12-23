"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, processing, success, error
  const [message, setMessage] = useState("Initializing payment...");
  const [paymentData, setPaymentData] = useState(null);

  const createOrderMutation = useMutation(api.orders.createOrder);
  const clearCartMutation = useMutation(api.cart.clearCart);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid payment request");
      return;
    }

    try {
      const decoded = JSON.parse(atob(token));
      setPaymentData(decoded);
      initializePayment(decoded);
    } catch (err) {
      setStatus("error");
      setMessage("Failed to decode payment data");
    }
  }, [searchParams]);

  const initializePayment = async (data) => {
    setStatus("processing");
    setMessage("Opening payment gateway...");

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => openRazorpay(data);
    script.onerror = () => {
      setStatus("error");
      setMessage("Failed to load payment gateway");
    };
    document.body.appendChild(script);
  };

  const openRazorpay = (data) => {
    // Debug: Log the order_id being used
    console.log("Opening Razorpay with order_id:", data.orderId);
    console.log("Using key:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RtYKQ2F9glN6Vf");
    
    if (!data.orderId) {
      setStatus("error");
      setMessage("Order ID is missing. Please try again.");
      return;
    }
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RtYKQ2F9glN6Vf",
      amount: data.amount,
      currency: data.currency || "INR",
      name: "Walkdrobe",
      description: data.isHybridPayment 
        ? `Hybrid Payment - ₹${data.hybridDetails?.upfrontAmount} upfront` 
        : "Order Payment",
      order_id: data.orderId,
      prefill: {
        name: data.customerDetails?.fullName || "",
        email: data.customerDetails?.email || "",
        contact: data.customerDetails?.phone || "",
      },
      theme: { color: "#111827" },
      handler: async (response) => {
        await handlePaymentSuccess(response, data);
      },
      modal: {
        ondismiss: () => {
          setStatus("error");
          setMessage("Payment cancelled");
          setTimeout(() => router.push("/checkout"), 2000);
        },
      },
    };

    console.log("Razorpay options:", options);
    
    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      console.error("Payment failed:", response.error);
      setStatus("error");
      setMessage(response.error?.description || "Payment failed");
    });
    razorpay.open();
  };

  const handlePaymentSuccess = async (response, data) => {
    setStatus("processing");
    setMessage("Verifying payment...");

    try {
      // Verify payment
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error("Payment verification failed");

      setMessage("Creating your order...");

      // Map items for order
      const mappedItems = data.items.map((item) => ({
        productId: item.productId || "",
        name: item.productName || item.name || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        size: item.size || "Free",
        image: item.productImage || item.image || "",
      }));

      // Ensure shipping details have all required fields
      const shippingDetails = {
        fullName: data.customerDetails?.fullName || "",
        email: data.customerDetails?.email || "",
        phone: data.customerDetails?.phone || "",
        address: data.customerDetails?.address || "",
        city: data.customerDetails?.city || "",
        state: data.customerDetails?.state || "",
        pincode: data.customerDetails?.pincode || "",
        country: data.customerDetails?.country || "India",
      };

      // Create order in database
      const orderResult = await createOrderMutation({
        userId: data.userId || null,
        items: mappedItems,
        shippingDetails: shippingDetails,
        paymentDetails: {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          amount: Number(data.orderTotal) || 0,
          currency: "INR",
          status: data.isHybridPayment ? "partial" : "paid",
          paymentMethod: data.isHybridPayment ? "hybrid" : "razorpay",
        },
        orderTotal: Number(data.orderTotal) || 0,
        status: "confirmed",
      });

      if (!orderResult?.success) throw new Error(orderResult?.message || "Failed to create order");

      // Send confirmation emails
      await Promise.all([
        fetch("/api/send-order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: shippingDetails.email,
            userName: shippingDetails.fullName,
            orderNumber: orderResult.orderNumber,
            orderItems: mappedItems,
            orderTotal: data.orderTotal,
            shippingDetails: shippingDetails,
            paymentDetails: {
              amount: data.orderTotal,
              currency: "INR",
              status: data.isHybridPayment ? "partial" : "paid",
              paymentMethod: data.isHybridPayment ? "hybrid" : "razorpay",
            },
          }),
        }).catch(console.error),
        fetch("/api/send-admin-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: orderResult.orderNumber,
            customerName: shippingDetails.fullName,
            customerEmail: shippingDetails.email,
            orderTotal: data.orderTotal,
            items: mappedItems,
            shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}`,
            shippingDetails: shippingDetails,
            paymentDetails: {
              amount: data.orderTotal,
              currency: "INR",
              status: data.isHybridPayment ? "partial" : "paid",
              paymentMethod: data.isHybridPayment ? "hybrid" : "razorpay",
            },
          }),
        }).catch(console.error),
      ]);

      // Clear cart if not direct purchase
      if (!data.isDirectPurchase && data.userId) {
        try { await clearCartMutation({ userId: data.userId }); } catch (e) { console.error(e); }
      }

      setStatus("success");
      setMessage("Payment successful!");
      setTimeout(() => router.push(`/order-success?orderNumber=${orderResult.orderNumber}`), 1500);

    } catch (error) {
      console.error("Payment processing error:", error);
      setStatus("error");
      setMessage(error.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {status === "loading" || status === "processing" ? (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-500">{message}</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500">Redirecting to order confirmation...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button onClick={() => router.push("/checkout")} className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium">
              Try Again
            </button>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Secured by Razorpay</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
