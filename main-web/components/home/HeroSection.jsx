"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const heroImages = [
  { mobile: "/hero-images/TAS_4282.webp", desktop: "/hero-images/TAS_4282landscape.webp" },
  { mobile: "/hero-images/TAS_4296.webp", desktop: "/hero-images/TAS_4296landscape.webp" },
  { mobile: "/hero-images/TAS_4315.webp", desktop: "/hero-images/TAS_4315landscape.webp" },
  { mobile: "/hero-images/TAS_4324.webp", desktop: "/hero-images/TAS_4324landscape.webp" },
  { mobile: "/hero-images/TAS_4337.webp", desktop: "/hero-images/TAS_4337landscape.webp" },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-white pt-24 pb-0 overflow-hidden w-full flex flex-col items-center">
      {/* Slider Container - Full Width Proportional Aspect Ratio Box (16:9) */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Unified Desktop Image (Used for all screens) */}
            <div className="relative w-full h-full">
              <Image
                src={heroImages[currentSlide].desktop}
                alt={`Slide ${currentSlide + 1}`}
                fill
                priority
                className="object-cover object-center animate-pulse-once"
                sizes="100vw"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators (Dots) below the image container */}
    
    </section>
  );
}
