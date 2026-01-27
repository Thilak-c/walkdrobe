"use client";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 overflow-hidden">
      {/* Top CTA Section */}
      <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 py-10 md:py-12 relative border-y border-gray-200">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Step Into Style</h3>
              <p className="text-gray-500 text-sm">Visit our store in Patna or shop online</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/_walkdrobe.in_/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Follow @walkdrobe.in
              </a>
              {/* <a
                href="tel:9122583392"
                className="flex items-center gap-2 border-2 border-gray-900 text-gray-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </a> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo.png" alt="Walkdrobe" width={120} height={32} className="h-7 w-auto mb-4" />
            <p className="text-gray-500 text-sm leading-relaxed">
              Premium footwear for every step of your journey.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {["All", "Sneakers", "Sports"].map((item) => (
                <li key={item}>
                  <Link href={`/shop?ct=${item.toLowerCase()}`} className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Help</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Size Chart", href: "/size-chart" },
                { name: "Track Order", href: "/track-order" },
                { name: "Contact Us", href: "/contact" },
                { name: "FAQ", href: "/faq" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="text-gray-900 font-semibold text-sm mb-4">Visit Us</h4>
            <div className="space-y-2 text-gray-500 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                Patna, Bihar
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                11AM - 9PM
              </p>
              <p className="text-gray-400 text-xs pl-6">Wednesday Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Walkdrobe. Made with ❤️ by{" "}
            <a 
              href="https://wa.me/918008439762" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Thilak-c
            </a>
            {" "}in Patna
          </p>
          <div className="flex gap-5 text-gray-400 text-xs">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
