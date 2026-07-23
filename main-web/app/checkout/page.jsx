"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/hooks/useGuestCart";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft, ShoppingCart, CreditCard, Truck, Shield, Check, Lock, MapPin,
  Phone, Mail, AlertCircle, Loader2, Smartphone, Landmark, Wallet, Banknote, Home, X, Package, ArrowDown, ChevronRight
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
    if (method === "cod" && appliedCoupon && !codAllowCoupons) {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
      showToastMessage("Coupons are not allowed with COD. Coupon removed.");
    }
  };

  // Coupon validation function
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (selectedPaymentMethod === "cod" && !codAllowCoupons) {
      setCouponError("Coupons cannot be used with Cash on Delivery (COD) orders.");
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
  const config = useQuery(api.shiprocketConfig.getConfig);
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

      // COD charge: ₹100 flat per order (must be paid online) - Removed extra charge
      const codCharge = 0;

      // Coupon discount
      let couponDiscount = 0;
      if (appliedCoupon) {
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

      // COD charge: ₹100 flat per order (must be paid online) - Removed extra charge
      const codCharge = 0;

      // Coupon discount
      let couponDiscount = 0;
      if (appliedCoupon) {
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
  const codAdvance = Math.min(200, finalTotal);
  const remainingCOD = Math.max(0, finalTotal - codAdvance);
  const codAllowCoupons = config?.codAllowCoupons !== false;
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
        paymentStatus = "partial"; // Advance paid, remaining on delivery
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
          advanceAmount: paymentData.codDetails?.advanceAmount || (paymentData.isCODPayment ? codAdvance : 0),
          remainingCOD: paymentData.codDetails?.remainingCOD !== undefined ? paymentData.codDetails.remainingCOD : (paymentData.isCODPayment ? remainingCOD : 0),
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
              status: (paymentData.isHybridPayment || paymentData.isCODPayment) ? "partial" : "paid",
              paymentMethod: paymentData.isHybridPayment ? "hybrid" : (paymentData.isCODPayment ? "cod" : "razorpay"),
              codCharge: paymentData.isCODPayment ? paymentData.codDetails?.codCharge : undefined,
              remainingCOD: paymentData.isCODPayment ? paymentData.codDetails?.remainingCOD : undefined,
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
              status: (paymentData.isHybridPayment || paymentData.isCODPayment) ? "partial" : "paid",
              paymentMethod: paymentData.isHybridPayment ? "hybrid" : (paymentData.isCODPayment ? "cod" : "razorpay"),
              codCharge: paymentData.isCODPayment ? paymentData.codDetails?.codCharge : undefined,
              remainingCOD: paymentData.isCODPayment ? paymentData.codDetails?.remainingCOD : undefined,
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
        : paymentData.isCODPayment
        ? `COD Advance - ₹${paymentData.codDetails?.advanceAmount || 200}`
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

      // Create Razorpay order for ₹200 COD advance
      const response = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: codAdvance, currency: "INR", receipt: `cod_adv_${Date.now()}`, notes: { userId: me?._id || "guest", userEmail: getCurrentShippingDetails().email, userName: getCurrentShippingDetails().fullName, paymentType: "cod_advance", totalAmount: finalTotal, codAmount: remainingCOD, advancePaid: codAdvance } }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");

      const paymentData = {
        orderId: data.order.id, amount: data.order.amount, currency: data.order.currency, customerDetails: getCurrentShippingDetails(),
        items: isDirectPurchase ? [{ productId: directPurchaseItem.productId, productName: directPurchaseItem.productName, productImage: directPurchaseItem.productImage, price: directPurchaseItem.price, size: directPurchaseItem.size, quantity: directPurchaseItem.quantity, category: directPurchaseItem.category || '', brand: directPurchaseItem.brand || '' }] : userCart.items,
        orderTotal: finalTotal, isDirectPurchase, userId: me?._id, isCODPayment: true,
        codDetails: { advanceAmount: codAdvance, remainingCOD: remainingCOD, codCharge: 0 },
      };

      await openRazorpayModal(paymentData);
    } catch (error) {
      showToastMessage(error.message || "Payment failed");
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
    <div className="min-h-screen bg-white font-inter text-gray-900">
      {/* Navigation */}
      <Navbar />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90%] md:max-w-md pointer-events-none"
          >
            <div className="bg-neutral-900 text-white border border-neutral-800 px-4 py-2.5 rounded-none text-xs font-medium shadow-2xl flex items-center gap-3 select-none tracking-wide">
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
              <span className="leading-snug font-inter">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-32 md:pt-36 lg:pt-40 pb-20">

        {/* Breadcrumbs & Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-500 mb-3 font-bold">
            <button onClick={() => router.push("/")} className="hover:text-black transition-colors font-bold">Home</button>
            <ChevronRight className="w-3 h-3 stroke-[2.5px]" />
            <button onClick={() => router.push("/cart")} className="hover:text-black transition-colors font-bold">Cart</button>
            <ChevronRight className="w-3 h-3 stroke-[2.5px]" />
            <span className="text-gray-900 font-black">Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">Express Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT COLUMN: Shipping Form & Payment Selection */}
          <div className="lg:col-span-7 space-y-8">

            {/* 1. Order Items Summary Accordion */}
            <div className="  rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2 font-inter">
                  <Package className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                  Order Items ({items.length})
                </h2>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white border border-gray-200/80 p-3.5 rounded-md">
                    <img src={item.productImage} alt={item.productName} className="w-14 h-14 object-cover border border-gray-200 bg-gray-50 rounded-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs truncate leading-snug font-inter">{item.productName}</p>
                      <p className="text-gray-600 text-[11px] font-bold mt-1">Size: <span className="text-gray-900 font-extrabold">{item.size}</span> • Qty: <span className="text-gray-900 font-extrabold">{item.quantity}</span></p>
                    </div>
                    <p className="font-extrabold text-gray-900 text-xs font-inter">₹{item.price?.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Shipping & Delivery Address */}
            <div className="rounded-lg">
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-900 mb-5 flex items-center gap-2 font-inter">
                <MapPin className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                Shipping & Delivery Address
              </h2>

              {isAuthLoading || (token !== null && (!me || !isFormInitialized)) ? (
                /* Skeleton Loader */
                <div className="grid grid-cols-2 gap-3 animate-pulse">
                  <div className="col-span-2 h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="col-span-2 h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                  <div className="h-11 bg-gray-200/60 rounded-md" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    {...register('fullName')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="col-span-2 px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    {...register('email')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    {...register('phone')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Flat / House No. *"
                    {...register('flatNo')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Area / Locality *"
                    {...register('area')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    {...register('landmark')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="col-span-2 px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="City *"
                    {...register('city')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    {...register('state')}
                    onBlur={() => updateUserAddressConvex(getValues())}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-md text-xs font-inter text-gray-900 focus:border-neutral-900 outline-none transition-colors placeholder:text-gray-500 font-bold"
                  />

                  {/* Pincode Input with Live Serviceability Indicator */}
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
                      className={`px-4 py-3 pr-9 bg-white border rounded-md text-xs font-inter text-gray-900 outline-none w-full transition-colors placeholder:text-gray-500 font-bold ${pincodeCheckStatus === 'available' ? 'border-emerald-600' :
                          pincodeCheckStatus === 'unavailable' ? 'border-rose-500' :
                            'border-gray-300 focus:border-neutral-900'
                        }`}
                      maxLength={6}
                    />

                    {/* Delivery Status Icon */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {pincodeCheckStatus === 'checking' && (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      )}
                      {pincodeCheckStatus === 'available' && (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                      )}
                      {pincodeCheckStatus === 'unavailable' && (
                        <X className="w-4 h-4 text-rose-500 stroke-[3px]" />
                      )}
                    </div>
                  </div>

                  <input type="text" value="India" disabled className="px-4 py-3 bg-gray-100/90 border border-gray-200 rounded-md text-xs text-gray-600 font-bold cursor-not-allowed" />
                </div>
              )}

              {/* Delivery Serviceability Banner */}
              {pincodeCheckStatus === 'available' && deliveryInfo && (
                <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                    <span className="text-[11px] font-black uppercase tracking-wider font-inter">Delivery Available to Pincode</span>
                  </div>
                  {deliveryInfo.estimatedDays && (
                    <span className="text-[11px] text-emerald-900 font-black font-inter">
                      Est. Delivery: {
                        typeof deliveryInfo.estimatedDays === 'number'
                          ? `${deliveryInfo.estimatedDays} Days`
                          : String(deliveryInfo.estimatedDays).toLowerCase().includes('day')
                            ? deliveryInfo.estimatedDays
                            : deliveryInfo.estimatedDays
                      }
                    </span>
                  )}
                </div>
              )}

              {pincodeCheckStatus === 'unavailable' && pincodeError && (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-300 rounded-md">
                  <div className="flex items-center gap-2 text-rose-950">
                    <AlertCircle className="w-4 h-4 text-rose-600 stroke-[2.5px]" />
                    <span className="text-[11px] font-black uppercase tracking-wider font-inter">Delivery Notice</span>
                  </div>
                  <p className="mt-1 text-[11px] text-rose-900 font-bold pl-6 leading-normal">{pincodeError}</p>
                </div>
              )}
            </div>

            {/* 3. Payment Method Selection */}
            <div className=" rounded-lg">
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-900 mb-5 flex items-center gap-2 font-inter">
                <CreditCard className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                Select Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* UPI */}
                <button
                  onClick={() => handlePaymentMethodChange("upi")}
                  type="button"
                  className={`p-4 rounded-md border text-left transition-all relative flex flex-col justify-between h-22 cursor-pointer ${selectedPaymentMethod === "upi"
                      ? "border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-sm"
                      : "border-gray-300 bg-white hover:border-gray-500"
                    }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === "upi" ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-400"
                      }`}>
                      {selectedPaymentMethod === "upi" && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xs leading-none font-inter">UPI / QR Code</p>
                    <p className="text-[10px] text-gray-600 font-bold mt-1">GPay, PhonePe, Paytm, BHIM</p>
                  </div>
                </button>

                {/* Cards */}
                <button
                  onClick={() => handlePaymentMethodChange("card")}
                  type="button"
                  className={`p-4 rounded-md border text-left transition-all relative flex flex-col justify-between h-22 cursor-pointer ${selectedPaymentMethod === "card"
                      ? "border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-sm"
                      : "border-gray-300 bg-white hover:border-gray-500"
                    }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === "card" ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-400"
                      }`}>
                      {selectedPaymentMethod === "card" && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xs leading-none font-inter">Credit / Debit Card</p>
                    <p className="text-[10px] text-gray-600 font-bold mt-1">Visa, Mastercard, RuPay</p>
                  </div>
                </button>

                {/* Net Banking */}
                <button
                  onClick={() => handlePaymentMethodChange("netbanking")}
                  type="button"
                  className={`p-4 rounded-md border text-left transition-all relative flex flex-col justify-between h-22 cursor-pointer ${selectedPaymentMethod === "netbanking"
                      ? "border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-sm"
                      : "border-gray-300 bg-white hover:border-gray-500"
                    }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === "netbanking" ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-400"
                      }`}>
                      {selectedPaymentMethod === "netbanking" && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xs leading-none font-inter">Net Banking</p>
                    <p className="text-[10px] text-gray-600 font-bold mt-1">HDFC, SBI, ICICI & All Banks</p>
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  onClick={() => handlePaymentMethodChange("cod")}
                  type="button"
                  className={`p-4 rounded-md border text-left transition-all relative flex flex-col justify-between h-22 cursor-pointer ${selectedPaymentMethod === "cod"
                      ? "border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-sm"
                      : "border-gray-300 bg-white hover:border-gray-500"
                    }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-neutral-900 stroke-[2.5px]" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === "cod" ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-400"
                      }`}>
                      {selectedPaymentMethod === "cod" && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xs leading-none font-inter">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-gray-600 font-bold mt-1">Pay Cash/UPI at doorstep</p>
                  </div>
                </button>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary & Checkout Action */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50/70 border border-gray-200/80 p-6 rounded-lg lg:sticky lg:top-36 shadow-xs space-y-6">

              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-900 font-inter border-b border-gray-200 pb-3">
                Order Summary
              </h2>

              {/* Coupon Code Input */}
              <div className="space-y-2">
                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-inter border border-gray-300 rounded-md focus:border-neutral-900 outline-none uppercase font-bold placeholder:normal-case placeholder:font-bold placeholder:text-gray-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-md disabled:opacity-50 transition-all cursor-pointer font-inter"
                      >
                        {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-rose-600 text-[11px] flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {couponError}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                      <div>
                        <p className="text-xs font-black text-emerald-950 font-inter">{appliedCoupon.code}</p>
                        <p className="text-[11px] font-bold text-emerald-800">
                          {appliedCoupon.type === "flat"
                            ? `₹${appliedCoupon.discount} Discount Applied`
                            : `${appliedCoupon.discount}% Discount Applied`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.5px]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs font-inter border-t border-b border-gray-200 py-4">
                <div className="flex justify-between text-gray-700 font-bold">
                  <span>Subtotal</span>
                  <span className="font-black text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-bold">Shipping Fee</span>
                  <span className="font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-sm">
                    Free Delivery
                  </span>
                </div>

                <div className="flex justify-between text-gray-700 font-bold">
                  <span>Protection Fee</span>
                  <span className="font-black text-gray-900">₹{protectPromiseFee}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-black pt-1 border-t border-dashed border-gray-200">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {selectedPaymentMethod === "cod" && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>Advance Online Payment (Pay Now)</span>
                      <span className="font-black">₹{codAdvance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>Cash Due on Delivery</span>
                      <span className="font-black">₹{remainingCOD.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-300 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900 block font-inter">Total Order Amount</span>
                    <span className="text-[10px] text-gray-500 font-bold">Inclusive of all taxes</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-serif font-black text-gray-900">
                    ₹{(selectedPaymentMethod === "hybrid" ? hybridFinalTotal : finalTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handlePayment}
                disabled={!isFormValid() || isProcessing || (!cartProducts && !isDirectPurchase) || (isDirectPurchase && !directPurchaseProduct)}
                className="w-full py-4 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-inter rounded-md shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing Order...</>
                ) : selectedPaymentMethod === "cod" ? (
                  <><Lock className="w-4 h-4" /> Pay ₹{codAdvance.toLocaleString()} Advance & Confirm</>
                ) : (
                  <> Pay ₹{(selectedPaymentMethod === "hybrid" ? hybridUpfrontAmount : finalTotal).toLocaleString()} Now</>
                )}
              </button>

              {/* Security & Authentication Trust Banner */}
              <div className="space-y-2 pt-2 border-t border-gray-200 text-[10px] text-gray-700 font-bold">
                <div className="flex items-center gap-2 text-gray-800">
                  <Shield className="w-4 h-4 text-emerald-700 stroke-[2.5px] shrink-0" />
                  <span>256-Bit SSL Encrypted & Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <Truck className="w-4 h-4 text-neutral-900 stroke-[2.5px] shrink-0" />
                  <span>Express Doorstep Delivery Across India</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* COD Confirmation Modal */}
      <AnimatePresence>
        {showCODConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCODConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-5 rounded-none"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 font-inter">Confirm Cash on Delivery</h3>
                <button onClick={() => setShowCODConfirmation(false)} className="p-1 hover:text-gray-600 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-[11px] font-bold text-amber-900 leading-snug">
                  An advance payment of ₹{codAdvance.toLocaleString()} is required online to confirm your COD order. The remaining ₹{remainingCOD.toLocaleString()} will be collected on delivery.
                </p>
              </div>

              {/* Items Preview */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-100">
                    <img src={item.productImage} alt="" className="w-10 h-10 object-cover border border-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs truncate">{item.productName}</p>
                      <p className="text-[10px] text-gray-500">Size: {item.size} • Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-xs font-inter">₹{item.price?.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Address Preview */}
              <div className="bg-gray-50 p-3 border border-gray-200/80 text-xs text-gray-700">
                <p className="font-bold text-gray-900 mb-1">{getCurrentShippingDetails().fullName} • {getCurrentShippingDetails().phone}</p>
                <p className="text-gray-600">{getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}</p>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 space-y-1.5 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 font-inter">Advance Online Payment (Pay Now)</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">₹{codAdvance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200/80 pt-1.5">
                  <span className="text-xs font-bold text-amber-900 font-inter">Remaining Cash Due on Delivery</span>
                  <span className="text-sm font-bold text-amber-800 font-mono">₹{remainingCOD.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200/80 pt-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-inter">Total Order Price</span>
                  <span className="text-base font-serif font-black text-slate-900">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCODConfirmation(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCODConfirmation}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-inter"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${codAdvance} Advance`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mobile Payment Bar */}
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 flex items-center justify-between lg:hidden shadow-xl"
          >
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block leading-none font-inter">Total Amount</span>
              <span className="text-lg font-serif font-bold text-gray-900 mt-1 block">
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
              className="bg-neutral-900 hover:bg-black text-white px-5 py-3 rounded-none font-bold text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer font-inter"
            >
              <span>Complete Order</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
