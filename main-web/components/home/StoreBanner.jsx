"use client";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export default function StoreBanner() {
  return (
    <section className="bg-gradient-to-r from-gray-100 via-white to-gray-100 py-10 md:py-12 relative border-y border-gray-200">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
