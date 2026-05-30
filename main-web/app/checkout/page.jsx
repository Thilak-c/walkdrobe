"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/hooks/useGuestCart";
import {
  ArrowLeft, ShoppingCart, CreditCard, Truck, Shield, Check, Lock, MapPin,
  Phone, Mail, AlertCircle, Loader2, Smartphone, Landmark, Wallet, Banknote, Home, X, Package, ArrowDown
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
  const [showFloatingBar, setShowFloatingBar] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = document.documentElement.scrollHeight - window.innerHeight - 240;
      if (window.scrollY >= threshold) {
        setShowFloatingBar(false);
      } else {
        setShowFloatingBar(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);
  const [showHybridConfirmation, setShowHybridConfirmation] = useState(false);
  const saveTimeoutRef = useRef(null);
  const formInitializedRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Pincode delivery check states
  const [pincodeCheckStatus, setPincodeCheckStatus] = useState(null); // null, 'checking', 'available', 'unavailable'
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [pincodeError, setPincodeError] = useState("");
  
  // Only use custom address now

  const [shippingDetails, setShippingDetails] = useState({
    fullName: "", email: "", phone: "", flatNo: "", area: "", landmark: "",
    address: "", city: "", state: "", pincode: "", country: "India",
  });

  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      flatNo: "",
      area: "",
      landmark: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    // Clear coupon if COD is selected
    if (method === "cod" && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
      showToastMessage("Coupons are only valid for prepaid orders");
    }
  };

  // Coupon validation function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (selectedPaymentMethod === "cod") {
      setCouponError("Coupons are only valid for prepaid orders");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const currentSubtotal = isDirectPurchase 
        ? directPurchaseItem.price * directPurchaseItem.quantity 
        : effectiveCartTotals.totalPrice;

      // Validate coupon using Convex
      const result = await fetch("/api/convex/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          userId: me?._id,
          orderTotal: currentSubtotal,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await result.json();

      if (!data.valid) {
        setCouponError(data.error || "Invalid coupon code");
        setIsApplyingCoupon(false);
        return;
      }

      setAppliedCoupon({
        code: data.coupon.code,
        type: data.coupon.discountType,
        discount: data.coupon.discountValue,
        discountAmount: data.coupon.discountAmount,
      });
      showToastMessage("Coupon applied successfully!");
      setIsApplyingCoupon(false);
    } catch (error) {
      setCouponError("Failed to apply coupon");
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    showToastMessage("Coupon removed");
  };

  // Pincode delivery check function
  const checkPincodeDelivery = async (pincode) => {
    if (!pincode || pincode.length !== 6) {
      setPincodeCheckStatus(null);
      setDeliveryInfo(null);
      setPincodeError("");
      return;
    }

    setPincodeCheckStatus('checking');
    setPincodeError("");
    
    try {
      const response = await fetch(`/api/shiprocket/serviceability?pincode=${pincode}&pickup_pincode=400001&weight=0.5`);
      const data = await response.json();
      
      if (response.ok) {
        // Handle temporary errors (like rate limiting)
        if (data.temporaryError) {
          setPincodeCheckStatus('warning');
          setDeliveryInfo({ temporaryError: true });
          setPincodeError(data.message);
          return;
        }
        
        if (data.deliverable) {
          setPincodeCheckStatus('available');
          setDeliveryInfo({
            estimatedDays: data.estimatedDays,
            codAvailable: data.codAvailable,
            courierPartners: data.courierPartners?.length || 0
          });
        } else {
          setPincodeCheckStatus('unavailable');
          setDeliveryInfo(null);
          setPincodeError(data.message || "Delivery not available to this pincode");
        }
      } else {
        setPincodeCheckStatus('unavailable');
        setPincodeError(data.error || "Unable to check delivery availability");
      }
    } catch (error) {
      setPincodeCheckStatus('warning');
      setPincodeError("Network error. You can proceed with checkout.");
      console.error('Pincode check error:', error);
    }
  };

  // Watch pincode changes and trigger delivery check
  const watchedPincode = watch('pincode');
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedPincode && watchedPincode.length === 6) {
        checkPincodeDelivery(watchedPincode);
      } else {
        setPincodeCheckStatus(null);
        setDeliveryInfo(null);
        setPincodeError("");
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedPincode]);



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
      const sessionToken = match ? decodeURIComponent(match[1]) : null;
      setToken(sessionToken);
      setIsAuthLoading(false);
      if (!sessionToken) {
        setIsFormInitialized(true);
      }
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  useEffect(() => {
    if (me === null) {
      setIsLoggedIn(false);
      setIsFormInitialized(true);
      return;
    }
    if (!me) {
      return;
    }
    setIsLoggedIn(true);
    // Only prefill once and do not overwrite fields the user has already edited.
    if (formInitializedRef.current) {
      return;
    }
    const current = typeof getValues === 'function' ? getValues() : {};
    if (!current.fullName) setValue("fullName", me.name || "");
    if (!current.email) setValue("email", me.email || "");
    if (!current.phone) setValue("phone", me.phoneNumber || "");
    if (!current.flatNo) setValue("flatNo", me.address?.flatNo || me.address?.houseNo || "");
    if (!current.area) setValue("area", me.address?.area || me.address?.street || "");
    if (!current.landmark) setValue("landmark", me.address?.landmark || "");
    if (!current.address) setValue("address", me.address?.fullAddress || me.address || "");
    if (!current.city) setValue("city", me.address?.city || me.city || "");
    if (!current.state) setValue("state", me.address?.state || me.state || "");
    if (!current.pincode) setValue("pincode", me.address?.pinCode || me.pincode || "");
    setValue("country", "India");
    formInitializedRef.current = true;
    setIsFormInitialized(true);
  }, [me, token, setValue, getValues]);

  useEffect(() => { loadRazorpayScript(); }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Watch form values and autosave with debounce
  useEffect(() => {
    const subscription = watch((value) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const vals = getValues();
        updateUserAddressConvex(vals);
      }, 600);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  const userCart = useQuery(api.cart.getUserCart, me && !isDirectPurchase ? { userId: me._id } : "skip");
  const { guestCart, getGuestCartSummary, clearGuestCart } = useGuestCart();
  const clearCartMutation = useMutation(api.cart.clearCart);
  const createOrderMutation = useMutation(api.orders.createOrder);

  const showToastMessage = (message) => { setToastMessage(message); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const guestSummary = getGuestCartSummary();
  const effectiveCartItems = isDirectPurchase ? [] : (me ? (userCart?.items || []) : (guestSummary.items || []));
  const effectiveCartTotals = isDirectPurchase ? { totalPrice: 0, totalItems: 0 } : (me ? { totalPrice: userCart?.totalPrice || 0, totalItems: userCart?.totalItems || 0 } : { totalPrice: guestSummary.totalPrice || 0, totalItems: guestSummary.totalItems || 0 });

  const cartProductIds = effectiveCartItems?.map((item) => item.productId) || [];
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
      if (!effectiveCartItems || effectiveCartItems.length === 0) return { isValid: false, message: "Cart is empty" };
      if (!cartProducts) return { isValid: false, message: "Loading..." };
      const productMap = new Map();
      cartProducts.forEach((p) => { if (p) { productMap.set(p._id, p); productMap.set(p.itemId, p); } });
      for (const item of effectiveCartItems) {
        const product = productMap.get(item.productId);
        if (!product || product.isHidden || product.isDeleted || !product.inStock) return { isValid: false, message: `${item.productName} unavailable` };
        if (!product.availableSizes?.includes(item.size)) return { isValid: false, message: `Size ${item.size} unavailable` };
        if ((product.sizeStock?.[item.size] || 0) < item.quantity) return { isValid: false, message: `Insufficient stock for ${item.productName}` };
      }
      return { isValid: true, message: "All items in stock" };
    }
  };
  const getCurrentShippingDetails = () => {
    const details = typeof getValues === 'function' ? getValues() : {};
    let finalAddress = details.address;
    if (details.flatNo || details.area || details.landmark) {
      const parts = [details.flatNo, details.area, details.landmark].filter(Boolean);
      if (parts.length > 0) finalAddress = parts.join(", ");
    }
    return {
      fullName: details.fullName || "",
      email: details.email || "",
      phone: details.phone || "",
      address: finalAddress || "",
      flatNo: details.flatNo || "",
      area: details.area || "",
      landmark: details.landmark || "",
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || "",
      country: details.country || "India",
    };
  };

  const isFormValid = () => {
    const d = getCurrentShippingDetails();
    return d.fullName && d.email && d.phone && d.address && d.flatNo && d.area && d.city && d.pincode;
  };

  const updateUserAddressConvex = async (addressData) => {
    if (me && me._id) {
      try {
            // Convex `updateUserProfile` validator expects address to only contain
            // { state, city, pinCode, fullAddress } — remove extra fields.
            // Normalize address to ensure `fullAddress` is a string.
            const addressField = addressData.address;
            let addressString = "";
            if (typeof addressField === "string") {
              addressString = addressField;
            } else if (addressField && typeof addressField === "object") {
              addressString = addressField.fullAddress || [addressField.flatNo || addressField.houseNo, addressField.area || addressField.street, addressField.landmark].filter(Boolean).join(", ") || addressField.city || "";
            }
            const fullAddress = addressString || [addressData.flatNo || addressData.houseNo, addressData.area || addressData.street, addressData.landmark].filter(Boolean).join(", ");
            const payload = {
              userId: me._id,
              name: addressData.fullName || undefined,
              phoneNumber: addressData.phone || undefined,
              address: {
                flatNo: addressData.flatNo || (addressField && addressField.flatNo) || "",
                area: addressData.area || (addressField && addressField.area) || "",
                landmark: addressData.landmark || (addressField && addressField.landmark) || "",
                state: addressData.state || (addressField && addressField.state) || "",
                city: addressData.city || (addressField && addressField.city) || "",
                pinCode: addressData.pincode || (addressField && addressField.pinCode) || "",
                fullAddress: fullAddress || "",
              },
            };
            const res = await fetch("/api/convex/users/updateUserProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!result || !result.success) {
          showToastMessage("Failed saving address");
        }
      } catch (e) {
        console.error("updateUserAddressConvex error:", e);
        showToastMessage("Failed saving address");
      }
    }
  };

  const handleInputChange = (field, value) => {
    // legacy handler - not used when using react-hook-form
    setValue(field, value);
  };

  // Removed address toggle logic

  const getOrderTotals = () => {
    if (isDirectPurchase) {
      const subtotal = directPurchaseItem.price * directPurchaseItem.quantity;
      const deliveryFee = subtotal >= 999 ? 0 : 50;
      const protectPromiseFee = directPurchaseItem.quantity * 9;
      
      // COD charge: ₹100 flat per order (must be paid online)
      const codCharge = selectedPaymentMethod === "cod" ? 100 : 0;
      
      // Coupon discount (only for prepaid orders)
      let couponDiscount = 0;
      if (appliedCoupon && selectedPaymentMethod !== "cod") {
        couponDiscount = appliedCoupon.discountAmount || 0;
      }
      
      return { 
        subtotal, 
        deliveryFee, 
        protectPromiseFee, 
        codCharge,
        couponDiscount,
        finalTotal: Math.max(0, subtotal + protectPromiseFee + deliveryFee + codCharge - couponDiscount)
      };
    } else {
      if (!effectiveCartItems) return { subtotal: 0, deliveryFee: 0, protectPromiseFee: 0, codCharge: 0, couponDiscount: 0, finalTotal: 0 };
      
      const deliveryFee = effectiveCartTotals.totalPrice >= 999 ? 0 : 50;
      
      // COD charge: ₹100 flat per order (must be paid online)
      const codCharge = selectedPaymentMethod === "cod" ? 100 : 0;
      
      // Coupon discount (only for prepaid orders)
      let couponDiscount = 0;
      if (appliedCoupon && selectedPaymentMethod !== "cod") {
        couponDiscount = appliedCoupon.discountAmount || 0;
      }
      
      return { 
        subtotal: effectiveCartTotals.totalPrice, 
        deliveryFee, 
        protectPromiseFee: effectiveCartTotals.totalItems * 9, 
        codCharge,
        couponDiscount,
        finalTotal: Math.max(0, effectiveCartTotals.totalPrice + effectiveCartTotals.totalItems * 9 + deliveryFee + codCharge - couponDiscount)
      };
    }
  };

  const { subtotal, deliveryFee, protectPromiseFee, codCharge, couponDiscount, finalTotal } = (isDirectPurchase ? getOrderTotals() : (effectiveCartItems.length === 0 ? { subtotal: 0, deliveryFee: 0, protectPromiseFee: 0, codCharge: 0, couponDiscount: 0, finalTotal: 0 } : getOrderTotals()));
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

      // Determine payment status and method based on payment type
      let paymentStatus = "paid";
      let paymentMethod = "razorpay";
      
      if (paymentData.isHybridPayment) {
        paymentStatus = "partial";
        paymentMethod = "hybrid";
      } else if (paymentData.isCODPayment) {
        paymentStatus = "partial"; // COD charge paid, remaining on delivery
        paymentMethod = "cod";
      }

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
          status: paymentStatus,
          paymentMethod: paymentMethod,
          codCharge: paymentData.codDetails?.codCharge || 0,
          remainingCOD: paymentData.codDetails?.remainingCOD || 0,
        },
        orderTotal: Number(paymentData.orderTotal) || 0,
        status: "confirmed",
      });

      // Save address to user table if logged in
      if (me && me._id) {
        await fetch("/api/update-user-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: me._id, address: shippingDetails }),
        });
      }

      if (!orderResult?.success) throw new Error(orderResult?.message || "Failed to create order");

      // Send confirmation emails and create Shiprocket order
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
        // Automatically create Shiprocket order
        fetch("/api/auto-shiprocket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: orderResult.orderNumber,
          }),
        }).then(response => response.json())
          .then(result => {
            if (!result.success) {
              console.error("Shiprocket order creation failed:", result.error);
            }
          })
          .catch(error => {
            console.error("Error creating Shiprocket order:", error);
          }),
      ]);

      // Clear cart if not direct purchase
      if (!paymentData.isDirectPurchase) {
        if (paymentData.userId) {
          try { await clearCartMutation({ userId: paymentData.userId }); } catch (e) { console.error(e); }
        } else {
          try { clearGuestCart(); } catch (e) { console.error(e); }
        }
      }

      showToastMessage("Payment successful! Redirecting...");
      console.log("🔄 Redirecting to:", `/order-success?orderNumber=${orderResult.orderNumber}`);
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

    // Configure payment method based on user selection
    const config = {
      upi: { method: "upi" },
      card: { method: "card" },
      netbanking: { method: "netbanking" },
      wallet: { method: "wallet" }
    };

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_RtYKQ2F9glN6Vf",
      amount: paymentData.amount,
      currency: paymentData.currency || "INR",
      name: "Walkdrobe",
      image: "https://walkdrobe.in/favicon.ico",
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

    // Add payment method restriction if user selected a specific method
    if (selectedPaymentMethod && config[selectedPaymentMethod]) {
      options.config = {
        display: {
          blocks: {
            banks: {
              name: selectedPaymentMethod === 'netbanking' ? 'Pay using Netbanking' : 'Pay Now',
              instruments: [config[selectedPaymentMethod]]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: false // Hide other payment methods
          }
        }
      };
    }

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
      const currentShippingDetails = getCurrentShippingDetails();
      if (!currentShippingDetails.fullName || !currentShippingDetails.email || !currentShippingDetails.phone || !currentShippingDetails.address || !currentShippingDetails.city || !currentShippingDetails.pincode || !currentShippingDetails.flatNo || !currentShippingDetails.area) {
        showToastMessage("Please fill all required fields");
        setIsProcessing(false);
        return;
      }
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
    // Check pincode delivery availability for COD (allow if temporary error)
    const currentPincode = getValues('pincode');
    if (pincodeCheckStatus === 'unavailable' && !deliveryInfo?.temporaryError) {
      showToastMessage("Please verify that delivery is available to your pincode");
      setShowCODConfirmation(false);
      return;
    }
    
    // Check if COD is available for this pincode (skip if temporary error)
    if (deliveryInfo && !deliveryInfo.temporaryError && !deliveryInfo.codAvailable) {
      showToastMessage("Cash on Delivery is not available for your pincode. Please choose online payment.");
      setShowCODConfirmation(false);
      return;
    }
    
    setShowCODConfirmation(false);
    setIsProcessing(true);
    
    try {
      const currentShippingDetails = getCurrentShippingDetails();
      if (!currentShippingDetails.fullName || !currentShippingDetails.email || !currentShippingDetails.phone || !currentShippingDetails.address || !currentShippingDetails.flatNo || !currentShippingDetails.area || !currentShippingDetails.city || !currentShippingDetails.pincode) {
        showToastMessage("Please fill all required fields"); 
        setIsProcessing(false); 
        return;
      }

      // Create Razorpay order for COD charge (₹100 per item)
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: codCharge, // Only charge the COD fee online
          currency: "INR", 
          receipt: `cod_${Date.now()}`, 
          notes: { 
            userId: me?._id || "guest", 
            userEmail: currentShippingDetails.email, 
            userName: currentShippingDetails.fullName,
            paymentType: "cod",
            codCharge: codCharge,
            totalAmount: finalTotal,
            remainingCOD: finalTotal - codCharge
          } 
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");

      // Open Razorpay modal to collect COD charge
      const paymentData = {
        orderId: data.order.id,
        amount: data.order.amount, // COD charge amount
        currency: data.order.currency,
        customerDetails: currentShippingDetails,
        items: isDirectPurchase 
          ? [{ 
              productId: directPurchaseItem.productId, 
              productName: directPurchaseItem.productName, 
              productImage: directPurchaseItem.productImage, 
              price: directPurchaseItem.price, 
              size: directPurchaseItem.size, 
              quantity: directPurchaseItem.quantity 
            }] 
          : userCart.items,
        orderTotal: finalTotal,
        isDirectPurchase,
        userId: me?._id,
        isCODPayment: true,
        codDetails: {
          codCharge: codCharge,
          remainingCOD: finalTotal - codCharge,
          totalAmount: finalTotal
        }
      };

      await openRazorpayModal(paymentData);
      
    } catch (error) { 
      showToastMessage(`Failed: ${error.message}`); 
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!isFormValid()) { showToastMessage("Please fill all required fields"); return; }
    
    // Check pincode delivery availability
    const currentPincode = getValues('pincode');
    if (!currentPincode || currentPincode.length !== 6) {
      showToastMessage("Please enter a valid 6-digit pincode");
      return;
    }
    
    if (pincodeCheckStatus === 'checking') {
      showToastMessage("Please wait while we check delivery availability for your pincode");
      return;
    }
    
    // Allow checkout if there's a temporary error (like rate limiting)
    if (pincodeCheckStatus === 'unavailable' && !deliveryInfo?.temporaryError) {
      showToastMessage("Delivery is not available to your pincode. Please try a different pincode.");
      return;
    }
    
    // If status is warning or temporary error, allow checkout to proceed
    if (pincodeCheckStatus !== 'available' && pincodeCheckStatus !== 'warning') {
      // Trigger pincode check if not already done
      await checkPincodeDelivery(currentPincode);
      if (pincodeCheckStatus === 'unavailable' && !deliveryInfo?.temporaryError) {
        showToastMessage("Please verify that delivery is available to your pincode");
        return;
      }
    }
    
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
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90%] md:max-w-md pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 select-none tracking-wide">
              {toastMessage.toLowerCase().includes('fail') || 
               toastMessage.toLowerCase().includes('error') || 
               toastMessage.toLowerCase().includes('cancel') || 
               toastMessage.toLowerCase().includes('wrong') || 
               toastMessage.toLowerCase().includes('not available') ||
               toastMessage.toLowerCase().includes('required') ||
               toastMessage.toLowerCase().includes('invalid') ? (
                <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 text-white stroke-[3px]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                </div>
              )}
              <span className="leading-snug">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-3 py-4 md:px-4 md:py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-4">
            {/* Order Items */}
            <div className="bg-slate-50 border border-slate-100/85 rounded-2xl p-3.5 sm:p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-700" />
                Order Items ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 shadow-3xs">
                    <img src={item.productImage} alt={item.productName} className="w-10 h-10 object-cover rounded-lg bg-slate-50 border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate leading-normal">{item.productName}</p>
                      <p className="text-slate-400 text-[10px] font-medium leading-none mt-0.5">Size: {item.size} • Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-850 text-xs font-mono">₹{item.price}</p>
                  </div>
                ))}
              </div>
                  {/* Shipping / Delivery Address */}
             <div className="bg-slate-50 border border-slate-100/85 rounded-2xl p-3.5 sm:p-5">
               <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                 <MapPin className="w-4 h-4 text-slate-700" />
                 Delivery Address
               </h2>
               
               {isAuthLoading || (token !== null && (!me || !isFormInitialized)) ? (
                 /* Address Form Skeleton Loader */
                 <div className="grid grid-cols-2 gap-2 animate-pulse">
                   <div className="col-span-2 h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="col-span-2 h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                   <div className="h-8.5 bg-slate-200/50 rounded-xl" />
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-2">
                   <input 
                     type="text" 
                     placeholder="Full Name *" 
                     {...register('fullName')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   <input 
                     type="email" 
                     placeholder="Email *" 
                     {...register('email')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   <input 
                     type="tel" 
                     placeholder="Phone No *" 
                     {...register('phone')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   <input 
                     type="text" 
                     placeholder="Flat/House No. *" 
                     {...register('flatNo')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-805" 
                   />
                   <input 
                     type="text" 
                     placeholder="Area / Locality *" 
                     {...register('area')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-808" 
                   />
                   <input 
                     type="text" 
                     placeholder="Landmark (Optional)" 
                     {...register('landmark')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   <input 
                     type="text" 
                     placeholder="City *" 
                     {...register('city')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   <input 
                     type="text" 
                     placeholder="State *" 
                     {...register('state')} 
                     onBlur={() => updateUserAddressConvex(getValues())} 
                     className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                   />
                   
                   {/* Enhanced Pincode Input with Delivery Check */}
                   <div className="relative">
                     <input 
                       type="text" 
                       placeholder="Pincode *" 
                       {...register('pincode', {
                         pattern: {
                           value: /^\d{6}$/,
                           message: "Please enter a valid 6-digit pincode"
                         }
                       })} 
                       onBlur={() => updateUserAddressConvex(getValues())} 
                       className={`px-3 py-2 pr-8 bg-white border rounded-xl text-xs focus:ring-1 focus:border-transparent outline-none w-full transition-all placeholder:text-slate-400 font-medium text-slate-800 ${
                         pincodeCheckStatus === 'available' ? 'border-emerald-500 focus:ring-emerald-500' :
                         pincodeCheckStatus === 'unavailable' ? 'border-rose-500 focus:ring-rose-500' :
                         'border-slate-200 focus:ring-slate-900'
                       }`}
                       maxLength={6}
                     />
                     
                     {/* Delivery Check Status Icon */}
                     <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                       {pincodeCheckStatus === 'checking' && (
                         <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                       )}
                       {pincodeCheckStatus === 'available' && (
                         <Check className="w-3.5 h-3.5 text-emerald-500" />
                       )}
                       {pincodeCheckStatus === 'unavailable' && (
                         <X className="w-3.5 h-3.5 text-rose-500" />
                       )}
                     </div>
                   </div>
                   
                   <input type="text" value="India" disabled className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-450 font-medium cursor-not-allowed" />
                 </div>
               )}
               
               {/* Delivery Status Messages / Skeletons */}
               {pincodeCheckStatus === 'checking' && (
                 <div className="mt-2.5 p-2 bg-slate-100/60 border border-slate-200/50 rounded-xl animate-pulse flex flex-col gap-1.5">
                   <div className="flex items-center gap-1.5">
                     <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                     <div className="h-3.5 bg-slate-200 rounded w-28" />
                   </div>
                   <div className="pl-5 space-y-1">
                     <div className="h-3 bg-slate-200 rounded w-40" />
                     <div className="h-3 bg-slate-200 rounded w-32" />
                   </div>
                 </div>
               )}

               {pincodeCheckStatus === 'available' && deliveryInfo && (
                 <div className="mt-2.5 p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                   <div className="flex items-center gap-1.5 text-emerald-800">
                     <Check className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Delivery Available!</span>
                   </div>
                   <div className="mt-0.5 text-[10px] text-emerald-650 font-medium pl-5 space-y-0.5">
                     {deliveryInfo.estimatedDays && (
                       <p>• Estimated delivery: {deliveryInfo.estimatedDays} days</p>
                     )}
                     {deliveryInfo.codAvailable && (
                       <p>• Cash on Delivery available</p>
                     )}
                   </div>
                 </div>
               )}
               
               {pincodeCheckStatus === 'warning' && pincodeError && (
                 <div className="mt-2.5 p-2 bg-amber-50/70 border border-amber-100 rounded-xl">
                   <div className="flex items-center gap-1.5 text-amber-800">
                     <AlertCircle className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Delivery Check Unavailable</span>
                   </div>
                   <p className="mt-0.5 text-[10px] text-amber-650 font-medium pl-5 leading-normal">{pincodeError}</p>
                   <p className="mt-0.5 text-[9px] text-amber-500 italic pl-5 leading-normal">You can proceed with checkout. We'll verify delivery after order placement.</p>
                 </div>
               )}
               
               {pincodeCheckStatus === 'unavailable' && pincodeError && (
                 <div className="mt-2.5 p-2 bg-rose-50/70 border border-rose-100 rounded-xl">
                   <div className="flex items-center gap-1.5 text-rose-800">
                     <AlertCircle className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Delivery Not Available</span>
                   </div>
                   <p className="mt-0.5 text-[10px] text-rose-650 font-medium pl-5 leading-normal">{pincodeError}</p>
                 </div>
               )}
             </div>
            </div>

            {/* Payment Method */}
            <div className="bg-slate-50 border border-slate-100/85 rounded-2xl p-3.5 sm:p-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-700" />
                Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {/* UPI */}
                <button 
                  onClick={() => handlePaymentMethodChange("upi")} 
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                    selectedPaymentMethod === "upi" 
                      ? "border-slate-900 bg-white ring-1 ring-slate-900" 
                      : "border-slate-200 bg-white hover:border-slate-350"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-3.5 h-3.5 text-slate-605" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "upi" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
                    }`}>
                      {selectedPaymentMethod === "upi" && <Check className="w-2 h-2" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs leading-none">UPI</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">GPay, PhonePe, Paytm</p>
                  </div>
                </button>

                {/* Card */}
                <button 
                  onClick={() => handlePaymentMethodChange("card")} 
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                    selectedPaymentMethod === "card" 
                      ? "border-slate-900 bg-white ring-1 ring-slate-900" 
                      : "border-slate-200 bg-white hover:border-slate-350"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5 text-slate-605" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "card" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
                    }`}>
                      {selectedPaymentMethod === "card" && <Check className="w-2 h-2" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs leading-none">Card</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">Credit / Debit Card</p>
                  </div>
                </button>

                {/* Net Banking */}
                <button 
                  onClick={() => handlePaymentMethodChange("netbanking")} 
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                    selectedPaymentMethod === "netbanking" 
                      ? "border-slate-900 bg-white ring-1 ring-slate-900" 
                      : "border-slate-200 bg-white hover:border-slate-350"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                      <Landmark className="w-3.5 h-3.5 text-slate-605" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "netbanking" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
                    }`}>
                      {selectedPaymentMethod === "netbanking" && <Check className="w-2 h-2" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs leading-none">Net Banking</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">All major banks</p>
                  </div>
                </button>

                {/* COD */}
                <button 
                  onClick={() => handlePaymentMethodChange("cod")} 
                  type="button"
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-20 ${
                    selectedPaymentMethod === "cod" 
                      ? "border-slate-900 bg-white ring-1 ring-slate-900" 
                      : "border-slate-200 bg-white hover:border-slate-350"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                      <Banknote className="w-3.5 h-3.5 text-slate-605" />
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === "cod" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
                    }`}>
                      {selectedPaymentMethod === "cod" && <Check className="w-2 h-2" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs leading-none">Cash on Delivery</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate">₹{codCharge || 0} online + rest COD</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 sm:p-5 lg:sticky lg:top-24 shadow-2xs">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">Order Summary</h2>
              
              {/* Coupon Code Section */}
              {selectedPaymentMethod !== "cod" && (
                <div className="mb-3 pb-3 border-b border-slate-200">
                  <div className="space-y-1.5">
                    {!appliedCoupon ? (
                      <>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponCode.trim()}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-red-500 text-[10px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {couponError}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-emerald-950">{appliedCoupon.code}</p>
                            <p className="text-[10px] font-semibold text-emerald-650">
                              {appliedCoupon.type === "flat" 
                                ? `₹${appliedCoupon.discount} off` 
                                : `${appliedCoupon.discount}% off`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="p-1 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "cod" && (
                <div className="mb-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-[10px] flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Coupons are only available for prepaid orders
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Fee</span>
                  <span className="font-semibold text-slate-800">₹50.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protection Fee</span>
                  <span className="font-semibold text-slate-800">₹{protectPromiseFee}</span>
                </div>
                {selectedPaymentMethod === "cod" && codCharge > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">COD Charge</span>
                      <span className="text-[9px] text-gray-400">(Flat Fee)</span>
                    </div>
                    <span className="font-semibold text-slate-800">₹{codCharge}</span>
                  </div>
                )}

                {/* Pre-discount Gross Total Row */}
                <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-bold text-slate-700 text-xs">
                  <span>Gross Total (Before Discounts)</span>
                  <span>₹{(subtotal + 50 + protectPromiseFee + (selectedPaymentMethod === "cod" ? codCharge : 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Applied Discounts & Promos Section */}
                <div className="space-y-1 bg-white border border-slate-150 p-2.5 rounded-xl mt-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applied Discounts & Promos</p>
                  
                  {/* Free Delivery Promo */}
                  {deliveryFee === 0 ? (
                    <div className="flex justify-between items-center text-emerald-600 text-[11px]">
                      <span className="font-medium">Free Delivery Promo</span>
                      <span className="font-bold font-mono">-₹50.00</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-slate-400 text-[9px]">
                      <span>No delivery promotion applied</span>
                      <span>—</span>
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 text-[11px] border-t border-slate-50 pt-1 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Coupon Discount</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-black tracking-wider uppercase">({appliedCoupon?.code})</span>
                      </div>
                      <span className="font-bold font-mono">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Hybrid Payment Discount */}
                  {selectedPaymentMethod === "hybrid" && (
                    <div className="flex justify-between items-center text-emerald-600 text-[11px] border-t border-slate-50 pt-1 mt-1">
                      <span className="font-medium">Hybrid Discount (5%)</span>
                      <span className="font-bold font-mono">-₹{hybridDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Zero state for discounts */}
                  {deliveryFee !== 0 && couponDiscount === 0 && selectedPaymentMethod !== "hybrid" && (
                    <div className="text-[9px] text-slate-400 italic">Add a coupon code to claim extra discounts!</div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-800 text-xs uppercase block leading-none">Final Total</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1 block">inclusive of all taxes</span>
                  </div>
                  <span className="font-black text-base text-emerald-600 font-mono tracking-tight leading-none">₹{(selectedPaymentMethod === "hybrid" ? hybridFinalTotal : finalTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {selectedPaymentMethod === "cod" && codCharge > 0 && (
                <div className="mt-2.5 p-2 bg-orange-50/70 border border-orange-150 rounded-xl">
                  <p className="text-orange-700 text-[10px] font-medium leading-relaxed">⚠️ COD Charge (₹{codCharge}) must be paid online now. Remaining amount will be collected on delivery.</p>
                </div>
              )}

              {selectedPaymentMethod === "hybrid" && (
                <div className="mt-2.5 p-2 bg-green-50/70 border border-green-150 rounded-xl">
                  <p className="text-green-700 text-[10px] font-medium leading-relaxed">You save ₹{hybridDiscount} with Hybrid Payment!</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!isFormValid() || isProcessing || (!cartProducts && !isDirectPurchase) || (isDirectPurchase && !directPurchaseProduct)}
                className="w-full mt-3.5 bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-slate-100 cursor-pointer"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : selectedPaymentMethod === "cod" ? (
                  <><Lock className="w-3.5 h-3.5" /> Pay COD Charge ₹{codCharge.toLocaleString()}</>
                ) : (
                  <><Lock className="w-3.5 h-3.5" /> Pay ₹{(selectedPaymentMethod === "hybrid" ? hybridUpfrontAmount : finalTotal).toLocaleString()}</>
                )}
              </button>

              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout powered by Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COD Confirmation Modal */}
      <AnimatePresence>
        {showCODConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowCODConfirmation(false)}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Drag Handle on Mobile */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden" />
              
              <div className="px-4 pb-5 pt-1.5 sm:p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Confirm COD Order</h3>
                  <button onClick={() => setShowCODConfirmation(false)} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-650 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Items preview */}
                <div className="space-y-1.5 mb-3 max-h-24 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl shadow-3xs">
                      <img src={item.productImage} alt="" className="w-8 h-8 object-cover rounded-lg bg-white border border-slate-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-805 text-[10px] truncate leading-tight">{item.productName}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-800 text-[10px] font-mono shrink-0">₹{item.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery Address Preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-slate-800 text-[10px] truncate leading-none">{getCurrentShippingDetails().fullName}</p>
                      <span className="text-[9px] text-slate-400 font-semibold">•</span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-none">{getCurrentShippingDetails().phone}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 truncate leading-tight">
                      {getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}
                    </p>
                  </div>
                </div>

                {/* Payment split */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pay Online Now</p>
                    <p className="text-slate-800 font-black text-xs font-mono mt-1">₹{codCharge.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-405 font-medium leading-none mt-0.5">COD Reservation Fee</p>
                  </div>
                  <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <p className="text-[8px] font-bold text-emerald-705 uppercase tracking-wider">Pay on Delivery</p>
                    <p className="text-emerald-700 font-black text-xs font-mono mt-1">₹{(finalTotal - codCharge).toLocaleString()}</p>
                    <p className="text-[8px] text-emerald-600 font-medium leading-none mt-0.5">Cash collected at door</p>
                  </div>
                </div>
                
                <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl mb-3.5">
                  <p className="text-blue-700 text-[9px] leading-normal font-medium">
                    💡 <strong>How it works:</strong> Pay the online COD booking fee of ₹{codCharge} now to secure your order dispatch. The remaining ₹{(finalTotal - codCharge).toLocaleString()} is payable in cash/UPI upon delivery.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCODConfirmation(false)} 
                    className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-55 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCODConfirmation} 
                    disabled={isProcessing} 
                    className="flex-2 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-slate-100 transition-colors active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-3.5 h-3.5" /> Pay ₹{codCharge.toLocaleString()} Now</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hybrid Payment Confirmation Modal */}
      <AnimatePresence>
        {showHybridConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowHybridConfirmation(false)}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Drag Handle on Mobile */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden" />
              
              <div className="px-4 pb-5 pt-1.5 sm:p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Confirm Hybrid Order</h3>
                  <button onClick={() => setShowHybridConfirmation(false)} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-650 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Savings Banner */}
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-3 flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">🎉 Hybrid Special Savings</span>
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-white border border-emerald-100 px-1.5 py-0.2 rounded">Save ₹{hybridDiscount.toLocaleString()}</span>
                </div>
                
                {/* Items preview */}
                <div className="space-y-1.5 mb-3 max-h-24 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl shadow-3xs">
                      <img src={item.productImage} alt="" className="w-8 h-8 object-cover rounded-lg bg-white border border-slate-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-850 text-[10px] truncate leading-tight">{item.productName}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-800 text-[10px] font-mono shrink-0">₹{item.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery Address Preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-slate-800 text-[10px] truncate leading-none">{getCurrentShippingDetails().fullName}</p>
                      <span className="text-[9px] text-slate-400 font-semibold">•</span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-none">{getCurrentShippingDetails().phone}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 truncate leading-tight">
                      {getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}
                    </p>
                  </div>
                </div>

                {/* Payment split */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pay Online (20%)</p>
                    <p className="text-slate-800 font-black text-xs font-mono mt-1">₹{hybridUpfrontAmount.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-405 font-medium leading-none mt-0.5">Upfront online payment</p>
                  </div>
                  <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <p className="text-[8px] font-bold text-emerald-705 uppercase tracking-wider">Pay on Delivery (80%)</p>
                    <p className="text-emerald-700 font-black text-xs font-mono mt-1">₹{hybridCodAmount.toLocaleString()}</p>
                    <p className="text-[8px] text-emerald-600 font-medium leading-none mt-0.5">Cash collected at door</p>
                  </div>
                </div>
                
                <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl mb-3.5">
                  <p className="text-blue-700 text-[9px] leading-normal font-medium">
                    💡 <strong>How it works:</strong> Secure your 5% discount by paying the 20% upfront fee of ₹{hybridUpfrontAmount} online now. Pay the remaining ₹{hybridCodAmount.toLocaleString()} at delivery.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowHybridConfirmation(false)} 
                    className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-55 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleHybridPayment} 
                    disabled={isProcessing} 
                    className="flex-2 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-slate-100 transition-colors active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-3.5 h-3.5" /> Pay Upfront ₹{hybridUpfrontAmount.toLocaleString()}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mobile bottom payment bar */}
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100/80 p-3.5 flex items-center justify-between md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-4"
          >
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block leading-none">Total Amount</span>
              <span className="font-black text-sm text-emerald-600 font-mono tracking-tight mt-1 block">
                ₹{(selectedPaymentMethod === "hybrid" ? hybridFinalTotal : finalTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => {
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth"
                });
              }}
              className="bg-slate-900 hover:bg-slate-850 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-slate-100 cursor-pointer"
            >
              <span>Proceed to Pay</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    
    </div>
  );
}

