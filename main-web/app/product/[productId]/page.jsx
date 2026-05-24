"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestCart } from "@/hooks/useGuestCart";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Check,
  Clock,
  MapPin,
  Award,
  X,
  Lock,
  ZoomIn,
  History,
  Ruler,
  Footprints,
  Wind,
  Layers,
  Target,
  Activity,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import EmailOtpModal from "@/components/EmailOtpModal";
import { ProductStructuredData, BreadcrumbStructuredData } from "@/components/StructuredData";
import SizeChart, { SIZE_CHART_DATA } from "@/components/SizeChart";
import FooterSimple from "@/components/FooterSimple";
import React from "react";

export default function ProductPage() {
  const [token, setToken] = useState(null);
  const params = useParams();
  const router = useRouter();
  const { productId } = params;
  const { addToGuestCart, getGuestCartSummary } = useGuestCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("reviews");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeSystem, setSizeSystem] = useState("UK");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "", size: "", recommend: true });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpReturnUrl, setOtpReturnUrl] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showFloatingBuyBar, setShowFloatingBuyBar] = useState(false);
  const [pulseSizeSelector, setPulseSizeSelector] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState("reviews");

  const handleSelectSizeClick = () => {
    const sizeSelector = document.getElementById("size-selector-grid");
    if (sizeSelector) {
      sizeSelector.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulseSizeSelector(true);
      setTimeout(() => setPulseSizeSelector(false), 2000);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowFloatingBuyBar(true);
      } else {
        setShowFloatingBuyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [productId]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const updateForm = (field, value) => setReviewForm((prev) => ({ ...prev, [field]: value }));
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  useEffect(() => {
    if (me) setIsLoggedIn(true);
    else if (token && !me) setIsLoggedIn(false);
  }, [me, token]);

  const wishlistStatus = useQuery(api.wishlist.isProductWishlisted, me && productId ? { userId: me._id, productId } : "skip");
  useEffect(() => { if (wishlistStatus) setIsWishlisted(wishlistStatus.isWishlisted); }, [wishlistStatus]);

  const handleClickProduct = (id) => { sessionStorage.setItem("homeScroll", window.scrollY); router.push(`/product/${id}`); };

  const reviews = useQuery(api.reviews.getProductReviews, productId ? { productId } : "skip");
  const reviewStats = useQuery(api.reviews.getProductReviewStats, productId ? { productId } : "skip");
  const addReviewMutation = useMutation(api.reviews.addReview);
  const addToCartMutation = useMutation(api.cart.addToCart);
  const toggleWishlistMutation = useMutation(api.wishlist.toggleWishlist);
  const addViewMutation = useMutation(api.views.addView);
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");

  let product, productError = null;
  try { product = useQuery(api.products.getProductById, productId ? { productId } : "skip"); }
  catch (err) { productError = err; }

  useEffect(() => {
    if (productError) { setIsLoading(false); setError("Product not found"); }
    else if (product !== undefined) { setIsLoading(false); if (!product) setError("Product not found"); }
  }, [product, productError]);

  const trendingProducts = useQuery(api.views.getMostViewedProducts, product?.category ? { limit: 6, category: product.category } : "skip");
  const personalizedProducts = useQuery(api.products.getPersonalizedProducts, me?._id ? { limit: 6, userId: me._id } : "skip");
  const relatedProducts = useQuery(api.products.getRelatedProducts, product && productId ? { productId, category: product.category, price: product.price, limit: 4 } : "skip");
  const recentlyViewed = useQuery(api.products.getRecentlyViewed, me ? { userId: me._id, limit: 6 } : "skip");
  const addRecentlyViewedMutation = useMutation(api.products.addRecentlyViewed);

  useEffect(() => {
    if (product && me) {
      addRecentlyViewedMutation({ userId: me._id, productId, productName: product.name, productImage: product.mainImage, productPrice: product.price, productCategory: product.category }).catch(console.error);
    }
  }, [product, me, productId, addRecentlyViewedMutation]);

  useEffect(() => {
    if (product) {
      const sessionId = sessionStorage.getItem("sessionId") || (() => { const id = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9); sessionStorage.setItem("sessionId", id); return id; })();
      const viewData = { productId: product.itemId, viewedAt: new Date().toISOString(), sessionId, viewType: "product_page", category: product.category };
      if (me?._id) viewData.userId = me._id;
      addViewMutation(viewData).catch(console.error);
    }
  }, [product, productId, me, addViewMutation]);

  const showToastMsg = (msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const handleAddToCart = async () => {
    if (!isLoggedIn || !me) {
      if (!selectedSize) { showToastMsg("Please select your size"); return; }
      if (!product) { showToastMsg("Product not available"); return; }
      // Add to guest cart so user doesn't lose the item, then prompt for OTP to save to account
      addToGuestCart({ productId: product.itemId, productName: product.name, productImage: product.mainImage, price: product.price, size: selectedSize, quantity, category: product.category, brand: product.brand });
      setOtpReturnUrl('/cart');
      setShowOtpModal(true);
      showToastMsg("Added to cart!");
      return;
    }
    if (!selectedSize) { showToastMsg("Please select your size"); return; }
    if (!product) { showToastMsg("Product not available"); return; }
    if (quantity > (product.sizeStock?.[selectedSize] || 0)) { showToastMsg(`Only ${product.sizeStock?.[selectedSize] || 0} pairs available`); return; }
    try {
      await addToCartMutation({ userId: me._id, productId, productName: product.name, productImage: product.mainImage, price: product.price, size: selectedSize, quantity });
      showToastMsg("Added to cart!");
    } catch { showToastMsg("Failed to add to cart"); }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) { showToastMsg("Please select your size"); return; }
    if (!product) { showToastMsg("Product not available"); return; }
    if (selectedSize && product.sizeStock?.[selectedSize] !== undefined && quantity > product.sizeStock[selectedSize]) { showToastMsg(`Only ${product.sizeStock[selectedSize]} pairs available`); return; }
    const params = new URLSearchParams({ productId, productName: product.name, productImage: product.mainImage, price: product.price.toString(), size: selectedSize, quantity: quantity.toString(), category: product.category, brand: product.brand || "", action: "buyNow" });
    const checkoutUrl = `/checkout?${params.toString()}`;
    if (!isLoggedIn || !me) {
      // Open OTP modal and redirect to checkout after verification
      setOtpReturnUrl(checkoutUrl);
      setShowOtpModal(true);
      // Also add to guest cart so checkout has items if user closes modal
      addToGuestCart({ productId: product.itemId, productName: product.name, productImage: product.mainImage, price: product.price, size: selectedSize, quantity, category: product.category, brand: product.brand });
      showToastMsg("sign in");
      return;
    }
    router.push(checkoutUrl);
  };

  const handleWishlistToggle = async () => {
    if (!isLoggedIn || !me) { showToastMsg("Please login to save items"); return; }
    if (!product) return;
    setIsWishlisting(true);
    try {
      const result = await toggleWishlistMutation({ userId: me._id, productId, productName: product.name, productImage: product.mainImage, price: product.price, category: product.category });
      if (result.success) { setIsWishlisted(result.isWishlisted); showToastMsg(result.message); }
    } catch (err) { showToastMsg(err.message || "Failed"); }
    finally { setIsWishlisting(false); }
  };

  const handleAddReview = async () => {
    if (!isLoggedIn || !me) return;
    setIsSubmittingReview(true);
    try {
      await addReviewMutation({ productId, userId: me._id, userName: me.name || "Anonymous", rating: reviewForm.rating, title: reviewForm.title.trim(), comment: reviewForm.comment.trim(), size: reviewForm.size || "", recommend: reviewForm.recommend });
      setReviewForm({ rating: 5, title: "", comment: "", size: "", recommend: true });
      showToastMsg("Review submitted!");
    } catch (err) { showToastMsg(err.message || "Failed"); }
    finally { setIsSubmittingReview(false); }
  };

  const handleTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const total = [product?.mainImage, ...(product?.otherImages || [])].length;
    if (distance > 50 && selectedImage < total - 1) setSelectedImage(selectedImage + 1);
    if (distance < -50 && selectedImage > 0) setSelectedImage(selectedImage - 1);
  };

  const getSizeLabel = (size) => {
    const uk = parseFloat(size);
    if (isNaN(uk)) return size;

    // Try to find the canonical mapping in the shared size chart
    const entry = Array.isArray(SIZE_CHART_DATA)
      ? SIZE_CHART_DATA.find((r) => parseFloat(r.uk) === uk)
      : null;

    // Return object with EU and US sizes for separate styling
    const euSize = entry && entry.euro ? String(entry.euro) : String(Math.round(uk + -34));
    const usSize = entry && entry.us ? String(entry.us) : String(Math.round(uk));
    
    return { eu: euSize, us: usSize };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loader-4"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Footprints className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sneaker Not Found</h2>
          <p className="text-gray-500">This sneaker doesn&apos;t exist or has been removed.</p>
          <Link href="/shop" className="block w-full px-6 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all">Browse Collection</Link>
          <button onClick={() => router.back()} className="block w-full px-6 py-4 text-gray-900 rounded-full font-semibold border border-gray-300 hover:border-gray-900 transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  const allImages = [product?.mainImage, ...(product?.otherImages || [])];
  const tabs = [
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "details", label: "Details", icon: Layers },
    { id: "specs", label: "Specs", icon: Activity },
    { id: "shipping", label: "Shipping", icon: Truck },
  ];

  const renderDetailsContent = (isMobile = false) => (
    <motion.div key="details" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto">
      <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-transparent p-1" : "sm:p-6 shadow-3xs"}`}>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">About This Sneaker</h3>
        <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line font-medium">{product?.description || "No description available."}</p>
      </div>
    </motion.div>
  );

  const renderSpecsContent = (isMobile = false) => (
    <motion.div key="specs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5"><Footprints className="w-4 h-4 text-slate-700" />Construction</h4>
          <div className="space-y-2 text-xs font-medium">
            {[{ label: "Upper Material", value: "Premium Mesh" }, { label: "Sole", value: "Rubber Outsole" }, { label: "Midsole", value: "EVA Foam" }, { label: "Closure", value: "Lace-up" }, { label: "Toe Style", value: "Round Toe" }].map((spec, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-slate-150 last:border-0">
                <span className="text-slate-450">{spec.label}</span>
                <span className="text-slate-800 font-bold">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5"><Activity className="w-4 h-4 text-slate-700" />Performance</h4>
          <div className="space-y-2 text-xs font-medium">
            {[{ label: "Weight", value: "~280g (per shoe)" }, { label: "Cushioning", value: "High Impact" }, { label: "Arch Support", value: "Neutral" }, { label: "Breathability", value: "Excellent" }, { label: "Best For", value: "Casual / Lifestyle" }].map((spec, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-slate-150 last:border-0">
                <span className="text-slate-450">{spec.label}</span>
                <span className="text-slate-800 font-bold">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {product?.availableSizes?.length > 0 && (
        <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">Size Availability</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {product.availableSizes.map((size) => {
              const stock = product.sizeStock?.[size] || 0;
              return (
                <div key={size} className="text-center p-2.5 bg-white rounded-xl border border-slate-150">
                  <p className="text-slate-800 font-black text-xs font-mono">{size}</p>
                  <p className={`text-[9px] font-bold mt-0.5 uppercase tracking-wide ${stock === 0 ? "text-rose-500" : stock < 5 ? "text-amber-600" : "text-emerald-650"}`}>
                    {stock === 0 ? "Out of Stock" : `${stock} Left`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">Care Instructions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
          {[{ icon: Wind, text: "Air dry away from direct heat" }, { icon: Shield, text: "Use a soft brush for cleaning" }, { icon: RotateCcw, text: "Remove insoles to dry separately" }, { icon: Target, text: "Store in a cool, dry place" }].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-655">
              <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderReviewsContent = (isMobile = false) => (
    <motion.div key="reviews" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-4xl mx-auto space-y-4">
      <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "sm:p-4 shadow-none border-0 bg-slate-50/50" : "sm:p-6 shadow-3xs"}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-900 font-mono leading-none">{reviewStats?.averageRating?.toFixed(1) || "0.0"}</p>
            <div className="flex justify-center gap-0.5 my-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-3.5 h-3.5 ${star <= (reviewStats?.averageRating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
              ))}
            </div>
            <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider">{reviewStats?.totalReviews || 0} reviews</p>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewStats?.ratingDistribution?.[rating] || 0;
              const pct = reviewStats?.totalReviews ? Math.round((count / reviewStats.totalReviews) * 100) : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="text-slate-500 w-6 text-right">{rating}★</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-slate-400 w-6 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {reviews === undefined ? (
          <div className="text-center py-6">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, i) => {
            const daysAgo = Math.ceil(Math.abs(new Date() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24));
            return (
              <motion.div key={review._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-3xs">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-slate-800 font-extrabold text-xs leading-none">{review.userName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      {review.size && <span className="text-slate-400 text-[9px] font-bold">Size: {review.size}</span>}
                    </div>
                  </div>
                  <span className="text-slate-400 text-[10px] font-medium">{daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}</span>
                </div>
                <p className="text-slate-600 text-xs leading-normal font-medium">{review.comment}</p>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-2xl">
            <Star className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-550 text-[10px] font-black uppercase tracking-wider">No reviews yet</p>
            <p className="text-slate-400 text-[9px] mt-0.5">Be the first to review this sneaker</p>
          </div>
        )}
      </div>
      {token && me && reviews && !reviews.find((r) => r.userId === me._id) && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3">Write a Review</h4>
          <div className="space-y-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => updateForm("rating", s)} className="p-0.5">
                  <Star className={`w-6 h-6 ${s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
            <input type="text" value={reviewForm.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Review title" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-855 placeholder:text-slate-400 font-medium focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all" />
            <textarea value={reviewForm.comment} onChange={(e) => updateForm("comment", e.target.value)} placeholder="Share your experience..." rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-855 placeholder:text-slate-400 font-medium focus:ring-1 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none" />
            <button onClick={handleAddReview} disabled={!reviewForm.title.trim() || !reviewForm.comment.trim() || isSubmittingReview} className="w-full bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all">{isSubmittingReview ? "Submitting..." : "Submit Review"}</button>
          </div>
        </div>
      )}
      {!token && (
        <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-2xl">
          <Lock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-xs font-bold mb-2">Login to write a review</p>
          <Link href="/login" className="inline-block bg-slate-900 hover:bg-slate-850 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">Login</Link>
        </div>
      )}
    </motion.div>
  );

  const renderShippingContent = (isMobile = false) => (
    <motion.div key="shipping" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5"><Truck className="w-4 h-4 text-slate-700" />Delivery</h4>
          <div className="space-y-3">
            {[
              { icon: Check, color: "emerald", title: "Free Shipping", desc: "On orders above ₹999" },
              { icon: Clock, color: "blue", title: "Express Delivery", desc: "2-4 business days" },
              { icon: MapPin, color: "indigo", title: "Track Your Order", desc: "Real-time tracking" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-150">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-extrabold text-xs leading-none">{item.title}</p>
                  <p className="text-slate-450 text-[10px] font-medium mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 ${isMobile ? "shadow-none border-0 bg-slate-50/50" : "shadow-3xs"}`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-slate-700" />Returns</h4>
          <div className="space-y-3">
            {[
              { icon: RotateCcw, color: "orange", title: "30 Day Returns", desc: "Easy returns, no questions" },
              { icon: Shield, color: "teal", title: "100% Authentic", desc: "Guaranteed genuine" },
              { icon: Award, color: "rose", title: "Quality Promise", desc: "Premium quality guaranteed" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-150">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                  item.color === 'teal' ? 'bg-teal-50 text-teal-650' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-extrabold text-xs leading-none">{item.title}</p>
                  <p className="text-slate-450 text-[10px] font-medium mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ProductStructuredData product={product} reviews={reviews} reviewStats={reviewStats} />
      <BreadcrumbStructuredData items={[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }, { name: product?.category, url: `/shop?category=${product?.category}` }, { name: product?.name, url: `/product/${productId}` }]} />

      {/* Header */}
      <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()} className="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-1">
              <Link href="/cart">
                <motion.button whileTap={{ scale: 0.95 }} className="relative p-2.5 text-slate-600 hover:text-slate-900 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {((me && cartSummary?.totalItems) || (!me && getGuestCartSummary().totalItems)) > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{((me && cartSummary?.totalItems) || (!me && getGuestCartSummary().totalItems)) > 9 ? "9+" : ((me && cartSummary?.totalItems) || (!me && getGuestCartSummary().totalItems))}</span>
                  )}
                </motion.button>
              </Link>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { navigator.share ? navigator.share({ title: product?.name, url: window.location.href }) : (navigator.clipboard.writeText(window.location.href), showToastMsg("Link copied!")); }} className="p-2.5 text-slate-600 hover:text-slate-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-medium text-xs shadow-2xl flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Chart Modal */}
      <SizeChart isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white z-50 flex items-center justify-center" onClick={() => setShowImageModal(false)}>
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 z-10 p-2.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            <div className="w-full h-full flex items-center justify-center p-4"><img src={allImages[modalImageIndex]} alt={product?.name} className="max-w-full max-h-full object-contain" /></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); setModalImageIndex(i); }} className={`w-2 h-2 rounded-full transition-all ${modalImageIndex === i ? "bg-slate-900 w-6" : "bg-slate-350"}`} />))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-14 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 animate-fade-in">
            
            {/* Image Section */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 lg:p-0 relative lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
              <div className="relative aspect-[1.15] sm:aspect-square lg:aspect-auto lg:h-full bg-slate-50 border border-slate-100 rounded-3xl cursor-zoom-in overflow-hidden shadow-3xs" onClick={() => { setModalImageIndex(selectedImage); setShowImageModal(true); }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <AnimatePresence mode="wait">
                  <motion.img key={selectedImage} src={allImages[selectedImage]} alt={product?.name} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="w-full h-full object-contain p-4 sm:p-8 lg:p-16" />
                </AnimatePresence>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }} className={`h-1 rounded-full transition-all duration-300 ${selectedImage === i ? "bg-slate-900 w-4" : "bg-slate-300 w-1"}`} />))}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-slate-550 text-[10px] font-bold flex items-center gap-1"><ZoomIn className="w-3 h-3" />Tap to zoom</div>
              </div>
              <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-3">
                {allImages.map((img, i) => (<motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${selectedImage === i ? "border-gray-900" : "border-transparent opacity-60 hover:opacity-100"}`}><img src={img} alt="" className="w-full h-full object-cover" /></motion.button>))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 lg:px-0 py-3 lg:py-8 space-y-4 lg:space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span>{product?.brand || "Brand"}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span>{product?.category}</span>
                </div>
                <h1 className="text-lg lg:text-2xl font-black text-slate-900 leading-tight tracking-tight">{product?.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= (reviewStats?.averageRating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <span className="text-slate-500 text-[10px] font-bold">{reviewStats?.averageRating?.toFixed(1) || "0.0"} ({reviews?.length || 0} reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
                <span className="text-xl font-black text-slate-900 font-mono">₹{product?.price?.toLocaleString()}</span>
                <span className="text-xs text-slate-455 font-bold font-mono line-through">₹{Math.round(product?.price * 1.25).toLocaleString()}</span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded">20% OFF</span>
              </div>

              {/* Size Selection */}
              {product?.availableSizes?.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900 text-xs font-black uppercase tracking-wider">Select Size</span>
                    <button onClick={() => setShowSizeGuide(true)} className="text-slate-500 text-[10px] hover:text-slate-800 transition-colors flex items-center gap-1 font-bold"><Ruler className="w-3.5 h-3.5" />Size Guide</button>
                  </div>
                  
                  <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-6 gap-1.5 p-0.5 rounded-2xl transition-all duration-500" id="size-selector-grid" style={{
                    boxShadow: pulseSizeSelector ? "0 0 0 2px #0f172a" : "none"
                  }}>
                    {product.availableSizes.map((size) => {
                      const stock = product.sizeStock?.[size] || 0;
                      const isOut = stock === 0;
                      const isSelected = selectedSize === size;
                      const isLow = stock > 0 && stock < 5;
                      const sizeLabel = getSizeLabel(size);
                      return (
                        <motion.button 
                          key={size} 
                          whileTap={{ scale: isOut ? 1 : 0.95 }} 
                          onClick={() => !isOut && setSelectedSize(size)} 
                          disabled={isOut} 
                          className={`relative py-1.5 rounded-xl transition-all border ${
                            isSelected 
                              ? "bg-slate-900 border-slate-900 text-white shadow-xs" 
                              : isOut 
                                ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed opacity-60" 
                                : "bg-white border-slate-200 hover:border-slate-400 text-slate-800"
                          }`}
                        >
                          <div className="flex flex-col items-center leading-none">
                            <span className="font-black text-[11px]">{sizeLabel.eu}</span>
                            <span className={`text-[8px] mt-0.5 font-bold ${isSelected ? "text-white/70" : "text-slate-405"}`}>({sizeLabel.us})</span>
                          </div>
                          {isLow && !isSelected && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                          {isOut && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-px bg-slate-200 rotate-45 absolute" /></span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedSize ? (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-[10px] font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                      <span className="text-slate-555">Size {getSizeLabel(selectedSize).eu} ({getSizeLabel(selectedSize).us}) selected{product.sizeStock?.[selectedSize] < 5 && product.sizeStock?.[selectedSize] > 0 && <span className="text-orange-600 font-black ml-1.5">• Only {product.sizeStock[selectedSize]} left!</span>}</span>
                    </motion.div>
                  ) : (
                    <p className="text-slate-400 text-[10px] font-bold italic">Please select a size to continue</p>
                  )}
                </div>
              )}

              {/* Quantity & Actions Row */}
              <div className="flex items-center gap-4 py-2 border-t border-b border-slate-100">
                <span className="text-slate-900 text-xs font-black uppercase tracking-wider">Quantity</span>
                <div className="flex items-center bg-slate-50 border border-slate-150 rounded-xl p-0.5">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-8 text-center text-slate-855 font-black text-xs font-mono">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} disabled={selectedSize && product?.sizeStock?.[selectedSize] !== undefined && quantity >= product.sizeStock[selectedSize]} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <motion.button 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }} 
                  onClick={handleAddToCart} 
                  disabled={!selectedSize || (selectedSize && product?.sizeStock?.[selectedSize] === 0)} 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-805 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200/60"
                >
                  Add to Cart
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }} 
                  onClick={handleBuyNow} 
                  disabled={!selectedSize || (selectedSize && product?.sizeStock?.[selectedSize] === 0)} 
                  className="bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-slate-100"
                >
                  Buy Now
                </motion.button>
              </div>

              {/* Quick Features */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-slate-800 text-xs font-black leading-normal">Free Delivery</p>
                    <p className="text-slate-400 text-[9px] font-bold leading-none mt-0.5">On orders over ₹999</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 border-t border-slate-100 overflow-x-hidden">
          {/* Desktop Tabs */}
          <div className="hidden md:block">
            <div className="flex gap-1 p-0.5 bg-slate-100 border border-slate-200/50 rounded-full w-fit mx-auto mb-6 overflow-x-auto max-w-full">
              {tabs.map((tab) => { const Icon = tab.icon; return (
                <motion.button 
                  key={tab.id} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "bg-white text-slate-900 shadow-3xs" 
                      : "text-slate-450 hover:text-slate-850"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                </motion.button>
              ); })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "details" && renderDetailsContent()}
              {activeTab === "specs" && renderSpecsContent()}
              {activeTab === "reviews" && renderReviewsContent()}
              {activeTab === "shipping" && renderShippingContent()}
            </AnimatePresence>
          </div>

          {/* Mobile Accordion */}
          <div className="block md:hidden space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isExpanded = expandedAccordion === tab.id;
              return (
                <div key={tab.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setExpandedAccordion(isExpanded ? null : tab.id)}
                    className="w-full flex items-center justify-between p-3.5 flex-row text-left font-black text-xs uppercase tracking-wider text-slate-800 bg-slate-50 border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-605" />
                      {tab.label}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-white border-t border-slate-100"
                      >
                        <div className="p-3">
                          {tab.id === "details" && renderDetailsContent(true)}
                          {tab.id === "specs" && renderSpecsContent(true)}
                          {tab.id === "reviews" && renderReviewsContent(true)}
                          {tab.id === "shipping" && renderShippingContent(true)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts?.length > 0 && (
          <div className="py-8 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-6">You May Also Like</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
                {relatedProducts.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => handleClickProduct(item._id)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Trending */}
        {trendingProducts?.length > 0 && (
          <div className="py-8 border-t border-slate-100 bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-1">Trending Now</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6">Most viewed in {product?.category}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {trendingProducts.map((item, i) => (<motion.div key={item.itemId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.itemId)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed?.length > 0 && (
          <div className="py-8 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2"><History className="w-5 h-5 text-slate-700" />Recently Viewed</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6">Continue where you left off</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {recentlyViewed.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.productId)}><ProductCard img={item.productImage} name={item.productName} category={item.productCategory} price={item.productPrice} productId={item.productId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Personalized */}
        {personalizedProducts?.length > 0 && me && (
          <div className="py-8 border-t border-slate-100 bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2"><Heart className="w-5 h-5 text-slate-700" />Picked for {me.name}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6">Based on your style preferences</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {personalizedProducts.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.itemId)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating mobile bottom buy bar */}
      <AnimatePresence>
        {showFloatingBuyBar && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100/80 p-3.5 flex items-center justify-between md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-4"
          >
            <div className="flex flex-col min-w-0 mr-3">
              <span className="text-[10px] font-black text-slate-800 truncate max-w-[170px] uppercase tracking-wider">{product?.name}</span>
              <span className="font-black text-xs text-emerald-600 font-mono tracking-tight mt-0.5">
                ₹{product?.price?.toLocaleString()} {selectedSize && <span className="text-slate-450 font-medium">({getSizeLabel(selectedSize).eu})</span>}
              </span>
            </div>
            <button 
              type="button"
              onClick={!selectedSize ? handleSelectSizeClick : handleBuyNow}
              disabled={selectedSize && product?.sizeStock?.[selectedSize] === 0}
              className="bg-slate-900 hover:bg-slate-850 text-white px-4.5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-all active:scale-[0.98]"
            >
              {!selectedSize ? "Select Size" : "Buy Now"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <EmailOtpModal open={showOtpModal} onClose={() => setShowOtpModal(false)} returnUrl={otpReturnUrl} />
      <FooterSimple />
    </div>
  );
}
