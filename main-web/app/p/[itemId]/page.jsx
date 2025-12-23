"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

// This page loads products from products table
export default function WebProductPage() {
  const params = useParams();
  const router = useRouter();
  const { itemId } = params;

  const [token, setToken] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [itemId]);

  // Queries - using products table
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const product = useQuery(api.products.getProductByItemId, itemId ? { itemId } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");

  // Mutations
  const addToCart = useMutation(api.cart.addToCart);
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);

  const allImages = product ? [product.mainImage, ...(product.otherImages || [])].filter(Boolean) : [];

  const toast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = async () => {
    if (!me) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!selectedSize) {
      toast("Please select a size");
      return;
    }
    try {
      await addToCart({
        userId: me._id,
        productId: product.itemId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        size: selectedSize,
        quantity,
      });
      toast("Added to cart!");
    } catch (err) {
      toast("Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast("Please select a size");
      return;
    }
    const params = new URLSearchParams({
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage,
      price: product.price.toString(),
      size: selectedSize,
      quantity: quantity.toString(),
      action: "buyNow",
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const handleWishlist = async () => {
    if (!me) {
      toast("Please login to save items");
      return;
    }
    try {
      const result = await toggleWishlist({
        userId: me._id,
        productId: product.itemId,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
        category: product.category,
      });
      setIsWishlisted(result.isWishlisted);
      toast(result.message);
    } catch (err) {
      toast("Failed to update wishlist");
    }
  };

  // Loading
  if (product === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-6">This product doesn't exist or has been removed.</p>
          <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.share ? navigator.share({ title: product.name, url: window.location.href }) : navigator.clipboard.writeText(window.location.href);
                toast("Link copied!");
              }}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleWishlist}
              className={`p-2 rounded-full transition-colors ${isWishlisted ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:text-black hover:bg-gray-100"}`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
            <Link href="/cart" className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartSummary?.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartSummary.totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {allImages[selectedImage] && (
                    <Image
                      src={allImages[selectedImage]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {selectedImage + 1} / {allImages.length}
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? "border-black" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 text-xs tracking-widest uppercase mb-2">{product.category}</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-400 text-sm mt-1">SKU: {product.itemId}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
              {product.costPrice && product.costPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">₹{product.costPrice?.toLocaleString()}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <span className="text-green-600 text-sm font-medium">✓ In Stock ({product.totalStock} available)</span>
              ) : (
                <span className="text-red-500 text-sm font-medium">Out of Stock</span>
              )}
            </div>

            {/* Size Selection */}
            {product.availableSizes?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => {
                    const stock = product.sizeStock?.[size] || 0;
                    const isOutOfStock = stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !isOutOfStock && setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`min-w-[48px] h-12 px-4 rounded-xl border-2 font-medium transition-all ${
                          selectedSize === size
                            ? "border-black bg-black text-white"
                            : isOutOfStock
                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 hover:border-black text-gray-900"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && product.sizeStock?.[selectedSize] <= 5 && (
                  <p className="text-orange-500 text-sm mt-2">Only {product.sizeStock[selectedSize]} left!</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 h-14 bg-white border-2 border-black text-black rounded-full font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 h-14 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <Truck className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Secure Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Easy Returns</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Color Info */}
            {product.color && (
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Color:</span> {product.color}
                  {product.secondaryColor && ` / ${product.secondaryColor}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 h-12 bg-white border-2 border-black text-black rounded-full font-semibold text-sm disabled:opacity-50"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!product.inStock}
            className="flex-1 h-12 bg-black text-white rounded-full font-semibold text-sm disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>

      <div className="lg:hidden h-24" />
    </div>
  );
}
