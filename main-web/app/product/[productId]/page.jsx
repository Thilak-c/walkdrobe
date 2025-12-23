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
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductStructuredData, BreadcrumbStructuredData } from "@/components/StructuredData";
import SizeChart from "@/components/SizeChart";

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
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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
    if (!isLoggedIn || !me) { router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}&action=addToCart`); return; }
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
    router.push(`/checkout?${params.toString()}`);
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
    if (sizeSystem === "US") return (uk + 1).toString();
    if (sizeSystem === "EU") return (uk + 33).toString();
    return size;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading</p>
        </div>
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

  return (
    <div className="min-h-screen bg-white">
      <ProductStructuredData product={product} reviews={reviews} reviewStats={reviewStats} />
      <BreadcrumbStructuredData items={[{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }, { name: product?.category, url: `/shop?category=${product?.category}` }, { name: product?.name, url: `/product/${productId}` }]} />

      {/* Header */}
      <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <Link href="/cart">
                  <motion.button whileTap={{ scale: 0.95 }} className="relative p-3 text-gray-600 hover:text-gray-900 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    {cartSummary?.totalItems > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartSummary.totalItems > 9 ? "9+" : cartSummary.totalItems}</span>}
                  </motion.button>
                </Link>
              )}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { navigator.share ? navigator.share({ title: product?.name, url: window.location.href }) : (navigator.clipboard.writeText(window.location.href), showToastMsg("Link copied!")); }} className="p-3 text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleWishlistToggle} disabled={isWishlisting} className={`p-3 transition-colors ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-gray-900"}`}>
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-full font-medium text-sm shadow-2xl flex items-center gap-2">
              <Check className="w-4 h-4" />
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
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 z-10 p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"><X className="w-6 h-6" /></button>
            <div className="w-full h-full flex items-center justify-center p-4"><img src={allImages[modalImageIndex]} alt={product?.name} className="max-w-full max-h-full object-contain" /></div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); setModalImageIndex(i); }} className={`w-2 h-2 rounded-full transition-all ${modalImageIndex === i ? "bg-gray-900 w-6" : "bg-gray-300"}`} />))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
            
            {/* Image Section */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
              <div className="relative aspect-square lg:aspect-auto lg:h-full bg-gray-50 cursor-zoom-in overflow-hidden" onClick={() => { setModalImageIndex(selectedImage); setShowImageModal(true); }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <AnimatePresence mode="wait">
                  <motion.img key={selectedImage} src={allImages[selectedImage]} alt={product?.name} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="w-full h-full object-contain p-8 lg:p-16" />
                </AnimatePresence>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === i ? "bg-gray-900 w-8" : "bg-gray-300 w-1.5 hover:bg-gray-400"}`} />))}
                </div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-gray-500 text-xs flex items-center gap-1.5"><ZoomIn className="w-3 h-3" />Tap to zoom</div>
              </div>
              <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-3">
                {allImages.map((img, i) => (<motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${selectedImage === i ? "border-gray-900" : "border-transparent opacity-60 hover:opacity-100"}`}><img src={img} alt="" className="w-full h-full object-cover" /></motion.button>))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 lg:px-0 py-8 lg:py-12 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm uppercase tracking-widest">{product?.brand || "Brand"}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-gray-400 text-sm uppercase tracking-widest">{product?.category}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product?.name}</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-4 h-4 ${star <= (reviewStats?.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />))}</div>
                  <span className="text-gray-500 text-sm">{reviewStats?.averageRating?.toFixed(1) || "0.0"} ({reviews?.length || 0} reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gray-900">₹{product?.price?.toLocaleString()}</span>
                <span className="text-lg text-gray-400 line-through">₹{Math.round(product?.price * 1.25).toLocaleString()}</span>
                <span className="bg--100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">20% OFF</span>
              </div>

              {/* Size Selection */}
              {product?.availableSizes?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">Select Size</span>
                    <button onClick={() => setShowSizeGuide(true)} className="text-gray-500 text-sm hover:text-gray-900 transition-colors flex items-center gap-1"><Ruler className="w-4 h-4" />Size Guide</button>
                  </div>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-full w-fit">
                    {["UK", "US", "EU"].map((sys) => (<button key={sys} onClick={() => setSizeSystem(sys)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${sizeSystem === sys ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>{sys}</button>))}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {product.availableSizes.map((size) => {
                      const stock = product.sizeStock?.[size] || 0;
                      const isOut = stock === 0;
                      const isSelected = selectedSize === size;
                      const isLow = stock > 0 && stock < 5;
                      return (
                        <motion.button key={size} whileTap={{ scale: isOut ? 1 : 0.95 }} onClick={() => !isOut && setSelectedSize(size)} disabled={isOut} className={`relative py-3 rounded-xl font-medium transition-all text-sm ${isSelected ? "bg-gray-900 text-white" : isOut ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                          {getSizeLabel(size)}
                          {isLow && !isSelected && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />}
                          {isOut && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-px bg-gray-300 rotate-45 absolute" /></span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedSize && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Size {getSizeLabel(selectedSize)} selected{product.sizeStock?.[selectedSize] < 5 && product.sizeStock?.[selectedSize] > 0 && <span className="text-orange-500 ml-2">• Only {product.sizeStock[selectedSize]} left</span>}</span>
                    </motion.div>
                  )}
                  {!selectedSize && <p className="text-gray-400 text-sm">Please select a size to continue</p>}
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <span className="text-gray-900 font-medium">Quantity</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-100 rounded-full">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="p-3 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"><Minus className="w-5 h-5" /></button>
                    <span className="w-12 text-center text-gray-900 font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} disabled={selectedSize && product?.sizeStock?.[selectedSize] !== undefined && quantity >= product.sizeStock[selectedSize]} className="p-3 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddToCart} disabled={!selectedSize || (selectedSize && product?.sizeStock?.[selectedSize] === 0)} className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold text-base transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Add to Cart</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBuyNow} disabled={!selectedSize || (selectedSize && product?.sizeStock?.[selectedSize] === 0)} className="w-full bg-white text-gray-900 py-4 rounded-full font-semibold text-base border-2 border-gray-200 hover:border-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Buy Now</motion.button>
              </div>

              {/* Quick Features */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <Truck className="w-5 h-5 text-gray-500" />
                  <div><p className="text-gray-900 text-sm font-medium">Free Delivery</p><p className="text-gray-400 text-xs">On orders over ₹999</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <RotateCcw className="w-5 h-5 text-gray-500" />
                  <div><p className="text-gray-900 text-sm font-medium">Easy Returns</p><p className="text-gray-400 text-xs">30 day return policy</p></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 border-t border-gray-100">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-full w-fit mx-auto mb-8 overflow-x-auto">
            {tabs.map((tab) => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}><Icon className="w-4 h-4" />{tab.label}</button>); })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "details" && (
              <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                <div className="bg-gray-50 rounded-3xl p-6 lg:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About This Sneaker</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product?.description || "No description available."}</p>
                </div>
              </motion.div>
            )}

            {activeTab === "specs" && (
              <motion.div key="specs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Footprints className="w-5 h-5" />Construction</h4>
                    <div className="space-y-3">
                      {[{ label: "Upper Material", value: "Premium Mesh" }, { label: "Sole", value: "Rubber Outsole" }, { label: "Midsole", value: "EVA Foam" }, { label: "Closure", value: "Lace-up" }, { label: "Toe Style", value: "Round Toe" }].map((spec, i) => (<div key={i} className="flex justify-between py-2 border-b border-gray-200 last:border-0"><span className="text-gray-500">{spec.label}</span><span className="text-gray-900 font-medium">{spec.value}</span></div>))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5" />Performance</h4>
                    <div className="space-y-3">
                      {[{ label: "Weight", value: "~280g (per shoe)" }, { label: "Cushioning", value: "High Impact" }, { label: "Arch Support", value: "Neutral" }, { label: "Breathability", value: "Excellent" }, { label: "Best For", value: "Casual / Lifestyle" }].map((spec, i) => (<div key={i} className="flex justify-between py-2 border-b border-gray-200 last:border-0"><span className="text-gray-500">{spec.label}</span><span className="text-gray-900 font-medium">{spec.value}</span></div>))}
                    </div>
                  </div>
                </div>
                {product?.availableSizes?.length > 0 && (
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Size Availability</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {product.availableSizes.map((size) => { const stock = product.sizeStock?.[size] || 0; return (<div key={size} className="text-center p-3 bg-white rounded-xl border border-gray-200"><p className="text-gray-900 font-bold">{size}</p><p className={`text-xs mt-1 ${stock === 0 ? "text-red-500" : stock < 5 ? "text-orange-500" : "text-green-600"}`}>{stock === 0 ? "Out of stock" : `${stock} left`}</p></div>); })}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-3xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Care Instructions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[{ icon: Wind, text: "Air dry away from direct heat" }, { icon: Shield, text: "Use a soft brush for cleaning" }, { icon: RotateCcw, text: "Remove insoles to dry separately" }, { icon: Target, text: "Store in a cool, dry place" }].map((item, i) => (<div key={i} className="flex items-center gap-3 text-gray-600"><item.icon className="w-5 h-5 text-gray-400" /><span>{item.text}</span></div>))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-6">
                <div className="bg-gray-50 rounded-3xl p-6 lg:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900">{reviewStats?.averageRating?.toFixed(1) || "0.0"}</p>
                      <div className="flex justify-center gap-1 my-2">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-5 h-5 ${star <= (reviewStats?.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />))}</div>
                      <p className="text-gray-500 text-sm">{reviewStats?.totalReviews || 0} reviews</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => { const count = reviewStats?.ratingDistribution?.[rating] || 0; const pct = reviewStats?.totalReviews ? Math.round((count / reviewStats.totalReviews) * 100) : 0; return (<div key={rating} className="flex items-center gap-3"><span className="text-gray-500 text-sm w-8">{rating}★</span><div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} /></div><span className="text-gray-400 text-sm w-8">{count}</span></div>); })}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews === undefined ? (<div className="text-center py-12"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" /></div>) : reviews.length > 0 ? (
                    reviews.map((review, i) => { const daysAgo = Math.ceil(Math.abs(new Date() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24)); return (
                      <motion.div key={review._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-50 rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div><p className="text-gray-900 font-medium">{review.userName}</p><div className="flex items-center gap-2 mt-1"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />))}</div>{review.size && <span className="text-gray-400 text-xs">Size {review.size}</span>}</div></div>
                          <span className="text-gray-400 text-xs">{daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                      </motion.div>
                    ); })
                  ) : (<div className="text-center py-12 bg-gray-50 rounded-3xl"><Star className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500">No reviews yet</p><p className="text-gray-400 text-sm">Be the first to review</p></div>)}
                </div>
                {token && me && reviews && !reviews.find((r) => r.userId === me._id) && (
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h4>
                    <div className="space-y-4">
                      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((s) => (<button key={s} onClick={() => updateForm("rating", s)} className="p-1"><Star className={`w-8 h-8 ${s <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} /></button>))}</div>
                      <input type="text" value={reviewForm.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Review title" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                      <textarea value={reviewForm.comment} onChange={(e) => updateForm("comment", e.target.value)} placeholder="Share your experience..." rows={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none" />
                      <button onClick={handleAddReview} disabled={!reviewForm.title.trim() || !reviewForm.comment.trim() || isSubmittingReview} className="w-full bg-gray-900 text-white py-3 rounded-full font-semibold disabled:opacity-50">{isSubmittingReview ? "Submitting..." : "Submit Review"}</button>
                    </div>
                  </div>
                )}
                {!token && (<div className="text-center py-8 bg-gray-50 rounded-3xl"><Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 mb-4">Login to write a review</p><Link href="/login" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-full font-medium">Login</Link></div>)}
              </motion.div>
            )}

            {activeTab === "shipping" && (
              <motion.div key="shipping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5" />Delivery</h4>
                    <div className="space-y-4">
                      {[{ icon: Check, color: "green", title: "Free Shipping", desc: "On orders above ₹999" }, { icon: Clock, color: "blue", title: "Express Delivery", desc: "2-4 business days" }, { icon: MapPin, color: "purple", title: "Track Your Order", desc: "Real-time tracking" }].map((item, i) => (<div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100"><div className={`w-10 h-10 bg-${item.color}-100 rounded-full flex items-center justify-center shrink-0`}><item.icon className={`w-5 h-5 text-${item.color}-600`} /></div><div><p className="text-gray-900 font-medium">{item.title}</p><p className="text-gray-500 text-sm">{item.desc}</p></div></div>))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-3xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><RotateCcw className="w-5 h-5" />Returns</h4>
                    <div className="space-y-4">
                      {[{ icon: RotateCcw, color: "orange", title: "30 Day Returns", desc: "Easy returns, no questions" }, { icon: Shield, color: "teal", title: "100% Authentic", desc: "Guaranteed genuine" }, { icon: Award, color: "pink", title: "Quality Promise", desc: "Premium quality guaranteed" }].map((item, i) => (<div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100"><div className={`w-10 h-10 bg-${item.color}-100 rounded-full flex items-center justify-center shrink-0`}><item.icon className={`w-5 h-5 text-${item.color}-600`} /></div><div><p className="text-gray-900 font-medium">{item.title}</p><p className="text-gray-500 text-sm">{item.desc}</p></div></div>))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts?.length > 0 && (
          <div className="py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => handleClickProduct(item._id)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Trending */}
        {trendingProducts?.length > 0 && (
          <div className="py-12 border-t border-gray-100 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Trending Now</h3>
              <p className="text-gray-500 mb-8">Most viewed in {product?.category}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingProducts.map((item, i) => (<motion.div key={item.itemId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.itemId)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed?.length > 0 && (
          <div className="py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><History className="w-6 h-6" />Recently Viewed</h3>
              <p className="text-gray-500 mb-8">Continue where you left off</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recentlyViewed.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.productId)}><ProductCard img={item.productImage} name={item.productName} category={item.productCategory} price={item.productPrice} productId={item.productId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}

        {/* Personalized */}
        {personalizedProducts?.length > 0 && me && (
          <div className="py-12 border-t border-gray-100 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Heart className="w-6 h-6" />Picked for {me.name}</h3>
              <p className="text-gray-500 mb-8">Based on your style preferences</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {personalizedProducts.map((item, i) => (<motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleClickProduct(item.itemId)}><ProductCard img={item.mainImage} name={item.name} category={item.category} price={item.price} productId={item.itemId} /></motion.div>))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
