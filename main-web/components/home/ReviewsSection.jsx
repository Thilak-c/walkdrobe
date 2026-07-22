"use client";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    id: 1,
    name: "Furkan Khan",
    initials: "FK",
    time: "4 months ago",
    comment: "Osm product value for money",
    avatarBg: "bg-amber-100 text-amber-700"
  },
  {
    id: 2,
    name: "Thangkhosei Haokip",
    initials: "T",
    time: "4 months ago",
    comment: "Everyone should buy this.The quality is top notch",
    avatarBg: "bg-green-100 text-green-700"
  },
  {
    id: 3,
    name: "Gursimran Deep Singh",
    initials: "GS",
    time: "4 months ago",
    comment: "Good quality leather at affordable prices",
    avatarBg: "bg-blue-100 text-blue-700"
  },
  {
    id: 4,
    name: "ITS_SAURABH TRIPATHI",
    initials: "ST",
    time: "4 months ago",
    comment: "Best quality...",
    avatarBg: "bg-purple-100 text-purple-700"
  },
  {
    id: 5,
    name: "Rahul chaudhary",
    initials: "RC",
    time: "4 months ago",
    comment: "Juct like this product very nice full",
    avatarBg: "bg-orange-100 text-orange-700"
  }
];

export default function ReviewsSection() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="py-12 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-gray-400 text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase mb-1.5 font-inter">Feedback</p>
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 tracking-wide">
            Trusted Customer Reviews
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative group px-4">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full hidden md:flex items-center justify-center shadow-xs cursor-pointer hover:shadow-md transition-all duration-300"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Review Cards Scrollable list */}
          <div 
            ref={scrollRef}
            className="flex gap-5 md:gap-6 overflow-x-auto scroll-smooth py-4 no-scrollbar scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="min-w-[280px] md:min-w-[340px] flex-shrink-0 bg-[#FAF9F5] rounded-none p-8 border border-neutral-100/60 flex flex-col text-left transition-colors duration-300 relative"
              >
                {/* Top User Info & Google Logo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rev.avatarBg}`}>
                      {rev.initials}
                    </div>
                    <div>
                      <h4 className="text-gray-800 text-sm font-semibold leading-tight">{rev.name}</h4>
                      <span className="text-gray-400 text-[10px]">{rev.time}</span>
                    </div>
                  </div>
                  
                  {/* Google Logo (Colored SVG) */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>

                {/* Stars and Verified Badge */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none" />
                    ))}
                  </div>
                  <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[7px] font-bold shadow-xs">
                    ✓
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed flex-grow">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-full hidden md:flex items-center justify-center shadow-xs cursor-pointer hover:shadow-md transition-all duration-300"
            aria-label="Next reviews"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      </div>
    </section>
  );
}
