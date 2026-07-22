"use client";
import { Instagram } from "lucide-react";

export default function InstagramSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] border-t border-gray-100">
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <p className="text-gray-400 text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase mb-2 font-inter">
          IN THE SPOTLIGHT
        </p>
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-wide mb-8 font-light">
          Our Instagram
        </h2>

        {/* Follow Button */}
        <a
          href="https://www.instagram.com/_walkdrobe.in_/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-[#4285F4] hover:bg-[#3370D4] text-white px-9 py-4 rounded-none text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer font-inter shadow-xs"
        >
          <Instagram className="w-4.5 h-4.5" />
          <span>Follow on Instagram</span>
        </a>
      </div>

    </section>
  );
}
