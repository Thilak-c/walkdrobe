"use client";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PromoBanner from "@/components/home/PromoBanner";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ReviewsSection from "@/components/home/ReviewsSection";
import ReelsSection from "@/components/home/ReelsSection";
import InstagramSection from "@/components/home/InstagramSection";
import Footer from "@/components/home/Footer";

export default function Home() {
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

      {/* Sections assembled in reference website order */}
      <HeroSection />
      <CategoriesSection />
      <PromoBanner />
      <FeaturedProducts />
      <ReviewsSection />
      <ReelsSection />
      <InstagramSection />
      <Footer />
    </div>
  );
}