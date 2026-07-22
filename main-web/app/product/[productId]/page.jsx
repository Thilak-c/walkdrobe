"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/hooks/useGuestCart";
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Check,
  X,
  ZoomIn,
  Ruler,
  Footprints,
  ChevronLeft,
  ChevronRight,
  Share2,
  Lock,
} from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import EmailOtpModal from "@/components/EmailOtpModal";
import SizeChart from "@/components/SizeChart";
import Footer from "@/components/home/Footer";
import React from "react";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { productId } = params;

  const { addToGuestCart } = useGuestCart();
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Modals & UI States
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpReturnUrl, setOtpReturnUrl] = useState(null);
  const [showFloatingBuyBar, setShowFloatingBuyBar] = useState(false);
  const [pulseSizeSelector, setPulseSizeSelector] = useState(false);

  // Directional Slide State & Handlers for Smooth Carousel
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    const nextImage = selectedImage + newDirection;
    if (nextImage >= 0 && nextImage < allImages.length) {
      setPage([nextImage, newDirection]);
      setSelectedImage(nextImage);
    }
  };

  const handleSelectThumbnail = (idx) => {
    const dir = idx > selectedImage ? 1 : -1;
    setPage([idx, dir]);
    setSelectedImage(idx);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "100%" : dir < 0 ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? "100%" : dir > 0 ? "-100%" : 0,
      opacity: 0,
    }),
  };

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Review Form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    size: "",
    recommend: true,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Scroll to top on mount / productId change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  // Read session token
  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  useEffect(() => {
    if (me) setIsLoggedIn(true);
    else if (token && !me) setIsLoggedIn(false);
  }, [me, token]);

  // Floating buy bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowFloatingBuyBar(true);
      } else {
        setShowFloatingBuyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch product data
  let product, productError = null;
  try {
    product = useQuery(api.products.getProductById, productId ? { productId } : "skip");
  } catch (err) {
    productError = err;
  }

  useEffect(() => {
    if (productError) {
      setIsLoading(false);
      setError("Product not found");
    } else if (product !== undefined) {
      setIsLoading(false);
      if (!product) setError("Product not found");
    }
  }, [product, productError]);

  // Wishlist Status
  const wishlistStatus = useQuery(
    api.wishlist.isProductWishlisted,
    me && productId ? { userId: me._id, productId } : "skip"
  );

  useEffect(() => {
    if (wishlistStatus) setIsWishlisted(wishlistStatus.isWishlisted);
  }, [wishlistStatus]);

  // Related & Reviews Queries
  const reviews = useQuery(api.reviews.getProductReviews, productId ? { productId } : "skip");
  const reviewStats = useQuery(api.reviews.getProductReviewStats, productId ? { productId } : "skip");
  const relatedProducts = useQuery(
    api.products.getRelatedProducts,
    product && productId
      ? { productId, category: product.category, price: product.price, limit: 4 }
      : "skip"
  );

  // Mutations
  const addReviewMutation = useMutation(api.reviews.addReview);
  const addToCartMutation = useMutation(api.cart.addToCart);
  const toggleWishlistMutation = useMutation(api.wishlist.toggleWishlist);
  const addViewMutation = useMutation(api.views.addView);
  const addRecentlyViewedMutation = useMutation(api.products.addRecentlyViewed);

  // Log product view
  useEffect(() => {
    if (product) {
      const sessionId =
        sessionStorage.getItem("sessionId") ||
        (() => {
          const id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
          sessionStorage.setItem("sessionId", id);
          return id;
        })();
      const viewData = {
        productId: product.itemId,
        viewedAt: new Date().toISOString(),
        sessionId,
        viewType: "product_page",
        category: product.category,
      };
      if (me?._id) viewData.userId = me._id;
      addViewMutation(viewData).catch(console.error);
    }
  }, [product, me, addViewMutation]);

  // Add to recently viewed
  useEffect(() => {
    if (product && me) {
      addRecentlyViewedMutation({
        userId: me._id,
        productId,
        productName: product.name,
        productImage: product.mainImage,
        productPrice: product.price,
        productCategory: product.category,
      }).catch(console.error);
    }
  }, [product, me, productId, addRecentlyViewedMutation]);

  const showToastMsg = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSelectSizeClick = () => {
    const sizeSelector = document.getElementById("size-selector-grid");
    if (sizeSelector) {
      sizeSelector.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulseSizeSelector(true);
      setTimeout(() => setPulseSizeSelector(false), 2000);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      showToastMsg("Please select your size first");
      handleSelectSizeClick();
      return;
    }
    if (!product) return;

    if (!isLoggedIn || !me) {
      addToGuestCart({
        productId: product.itemId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        size: selectedSize,
        quantity,
        category: product.category,
        brand: product.brand,
      });
      showToastMsg("Added to cart!");
      return;
    }

    try {
      await addToCartMutation({
        userId: me._id,
        productId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        size: selectedSize,
        quantity,
      });
      showToastMsg("Added to cart!");
    } catch {
      showToastMsg("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      showToastMsg("Please select your size first");
      handleSelectSizeClick();
      return;
    }
    if (!product) return;

    const queryParams = new URLSearchParams({
      productId,
      productName: product.name,
      productImage: product.mainImage,
      price: product.price.toString(),
      size: selectedSize,
      quantity: quantity.toString(),
      category: product.category || "",
      brand: product.brand || "",
      action: "buyNow",
    });

    const checkoutUrl = `/checkout?${queryParams.toString()}`;

    if (!isLoggedIn || !me) {
      addToGuestCart({
        productId: product.itemId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        size: selectedSize,
        quantity,
        category: product.category,
        brand: product.brand,
      });
      router.push(checkoutUrl);
      return;
    }

    router.push(checkoutUrl);
  };

  const handleWishlistToggle = async () => {
    if (!isLoggedIn || !me) {
      showToastMsg("Please login to save items");
      return;
    }
    if (!product) return;
    setIsWishlisting(true);
    try {
      const result = await toggleWishlistMutation({
        userId: me._id,
        productId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        category: product.category,
      });
      if (result.success) {
        setIsWishlisted(result.isWishlisted);
        showToastMsg(result.message);
      }
    } catch (err) {
      showToastMsg(err.message || "Failed to update wishlist");
    } finally {
      setIsWishlisting(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !me) return;
    if (!reviewForm.comment.trim()) {
      showToastMsg("Please enter a review comment");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addReviewMutation({
        productId,
        userId: me._id,
        userName: me.name || "Anonymous Customer",
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
        size: reviewForm.size || selectedSize || "",
        recommend: reviewForm.recommend,
      });
      setReviewForm({ rating: 5, title: "", comment: "", size: "", recommend: true });
      showToastMsg("Review submitted successfully!");
    } catch (err) {
      showToastMsg(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-gray-400 font-inter font-semibold">
          Loading Product...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Footprints className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-serif text-gray-900 font-light">Product Not Found</h2>
          <p className="text-gray-500 text-xs font-inter leading-relaxed">
            The shoe item you requested ({productId}) is unavailable or has been updated.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/shop"
              className="px-6 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider font-inter hover:bg-black transition-colors"
            >
              Browse Shop
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider font-inter hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate discount & price
  const discount = product.discount || 24;
  const originalPrice = product.originalPrice || Math.round(product.price / (1 - discount / 100));
  const allImages = [product.mainImage, ...(product.otherImages || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white font-inter text-gray-900 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-bold tracking-wider px-6 py-3 rounded-none shadow-xl border border-white/20 uppercase font-inter"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbars */}
      <div className="xl:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      {/* Main Content Area */}
      <main className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-gray-400 mb-6 font-inter">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link href={`/categories/${(product.category || "sports").toLowerCase()}`} className="hover:text-gray-900 transition-colors capitalize">
              {product.category || "Footwear"}
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Product Hero Grid (Left: Image Showcase | Right: Specs & Actions) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Gallery & Showcase (Sticky on Desktop) */}
            <div className="lg:col-span-7 lg:sticky lg:top-36">
              
              {/* Main Image Display Box with Smooth Directional Slide & Physics Drag */}
              <div className="relative aspect-[4/5] bg-gray-100/70 overflow-hidden group rounded-xs mb-4 touch-pan-y flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
                    key={selectedImage}
                    src={allImages[selectedImage] || product.mainImage}
                    alt={product.name}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      if (offset.x < -40 || swipe < -200) {
                        paginate(1);
                      } else if (offset.x > 40 || swipe > 200) {
                        paginate(-1);
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing select-none"
                  />
                </AnimatePresence>

                {/* Image Counter Badge */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-neutral-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs font-inter z-10 pointer-events-none">
                    {selectedImage + 1} / {allImages.length}
                  </div>
                )}

                {/* Zoom Preview Overlay Button */}
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-md text-gray-700 hover:text-black transition-transform hover:scale-110 z-10 cursor-pointer"
                  title="View Fullscreen"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnails Rail */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar scrollbar-none">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectThumbnail(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 bg-gray-100 border overflow-hidden rounded-xs transition-all duration-200 ${
                        selectedImage === idx
                          ? "border-neutral-900 ring-1 ring-neutral-900 opacity-100"
                          : "border-gray-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Product Info & Purchase Form */}
            <div className="lg:col-span-5 flex flex-col text-left">
              
              {/* Category & Item ID */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 font-inter">
                  {product.category || "Footwear"} • {product.itemId}
                </span>
                {reviewStats?.averageRating > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{reviewStats.averageRating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({reviews?.length || 0})</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-gray-900 font-light tracking-wide leading-tight mb-4">
                {product.name}
              </h1>

              {/* Price & Offer Box */}
              <div className="flex items-baseline gap-3 pb-3">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-inter">
                  ₹{product.price?.toLocaleString()}
                </span>
                {originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-gray-400 line-through font-inter">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase font-inter">
                  Save ₹{(originalPrice - product.price).toLocaleString()}
                </span>
              </div>

              {/* Minimalist Trust Features (Directly Below Price) */}
              <div className="grid grid-cols-3 gap-2 py-3.5 my-4 border-y border-gray-100 font-inter">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <span>100% Authentic</span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate">Verified Quality</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                    <Truck className="w-4 h-4 text-blue-800 flex-shrink-0" />
                    <span>Fast Shipping</span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate">All-India Delivery</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                    <RotateCcw className="w-4 h-4 text-amber-800 flex-shrink-0" />
                    <span>Easy Return</span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate">Hassle Free</span>
                </div>
              </div>

              {/* Size Selection Grid */}
              <div className="mb-6" id="size-selector-grid">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 font-inter">
                    Select Size (UK/IN) <span className="text-red-500">*</span>
                  </span>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-black underline underline-offset-4 transition-colors font-inter"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>

                {/* Size Chips */}
                <div
                  className={`grid grid-cols-4 sm:grid-cols-5 gap-2.5 transition-all duration-300 ${
                    pulseSizeSelector ? "ring-2 ring-red-500 p-1 rounded-xs" : ""
                  }`}
                >
                  {(product.availableSizes || ["6", "7", "8", "9", "10"]).map((sz) => {
                    const isSelected = selectedSize === sz;
                    const stock = product.sizeStock?.[sz];
                    const isOutOfStock = stock === 0;

                    return (
                      <button
                        key={sz}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-3 rounded-xs text-xs font-bold tracking-wider font-inter transition-all duration-200 relative ${
                          isOutOfStock
                            ? "bg-gray-100 text-gray-300 line-through cursor-not-allowed border border-gray-200"
                            : isSelected
                            ? "bg-neutral-900 text-white border border-neutral-900 shadow-xs"
                            : "bg-white text-gray-900 border border-gray-200 hover:border-neutral-900"
                        }`}
                      >
                        UK {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector & Wishlist */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-200 rounded-xs bg-gray-50 h-11">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 h-full flex items-center justify-center text-gray-600 hover:text-black transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-bold text-gray-900 font-inter">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 h-full flex items-center justify-center text-gray-600 hover:text-black transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlisting}
                  className={`h-11 px-4 border rounded-xs flex items-center justify-center gap-2 transition-colors duration-200 text-xs font-semibold font-inter ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
                  <span>{isWishlisted ? "Saved" : "Wishlist"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 font-inter rounded-none shadow-xs"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add To Cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 font-inter rounded-none shadow-xs"
                >
                  <span>Buy Now</span>
                </button>
              </div>

            </div>

          </div>

          {/* Details & Reviews Tabs Section */}
          <div className="mt-16 pt-12 border-t border-gray-100">
            {/* Tab Buttons */}
            <div className="flex items-center justify-center gap-8 border-b border-gray-200/80 pb-4 mb-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "specs", label: "Specifications" },
                { id: "reviews", label: `Reviews (${reviews?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs md:text-sm font-bold uppercase tracking-widest font-inter relative pb-4 transition-colors ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="max-w-4xl mx-auto">
              {activeTab === "overview" && (
                <div className="text-left leading-relaxed text-gray-600 text-xs md:text-sm font-inter space-y-4">
                  <p className="whitespace-pre-line leading-relaxed">
                    {product.description ||
                      "Engineered for daily comfort, performance, and modern streetwear aesthetic. Features premium lightweight materials and responsive cushioning built for maximum durability."}
                  </p>
                </div>
              )}

              {activeTab === "specs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs font-inter">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xs space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Category</span>
                      <span className="font-semibold text-gray-900">{product.category || "Footwear"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Item ID</span>
                      <span className="font-semibold text-gray-900">{product.itemId}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">In Stock</span>
                      <span className="font-semibold text-emerald-600">Yes</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xs space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Upper</span>
                      <span className="font-semibold text-gray-900">Synthetic & Breathable Mesh</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Sole</span>
                      <span className="font-semibold text-gray-900">High-Traction Rubber</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                      <span className="text-gray-500">Fit</span>
                      <span className="font-semibold text-gray-900">True to Size</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-8 text-left">
                  {/* Rating Breakdown Header */}
                  <div className="p-6 bg-gray-50 border border-gray-100 rounded-xs flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <span className="text-4xl font-serif font-bold text-gray-900 block mb-1">
                        {reviewStats?.averageRating?.toFixed(1) || "5.0"}
                      </span>
                      <div className="flex items-center gap-1 justify-center md:justify-start mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-inter">
                        Based on {reviews?.length || 0} customer reviews
                      </span>
                    </div>
                  </div>

                  {/* Add Review Form */}
                  {isLoggedIn ? (
                    <form onSubmit={handleAddReview} className="p-6 bg-gray-50 border border-gray-200 rounded-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 font-inter">
                        Write a Customer Review
                      </h4>

                      <div>
                        <label className="text-xs text-gray-600 block mb-1 font-inter">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setReviewForm((r) => ({ ...r, rating: star }))}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= reviewForm.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Review Title"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm((r) => ({ ...r, title: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-neutral-900 font-inter"
                        />
                      </div>

                      <div>
                        <textarea
                          placeholder="Share details about fit, comfort, and style..."
                          rows={3}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm((r) => ({ ...r, comment: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-neutral-900 font-inter"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors font-inter"
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 text-center text-xs text-gray-500 font-inter">
                      Please sign in to write a product review.
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4 pt-4">
                      {reviews.map((rev) => (
                        <div key={rev._id} className="p-4 border-b border-gray-100 text-left font-inter">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-900">{rev.userName}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          {rev.title && <h5 className="text-xs font-bold text-gray-900 mb-1">{rev.title}</h5>}
                          <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6 font-inter">
                      No customer reviews yet. Be the first to review this product!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products Grid */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-gray-100">
              <div className="text-center mb-10">
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-400 font-inter block mb-1">
                  Recommendations
                </span>
                <h3 className="text-2xl font-serif text-gray-900 font-light">You May Also Like</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relItem) => (
                  <ProductCard
                    key={relItem.itemId}
                    img={relItem.mainImage}
                    name={relItem.name}
                    category={relItem.category}
                    price={relItem.price}
                    productId={relItem.itemId}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Bottom Bar for Mobile Phones */}
      <AnimatePresence>
        {showFloatingBuyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 flex items-center justify-between lg:hidden shadow-lg"
          >
            <div>
              <span className="text-[10px] text-gray-400 font-inter uppercase tracking-wider block">
                {product.itemId}
              </span>
              <span className="text-sm font-bold text-gray-900 font-inter">
                ₹{product.price?.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider font-inter flex items-center gap-2"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add To Cart</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-20 cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Lightbox Arrow */}
          {allImages.length > 1 && selectedImage > 0 && (
            <button
              onClick={() => setSelectedImage((prev) => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20 cursor-pointer"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={allImages[selectedImage] || product.mainImage}
            alt={product.name}
            className="max-w-full max-h-[85vh] object-contain rounded-xs select-none"
          />

          {/* Right Lightbox Arrow */}
          {allImages.length > 1 && selectedImage < allImages.length - 1 && (
            <button
              onClick={() => setSelectedImage((prev) => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20 cursor-pointer"
              aria-label="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Size Chart Modal */}
      <SizeChart isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      {/* Email OTP Modal for Guest Users */}
      <EmailOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        returnUrl={otpReturnUrl}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
