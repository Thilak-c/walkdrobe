"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export default function FooterSimple() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image src="/logo.png" alt="Walkdrobe" width={140} height={36} className="h-8 w-auto mb-4" />
            <p className="text-gray-600 text-sm mb-4 max-w-sm">
              Step into style with Patna's premium footwear destination. Quality shoes for every occasion.
            </p>
            <a
              href="https://instagram.com/walkdrobe.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-black font-semibold text-sm mb-3 tracking-wider">SHOP</h4>
            <ul className="space-y-2">
              {["Sneakers", "Boots", "Sandals", "Formal"].map((item) => (
                <li key={item}>
                  <Link href={`/shop?ct=${item.toLowerCase()}`} className="text-gray-500 hover:text-black transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-black font-semibold text-sm mb-3 tracking-wider">HELP</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/size-chart" className="text-gray-500 hover:text-black transition-colors text-sm">
                  Size Chart
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-gray-500 hover:text-black transition-colors text-sm">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-500 hover:text-black transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:text-black transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-black font-semibold text-sm mb-3 tracking-wider">CONTACT</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Patna, Bihar
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                9122583392
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                11 AM - 9 PM
              </li>
              <li className="text-gray-400 text-xs pl-6">Wednesday Closed</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Walkdrobe. All rights reserved.
          </p>
          <div className="flex gap-4 text-gray-400 text-xs">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
