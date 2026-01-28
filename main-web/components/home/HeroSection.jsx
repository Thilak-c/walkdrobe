"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const heroImages = [
  { mobile: "/hero-images/TAS_4282.webp", desktop: "/hero-images/TAS_4282landscape.webp" },
  { mobile: "/hero-images/TAS_4296.webp", desktop: "/hero-images/TAS_4296landscape.webp" },
  { mobile: "/hero-images/TAS_4315.webp", desktop: "/hero-images/TAS_4315landscape.webp" },
  { mobile: "/hero-images/TAS_4324.webp", desktop: "/hero-images/TAS_4324landscape.webp" },
  { mobile: "/hero-images/TAS_4337.webp", desktop: "/hero-images/TAS_4337landscape.webp" },
];

const slides = [
  { title: "STEP INTO", highlight: "STYLE", subtitle: "Premium footwear for the modern soul", cta: "Shop Now", link: "/shop" },
  { title: "NEW", highlight: "ARRIVALS", subtitle: "Discover the latest trends", cta: "Explore", link: "/shop?sort=newest" },
  { title: "EXCLUSIVE", highlight: "SNEAKERS", subtitle: "Limited edition drops", cta: "View", link: "/shop?ct=sneakers" },
  { title: "PREMIUM", highlight: "SPORTS", subtitle: "Performance meets style", cta: "Shop", link: "/shop?ct=sports" },
  { title: "WALK IN", highlight: "COMFORT", subtitle: "Quality you can feel", cta: "Discover", link: "/shop" },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  return (
    <section className="relative bg-white overflow-hidden h-screen">
      {/* Background Image Slider - All images rendered, only opacity changes */}
      <div className="absolute inset-0">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Mobile Image */}
            <Image
              src={img.mobile}
              alt="Hero"
              fill
              priority
              className="object-cover object-center md:hidden"
              sizes="100vw"
            />
            {/* Desktop Image */}
            <Image
              src={img.desktop}
              alt="Hero"
              fill
              priority
              className="object-cover object-center hidden md:block"
              sizes="100vw"
            />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>
removerem
      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full h-full flex items-center">
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
