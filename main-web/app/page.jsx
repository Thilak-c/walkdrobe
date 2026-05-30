"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import StoreBanner from "@/components/home/StoreBanner";
import TrendingSection from "@/components/home/TrendingSection";
import Footer from "@/components/home/Footer";

const heroImages = [
  { mobile: "/hero-images/TAS_4282.webp", desktop: "/hero-images/TAS_4282landscape.webp" },
  { mobile: "/hero-images/TAS_4296.webp", desktop: "/hero-images/TAS_4296landscape.webp" },
  { mobile: "/hero-images/TAS_4315.webp", desktop: "/hero-images/TAS_4315landscape.webp" },
  { mobile: "/hero-images/TAS_4324.webp", desktop: "/hero-images/TAS_4324landscape.webp" },
  { mobile: "/hero-images/TAS_4337.webp", desktop: "/hero-images/TAS_4337landscape.webp" },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // Preload all hero images before showing content
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const imagesToLoad = heroImages.map(img => isMobile ? img.mobile : img.desktop);
    
    let loadedCount = 0;
    const totalImages = imagesToLoad.length;

    imagesToLoad.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setTimeout(() => setIsLoading(false), 300);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setTimeout(() => setIsLoading(false), 300);
        }
      };
    });

    // Fallback: if images take too long, show content anyway after 5 seconds
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Show only loading screen while loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/40 relative overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* Logo container with bounce */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <img 
              src="/logo.png" 
              alt="Walkdrobe Logo" 
              className="h-10 w-auto object-contain  select-none pointer-events-none" 
            />
          </motion.div>

          {/* Premium dynamic shadow under the logo that scales with bounce */}
          <motion.div
            animate={{
              scaleX: [1, 0.6, 1],
              opacity: [0.4, 0.15, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-1.5 bg-slate-900/10 rounde blur-xs mt-0.5 mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Mobile Navbar - always visible */}
      <div className="xl:hidden">
        <NavbarMobile />
      </div>

      {/* Desktop: Full navbar */}
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      {/* <StoreBanner /> */}
      <TrendingSection />
      <Footer />
    </div>
  );
}