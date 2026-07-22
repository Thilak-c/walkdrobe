"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { ShieldCheck, Truck, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_CONFIG = {
  sports: {
    key: "Sports",
    title: "Sports Shoes",
    badge: "PERFORMANCE & ATHLETICS",
    tagline: "Engineered for maximum endurance, superior cushioning, and peak athletic performance on every terrain.",
    heroImg: "/haha-removebg-preview__1_-removebg-preview.png",
    bannerImg: "/hero-images/TAS_4296landscape.webp",
    featuredItemId: "WD2026-024",
    subcategories: ["All", "Recommended", "Trending", "Most Popular", "Most Loved"],
    fallbacks: [
      {
        _id: "sp1",
        itemId: "WD2026-074",
        name: "Magic FF Turbo",
        category: "Sports",
        price: 3399,
        originalPrice: 4500,
        discount: 24,
        views: 1250,
        buys: 420,
        wishlistCount: 380,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122453874.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sp2",
        itemId: "WD2026-073",
        name: "Nike Zoompro",
        category: "Sports",
        price: 3599,
        originalPrice: 5000,
        discount: 28,
        views: 3890,
        buys: 980,
        wishlistCount: 650,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122209478.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sp3",
        itemId: "WD2026-070",
        name: "Magic Speed FF Turbo",
        category: "Sports",
        price: 3399,
        originalPrice: 4500,
        discount: 24,
        views: 940,
        buys: 310,
        wishlistCount: 780,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779121222389.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sp4",
        itemId: "WD2026-068",
        name: "Under Armour (Black)",
        category: "Sports",
        price: 3499,
        originalPrice: 5000,
        discount: 30,
        views: 3100,
        buys: 640,
        wishlistCount: 1420,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779119714389.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sp5",
        itemId: "WD2026-037",
        name: "Adidas Adizero Pro-4",
        category: "Sports",
        price: 3799,
        originalPrice: 5000,
        discount: 24,
        views: 1800,
        buys: 520,
        wishlistCount: 410,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779015432350.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sp6",
        itemId: "WD2026-065",
        name: "Puma Nitro Velocity",
        category: "Sports",
        price: 3299,
        originalPrice: 4600,
        discount: 28,
        views: 1420,
        buys: 290,
        wishlistCount: 310,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779103484599.png",
        availableSizes: ["6", "7", "8", "9"]
      }
    ]
  },
  sneakers: {
    key: "Sneakers",
    title: "Sneakers",
    badge: "LIFESTYLE & CLASSICS",
    tagline: "Step into effortless style with iconic designs, premium craftsmanship, and daily streetwear comfort.",
    heroImg: "/test-removebg-preview__1_-removebg-preview.png",
    bannerImg: "/hero-images/TAS_4315landscape.webp",
    featuredItemId: "WD2026-024",
    subcategories: ["All", "Recommended", "Trending", "Most Popular", "Most Loved"],
    fallbacks: [
      {
        _id: "sn1",
        itemId: "WD2026-035",
        name: "Adidas Samba",
        category: "Sneakers",
        price: 2899,
        originalPrice: 4000,
        discount: 27,
        views: 4500,
        buys: 1200,
        wishlistCount: 1100,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779015002093.png",
        availableSizes: ["6", "7", "8", "9", "10"]
      },
      {
        _id: "sn2",
        itemId: "WD2026-041",
        name: "Nike Air Force 1 '07",
        category: "Sneakers",
        price: 3299,
        originalPrice: 4500,
        discount: 26,
        views: 3800,
        buys: 980,
        wishlistCount: 1650,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779101794905.png",
        availableSizes: ["6", "7", "8", "9", "10"]
      },
      {
        _id: "sn3",
        itemId: "WD2026-042",
        name: "Jordan 1 Retro Low",
        category: "Sneakers",
        price: 4199,
        originalPrice: 5800,
        discount: 27,
        views: 2900,
        buys: 750,
        wishlistCount: 890,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779014572832.png",
        availableSizes: ["7", "8", "9", "10"]
      },
      {
        _id: "sn4",
        itemId: "WD2026-043",
        name: "New Balance 550",
        category: "Sneakers",
        price: 3499,
        originalPrice: 4800,
        discount: 27,
        views: 2100,
        buys: 620,
        wishlistCount: 710,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779103143411.png",
        availableSizes: ["6", "7", "8", "9", "10"]
      },
      {
        _id: "sn5",
        itemId: "WD2026-044",
        name: "Converse Chuck 70",
        category: "Sneakers",
        price: 2699,
        originalPrice: 3600,
        discount: 25,
        views: 1850,
        buys: 510,
        wishlistCount: 460,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122453874.png",
        availableSizes: ["6", "7", "8", "9", "10"]
      },
      {
        _id: "sn6",
        itemId: "WD2026-045",
        name: "Nike Dunk Low Retro",
        category: "Sneakers",
        price: 3699,
        originalPrice: 5000,
        discount: 26,
        views: 3400,
        buys: 870,
        wishlistCount: 980,
        mainImage: "https://insys.walkdrobe.in/api/uploads/product_1779122209478.png",
        availableSizes: ["7", "8", "9", "10"]
      }
    ]
  }
};

export default function CategoryView({ categorySlug = "sports" }) {
  const router = useRouter();
  const slug = categorySlug.toLowerCase();
  const config = CATEGORY_CONFIG[slug] || CATEGORY_CONFIG.sports;

  const [activeSub, setActiveSub] = useState("All");

  // Fetch live products from Convex DB for this category
  const dbProducts = useQuery(api.products.getProductsForShop, {
    category: config.key,
    limit: 60,
  });

  // Use DB products if available, fallback to rich defaults
  const rawProducts = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p, idx) => {
        const discountOptions = [24, 28, 27, 30, 25, 26, 32, 22, 29];
        const discount = p.discount || discountOptions[idx % discountOptions.length];
        const originalPrice = p.originalPrice || Math.round(p.price / (1 - discount / 100));
        
        // Generate distinct ranking metrics if DB fields are empty/0
        const idNum = parseInt((p.itemId || "").replace(/\D/g, "")) || (idx + 1) * 17;
        const views = p.views || ((idNum * 137) % 4500) + 500;
        const buys = p.buys || p.inCart || ((idNum * 83) % 1100) + 100;
        const wishlistCount = p.wishlistCount || ((idNum * 199) % 1400) + 200;

        return {
          ...p,
          discount,
          originalPrice,
          views,
          buys,
          wishlistCount,
          availableSizes: p.availableSizes || ["7", "8", "9", "10"]
        };
      });
    }
    return config.fallbacks;
  }, [dbProducts, config]);

  // Filter & Sort Products based on Selected Tab
  const displayedProducts = useMemo(() => {
    let result = [...rawProducts];

    if (activeSub === "Recommended") {
      // Sort by highest discount / recommendation score
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (activeSub === "Trending") {
      // Sort by view count descending
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (activeSub === "Most Popular") {
      // Sort by purchase/buys count descending
      result.sort((a, b) => (b.buys || 0) - (a.buys || 0));
    } else if (activeSub === "Most Loved") {
      // Sort by wishlist count descending
      result.sort((a, b) => (b.wishlistCount || 0) - (a.wishlistCount || 0));
    }

    return result;
  }, [rawProducts, activeSub]);

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Navbar */}
      <div className="xl:hidden">
        <NavbarMobile />
      </div>

      {/* Desktop Navbar */}
      <div className="hidden xl:block">
        <Navbar />
      </div>

      {/* High-Fashion Editorial Hero Section */}
      <section className="bg-[#FAF8F5] pt-20 sm:pt-24 md:pt-28 border-b border-gray-200/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 pt-6 pb-2 font-inter">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 capitalize font-medium">{config.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-8 lg:py-12">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col text-left">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-3 font-inter">
                {config.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900 font-light tracking-wide leading-tight mb-4">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-light font-inter leading-relaxed max-w-lg mb-8">
                {config.tagline}
              </p>

              {/* Minimalist Trust Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-gray-200/80 font-inter">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-900 whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <span>100% Authentic</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-light truncate">Verified Quality</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-900 whitespace-nowrap">
                    <Truck className="w-4 h-4 text-blue-800 flex-shrink-0" />
                    <span>Fast Shipping</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-light truncate">All-India Delivery</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-900 whitespace-nowrap">
                    <RotateCcw className="w-4 h-4 text-amber-800 flex-shrink-0" />
                    <span>Easy Exchange</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-light truncate">Hassle-Free Returns</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Showcase Column */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div 
                className="relative w-full aspect-[16/10] lg:aspect-[4/3] rounded-xs overflow-hidden shadow-xl bg-gray-100 group cursor-pointer"
                onClick={() => handleProductClick(config.featuredItemId || "WD2026-024")}
              >
                <img
                  src={config.bannerImg}
                  alt={config.title}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                />
                
                {/* Floating Product Badge overlay */}
                <div className="absolute bottom-0 left-0 sm:bottom-6 sm:left-6 bg-white/0 backdrop-blur-md sm:p-4 rounded-sm flex items-center gap-4 transition-transform duration-300 group-hover:scale-102">
                  <div className="w-12 h-12 bg-gray-100 rounded-xs flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                    <img src={config.heroImg} alt={config.title} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 font-inter block">Featured</span>
                    <h4 className="text-xs font-serif font-bold text-gray-900">{config.title} Edition</h4>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-6 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          
          {/* Controls Bar: Subcategories / Metric Filters (All, Trending, Most Popular, Most Loved) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 md:pb-8 mb-6 md:mb-8 border-b border-gray-100">
            {/* Filter Pills with Horizontal Swipe for Phones */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-inter mr-1 hidden md:inline">
                Filter:
              </span>
              {config.subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSub(sub)}
                  className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-sm text-[11px] md:text-xs font-medium font-inter transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 ${
                    activeSub === sub
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-gray-100/60 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Item Count Info */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-[11px] md:text-xs font-inter text-gray-500">
              <span>Showing <strong>{displayedProducts.length}</strong> items</span>
            </div>
          </div>

          {/* Product Grid */}
          {displayedProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p className="text-sm md:text-base font-medium">No products found in this filter.</p>
              <button 
                onClick={() => setActiveSub("All")} 
                className="mt-2 text-xs text-black underline font-semibold cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-7 md:gap-y-10">
              {displayedProducts.map((product, idx) => (
                <motion.div
                  key={product._id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (idx % 4) * 0.04 }}
                  className="group flex flex-col bg-white overflow-hidden cursor-pointer"
                  onClick={() => handleProductClick(product.itemId)}
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden mb-2.5 bg-gray-100/60 aspect-[4/5] rounded-xs">
                    {product.discount && (
                      <span className="absolute top-2 left-2 z-10 bg-neutral-900 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider font-inter">
                        {product.discount}% OFF
                      </span>
                    )}

                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col flex-grow text-left">
                    <h3 className="text-gray-900 font-medium text-xs md:text-sm tracking-wide line-clamp-1 mb-1 font-inter group-hover:text-black">
                      {product.name}
                    </h3>

                    {/* Price Info */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-gray-900 text-xs md:text-sm font-semibold font-inter">
                        ₹{product.price?.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-gray-400 text-[10px] md:text-xs line-through font-inter">
                          ₹{product.originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
