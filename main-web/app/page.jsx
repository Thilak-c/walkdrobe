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
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track scroll for navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loader-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Mobile Navbar - always visible */}
      <div className="xl:hidden">
        <NavbarMobile />
      </div>

      {/* Desktop: Minimal hero nav (Sneakers | Sports only) - hidden on scroll */}

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
      {/* <StoreBanner /> */}
      <TrendingSection />
      <Footer />
    </div>
  );
}