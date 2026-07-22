"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F5F2EB] overflow-hidden">
          
          {/* Left Content Column */}
          <div className="flex flex-col justify-center p-8 md:p-16 lg:p-20 text-left">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-3 block font-inter">
              New Arrival
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-gray-900 tracking-wider mb-6 font-light leading-tight">
              SPORTS SHOES
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-light leading-relaxed mb-8 max-w-md font-inter">
              Designed for performance, durability, and daily comfort. Whether you're hitting the gym, the pavement, or navigating the city, experience the perfect balance of engineering and aesthetics.
            </p>
            <div>
              <Link href="/shop?ct=sports">
                <button className="inline-flex items-center gap-3 border border-neutral-900 bg-neutral-900 hover:bg-transparent hover:text-neutral-900 text-white px-8 py-3.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 group cursor-pointer font-inter rounded-none">
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="relative aspect-[4/3] md:aspect-auto min-h-[300px] bg-gray-100 overflow-hidden">
            <img 
              src="/hero-images/TAS_4296landscape.webp" 
              alt="Sports Shoes Showcase" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-103"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
