"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import {
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Sparkles,
  Ruler,
  X,
  Shirt,
  Footprints,
  Activity,
  TrendingUp,
} from "lucide-react";

// Hero images - mobile and desktop versions
const heroImages = [
  { mobile: "/hero-images/TAS_4282.jpg", desktop: "/hero-images/TAS_4282landscape.jpg" },
  { mobile: "/hero-images/TAS_4296.jpg", desktop: "/hero-images/TAS_4296landscape.jpg" },
  { mobile: "/hero-images/TAS_4315.jpg", desktop: "/hero-images/TAS_4315landscape.jpg" },
  { mobile: "/hero-images/TAS_4324.jpg", desktop: "/hero-images/TAS_4324landscape.jpg" },
  { mobile: "/hero-images/TAS_4337.jpg", desktop: "/hero-images/TAS_4337landscape.jpg" },
];

// Hero Section - Image Slider (Mobile Optimized)
function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const slides = [
    { title: "STEP INTO", highlight: "STYLE", subtitle: "Premium footwear for the modern soul", cta: "Shop Now", link: "/shop" },
    { title: "NEW", highlight: "ARRIVALS", subtitle: "Discover the latest trends", cta: "Explore", link: "/shop?sort=newest" },
    { title: "EXCLUSIVE", highlight: "SNEAKERS", subtitle: "Limited edition drops", cta: "View", link: "/shop?ct=sneakers" },
    { title: "PREMIUM", highlight: "SPORTS", subtitle: "Performance meets style", cta: "Shop", link: "/shop?ct=sports" },
    { title: "WALK IN", highlight: "COMFORT", subtitle: "Quality you can feel", cta: "Discover", link: "/shop" },
  ];

  // Preload all images on mount
  useEffect(() => {
    const preloadImages = async () => {
      const isMobile = window.innerWidth < 768;
      const imagePromises = heroImages.map((img) => {
        return new Promise((resolve) => {
          const image = new window.Image();
          image.src = isMobile ? img.mobile : img.desktop;
          image.onload = resolve;
          image.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };
    preloadImages();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  return (
    <section className="relative bg-gray-50 overflow-hidden h-screen">
      {/* Preload all images (hidden) */}
      <div className="hidden">
        {heroImages.map((img, idx) => (
          <div key={idx}>
            <Image src={img.mobile} alt="" width={1} height={1} priority />
            <Image src={img.desktop} alt="" width={1} height={1} priority />
          </div>
        ))}
      </div>

      {/* Background Image Slider */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            {/* Mobile Image */}
            <Image
              src={heroImages[currentSlide].mobile}
              alt="Hero"
              fill
              priority
              className="object-cover object-center md:hidden"
              sizes="100vw"
            />
            {/* Desktop Image */}
            <Image
              src={heroImages[currentSlide].desktop}
              alt="Hero"
              fill
              priority
              className="object-cover object-center hidden md:block"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full h-full flex items-center">
          {/* Text Content */}
          <div className="text-left max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.p
                  className="text-white/70 tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-2 md:mb-4 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  WALKDROBE
                </motion.p>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-none mb-1">
                  {slides[currentSlide].title}
                </h1>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-none mb-4 md:mb-6">
                  {slides[currentSlide].highlight}
                </h1>
                <p className="text-white/80 text-sm md:text-lg mb-6 md:mb-8 max-w-md">
                  {slides[currentSlide].subtitle}
                </p>
                <Link href={slides[currentSlide].link}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold tracking-wider hover:bg-gray-100 transition-all"
                  >
                    {slides[currentSlide].cta}
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-8 md:mt-12">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? "w-8 md:w-12 bg-white" : "w-4 md:w-6 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Arrows - Desktop only */}
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center transition-all"
        >
          <ArrowRight className="w-5 h-5 rotate-180 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center transition-all"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </section>
  );
}


// Categories Section - White Theme (Mobile Optimized)
function CategoriesSection() {
  // OPTIMIZED: Use card-only query - returns only: _id, itemId, name, price, mainImage, category
  const products = useQuery(api.products.getProductsForCards, { limit: 100 }) || [];
  
  // Build categories from actual products
  const categoryNames = ["All", "Sneakers", "Sports"];
  const categories = categoryNames.map(name => {
    const categoryProducts = products.filter(p => 
      (p.category || "").toLowerCase() === name.toLowerCase()
    );
    return {
      name,
      image: categoryProducts[0]?.mainImage || null,
      count: categoryProducts.length
    };
  }).filter(cat => cat.count > 0);

  // If no products yet, show placeholder categories
  const displayCategories = categories.length > 0 ? categories : categoryNames.map(name => ({
    name,
    image: null,
    count: 0
  }));

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
          {displayCategories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/shop?ct=${cat.name.toLowerCase()}`}>
                <div className="group relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-500">
                  {/* Category Image from Database - OPTIMIZED */}
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-700" />
                  )}

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

// Intro Video overlay shown on first visit/load
function VideoIntro({ videoSrc = "/asscet/intro-v1.mp4", onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Request only metadata first and assign src programmatically
    v.preload = "metadata";
    v.src = videoSrc;
    v.load();

    // Attempt autoplay (may be blocked by some browsers) but catch errors
    const p = v.play();
    if (p && p.catch) p.catch(() => {});

    return () => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch (e) {}
    };
  }, [videoSrc]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      <video
        ref={videoRef}
        preload="metadata"
        autoPlay
        muted
        playsInline
        onEnded={() => onClose && onClose()}
        className="w-full h-full object-cover"
      />
      <button
        onClick={() => onClose && onClose()}
        aria-label="Skip intro"
        className="absolute top-6 right-6 z-[10000] bg-black/60 text-white px-4 py-2 rounded-md backdrop-blur"
      >
        Skip
      </button>
    </motion.div>
  );
}

// Featured Products Section - White Theme (Mobile Optimized)
function FeaturedProducts() {
  const router = useRouter();
  // OPTIMIZED: Use card-only query - returns only: _id, itemId, name, price, mainImage, category
  const products = useQuery(api.products.getProductsForCards, { limit: 8 });

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
            products.map((product, idx) => (
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
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
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
              href="https://www.instagram.com/_walkdrobe.in_/"
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
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
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
                href="https://www.instagram.com/_walkdrobe.in_/"
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
              {["All", "Sneakers", "Sports"].map((item) => (
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
                { name: "Size Chart", href: "/size-chart" },
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
            © {new Date().getFullYear()} Walkdrobe. Made with Thilak-c ❤️ in Patna
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

// Style & Size Preference Popup - Redesigned for Maximum Engagement
function StylePopup({ onClose }) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    style: null,
    size: null,
  });

  const styles = [
    { id: "casual", label: "Casual", icon: Shirt },
    { id: "formal", label: "Formal", icon: Footprints },
    { id: "sporty", label: "Sporty", icon: Activity },
    { id: "trendy", label: "Trendy", icon: TrendingUp },
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
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-gray-900" : "bg-gray-200"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-gray-900" : "bg-gray-200"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">What's your style?</h3>
                <p className="text-gray-500 text-sm">Help us find your perfect pair</p>
              </div>
              
              {/* Style options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {styles.map((style) => {
                  const IconComponent = style.icon;
                  const isSelected = preferences.style === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setPreferences({ ...preferences, style: style.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        isSelected ? "bg-gray-900" : "bg-gray-100"
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          isSelected ? "text-white" : "text-gray-600"
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
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue →
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ruler className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">What's your size?</h3>
                <p className="text-gray-500 text-sm">Select your usual shoe size (UK)</p>
              </div>
              
              {/* Size selection */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setPreferences({ ...preferences, size })}
                    className={`w-11 h-11 rounded-full border-2 font-medium transition-all text-sm ${
                      preferences.size === size
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
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
                      ? "bg-gray-900 text-white hover:bg-gray-800"
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
  const [showIntro, setShowIntro] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if intro was already shown - only play once
  useEffect(() => {
    const introShown = localStorage.getItem("walkdrobe_intro_shown");
    if (!introShown) {
      setShowIntro(true);
    } else {
      setContentReady(true);
    }
  }, []);

  const handleIntroClose = () => {
    setShowIntro(false);
    localStorage.setItem("walkdrobe_intro_shown", "true");
  };

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
      <AnimatePresence onExitComplete={() => setContentReady(true)}>
        {showIntro && <VideoIntro onClose={handleIntroClose} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={contentReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Mobile Navbar - always visible */}
        <div className="xl:hidden">
          <NavbarMobile />
        </div>

        {/* Desktop: Minimal hero nav (Sneakers | Sports only) - hidden on scroll */}
        <div className={`hidden xl:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100'}`}>
          <div className="flex items-center justify-between px-8 py-4">
            {/* Logo */}
            <Link href="/">
              <img src="/logo.png" alt="Walkdrobe" className="h-8 opacity-90" />
            </Link>
            
            {/* Center: All | Sneakers | Sports */}
            <div className="flex items-center gap-8">
              <Link href="/shop" className="text-white font-semibold tracking-wider hover:opacity-80 transition-opacity text-sm">
                ALL
              </Link>
              <span className="text-white/40">|</span>
              <Link href="/shop?ct=sneakers" className="text-white font-semibold tracking-wider hover:opacity-80 transition-opacity text-sm">
                SNEAKERS
              </Link>
              <span className="text-white/40">|</span>
              <Link href="/shop?ct=sports" className="text-white font-semibold tracking-wider hover:opacity-80 transition-opacity text-sm">
                SPORTS
              </Link>
            </div>

            {/* Right spacer */}
            <div className="w-24"></div>
          </div>
        </div>

        {/* Desktop: Full navbar - visible on scroll with animation */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="hidden xl:block"
            >
              <Navbar />
            </motion.div>
          )}
        </AnimatePresence>

        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <StoreBanner />
        <TrendingSection />
        <Footer />
      </motion.div>

      {/* Style Preference Popup */}
      {/* <AnimatePresence>
        {showStylePopup && (
          <StylePopup onClose={() => {
            setShowStylePopup(false);
            localStorage.setItem("walkdrobe_popup_shown", "true");
          }} />
        )}
      </AnimatePresence> */}
    </div>
  );
}
