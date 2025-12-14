"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Sparkles,
  Briefcase,
  Zap,
  Star,
  Ruler,
  X,
} from "lucide-react";

// Dynamic import for 3D viewer (no SSR)
const ShoeViewer3D = dynamic(() => import("@/components/ShoeViewer3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
    </div>
  ),
});

// Clean White Navbar
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
            ? "bg-white/95 backdrop-blur-xl py-3 shadow-sm"
            : "bg-white py-5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-gray-700 hover:text-black transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Walkdrobe" width={150} height={40} className="h-8 md:h-10 w-auto" />
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {["Sneakers", "Boots", "Sandals", "Formal"].map((item) => (
              <Link
                key={item}
                href={`/shop?ct=${item.toLowerCase()}`}
                className="text-gray-600 hover:text-black transition-colors text-sm tracking-widest uppercase font-medium"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/search" className="hidden md:block text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link href="/wishlist" className="hidden md:block text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link href="/cart" className="relative text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartSummary?.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartSummary.totalItems}
                </span>
              )}
            </Link>
            <Link
              href={me ? "/user/profile" : "/login"}
              className="hidden md:block text-gray-600 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 overflow-y-auto shadow-2xl font-inter"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <Image src="/logo.png" alt="Walkdrobe" width={100} height={28} className="h-6 w-auto" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-black p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-0">
                  {["Sneakers", "Boots", "Sandals", "Formal"].map((item) => (
                    <Link
                      key={item}
                      href={`/shop?ct=${item.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2.5 text-gray-600 hover:text-black transition-colors text-sm tracking-wide border-b border-gray-50"
                    >
                      {item}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-gray-400 hover:text-black text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-gray-400 hover:text-black text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Wishlist
                  </Link>
                  <Link
                    href={me ? "/user/profile" : "/login"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-gray-400 hover:text-black text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {me ? "Profile" : "Login"}
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-gray-800 font-medium text-xs mb-1.5">Visit our store</p>
                  <p className="text-gray-400 text-[11px]">Patna, Bihar</p>
                  <p className="text-gray-400 text-[11px]">9122583392</p>
                  <p className="text-gray-400 text-[11px]">11 AM - 9 PM</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hero Section - Clean White (Mobile Optimized)
function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentModel, setCurrentModel] = useState(0);
  
  const slides = [
    { title: "STEP INTO", highlight: "STYLE", subtitle: "Premium footwear for the modern soul", cta: "Shop Now", link: "/shop" },
    { title: "NEW", highlight: "ARRIVALS", subtitle: "Discover the latest trends", cta: "Explore", link: "/shop?sort=newest" },
    { title: "EXCLUSIVE", highlight: "SNEAKERS", subtitle: "Limited edition drops", cta: "View", link: "/shop?ct=sneakers" },
  ];

  const shoeModels = [
    "/3d/shoe.glb",
    "/3d/a_white_salomon_trail_running_shoe_salomon.glb",
  ];

  const nextModel = () => setCurrentModel((prev) => (prev + 1) % shoeModels.length);
  const prevModel = () => setCurrentModel((prev) => (prev - 1 + shoeModels.length) % shoeModels.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-gray-50 overflow-hidden pt-16 md:pt-20">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full py-8 md:py-16">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-12 items-center min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-160px)]">

            {/* 3D Shoe Viewer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl overflow-hidden order-1 md:order-2 max-w-[280px] md:max-w-none mx-auto"
            >
              <ShoeViewer3D modelPath={shoeModels[currentModel]} />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevModel}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110"
              >
                <ArrowRight className="w-4 h-4 rotate-180 text-gray-700" />
              </button>
              <button
                onClick={nextModel}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110"
              >
                <ArrowRight className="w-4 h-4 text-gray-700" />
              </button>

              {/* Model indicator dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {shoeModels.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentModel(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentModel ? "bg-black w-4" : "bg-black/30"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Text Content */}
            <div className="order-2 md:order-1 text-center md:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.p
                    className="text-gray-400 tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-2 md:mb-4 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    WALKDROBE
                  </motion.p>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-none mb-1">
                    {slides[currentSlide].title}
                  </h1>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-black leading-none mb-3 md:mb-6">
                    {slides[currentSlide].highlight}
                  </h1>
                  <p className="text-gray-500 text-sm md:text-lg mb-5 md:mb-8 max-w-md mx-auto md:mx-0">
                    {slides[currentSlide].subtitle}
                  </p>
                  <Link href={slides[currentSlide].link}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="group inline-flex items-center gap-2 bg-black text-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold tracking-wider hover:bg-gray-900 transition-all rounded-full md:rounded-none"
                    >
                      {slides[currentSlide].cta}
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Slide indicators */}
              <div className="flex gap-2 mt-6 md:mt-12 justify-center md:justify-start">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-8 md:w-12 bg-black" : "w-4 md:w-6 bg-gray-300"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// Categories Section - White Theme (Mobile Optimized)
function CategoriesSection() {
  const categories = [
    { name: "Sneakers", image: "/banner/sneakers.png", count: "120+" },
    { name: "Boots", image: "/banner/boots.png", count: "80+" },
    { name: "Sandals", image: "/banner/sandals.png", count: "60+" },
    { name: "Formal", image: "/banner/formal.png", count: "90+" },
  ];

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16"
        >
          <p className="text-gray-400 tracking-[0.2em] text-xs md:text-sm mb-2 md:mb-4 font-medium">EXPLORE</p>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Shop by Category</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/shop?ct=${cat.name.toLowerCase()}`}>
                <div className="group relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-500">
                  {/* Placeholder - replace with actual images */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-700" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-white via-white/95 to-transparent">
                    <p className="text-gray-400 text-[10px] md:text-xs tracking-widest mb-0.5">{cat.count} Styles</p>
                    <h3 className="text-gray-900 text-sm md:text-xl font-bold">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Featured Products Section - White Theme (Mobile Optimized)
function FeaturedProducts() {
  const router = useRouter();
  const products = useQuery(api.products.getAllProducts, { limit: 8 });

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-6 md:mb-12"
        >
          <div>
            <p className="text-gray-400 tracking-[0.2em] text-xs md:text-sm mb-1 md:mb-4 font-medium">CURATED</p>
            <h2 className="text-xl md:text-4xl font-bold text-gray-900">Featured</h2>
          </div>
          <Link href="/shop" className="text-gray-500 hover:text-black transition-colors flex items-center gap-1 text-xs md:text-base font-medium">
            View All <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {!products ? (
            [...Array(8)].map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-gray-200 rounded-lg md:rounded-xl animate-pulse" />
            ))
          ) : (
            products.slice(0, 8).map((product, idx) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleProductClick(product.itemId)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg md:rounded-xl overflow-hidden mb-2 md:mb-4">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>

                <div>
                  <p className="text-gray-400 text-[10px] md:text-xs tracking-wider mb-0.5 uppercase">{product.category}</p>
                  <h3 className="text-gray-900 text-xs md:text-base font-medium mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-black text-sm md:text-base font-semibold">₹{product.price?.toLocaleString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// Store Info Banner - White Theme
function StoreBanner() {
  return (
    <section className="bg-gradient-to-r from-gray-100 via-white to-gray-100 py-10 md:py-12 relative border-y border-gray-200">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Info */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Visit Our Store
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Patna, Bihar
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                9122583392
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                11AM - 9PM
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <a
              href="https://instagram.com/walkdrobe.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Follow
            </a>
            <a
              href="tel:9122583392"
              className="flex items-center gap-2 border-2 border-gray-900 text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


// Trending Section - White Theme
function TrendingSection() {
  const router = useRouter();
  const trendingProducts = useQuery(api.views.getMostViewedProducts, {
    limit: 6,
    category: "Sneakers",
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-gray-500 tracking-[0.3em] text-sm mb-4 font-medium">HOT RIGHT NOW</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Trending Sneakers</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {!trendingProducts ? (
            [...Array(6)].map((_, idx) => (
              <div key={idx} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))
          ) : trendingProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No trending products yet
            </div>
          ) : (
            trendingProducts.map((product, idx) => (
              <motion.div
                key={product.itemId}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/product/${product.itemId}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}

                  {/* Rank badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm">#{idx + 1}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                      <p className="text-white font-bold">₹{product.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// Footer - White Theme Interesting Design
function Footer() {
  return (
    <footer className="bg-gray-50 overflow-hidden">
      {/* Top CTA Section */}
      <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 py-10 md:py-12 relative border-y border-gray-200">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Step Into Style</h3>
              <p className="text-gray-500 text-sm">Visit our store in Patna or shop online</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/walkdrobe.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Follow @walkdrobe.in
              </a>
              <a
                href="tel:9122583392"
                className="flex items-center gap-2 border-2 border-gray-900 text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo.png" alt="Walkdrobe" width={120} height={32} className="h-7 w-auto mb-4" />
            <p className="text-gray-500 text-sm leading-relaxed">
              Premium footwear for every step of your journey.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["Sneakers", "Boots", "Sandals", "Formal"].map((item) => (
                <li key={item}>
                  <Link href={`/shop?ct=${item.toLowerCase()}`} className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Help</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Track Order", href: "/track-order" },
                { name: "Contact Us", href: "/contact" },
                { name: "FAQ", href: "/faq" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Visit Us</h4>
            <div className="space-y-2 text-gray-500 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                Patna, Bihar
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                11AM - 9PM
              </p>
              <p className="text-gray-400 text-xs pl-6">Wednesday Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Walkdrobe. Made with ❤️ in Patna
          </p>
          <div className="flex gap-5 text-gray-400 text-xs">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Style & Size Preference Popup
function StylePopup({ onClose }) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    style: null,
    size: null,
  });

  const styles = [
    { id: "casual", label: "Casual", icon: Star },
    { id: "formal", label: "Formal", icon: Briefcase },
    { id: "sporty", label: "Sporty", icon: Zap },
    { id: "trendy", label: "Trendy", icon: Sparkles },
  ];

  const sizes = ["6", "7", "8", "9", "10", "11", "12"];

  const handleComplete = () => {
    localStorage.setItem("walkdrobe_preferences", JSON.stringify(preferences));
    localStorage.setItem("walkdrobe_popup_shown", "true");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-200"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-200"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">What's your style?</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">Help us find your perfect pair</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {styles.map((style) => {
                  const IconComponent = style.icon;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setPreferences({ ...preferences, style: style.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        preferences.style === style.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        preferences.style === style.id ? "bg-black" : "bg-gray-100"
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          preferences.style === style.id ? "text-white" : "text-gray-600"
                        }`} />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{style.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => preferences.style && setStep(2)}
                disabled={!preferences.style}
                className={`w-full py-3 rounded-full font-medium transition-all ${
                  preferences.style
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue →
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Ruler className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">What's your size?</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">Select your usual shoe size (UK)</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setPreferences({ ...preferences, size })}
                    className={`w-11 h-11 rounded-full border-2 font-medium transition-all text-sm ${
                      preferences.size === size
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-full font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!preferences.size}
                  className={`flex-1 py-3 rounded-full font-medium transition-all ${
                    preferences.size
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
}

// Main Page Component
export default function Home() {
  const [showStylePopup, setShowStylePopup] = useState(false);

  useEffect(() => {
    // Check if popup was already shown
    const popupShown = localStorage.getItem("walkdrobe_popup_shown");
    if (!popupShown) {
      // Show popup after 10 seconds
      const timer = setTimeout(() => {
        setShowStylePopup(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <StoreBanner />
      <TrendingSection />
      <Footer />

      {/* Style Preference Popup */}
      <AnimatePresence>
        {showStylePopup && (
          <StylePopup onClose={() => {
            setShowStylePopup(false);
            localStorage.setItem("walkdrobe_popup_shown", "true");
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
