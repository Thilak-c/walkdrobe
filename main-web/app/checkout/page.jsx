"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  Check,
  Lock,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Smartphone, Landmark, Wallet, Banknote, Home } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if this is a direct "Buy Now" purchase
  const isDirectPurchase = searchParams.get("action") === "buyNow";
  const directPurchaseItem = isDirectPurchase
    ? {
      productId: searchParams.get("productId"),
      productName: searchParams.get("productName"),
      productImage: searchParams.get("productImage"),
      price: parseFloat(searchParams.get("price")),
      size: searchParams.get("size"),
      quantity: parseInt(searchParams.get("quantity")),
      category: searchParams.get("category"),
      brand: searchParams.get("brand"),
    }
    : null;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("hybrid");
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);
  const [showHybridConfirmation, setShowHybridConfirmation] = useState(false);
  const [showMissDiscountPrompt, setShowMissDiscountPrompt] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState(null);

  // Handle payment method change with discount prompt
  const handlePaymentMethodChange = (method) => {
    if (selectedPaymentMethod === "hybrid" && method !== "hybrid") {
      // User is switching away from hybrid, show prompt
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

  // Form states
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    houseNo: "",
    street: "",
    landmark: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    houseNo: "",
    street: "",
    landmark: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Razorpay script loader function
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Get user data
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  useEffect(() => {
    if (me) {
      setIsLoggedIn(true);

      // Pre-fill shipping details with user data if available
      if (me.name)
        setShippingDetails((prev) => ({ ...prev, fullName: me.name }));
      if (me.email)
        setShippingDetails((prev) => ({ ...prev, email: me.email }));
      if (me.phoneNumber)
        setShippingDetails((prev) => ({ ...prev, phone: me.phoneNumber }));

      // Handle address fields with proper type checking
      if (me.address && typeof me.address === "object") {
        // Extract address fields from nested structure
        if (me.address.fullAddress) {
          setShippingDetails((prev) => ({
            ...prev,
            address: me.address.fullAddress,
          }));
        }
        if (me.address.city) {
          setShippingDetails((prev) => ({ ...prev, city: me.address.city }));
        }
        if (me.address.state) {
          setShippingDetails((prev) => ({ ...prev, state: me.address.state }));
        }
        if (me.address.pinCode) {
          setShippingDetails((prev) => ({
            ...prev,
            pincode: me.address.pinCode,
          }));
        }
      } else if (me.address && typeof me.address === "string") {
        // Fallback for string address
        setShippingDetails((prev) => ({ ...prev, address: me.address }));
      } else {
        // Clear address fields if no valid data
        clearInvalidAddressData();
      }

      if (me.city && typeof me.city === "string")
        setShippingDetails((prev) => ({ ...prev, city: me.city }));
      if (me.state && typeof me.state === "string")
        setShippingDetails((prev) => ({ ...prev, state: me.state }));
      if (me.pincode && typeof me.pincode === "string")
        setShippingDetails((prev) => ({ ...prev, pincode: me.pincode }));

      // Also set custom address with same data
      setCustomAddress({
        fullName: me.name || "",
        email: me.email || "",
        phone: me.phoneNumber || "",
        address: me.address?.fullAddress || me.address || "",
        city: me.address?.city || me.city || "",
        state: me.address?.state || me.state || "",
        pincode: me.address?.pinCode || me.pincode || "",
        country: "India",
      });
    } else if (token && !me) {
      setIsLoggedIn(false);
    }
  }, [me, token]);

  // Preload Razorpay script on page load for faster checkout
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Cart data - only fetch if not a direct purchase
  const userCart = useQuery(
    api.cart.getUserCart,
    me && !isDirectPurchase ? { userId: me._id } : "skip"
  );
  const removeFromCartMutation = useMutation(api.cart.removeFromCart);
  const clearCartMutation = useMutation(api.cart.clearCart);

  // Order mutations
  const createOrderMutation = useMutation(api.orders.createOrder);

  // Stock validation

  // Debug: Log cart items and stock validation

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Get products data for stock validation - only for cart items
  const cartProductIds = userCart?.items?.map((item) => item.productId) || [];
  const cartProducts = useQuery(
    api.products.getProductsByIds,
    cartProductIds.length > 0 ? { productIds: cartProductIds } : "skip"
  );

  // Get single product data for direct purchase
  const directPurchaseProduct = useQuery(
    api.products.getProductById,
    isDirectPurchase && directPurchaseItem?.productId
      ? { productId: directPurchaseItem.productId }
      : "skip"
  );

  // Stock validation function
  const validateStock = () => {
    if (isDirectPurchase) {
      // Validate direct purchase item
      if (!directPurchaseProduct) {
        return { isValid: false, message: "Loading product data..." };
      }

      if (!directPurchaseProduct.inStock) {
        return { isValid: false, message: "Product is currently out of stock" };
      }

      if (
        !directPurchaseProduct.availableSizes?.includes(directPurchaseItem.size)
      ) {
        return {
          isValid: false,
          message: `Size ${directPurchaseItem.size} is not available`,
        };
      }

      const availableStock =
        directPurchaseProduct.sizeStock?.[directPurchaseItem.size] || 0;
      if (availableStock < directPurchaseItem.quantity) {
        return {
          isValid: false,
          message: `Only ${availableStock} units available in size ${directPurchaseItem.size}`,
        };
      }

      return { isValid: true, message: "Product is in stock" };
    } else {
      // Validate cart items (existing logic)
      if (!userCart?.items || userCart.items.length === 0) {
        return { isValid: false, message: "Cart is empty" };
      }

      if (!cartProducts) {
        return { isValid: false, message: "Loading product data..." };
      }

      try {
        // Create a map for quick product lookup - handle both _id and itemId
        const productMap = new Map();
        cartProducts.forEach((product) => {
          if (product) {
            // Map both _id and itemId since cart might store either
            productMap.set(product._id, product);
            productMap.set(product.itemId, product);
          }
        });

        // Validate each cart item
        const invalidItems = [];

        for (const cartItem of userCart.items) {
          const product = productMap.get(cartItem.productId);

          if (!product) {
            invalidItems.push({
              isValid: false,
              productName: cartItem.productName,
              message: "Product not found",
            });
            continue;
          }

          // Check if product is hidden or deleted
          if (product.isHidden || product.isDeleted) {
            invalidItems.push({
              isValid: false,
              productName: cartItem.productName,
              message: "Product is no longer available",
            });
            continue;
          }

          // Check general stock status
          if (!product.inStock) {
            invalidItems.push({
              isValid: false,
              productName: cartItem.productName,
              message: "Product is currently out of stock",
            });
            continue;
          }

          // Check if the requested size is available
          if (!product.availableSizes?.includes(cartItem.size)) {
            invalidItems.push({
              isValid: false,
              productName: cartItem.productName,
              message: `Size ${cartItem.size} is not available`,
            });
            continue;
          }

          // Check size-specific stock
          const availableStock = product.sizeStock?.[cartItem.size] || 0;

          if (availableStock < cartItem.quantity) {
            // Show available stock in other sizes for better user experience
            const otherSizesStock = product.availableSizes
              ?.filter(
                (size) =>
                  size !== cartItem.size && (product.sizeStock?.[size] || 0) > 0
              )
              ?.map((size) => `${size}(${product.sizeStock[size]})`)
              ?.join(", ");

            let stockMessage;
            if (availableStock === 0) {
              stockMessage = `Size ${cartItem.size} is out of stock`;
            } else {
              stockMessage = `Only ${availableStock} of ${cartItem.quantity} units available in size ${cartItem.size}`;
            }

            if (otherSizesStock) {
              stockMessage += `. Available in: ${otherSizesStock}`;
            }

            invalidItems.push({
              isValid: false,
              productName: cartItem.productName,
              message: stockMessage,
            });
            continue;
          }
        }

        if (invalidItems.length > 0) {
          const errorMessage =
            invalidItems.length === 1
              ? `${invalidItems[0].productName}: ${invalidItems[0].message}`
              : `${invalidItems.length} items are out of stock or have insufficient quantity`;

          return { isValid: false, message: errorMessage };
        }

        return { isValid: true, message: "All items are in stock" };
      } catch (error) {
        console.error("Stock validation error:", error);
        return {
          isValid: false,
          message: "Unable to verify stock availability",
        };
      }
    }
  };

  const clearInvalidAddressData = () => {
    setShippingDetails((prev) => ({
      ...prev,
      address: "",
      city: "",
      state: "",
      pincode: "",
    }));
  };

  // Razorpay Integration Functions
  const createRazorpayOrder = async () => {
    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalTotal,
          currency: "INR",
          receipt: `order_${Date.now()}`,
          notes: {
            userId: me?._id || "guest",
            userEmail: getCurrentShippingDetails().email,
            userName: getCurrentShippingDetails().fullName,
            isGuestCheckout: !me,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      return data.order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  // Handle Hybrid Payment - 20% Razorpay + COD with 5% discount
  const handleHybridPayment = async () => {
    setShowHybridConfirmation(false);
    setIsProcessing(true);

    try {
      // Create Razorpay order for 20% upfront amount
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: hybridUpfrontAmount,
          currency: "INR",
          receipt: `hybrid_${Date.now()}`,
          notes: {
            userId: me?._id || "guest",
            userEmail: getCurrentShippingDetails().email,
            userName: getCurrentShippingDetails().fullName,
            paymentType: "hybrid",
            totalAmount: hybridFinalTotal,
            codAmount: hybridCodAmount,
            discount: hybridDiscount,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      // Create payment session data for hybrid payment
      const paymentData = {
        orderId: data.order.id,
        amount: data.order.amount,
        currency: data.order.currency,
        customerDetails: getCurrentShippingDetails(),
        items: isDirectPurchase ? [{
          productId: directPurchaseItem.productId,
          productName: directPurchaseItem.productName,
          productImage: directPurchaseItem.productImage,
          price: directPurchaseItem.price,
          size: directPurchaseItem.size,
          quantity: directPurchaseItem.quantity,
        }] : userCart.items,
        orderTotal: hybridFinalTotal,
        isDirectPurchase,
        userId: me?._id,
        isHybridPayment: true,
        hybridDetails: {
          upfrontAmount: hybridUpfrontAmount,
          codAmount: hybridCodAmount,
          discount: hybridDiscount,
          originalTotal: finalTotal,
        },
      };

      // Encode and redirect to payment page
      const paymentToken = btoa(JSON.stringify(paymentData));
      window.location.href = `https://aesthetx-ways.vercel.app/payment/raz?token=${paymentToken}`;
    } catch (error) {
      console.error("Hybrid payment error:", error);
      showToastMessage(error.message || "Failed to process payment");
      setIsProcessing(false);
    }
  };

  const handleCODConfirmation = async () => {
    setShowCODConfirmation(false);
    setIsProcessing(true);

    try {
      // Validate shipping details before proceeding
      const currentShippingDetails = getCurrentShippingDetails();
      console.log("Shipping Details:", currentShippingDetails);

      if (!currentShippingDetails.fullName || !currentShippingDetails.email ||
        !currentShippingDetails.phone || !currentShippingDetails.address ||
        !currentShippingDetails.city || !currentShippingDetails.pincode) {
        showToastMessage("Please fill all required shipping details");
        setIsProcessing(false);
        return;
      }

      // Map items to order format
      let mappedItems;
      if (isDirectPurchase) {
        mappedItems = [
          {
            productId: directPurchaseItem.productId,
            name: directPurchaseItem.productName,
            price: directPurchaseItem.price,
            quantity: directPurchaseItem.quantity,
            size: directPurchaseItem.size,
            image: directPurchaseItem.productImage,
          },
        ];
      } else {
        mappedItems = userCart.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.productImage,
        }));
      }

      console.log("Creating COD order with:", {
        userId: me?._id || null,
        itemsCount: mappedItems.length,
        orderTotal: finalTotal,
      });

      const orderResult = await createOrderMutation({
        userId: me?._id || null,
        items: mappedItems,
        shippingDetails: currentShippingDetails,
        paymentDetails: {
          amount: finalTotal,
          currency: "INR",
          status: "pending",
          paymentMethod: "cod",
        },
        orderTotal: finalTotal,
        status: "confirmed",
      });

      console.log("Order creation result:", orderResult);

      if (orderResult && orderResult.success) {
        showToastMessage("Order placed successfully! Pay on delivery.");

        // Send order confirmation email (non-blocking)
        fetch("/api/send-order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: currentShippingDetails.email,
            userName: currentShippingDetails.fullName,
            orderNumber: orderResult.orderNumber,
            orderItems: mappedItems,
            orderTotal: finalTotal,
            shippingDetails: currentShippingDetails,
            paymentDetails: {
              amount: finalTotal,
              currency: "INR",
              status: "pending",
              paymentMethod: "cod",
            },
          }),
        }).catch((emailError) => {
          console.error("Error sending order confirmation email:", emailError);
        });

        // Send admin notification email (non-blocking)
        fetch("/api/send-admin-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: orderResult.orderNumber,
            customerName: currentShippingDetails.fullName,
            customerEmail: currentShippingDetails.email,
            orderTotal: finalTotal,
            items: mappedItems,
            shippingAddress: `${currentShippingDetails.address}, ${currentShippingDetails.city}, ${currentShippingDetails.state} - ${currentShippingDetails.pincode}`,
            shippingDetails: currentShippingDetails,
            paymentDetails: {
              amount: finalTotal,
              currency: "INR",
              status: "pending",
              paymentMethod: "cod",
            },
          }),
        }).then(res => res.json()).then(data => {
          console.log("Admin notification sent:", data);
        }).catch((emailError) => {
          console.error("Error sending admin notification:", emailError);
        });

        // Clear cart after successful order
        if (!isDirectPurchase && me) {
          try {
            await clearCartMutation({ userId: me._id });
          } catch (error) {
            console.error("Error clearing cart:", error);
          }
        }

        setTimeout(() => {
          router.push(`/order-success?orderNumber=${orderResult.orderNumber}`);
        }, 1500);
      } else {
        console.error("Order creation failed:", orderResult);
        showToastMessage(orderResult?.message || "Order creation failed. Please try again.");
      }
    } catch (error) {
      console.error("Error creating COD order:", error);
      showToastMessage(`Failed to place order: ${error.message || "Please try again"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!isFormValid()) {
      showToastMessage("Please fill all required fields");
      return;
    }

    // Check stock availability before proceeding
    const stockValidation = validateStock();
    if (!stockValidation.isValid) {
      showToastMessage(stockValidation.message);
      return;
    }

    // Handle COD orders separately - show confirmation first
    if (selectedPaymentMethod === "cod") {
      setShowCODConfirmation(true);
      return;
    }

    // Handle Hybrid payment - show confirmation first
    if (selectedPaymentMethod === "hybrid") {
      setShowHybridConfirmation(true);
      return;
    }

    setIsProcessing(true);

    // Handle online payment (Razorpay) - Redirect to payment page
    try {
      // Create order first
      const order = await createRazorpayOrder();

      // Create payment session data
      const paymentData = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        customerDetails: getCurrentShippingDetails(),
        items: isDirectPurchase ? [{
          productId: directPurchaseItem.productId,
          productName: directPurchaseItem.productName,
          productImage: directPurchaseItem.productImage,
          price: directPurchaseItem.price,
          size: directPurchaseItem.size,
          quantity: directPurchaseItem.quantity,
          category: directPurchaseItem.category || '',
          brand: directPurchaseItem.brand || '',
        }] : userCart.items,
        orderTotal: finalTotal,
        isDirectPurchase,
        userId: me?._id,
      };

      // Encode payment data as base64 token
      const paymentToken = btoa(JSON.stringify(paymentData));

      // Redirect to Vercel payment page
      window.location.href = `https://aesthetx-ways.vercel.app/payment/raz?token=${paymentToken}`;
      return;

      // Configure Razorpay options
      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RAMQAuyK0c66gh",
        amount: order.amount,
        currency: order.currency,
        name: "AesthetX Ways",
        description: `Order for ${shippingDetails.fullName}`,
        image: "https://aesthetxways.com/favicon.png",
        order_id: order.id,
        prefill: {
          name: getCurrentShippingDetails().fullName,
          email: getCurrentShippingDetails().email,
          contact: getCurrentShippingDetails().phone,
        },
        notes: {
          name: getCurrentShippingDetails().fullName,
          email: getCurrentShippingDetails().email,
          phone: getCurrentShippingDetails().phone,
          address: `${getCurrentShippingDetails().address}, ${getCurrentShippingDetails().city}, ${getCurrentShippingDetails().state} - ${getCurrentShippingDetails().pincode}`,
        },
        theme: {
          color: "#000000",
        },
        handler: async function (response) {
          try {
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
              // Create order using Convex mutation
              try {
                // Map items to order format
                let mappedItems;
                if (isDirectPurchase) {
                  // Direct purchase item
                  mappedItems = [
                    {
                      productId: directPurchaseItem.productId,
                      name: directPurchaseItem.productName,
                      price: directPurchaseItem.price,
                      quantity: directPurchaseItem.quantity,
                      size: directPurchaseItem.size,
                      image: directPurchaseItem.productImage,
                    },
                  ];
                } else {
                  // Cart items
                  mappedItems = userCart.items.map((item) => ({
                    productId: item.productId,
                    name: item.productName,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    image: item.productImage,
                  }));
                }

                const orderResult = await createOrderMutation({
                  userId: me?._id || null, // null for guest users

                  items: mappedItems,
                  shippingDetails: getCurrentShippingDetails(),
                  paymentDetails: {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    amount: finalTotal,
                    currency: "INR",
                    status: "paid",
                    paidAt: Date.now(),
                    paidBy: getCurrentShippingDetails().fullName,
                    paymentMethod: "razorpay",
                  },
                  orderTotal: finalTotal,
                  status: "confirmed",
                });

                if (orderResult.success) {
                  showToastMessage(
                    "Payment successful! Order placed successfully."
                  );

                  // Send order confirmation email (non-blocking - fire and forget)
                  fetch("/api/send-order-confirmation", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userEmail: getCurrentShippingDetails().email,
                      userName: getCurrentShippingDetails().fullName,
                      orderNumber: orderResult.orderNumber,
                      orderItems: mappedItems,
                      orderTotal: finalTotal,
                      shippingDetails: getCurrentShippingDetails(),
                      paymentDetails: {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        amount: finalTotal,
                        currency: "INR",
                        status: "paid",
                        paidAt: Date.now(),
                        paidBy: getCurrentShippingDetails().fullName,
                        paymentMethod: "razorpay",
                      },
                    }),
                  }).catch((emailError) => {
                    console.error("Error sending order confirmation email:", emailError);
                  });

                  // Send admin notification email (non-blocking)
                  fetch("/api/send-admin-notification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderNumber: orderResult.orderNumber,
                      customerName: getCurrentShippingDetails().fullName,
                      customerEmail: getCurrentShippingDetails().email,
                      orderTotal: finalTotal,
                      items: mappedItems,
                      shippingAddress: `${getCurrentShippingDetails().address}, ${getCurrentShippingDetails().city}, ${getCurrentShippingDetails().state} - ${getCurrentShippingDetails().pincode}`,
                      shippingDetails: getCurrentShippingDetails(),
                      paymentDetails: {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        amount: finalTotal,
                        currency: "INR",
                        status: "paid",
                        paidAt: Date.now(),
                        paidBy: getCurrentShippingDetails().fullName,
                        paymentMethod: "razorpay",
                      },
                    }),
                  }).then(res => res.json()).then(data => {
                    console.log("Admin notification sent:", data);
                  }).catch((emailError) => {
                    console.error("Error sending admin notification:", emailError);
                  });

                  // Clear cart after successful order (only for cart-based purchases)
                  if (!isDirectPurchase) {
                    try {
                      await clearCartMutation({ userId: me._id });
                    } catch (error) {
                      console.error("Error clearing cart:", error);
                      // Don't block the success flow if cart clearing fails
                    }
                  }

                  setTimeout(() => {
                    router.push(
                      `/order-success?orderNumber=${orderResult.orderNumber}`
                    );
                  }, 1500);
                } else {
                  showToastMessage(
                    "Order creation failed. Please contact support."
                  );
                }
              } catch (error) {
                console.error("Error creating order:", error);
                showToastMessage(
                  "Payment successful but order creation failed. Please contact support."
                );
              }
            } else {
              showToastMessage(
                "Payment verification failed. Please contact support."
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            showToastMessage(
              "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpayInstance = new Razorpay(options);

      // Add event listeners for better state management
      razorpayInstance.on("payment.failed", function (response) {
        showToastMessage("Payment failed. Please try again.");
        setIsProcessing(false);
      });

      razorpayInstance.on("payment.cancelled", function (response) {
        showToastMessage("Payment was cancelled.");
        setIsProcessing(false);
      });

      razorpayInstance.open();

      // Reset processing state after a timeout as fallback
      setTimeout(() => {
        if (isProcessing) {
          setIsProcessing(false);
        }
      }, 10000); // 10 seconds timeout
    } catch (error) {
      console.error("Payment error:", error);
      showToastMessage(error.message || "Failed to process payment");
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (useDefaultAddress) {
      setShippingDetails((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setCustomAddress((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddressToggle = (useDefault) => {
    setUseDefaultAddress(useDefault);
    if (useDefault) {
      // Switch back to default address
      setShippingDetails((prev) => ({
        ...prev,
        fullName: me?.name || "",
        email: me?.email || "",
        phone: me?.phoneNumber || "",
        address: me?.address?.fullAddress || me?.address || "",
        city: me?.address?.city || me?.city || "",
        state: me?.address?.state || me?.state || "",
        pincode: me?.address?.pinCode || me?.pincode || "",
        country: "India",
      }));
    } else {
      // Switch to custom address - start with empty form
      setCustomAddress({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
    }
  };

  // Get current shipping details based on selection
  const getCurrentShippingDetails = () => {
    const details = useDefaultAddress ? shippingDetails : customAddress;

    // Combine address fields if they exist separately
    let finalAddress = details.address;
    if (details.houseNo || details.street || details.landmark) {
      const addressParts = [
        details.houseNo,
        details.street,
        details.landmark
      ].filter(Boolean);

      if (addressParts.length > 0) {
        finalAddress = addressParts.join(", ");
      }
    }

    // Ensure all required fields are present with fallbacks
    return {
      fullName: details.fullName || "",
      email: details.email || "",
      phone: details.phone || "",
      address: finalAddress || details.address || "",
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || "",
      country: details.country || "India",
    };
  };

  const isFormValid = () => {
    const currentDetails = getCurrentShippingDetails();
    return (
      currentDetails.fullName &&
      currentDetails.email &&
      currentDetails.phone &&
      currentDetails.address &&
      currentDetails.city &&
      currentDetails.pincode
    );
  };

  // Calculate totals based on purchase type
  const getOrderTotals = () => {
    if (isDirectPurchase) {
      const subtotal = directPurchaseItem.price * directPurchaseItem.quantity;
      const deliveryFee = subtotal >= 999 ? 0 : 50;
      const protectPromiseFee = directPurchaseItem.quantity * 9;
      const finalTotal = subtotal + protectPromiseFee + deliveryFee;

      return {
        subtotal,
        deliveryFee,
        protectPromiseFee,
        finalTotal,
      };
    } else {
      // Add null check for userCart
      if (!userCart) {
        return {
          subtotal: 0,
          deliveryFee: 0,
          protectPromiseFee: 0,
          finalTotal: 0,
        };
      }

      const deliveryFee = userCart.totalPrice >= 999 ? 0 : 50;
      const finalTotal =
        userCart.totalPrice + userCart.totalItems * 9 + deliveryFee;

      return {
        subtotal: userCart.totalPrice,
        deliveryFee,
        protectPromiseFee: userCart.totalItems * 9,
        finalTotal,
      };
    }
  };

  // Only calculate totals if we have the necessary data
  const orderTotals =
    !isDirectPurchase && !userCart
      ? { subtotal: 0, deliveryFee: 0, protectPromiseFee: 0, finalTotal: 0 }
      : getOrderTotals();

  const { subtotal, deliveryFee, protectPromiseFee, finalTotal } = orderTotals;

  // Hybrid payment calculations (20% upfront, 5% discount)
  const hybridDiscount = Math.round(finalTotal * 0.05); // 5% discount
  const hybridFinalTotal = finalTotal - hybridDiscount;
  const hybridUpfrontAmount = Math.round(hybridFinalTotal * 0.20); // 20% upfront via Razorpay
  const hybridCodAmount = hybridFinalTotal - hybridUpfrontAmount; // Rest via COD

  // if (!isLoggedIn) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-3">
  //       <motion.div
  //         initial={{ opacity: 0, y: 20 }}
  //         animate={{ opacity: 1, y: 0 }}
  //         className="text-center space-y-4 max-w-sm mx-auto"
  //       >
  //         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
  //           <Lock className="w-8 h-8 text-gray-600" />
  //         </div>
  //         <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
  //         <p className="text-sm text-gray-600">
  //           Please login to proceed with checkout.
  //         </p>
  //         <button
  //           onClick={() => router.push("/login")}
  //           className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
  //         >
  //           Login
  //         </button>
  //       </motion.div>
  //     </div>
  //   );
  // }

  // Check if we have items to checkout
  if (
    !isDirectPurchase &&
    (!userCart || !userCart.items || userCart.items.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm mx-auto"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Cart is Empty</h2>
          <p className="text-sm text-gray-600">
            Please add items to your cart before checkout.
          </p>
          <button
            onClick={() => router.push("/cart")}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Cart
          </button>
        </motion.div>
      </div>
    );
  }

  // Check if direct purchase data is valid
  if (isDirectPurchase && !directPurchaseItem?.productId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm mx-auto"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid Purchase</h2>
          <p className="text-sm text-gray-600">
            Product information is missing. Please try again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Show loading state while cart data is loading
  if (!isDirectPurchase && !userCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm mx-auto"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Loading Cart...</h2>
          <p className="text-sm text-gray-600">
            Please wait while we load your cart items.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" style={{ fontWeight: 500 }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-20">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 text-black lg:w-5 lg:h-5 mr-1.5 lg:mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm hidden text-black sm:inline">
                Back
              </span>
            </motion.button>

            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 flex justify-center items-center space-x-1.5 lg:space-x-2">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7" />
              <span className="hidden sm:inline">Checkout</span>
              <span className="sm:hidden">Checkout</span>
            </h1>

            <div className="w-16 lg:w-20"></div>
          </div>
        </div>
      </motion.header>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-16 lg:top-20 left-1/2 transform -translate-x-1/2 z-50 mx-3 max-w-xs w-full"
          >
            <div className="bg-gray-900 text-white px-3 py-2.5 rounded-lg shadow-2xl border border-gray-700 flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="font-medium text-sm">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-1 lg:px-8 py-1 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-3 lg:p-6 shadow-lg"
            >
              {/* Direct Purchase Notice */}
              {isDirectPurchase && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4  border border-yellow-500 rounded-xl"
                >
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">
                      Direct Purchase - This item will be processed separately
                      from your cart
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Shipping Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="md:w-12 md:h-12 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Truck className="md:w-6 md:h-6 h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                      Shipping Details
                    </h2>
                    <p className="text-gray-600 text-sm md:text-lg">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                {/* Address Selection */}
                <div className="md:bg-white md:border md:border-gray-50 rounded-lg md:p-4 p-1 mb-4 md:shadow-sm sm:rounded-xl sm:p-6 sm:mb-6">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Delivery Address
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Default Address */}
                    {/* Conditional Address Section - Only shows if user is logged in */}
                    {me ? (
                      <label
                        onClick={() => handleAddressToggle(true)}
                        className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${useDefaultAddress
                          ? "border-gray-900 bg-gray-100 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                          }`}
                      >
                        {/* Radio */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${useDefaultAddress
                              ? "border-gray-50 bg-gray-900"
                              : "border-gray-300"
                              }`}
                          >
                            {useDefaultAddress && (
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Icon + Text */}
                        <div className="flex items-center space-x-2">
                          <Home className="w-5 h-5 text-gray-700" />
                          <div>
                            <p className="font-semibold text-sm sm:text-lg">
                              Deliver to Default Address
                            </p>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {me?.address?.fullAddress ||
                                me?.address ||
                                "No default address set"}
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      // Disabled state when not logged in
                      <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed">
                        {/* Radio */}
                        <div className="flex-shrink-0">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300" />
                        </div>

                        {/* Icon + Text */}
                        <div className="flex items-center space-x-2">
                          <Home className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-semibold text-sm sm:text-lg text-gray-400">
                              Deliver to Default Address
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              Please log in to use default address
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Address */}
                    <label
                      onClick={() => handleAddressToggle(false)}
                      className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${!useDefaultAddress
                        ? "border-gray-900 bg-gray-100 shadow-md"
                        : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      {/* Radio */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${!useDefaultAddress
                            ? "border-gray-900 bg-gray-900"
                            : "border-gray-300"
                            }`}
                        >
                          {!useDefaultAddress && (
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Icon + Text */}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-gray-700" />
                        <div>
                          <p className="font-semibold text-sm sm:text-lg">
                            Deliver to Another Address
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            Enter a different delivery address
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Address Form – Only Show if Custom */}
                <AnimatePresence>
                  {!useDefaultAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                        opacity: { duration: 0.3 },
                        height: { duration: 0.4 },
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 sm:gap-4 sm:mt-6 overflow-hidden"
                    >
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={getCurrentShippingDetails().fullName}
                          onChange={(e) =>
                            handleInputChange("fullName", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={getCurrentShippingDetails().email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="Enter your email address"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={getCurrentShippingDetails().phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="10 digits"
                        />
                      </div>

                      {/* Country (disabled) */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={getCurrentShippingDetails().country}
                          disabled
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl bg-gray-50 text-gray-600 text-xs sm:text-base"
                        />
                      </div>

                      {/* House/Flat Number */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          House/Flat No. *
                        </label>
                        <input
                          type="text"
                          value={useDefaultAddress ? shippingDetails.houseNo : customAddress.houseNo}
                          onChange={(e) =>
                            handleInputChange("houseNo", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="e.g., 123, A-45, Flat 301"
                        />
                      </div>

                      {/* Street/Area */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Street/Area *
                        </label>
                        <input
                          type="text"
                          value={useDefaultAddress ? shippingDetails.street : customAddress.street}
                          onChange={(e) =>
                            handleInputChange("street", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="e.g., MG Road, Sector 5"
                        />
                      </div>

                      {/* Landmark */}
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={useDefaultAddress ? shippingDetails.landmark : customAddress.landmark}
                          onChange={(e) =>
                            handleInputChange("landmark", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="e.g., Near City Mall, Opposite Park"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={getCurrentShippingDetails().city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="Enter your city name"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={getCurrentShippingDetails().state}
                          onChange={(e) =>
                            handleInputChange("state", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="Enter your state name"
                        />
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={getCurrentShippingDetails().pincode}
                          onChange={(e) =>
                            handleInputChange("pincode", e.target.value)
                          }
                          className="w-full px-2 py-2 sm:px-4 sm:py-3 border border-gray-200 sm:border-2 rounded-lg sm:rounded-xl focus:ring-1 sm:focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-xs sm:text-base"
                          placeholder="Enter 6-digit pincode"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment Method Selection */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        Payment Method
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-lg">
                        Choose how you want to pay
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Hybrid Payment Option - FIRST - 20% Online + COD with 5% Discount */}
                    <div
                      onClick={() => setSelectedPaymentMethod("hybrid")}
                      className={`relative flex items-center space-x-2 sm:space-x-4 p-2.5 pl-3 pr-2 sm:p-5 border-2 rounded-xl transition-all cursor-pointer ${selectedPaymentMethod === "hybrid" ? "border-green-500 bg-green-500/0 shadow-md shadow-green-100" : "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400"}`}
                    >
                      {/* Best Value Badge */}
                      <div className="absolute -top-2 sm:-top-2.5 left-3 sm:left-4 bg-green-500 text-white text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 rounded-full flex items-center gap-1">
                        <span></span> RECOMMENDED - SAVE 5%
                      </div>
                      <input
                        type="radio"
                        id="hybrid"
                        name="paymentMethod"
                        value="hybrid"
                        checked={selectedPaymentMethod === "hybrid"}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 border-green-300 focus:ring-green-500 flex-shrink-0"
                        style={{ accentColor: "#22C55E" }}
                      />
                      <label
                        htmlFor="hybrid"
                        className="flex items-center space-x-2 sm:space-x-4 cursor-pointer w-full"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="relative">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-700 absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm sm:text-lg text-gray-900 block">
                            Pay 20% Now + COD
                          </span>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            ₹{hybridUpfrontAmount} now, ₹{hybridCodAmount} on delivery
                          </p>
                          <p className="text-green-600 text-xs sm:text-sm font-semibold">
                            You save ₹{hybridDiscount} • Total: ₹{hybridFinalTotal}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Other Payment Methods */}
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-1">— or pay full amount —</p>

                    {/* UPI Option */}
                    <div
                      onClick={() => handlePaymentMethodChange("upi")}
                      className={`flex items-center space-x-3 sm:space-x-4 p-2 pl-4 sm:p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer ${selectedPaymentMethod === "upi" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        id="upi"
                        name="paymentMethod"
                        value="upi"
                        checked={selectedPaymentMethod === "upi"}
                        onChange={() => { }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 border-gray-300 focus:ring-gray-500"
                        style={{ accentColor: "#4B5563" }}
                      />
                      <label
                        htmlFor="upi"
                        className="flex items-center space-x-3 sm:space-x-4 cursor-pointer w-full"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm sm:text-lg text-gray-900">UPI</span>
                          <p className="text-gray-500 text-xs sm:text-sm">Pay instantly using UPI apps</p>
                        </div>
                      </label>
                    </div>

                    {/* Card Option */}
                    <div
                      onClick={() => handlePaymentMethodChange("card")}
                      className={`flex items-center space-x-3 sm:space-x-4 p-2 pl-4 sm:p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer ${selectedPaymentMethod === "card" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        id="card"
                        name="paymentMethod"
                        value="card"
                        checked={selectedPaymentMethod === "card"}
                        onChange={() => { }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 border-gray-300 focus:ring-gray-500"
                        style={{ accentColor: "#4B5563" }}
                      />
                      <label
                        htmlFor="card"
                        className="flex items-center space-x-3 sm:space-x-4 cursor-pointer w-full"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm sm:text-lg text-gray-900">Card</span>
                          <p className="text-gray-500 text-xs sm:text-sm">Credit / Debit Card</p>
                        </div>
                      </label>
                    </div>

                    {/* Net Banking Option */}
                    <div
                      onClick={() => handlePaymentMethodChange("netbanking")}
                      className={`flex items-center space-x-3 sm:space-x-4 p-2 pl-4 sm:p-5 border-2 rounded-xl transition-all duration-300 cursor-pointer ${selectedPaymentMethod === "netbanking" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        id="netbanking"
                        name="paymentMethod"
                        value="netbanking"
                        checked={selectedPaymentMethod === "netbanking"}
                        onChange={() => { }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 border-gray-300 focus:ring-gray-500"
                        style={{ accentColor: "#4B5563" }}
                      />
                      <label
                        htmlFor="netbanking"
                        className="flex items-center space-x-3 sm:space-x-4 cursor-pointer w-full"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm sm:text-lg text-gray-900">Net Banking</span>
                          <p className="text-gray-500 text-xs sm:text-sm">Pay through your bank</p>
                        </div>
                      </label>
                    </div>
                    
                    {/* COD Option */}
                    <div
                      onClick={() => handlePaymentMethodChange("cod")}
                      className={`flex items-center space-x-3 sm:space-x-4 p-2 pl-4 sm:p-5 border-2 rounded-xl transition-all cursor-pointer ${selectedPaymentMethod === "cod" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={selectedPaymentMethod === "cod"}
                        onChange={() => { }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 border-gray-300 focus:ring-gray-500"
                        style={{ accentColor: "#000000" }}
                      />
                      <label
                        htmlFor="cod"
                        className="flex items-center space-x-3 sm:space-x-4 cursor-pointer w-full"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm sm:text-lg text-gray-900">Cash on Delivery</span>
                          <p className="text-gray-500 text-xs sm:text-sm">Pay when you receive</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Debug Section - Remove this after debugging */}

                {/* Stock Validation Warning */}

                {/* Security Badge */}

                {/* Navigation Buttons */}
                <div className="flex ab w-full justify-center sm:justify-end pt-6">
                  <button
                    onClick={handlePayment}
                    disabled={
                      !isFormValid() ||
                      isProcessing ||
                      (!cartProducts && !isDirectPurchase) ||
                      (isDirectPurchase && !directPurchaseProduct)
                    }
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gray-900 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md sm:shadow-lg flex items-center justify-center space-x-2 sm:space-x-3"
                  >
                    {(!cartProducts && !isDirectPurchase) ||
                      (isDirectPurchase && !directPurchaseProduct) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Proceed to Pay</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Navigation Buttons - Removed since step 2 is final */}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm"
            >
              {/* Header with Price Details and Collapsible Icon */}
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                  Price Details
                </h3>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Dashed Separator Line */}
              <div className="border-t border-dashed border-gray-300 mb-3 lg:mb-4"></div>

              {/* Price Breakdown */}
              <div className="space-y-3 lg:space-y-4">
                {/* Price (1 item) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm lg:text-base font-bold text-gray-700">
                      Price
                    </span>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-bold">i</span>
                    </div>
                  </div>
                  <span className="text-sm lg:text-base font-bold text-gray-900">
                    ₹{(subtotal * 1.2).toFixed(2)}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between">
                  <span className="text-sm lg:text-base font-bold text-gray-700">
                    Discount{" "}
                  </span>
                  <span className="text-sm lg:text-base font-bold text-green-600">
                    - ₹{(subtotal * 0.24).toFixed(2)}
                  </span>
                </div>

                {/* Coupons for you */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm lg:text-base font-bold text-gray-700">
                      Coupons
                    </span>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-bold">i</span>
                    </div>
                  </div>
                  <span className="text-sm lg:text-base font-bold text-gray-500">
                    No coupons available for now
                  </span>
                </div>

                {/* Protect Promise Fee */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm lg:text-base font-bold text-gray-700">
                      Protect Promise Fee
                    </span>
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-bold">i</span>
                    </div>
                  </div>
                  <span className="text-sm lg:text-base font-bold text-gray-900">
                    ₹{protectPromiseFee.toFixed(2)}
                  </span>
                </div>

                {/* Delivery Fee */}
                <div className="flex items-center justify-between">
                  <span className="text-sm lg:text-base font-bold text-gray-700">
                    Delivery Fee
                  </span>
                  <span
                    className={`text-sm lg:text-base font-bold ${deliveryFee === 0 ? "text-green-600" : "text-gray-900"}`}
                  >
                    {deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                {/* Dashed Separator Line */}
                <div className="border-t border-dashed border-gray-300 pt-3 lg:pt-4"></div>

                {/* Total Amount */}
                <div className="flex items-center justify-between pt-2 lg:pt-3">
                  <span className="text-base lg:text-lg font-bold text-gray-900">
                    Total Amount
                  </span>
                  <span className="text-base lg:text-lg font-bold text-gray-900">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Savings Banner */}
              <div className="mt-4 lg:mt-6 bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs lg:text-sm">
                      %
                    </span>
                  </div>
                  <span className="text-sm lg:text-base font-bold text-green-800">
                    You saved ₹{(subtotal * 0.24).toFixed(2)} on this order!
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Miss 5% Discount Prompt Modal */}
      <AnimatePresence>
        {showMissDiscountPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMissDiscountPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-black p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2">😮</div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Wait! Are you sure?</h2>
                <p className="text-amber-100 text-xs sm:text-sm mt-1">You're about to miss out on savings!</p>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 text-center">
                <div className="bg-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-800 font-semibold text-sm sm:text-base mb-1">
                    With Hybrid Payment you save
                  </p>
                  <p className="text-green-600 font-bold text-2xl sm:text-3xl">
                    ₹{hybridDiscount}
                  </p>
                  <p className="text-green-700 text-xs sm:text-sm mt-1">
                    Pay only ₹{hybridUpfrontAmount} now, rest on delivery
                  </p>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Switch to hybrid payment and get <span className="font-bold text-green-600">5% OFF</span> on your order!
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-6 pt-0 flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowMissDiscountPrompt(false);
                    setSelectedPaymentMethod("hybrid");
                    setPendingPaymentMethod(null);
                  }}
                  className="w-full px-4 py-3 bg-black text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🎉</span> Yes! Give me 5% OFF
                </button>
                <button
                  onClick={confirmSwitchPayment}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCODConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            >
              {/* Header - Compact on mobile */}
              <div className="sticky top-0 bg-black text-white p-3 sm:p-6 rounded-t-2xl">
                <h2 className="text-base sm:text-2xl font-bold">Confirm Order</h2>
                <p className="text-gray-300 text-[10px] sm:text-sm">Review your order details</p>
              </div>

              {/* Content - Compact on mobile */}
              <div className="p-2.5 sm:p-6 space-y-3 sm:space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="text-xs sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-3 flex items-center">
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Items
                  </h3>
                  <div className="space-y-1.5 sm:space-y-3 max-h-28 sm:max-h-48 overflow-y-auto">
                    {(isDirectPurchase ? [directPurchaseItem] : userCart?.items || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 sm:p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.productImage || item.image}
                          alt={item.productName || item.name}
                          className="w-9 h-9 sm:w-16 sm:h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-[10px] sm:text-base truncate">{item.productName || item.name}</p>
                          <p className="text-[9px] sm:text-sm text-gray-500">{item.size} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-[10px] sm:text-base">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address - Compact */}
                <div>
                  <h3 className="text-xs sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Delivery
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
                    <p className="font-medium text-gray-800 text-[10px] sm:text-base">{getCurrentShippingDetails().fullName}</p>
                    <p className="text-[9px] sm:text-sm text-gray-500">{getCurrentShippingDetails().phone}</p>
                    <p className="text-[9px] sm:text-sm text-gray-600 truncate mt-1">
                      {getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}
                    </p>
                  </div>
                </div>

                {/* Payment Method - Compact */}
                <div className="bg- border border-gray-200 rounded-lg p-2 sm:p-4 flex items-center">
                  <Truck className="w-5 h-5 sm:w-8 sm:h-8 text-gray-600 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-base">Cash on Delivery</p>
                    <p className="text-[9px] sm:text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </div>

                {/* Order Summary - Compact */}
                <div className="bg-gray-50 rounded-lg p-2.5 sm:p-4">
                  <div className="flex justify-between text-[10px] sm:text-sm mb-1 sm:mb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-sm mb-1 sm:mb-2">
                    <span className="text-gray-500">Delivery</span>
                    <span className="text-gray-700">{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 sm:pt-2 flex justify-between">
                    <span className="font-bold text-gray-900 text-xs sm:text-base">Total</span>
                    <span className="font-bold text-gray-900 text-sm sm:text-lg">₹{finalTotal}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Compact */}
              <div className="sticky bottom-0 bg-white p-2.5 sm:p-6 rounded-b-2xl border-t border-gray-200 flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowCODConfirmation(false)}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-base font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCODConfirmation}
                  disabled={isProcessing}
                  className="flex-[2] sm:flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span>Confirm Order</span>
                    </>
                  )}
                </button>
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
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHybridConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            >
              {/* Header - Compact on mobile */}
              <div className="sticky top-0 bg-black text-white p-3 sm:p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-2xl font-bold">Hybrid Payment</h2>
                    <p className="text-green-300 text-[10px] sm:text-sm">20% now + rest on delivery</p>
                  </div>
                  <div className="bg-g00 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                    <span className="text-[10px] text-green-400 sm:text-sm font-bold">5% OFF</span>
                  </div>
                </div>
              </div>

              {/* Content - Compact on mobile */}
              <div className="p-2.5 sm:p-6 space-y-3 sm:space-y-6">
                {/* Savings Highlight - Compact */}
                <div className="bg-g border border-green-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                  <div className="flex items-center justify-between text-xs sm:text-base mb-1.5 sm:mb-3">
                    <span className="text-gray-600">Original</span>
                    <span className="text-gray-400 line-through">₹{finalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-base mb-1.5 sm:mb-3">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600 font-semibold">-₹{hybridDiscount}</span>
                  </div>
                  <div className="border-t border-green-200 pt-1.5 sm:pt-3 flex items-center justify-between">
                    <span className="text-gray-900 font-bold text-sm sm:text-lg">Final</span>
                    <span className="text-green-600 font-bold text-base sm:text-xl">₹{hybridFinalTotal}</span>
                  </div>
                </div>

                {/* Payment Breakdown - Compact */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <CreditCard className="w-5 h-5 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-sm text-gray-500">Pay Now</p>
                    <p className="text-sm sm:text-2xl font-bold text-green-600">₹{hybridUpfrontAmount}</p>
                    <p className="text-[9px] sm:text-xs text-gray-400">Razorpay</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <Truck className="w-5 h-5 sm:w-8 sm:h-8 text-amber-500 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-sm text-gray-500">On Delivery</p>
                    <p className="text-sm sm:text-2xl font-bold text-amber-600">₹{hybridCodAmount}</p>
                    <p className="text-[9px] sm:text-xs text-gray-400">Cash/UPI</p>
                  </div>
                </div>

                {/* Order Items - Compact */}
                <div>
                  <h3 className="text-xs sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-3 flex items-center">
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Items
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 max-h-24 sm:max-h-40 overflow-y-auto">
                    {(isDirectPurchase ? [directPurchaseItem] : userCart?.items || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 sm:p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.productImage || item.image}
                          alt={item.productName || item.name}
                          className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-[10px] sm:text-sm truncate">{item.productName || item.name}</p>
                          <p className="text-[9px] sm:text-xs text-gray-500">{item.size} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-[10px] sm:text-sm">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address - Compact */}
                <div>
                  <h3 className="text-xs sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center">
                    <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    Delivery
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-[10px] sm:text-sm text-gray-600">
                    <p className="font-medium text-gray-800">{getCurrentShippingDetails().fullName}</p>
                    <p className="truncate">{getCurrentShippingDetails().address}, {getCurrentShippingDetails().city} - {getCurrentShippingDetails().pincode}</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Compact on mobile */}
              <div className="sticky bottom-0 bg-white p-2.5 sm:p-6 rounded-b-2xl border-t border-gray-200 flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowHybridConfirmation(false)}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-base font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex-[2] sm:flex-1 relative">
                  {/* Traveling light border effect */}
                  <style jsx>{`
                    @keyframes borderTravel {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                    .traveling-border {
                      background: linear-gradient(90deg, 
                        transparent 0%, transparent 35%, 
                        #22c55e 45%, #4ade80 50%, #22c55e 55%, 
                        transparent 65%, transparent 100%
                      );
                      background-size: 300% 100%;
                      animation: borderTravel 1.5s linear infinite;
                    }
                  `}</style>
                  <div className="absolute -inset-0.5 sm:-inset-1 rounded-lg sm:rounded-xl bg-green-500/20 blur-sm sm:blur-md"></div>
                  <div className="absolute -inset-[2px] rounded-lg sm:rounded-xl traveling-border"></div>
                  <div className="absolute -inset-[1px] rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500/40 via-emerald-400/40 to-green-500/40"></div>
                  <button
                    onClick={handleHybridPayment}
                    disabled={isProcessing}
                    className="relative w-full px-3 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>Pay ₹{hybridUpfrontAmount}</span>
                      </>
                    )}
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
