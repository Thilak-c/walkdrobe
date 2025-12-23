"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, CreditCard, Truck, Shield, Check, Lock, MapPin,
  Phone, Mail, AlertCircle, Loader2, Smartphone, Landmark, Wallet, Banknote, Home, X, Package
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isDirectPurchase = searchParams.get("action") === "buyNow";
  const directPurchaseItem = isDirectPurchase ? {
    productId: searchParams.get("productId"),
    productName: searchParams.get("productName"),
    productImage: searchParams.get("productImage"),
    price: parseFloat(searchParams.get("price")),
    size: searchParams.get("size"),
    quantity: parseInt(searchParams.get("quantity")),
    category: searchParams.get("category"),
    brand: searchParams.get("brand"),
  } : null;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("hybrid");
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);
  const [showHybridConfirmation, setShowHybridConfirmation] = useState(false);
  const [showMissDiscountPrompt, setShowMissDiscountPrompt] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState(null);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);

  const [shippingDetails, setShippingDetails] = useState({
    fullName: "", email: "", phone: "", houseNo: "", street: "", landmark: "",
    address: "", city: "", state: "", pincode: "", country: "India",
  });

  const [customAddress, setCustomAddress] = useState({
    fullName: "", email: "", phone: "", houseNo: "", street: "", landmark: "",
    address: "", city: "", state: "", pincode: "", country: "India",
  });

  const handlePaymentMethodChange = (method) => {
    if (selectedPaymentMethod === "hybrid" && method !== "hybrid") {
      setPendingPaymentMethod(method);
      setShowMissDiscountPrompt(true);
    } else {
      setSelectedPaymentMethod(method);
    }
  };

  const confirmSwitchPayment = () => {
    setSelectedPaymentMethod(pendingPaymentMethod);
    setShowMissDiscountPrompt(false);
    setPendingPaymentMethod(null);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(window.Razorpay); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  useEffect(() => {
    if (me) {
      setIsLoggedIn(true);
      if (me.name) setShippingDetails((prev) => ({ ...prev, fullName: me.name }));
      if (me.email) setShippingDetails((prev) => ({ ...prev, email: me.email }));
      if (me.phoneNumber) setShippingDetails((prev) => ({ ...prev, phone: me.phoneNumber }));
      if (me.address && typeof me.address === "object") {
        if (me.address.fullAddress) setShippingDetails((prev) => ({ ...prev, address: me.address.fullAddress }));
        if (me.address.city) setShippingDetails((prev) => ({ ...prev, city: me.address.city }));
        if (me.address.state) setShippingDetails((prev) => ({ ...prev, state: me.address.state }));
        if (me.address.pinCode) setShippingDetails((prev) => ({ ...prev, pincode: me.address.pinCode }));
      } else if (me.address && typeof me.address === "string") {
        setShippingDetails((prev) => ({ ...prev, address: me.address }));
      }
      if (me.city) setShippingDetails((prev) => ({ ...prev, city: me.city }));
      if (me.state) setShippingDetails((prev) => ({ ...prev, state: me.state }));
      if (me.pincode) setShippingDetails((prev) => ({ ...prev, pincode: me.pincode }));
      setCustomAddress({
        fullName: me.name || "", email: me.email || "", phone: me.phoneNumber || "",
        address: me.address?.fullAddress || me.address || "", city: me.address?.city || me.city || "",
        state: me.address?.state || me.state || "", pincode: me.address?.pinCode || me.pincode || "", country: "India",
      });
    } else if (token && !me) { setIsLoggedIn(false); }
  }, [me, token]);

  useEffect(() => { loadRazorpayScript(); }, []);

  const userCart = useQuery(api.cart.getUserCart, me && !isDirectPurchase ? { userId: me._id } : "skip");
  const clearCartMutation = useMutation(api.cart.clearCart);
  const createOrderMutation = useMutation(api.orders.createOrder);

  const showToastMessage = (message) => { setToastMessage(message); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const cartProductIds = userCart?.items?.map((item) => item.productId) || [];
  const cartProducts = useQuery(api.products.getProductsByIds, cartProductIds.length > 0 ? { productIds: cartProductIds } : "skip");
  const directPurchaseProduct = useQuery(api.products.getProductById, isDirectPurchase && directPurchaseItem?.productId ? { productId: directPurchaseItem.productId } : "skip");

  const validateStock = () => {
    if (isDirectPurchase) {
      if (!directPurchaseProduct) return { isValid: false, message: "Loading..." };
      if (!directPurchaseProduct.inStock) return { isValid: false, message: "Out of stock" };
      if (!directPurchaseProduct.availableSizes?.includes(directPurchaseItem.size)) return { isValid: false, message: `Size ${directPurchaseItem.size} unavailable` };
      const availableStock = directPurchaseProduct.sizeStock?.[directPurchaseItem.size] || 0;
      if (availableStock < directPurchaseItem.quantity) return { isValid: false, message: `Only ${availableStock} available` };
      return { isValid: true, message: "In stock" };
    } else {
      if (!userCart?.items?.length) return { isValid: false, message: "Cart is empty" };
      if (!cartProducts) return { isValid: false, message: "Loading..." };
      const productMap = new Map();
      cartProducts.forEach((p) => { if (p) { productMap.set(p._id, p); productMap.set(p.itemId, p); } });
      for (const item of userCart.items) {
        const product = productMap.get(item.productId);
        if (!product || product.isHidden || product.isDeleted || !product.inStock) return { isValid: false, message: `${item.productName} unavailable` };
        if (!product.availableSizes?.includes(item.size)) return { isValid: false, message: `Size ${item.size} unavailable` };
        if ((product.sizeStock?.[item.size] || 0) < item.quantity) return { isValid: false, message: `Insufficient stock for ${item.productName}` };
      }
      return { isValid: true, message: "All items in stock" };
    }
  };

  const getCurrentShippingDetails = () => {
    const details = useDefaultAddress ? shippingDetails : customAddress;
    let finalAddress = details.address;
    if (details.houseNo || details.street || details.landmark) {
      const parts = [details.houseNo, details.street, details.landmark].filter(Boolean);
      if (parts.length > 0) finalAddress = parts.join(", ");
    }
    return { fullName: details.fullName || "", email: details.email || "", phone: details.phone || "", address: finalAddress || "", city: details.city || "", state: details.state || "", pincode: details.pincode || "", country: "India" };
  };

  const isFormValid = () => {
    const d = getCurrentShippingDetails();
    return d.fullName && d.email && d.phone && d.address && d.city && d.pincode;
  };

  const handleInputChange = (field, value) => {
    if (useDefaultAddress) setShippingDetails((prev) => ({ ...prev, [field]: value }));
    else setCustomAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressToggle = (useDefault) => {
    setUseDefaultAddress(useDefault);
    if (useDefault) {
      setShippingDetails((prev) => ({
        ...prev, fullName: me?.name || "", email: me?.email || "", phone: me?.phoneNumber || "",
        address: me?.address?.fullAddress || me?.address || "", city: me?.address?.city || me?.city || "",
        state: me?.address?.state || me?.state || "", pincode: me?.address?.pinCode || me?.pincode || "", country: "India",
      }));
    } else {
      setCustomAddress({ fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", country: "India" });
    }
  };

  const getOrderTotals = () => {
    if (isDirectPurchase) {
      const subtotal = directPurchaseItem.price * directPurchaseItem.quantity;
      const deliveryFee = subtotal >= 999 ? 0 : 50;
      const protectPromiseFee = directPurchaseItem.quantity * 9;
      return { subtotal, deliveryFee, protectPromiseFee, finalTotal: subtotal + protectPromiseFee + deliveryFee };
    } else {
      if (!userCart) return { subtotal: 0, deliveryFee: 0, protectPromiseFee: 0, finalTotal: 0 };
      const deliveryFee = userCart.totalPrice >= 999 ? 0 : 50;
      return { subtotal: userCart.totalPrice, deliveryFee, protectPromiseFee: userCart.totalItems * 9, finalTotal: userCart.totalPrice + userCart.totalItems * 9 + deliveryFee };
    }
  };

  const { subtotal, deliveryFee, protectPromiseFee, finalTotal } = (!isDirectPurchase && !userCart) ? { subtotal: 0, deliveryFee: 0, protectPromiseFee: 0, finalTotal: 0 } : getOrderTotals();
  const hybridDiscount = Math.round(finalTotal * 0.05);
  const hybridFinalTotal = finalTotal - hybridDiscount;
  const hybridUpfrontAmount = Math.round(hybridFinalTotal * 0.20);
  const hybridCodAmount = hybridFinalTotal - hybridUpfrontAmount;

  const createRazorpayOrder = async () => {
    const response = await fetch("/api/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalTotal, currency: "INR", receipt: `order_${Date.now()}`, notes: { userId: me?._id || "guest", userEmail: getCurrentShippingDetails().email, userName: getCurrentShippingDetails().fullName, isGuestCheckout: !me } }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to create order");
    return data.order;
  };

  const handlePaymentSuccess = async (response, paymentData) => {
    setIsProcessing(true);
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

      // Map items for order
      const mappedItems = paymentData.items.map((item) => ({
        productId: item.productId || "",
        name: item.productName || item.name || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        size: item.size || "Free",
        image: item.productImage || item.image || "",
      }));

      // Ensure shipping details have all required fields
      const shippingDetails = {
        fullName: paymentData.customerDetails?.fullName || "",
        email: paymentData.customerDetails?.email || "",
        phone: paymentData.customerDetails?.phone || "",
        address: paymentData.customerDetails?.address || "",
        city: paymentData.customerDetails?.city || "",
        state: paymentData.customerDetails?.state || "",
        pincode: paymentData.customerDetails?.pincode || "",
        country: paymentData.customerDetails?.country || "India",
      };

      // Create order in database
      const orderResult = await createOrderMutation({
        userId: paymentData.userId || null,
        items: mappedItems,
        shippingDetails: shippingDetails,
        paymentDetails: {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          amount: Number(paymentData.orderTotal) || 0,
          currency: "INR",
          status: paymentData.isHybridPayment ? "partial" : "paid",
          paymentMethod: paymentData.isHybridPayment ? "hybrid" : "razorpay",
        },
        orderTotal: Number(paymentData.orderTotal) || 0,
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
            orderTotal: paymentData.orderTotal,
            shippingDetails: shippingDetails,
            paymentDetails: {
              amount: paymentData.orderTotal,
              currency: "INR",
              status: paymentData.isHybridPayment ? "partial" : "paid",
              paymentMethod: paymentData.isHybridPayment ? "hybrid" : "razorpay",
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
            orderTotal: paymentData.orderTotal,
            items: mappedItems,
            shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}`,
            shippingDetails: shippingDetails,
            paymentDetails: {
              amount: paymentData.orderTotal,
              currency: "INR",
              status: paymentData.isHybridPayment ? "partial" : "paid",
              paymentMethod: paymentData.isHybridPayment ? "hybrid" : "razorpay",
            },
          }),
        }).catch(console.error),
      ]);

      // Clear cart if not direct purchase
      if (!paymentData.isDirectPurchase && paymentData.userId) {
        try { await clearCartMutation({ userId: paymentData.userId }); } catch (e) { console.error(e); }
      }

      showToastMessage("Payment successful! Redirecting...");
      setTimeout(() => router.push(`/order-success?orderNumber=${orderResult.orderNumber}`), 1500);

    } catch (error) {
      console.error("Payment processing error:", error);
      showToastMessage(error.message || "Something went wrong");
      setIsProcessing(false);
    }
  };

  const openRazorpayModal = async (paymentData) => {
    const Razorpay = await loadRazorpayScript();
    if (!Razorpay) {
      showToastMessage("Failed to load payment gateway");
      setIsProcessing(false);
      return;
    }

    if (!paymentData.orderId) {
      showToastMessage("Order ID is missing. Please try again.");
      setIsProcessing(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RtYKQ2F9glN6Vf",
      amount: paymentData.amount,
      currency: paymentData.currency || "INR",
      name: "Walkdrobe",
      description: paymentData.isHybridPayment 
        ? `Hybrid Payment - ₹${paymentData.hybridDetails?.upfrontAmount} upfront` 
        : "Order Payment",
      order_id: paymentData.orderId,
      prefill: {
        name: paymentData.customerDetails?.fullName || "",
        email: paymentData.customerDetails?.email || "",
        contact: paymentData.customerDetails?.phone || "",
      },
      theme: { color: "#111827" },
      handler: async (response) => {
        await handlePaymentSuccess(response, paymentData);
      },
      modal: {
        ondismiss: () => {
          showToastMessage("Payment cancelled");
          setIsProcessing(false);
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      console.error("Payment failed:", response.error);
      showToastMessage(response.error?.description || "Payment failed");
      setIsProcessing(false);
    });
    razorpay.open();
  };

  const handleHybridPayment = async () => {
    setShowHybridConfirmation(false);
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: hybridUpfrontAmount, currency: "INR", receipt: `hybrid_${Date.now()}`, notes: { userId: me?._id || "guest", userEmail: getCurrentShippingDetails().email, userName: getCurrentShippingDetails().fullName, paymentType: "hybrid", totalAmount: hybridFinalTotal, codAmount: hybridCodAmount, discount: hybridDiscount } }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");
      const paymentData = {
        orderId: data.order.id, amount: data.order.amount, currency: data.order.currency, customerDetails: getCurrentShippingDetails(),
        items: isDirectPurchase ? [{ productId: directPurchaseItem.productId, productName: directPurchaseItem.productName, productImage: directPurchaseItem.productImage, price: directPurchaseItem.price, size: directPurchaseItem.size, quantity: directPurchaseItem.quantity }] : userCart.items,
        orderTotal: hybridFinalTotal, isDirectPurchase, userId: me?._id, isHybridPayment: true,
        hybridDetails: { upfrontAmount: hybridUpfrontAmount, codAmount: hybridCodAmount, discount: hybridDiscount, originalTotal: finalTotal },
      };
      await openRazorpayModal(paymentData);
    } catch (error) { showToastMessage(error.message || "Payment failed"); setIsProcessing(false); }
  };

  const handleCODConfirmation = async () => {
    setShowCODConfirmation(false);
    setIsProcessing(true);
    try {
      const currentShippingDetails = getCurrentShippingDetails();
      if (!currentShippingDetails.fullName || !currentShippingDetails.email || !currentShippingDetails.phone || !currentShippingDetails.address || !currentShippingDetails.city || !currentShippingDetails.pincode) {
        showToastMessage("Please fill all required fields"); setIsProcessing(false); return;
      }
      const mappedItems = isDirectPurchase ? [{ productId: directPurchaseItem.productId, name: directPurchaseItem.productName, price: directPurchaseItem.price, quantity: directPurchaseItem.quantity, size: directPurchaseItem.size, image: directPurchaseItem.productImage }]
        : userCart.items.map((item) => ({ productId: item.productId, name: item.productName, price: item.price, quantity: item.quantity, size: item.size, image: item.productImage }));
      const orderResult = await createOrderMutation({ userId: me?._id || null, items: mappedItems, shippingDetails: currentShippingDetails, paymentDetails: { amount: finalTotal, currency: "INR", status: "pending", paymentMethod: "cod" }, orderTotal: finalTotal, status: "confirmed" });
      if (orderResult?.success) {
        showToastMessage("Order placed successfully!");
        fetch("/api/send-order-confirmation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userEmail: currentShippingDetails.email, userName: currentShippingDetails.fullName, orderNumber: orderResult.orderNumber, orderItems: mappedItems, orderTotal: finalTotal, shippingDetails: currentShippingDetails, paymentDetails: { amount: finalTotal, currency: "INR", status: "pending", paymentMethod: "cod" } }) }).catch(console.error);
        fetch("/api/send-admin-notification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: orderResult.orderNumber, customerName: currentShippingDetails.fullName, customerEmail: currentShippingDetails.email, orderTotal: finalTotal, items: mappedItems, shippingAddress: `${currentShippingDetails.address}, ${currentShippingDetails.city}, ${currentShippingDetails.state} - ${currentShippingDetails.pincode}`, shippingDetails: currentShippingDetails, paymentDetails: { amount: finalTotal, currency: "INR", status: "pending", paymentMethod: "cod" } }) }).catch(console.error);
        if (!isDirectPurchase && me) { try { await clearCartMutation({ userId: me._id }); } catch (e) { console.error(e); } }
        setTimeout(() => { router.push(`/order-success?orderNumber=${orderResult.orderNumber}`); }, 1500);
      } else { showToastMessage(orderResult?.message || "Order failed"); }
    } catch (error) { showToastMessage(`Failed: ${error.message}`); }
    finally { setIsProcessing(false); }
  };

  const handlePayment = async () => {
    if (!isFormValid()) { showToastMessage("Please fill all required fields"); return; }
    const stockValidation = validateStock();
    if (!stockValidation.isValid) { showToastMessage(stockValidation.message); return; }
    if (selectedPaymentMethod === "cod") { setShowCODConfirmation(true); return; }
    if (selectedPaymentMethod === "hybrid") { setShowHybridConfirmation(true); return; }
    setIsProcessing(true);
    try {
      const order = await createRazorpayOrder();
      const paymentData = {
        orderId: order.id, amount: order.amount, currency: order.currency, customerDetails: getCurrentShippingDetails(),
        items: isDirectPurchase ? [{ productId: directPurchaseItem.productId, productName: directPurchaseItem.productName, productImage: directPurchaseItem.productImage, price: directPurchaseItem.price, size: directPurchaseItem.size, quantity: directPurchaseItem.quantity, category: directPurchaseItem.category || '', brand: directPurchaseItem.brand || '' }] : userCart.items,
        orderTotal: finalTotal, isDirectPurchase, userId: me?._id,
      };
      await openRazorpayModal(paymentData);
    } catch (error) { showToastMessage(error.message || "Payment failed"); setIsProcessing(false); }
  };

  const items = isDirectPurchase ? [directPurchaseItem] : (userCart?.items || []);

  // Loading state
  if (!isDirectPurchase && !userCart) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!isDirectPurchase && (!userCart?.items || userCart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="text-gray-500">Add some items to checkout</p>
          <button onClick={() => router.push("/shop")} className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium">
            Browse Shop
          </button>
        </div>
      </div>
    );
  }

  // Invalid direct purchase
  if (isDirectPurchase && !directPurchaseItem?.productId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid Purchase</h2>
          <p className="text-gray-500">Product information is missing</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Items */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-3">
                    <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                      <p className="text-gray-500 text-xs">Size: {item.size} • Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{item.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Address
              </h2>

              {/* Address Toggle */}
              <div className="flex gap-3 mb-5">
                {me && (
                  <button onClick={() => handleAddressToggle(true)} className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${useDefaultAddress ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4" />
                      <span className="font-medium text-sm">Default Address</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{me?.address?.fullAddress || me?.address || "No address saved"}</p>
                  </button>
                )}
                <button onClick={() => handleAddressToggle(false)} className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${!useDefaultAddress ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-sm">New Address</span>
                  </div>
                  <p className="text-xs text-gray-500">Enter a different address</p>
                </button>
              </div>

              {/* Address Form */}
              <AnimatePresence>
                {!useDefaultAddress && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Full Name *" value={getCurrentShippingDetails().fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} className="col-span-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="email" placeholder="Email *" value={getCurrentShippingDetails().email} onChange={(e) => handleInputChange("email", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="tel *" placeholder="Phone No" value={getCurrentShippingDetails().phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="House/Flat No. *" value={useDefaultAddress ? shippingDetails.houseNo : customAddress.houseNo} onChange={(e) => handleInputChange("houseNo", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="Street/Area *" value={useDefaultAddress ? shippingDetails.street : customAddress.street} onChange={(e) => handleInputChange("street", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="Landmark (Optional)" value={useDefaultAddress ? shippingDetails.landmark : customAddress.landmark} onChange={(e) => handleInputChange("landmark", e.target.value)} className="col-span-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="City *" value={getCurrentShippingDetails().city} onChange={(e) => handleInputChange("city", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="State *" value={getCurrentShippingDetails().state} onChange={(e) => handleInputChange("state", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" placeholder="Pincode *" value={getCurrentShippingDetails().pincode} onChange={(e) => handleInputChange("pincode", e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <input type="text" value="India" disabled className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
   

            {/* Payment Method */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>
              <div className="space-y-3">
                {/* Hybrid - Recommended */}
                <button onClick={() => setSelectedPaymentMethod("hybrid")} className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${selectedPaymentMethod === "hybrid" ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="absolute -top-2 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">5% OFF</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Hybrid Payment</p>
                      <p className="text-xs text-gray-500">Pay ₹{hybridUpfrontAmount} now, ₹{hybridCodAmount} on delivery</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "hybrid" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {selectedPaymentMethod === "hybrid" && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>

                {/* UPI */}
                <button onClick={() => handlePaymentMethodChange("upi")} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentMethod === "upi" ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">UPI</p>
                      <p className="text-xs text-gray-500">GPay, PhonePe, Paytm</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "upi" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {selectedPaymentMethod === "upi" && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>

                {/* Card */}
                <button onClick={() => handlePaymentMethodChange("card")} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentMethod === "card" ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Card</p>
                      <p className="text-xs text-gray-500">Credit / Debit Card</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "card" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {selectedPaymentMethod === "card" && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>

                {/* Net Banking */}
                <button onClick={() => handlePaymentMethodChange("netbanking")} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentMethod === "netbanking" ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Net Banking</p>
                      <p className="text-xs text-gray-500">All major banks</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "netbanking" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {selectedPaymentMethod === "netbanking" && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>

                {/* COD */}
                <button onClick={() => handlePaymentMethodChange("cod")} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPaymentMethod === "cod" ? "border-gray-900 bg-white" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Pay when you receive</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "cod" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {selectedPaymentMethod === "cod" && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-2xl p-5 lg:sticky lg:top-24">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-600" : "text-gray-900"}>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Protection Fee</span>
                  <span className="text-gray-900">₹{protectPromiseFee}</span>
                </div>
                {selectedPaymentMethod === "hybrid" && (
                  <div className="flex justify-between text-green-600">
                    <span>Hybrid Discount (5%)</span>
                    <span>-₹{hybridDiscount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">₹{(selectedPaymentMethod === "hybrid" ? hybridFinalTotal : finalTotal).toLocaleString()}</span>
                </div>
              </div>

              {selectedPaymentMethod === "hybrid" && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 text-xs font-medium">You save ₹{hybridDiscount} with Hybrid Payment!</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!isFormValid() || isProcessing || (!cartProducts && !isDirectPurchase) || (isDirectPurchase && !directPurchaseProduct)}
                className="w-full mt-5 bg-gray-900 text-white py-4 rounded-full font-semibold text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay ₹{(selectedPaymentMethod === "hybrid" ? hybridUpfrontAmount : finalTotal).toLocaleString()}</>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure checkout powered by Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Miss Discount Prompt Modal */}
      <AnimatePresence>
        {showMissDiscountPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMissDiscountPrompt(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">😮</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Wait! Are you sure?</h3>
                <p className="text-gray-500 text-sm mb-4">You're about to miss out on 5% savings!</p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-700 font-semibold text-lg">Save ₹{hybridDiscount}</p>
                  <p className="text-green-600 text-xs">with Hybrid Payment</p>
                </div>
                <button onClick={() => { setShowMissDiscountPrompt(false); setSelectedPaymentMethod("hybrid"); setPendingPaymentMethod(null); }} className="w-full bg-gray-900 text-white py-3 rounded-full font-semibold mb-2">
                  Yes! Give me 5% OFF
                </button>
                <button onClick={confirmSwitchPayment} className="w-full text-gray-500 py-2 text-sm">
                  No thanks, continue without discount
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COD Confirmation Modal */}
      <AnimatePresence>
        {showCODConfirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCODConfirmation(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Confirm Order</h3>
                  <button onClick={() => setShowCODConfirmation(false)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                
                {/* Items */}
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                      <img src={item.productImage} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.size} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">₹{item.price}</p>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="font-medium text-gray-900 text-sm">{getCurrentShippingDetails().fullName}</p>
                  <p className="text-xs text-gray-500">{getCurrentShippingDetails().phone}</p>
                  <p className="text-xs text-gray-500 mt-1">{getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}</p>
                </div>

                {/* Payment */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <Truck className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay ₹{finalTotal} when you receive</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowCODConfirmation(false)} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-full font-medium">Cancel</button>
                  <button onClick={handleCODConfirmation} disabled={isProcessing} className="flex-[2] py-3 bg-gray-900 text-white rounded-full font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Check className="w-4 h-4" /> Confirm Order</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hybrid Confirmation Modal */}
      <AnimatePresence>
        {showHybridConfirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowHybridConfirmation(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hybrid Payment</h3>
                    <p className="text-xs text-green-600 font-medium">5% OFF Applied!</p>
                  </div>
                  <button onClick={() => setShowHybridConfirmation(false)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                {/* Savings */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Original Total</span>
                    <span className="text-gray-400 line-through">₹{finalTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600">Discount (5%)</span>
                    <span className="text-green-600">-₹{hybridDiscount}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-green-200 pt-2">
                    <span className="text-gray-900">Final Total</span>
                    <span className="text-green-600 text-lg">₹{hybridFinalTotal}</span>
                  </div>
                </div>

                {/* Payment Split */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <CreditCard className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Pay Now</p>
                    <p className="text-xl font-bold text-gray-900">₹{hybridUpfrontAmount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Truck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">On Delivery</p>
                    <p className="text-xl font-bold text-gray-900">₹{hybridCodAmount}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                      <img src={item.productImage} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.size} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-xs">₹{item.price}</p>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="font-medium text-gray-900 text-sm">{getCurrentShippingDetails().fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowHybridConfirmation(false)} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-full font-medium">Cancel</button>
                  <button onClick={handleHybridPayment} disabled={isProcessing} className="flex-[2] py-3 bg-gray-900 text-white rounded-full font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Pay ₹{hybridUpfrontAmount}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
