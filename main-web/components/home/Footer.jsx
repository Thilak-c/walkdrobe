"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  Facebook, 
  Instagram, 
  Youtube, 
  ChevronUp,
  MessageSquare
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="bg-[#FAF9F5] text-gray-800 pt-16 pb-8 relative border-t border-gray-200/60">
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-200/60">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col items-start text-left">
            <div className="mb-4">
              <img 
                src="/logo.png" 
                alt="Walkdrobe Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 font-light">
              Walkdrobe is not just a shoe brand. It is a promise made from the factory floor to your doorstep.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-black text-[#FAF7E6] flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Facebook"
              >
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a 
                href="https://www.instagram.com/_walkdrobe.in_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-black text-[#FAF7E6] flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Instagram"
              >
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-black text-[#FAF7E6] flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="YouTube"
              >
                <Youtube className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Information Links */}
          <div className="flex flex-col items-start text-left">
            <h4 className="font-serif font-bold text-base tracking-wide border-b border-[#7A5C3E] pb-1 mb-6 text-gray-900 w-[80px]">
              Information
            </h4>
            <ul className="space-y-3.5 text-xs md:text-sm text-gray-600 font-medium tracking-wide font-inter">
              <li><Link href="/about" className="hover:text-[#7A5C3E] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#7A5C3E] transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-[#7A5C3E] transition-colors">Help Center</Link></li>
              <li><Link href="/size-chart" className="hover:text-[#7A5C3E] transition-colors">Size & Guide</Link></li>
              <li><Link href="/trust-transparency" className="hover:text-[#7A5C3E] transition-colors">Trust & Transparency</Link></li>
            </ul>
          </div>

          {/* Column 3: Policy Links */}
          <div className="flex flex-col items-start text-left">
            <h4 className="font-serif font-bold text-base tracking-wide border-b border-[#7A5C3E] pb-1 mb-6 text-gray-900 w-[50px]">
              Policy
            </h4>
            <ul className="space-y-3.5 text-xs md:text-sm text-gray-600 font-medium tracking-wide font-inter">
              <li><Link href="/policy/cancellation" className="hover:text-[#7A5C3E] transition-colors">Cancellation Policy</Link></li>
              <li><Link href="/policy/privacy" className="hover:text-[#7A5C3E] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/policy/return" className="hover:text-[#7A5C3E] transition-colors">Return Policy</Link></li>
              <li><Link href="/policy/shipping" className="hover:text-[#7A5C3E] transition-colors">Shipping Policy</Link></li>
              <li><Link href="/policy/terms" className="hover:text-[#7A5C3E] transition-colors">Terms and Conditions</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div className="flex flex-col items-start text-left text-xs md:text-sm text-gray-600 font-medium tracking-wide font-inter">
            <h4 className="font-serif font-bold text-base tracking-wide border-b border-[#7A5C3E] pb-1 mb-6 text-gray-900 w-[80px]">
              Contact Us
            </h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-gray-700 shrink-0 mt-0.5" />
                <span>Patna, Bihar, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-gray-700 shrink-0" />
                <a href="tel:+919122583392" className="hover:text-[#7A5C3E] transition-colors">+91 91225 83392</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-gray-700 shrink-0" />
                <a href="https://wa.me/919122583392" target="_blank" rel="noopener noreferrer" className="hover:text-[#7A5C3E] transition-colors">+91 91225 83392 (WhatsApp)</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-gray-700 shrink-0" />
                <a href="mailto:support@walkdrobe.in" className="hover:text-[#7A5C3E] transition-colors">support@walkdrobe.in</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4.5 h-4.5 text-gray-700 shrink-0 mt-0.5" />
                <span>Monday to Saturday | 9:00 AM – 9:00 PM (IST)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Copyright */}
          <p className="text-xs text-gray-500 font-light">
            © 2026 Walkdrobe. Powered by{" "}
            <a
              href="https://flowify.agency/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-medium text-gray-700 transition-colors"
            >
              Flowify Agency
            </a>
          </p>

          {/* Payment Icons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Visa */}
            <div className="border border-neutral-200 text-neutral-400 rounded-none px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">VISA</div>
            {/* Mastercard */}
            <div className="border border-neutral-200 text-neutral-400 rounded-none px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">MASTERCARD</div>
            {/* Rupay */}
            <div className="border border-neutral-200 text-neutral-400 rounded-none px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">RUPAY</div>
            {/* UPI */}
            <div className="border border-neutral-200 text-neutral-400 rounded-none px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">UPI</div>
            {/* Cod */}
            <div className="border border-neutral-200 text-neutral-400 rounded-none px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">COD AVAILABLE</div>
          </div>

        </div>
      </div>

      {/* Floating Elements: Animated WhatsApp chat badge & Scroll-to-top (Homepage Only) */}
      {isHomePage && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3 items-end">
            
            {/* WhatsApp Float with Hover Tooltip */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="relative group"
            >
              {/* Hover Tooltip */}
              <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-[11px] font-bold font-inter px-3 py-1.5 rounded-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md pointer-events-none">
                Chat on WhatsApp
              </span>

              {/* Floating WhatsApp Action Link */}
              <motion.a 
                href="https://wa.me/919122583392?text=Hi%20Walkdrobe!%20I%20have%20a%20question%20about%20a%20product." 
                target="_blank" 
                rel="noopener noreferrer"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:shadow-2xl cursor-pointer"
                aria-label="Chat on WhatsApp"
              >
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.982L2 22l5.202-1.362a9.92 9.92 0 004.814 1.248h.005c5.505 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.18-2.92-7.062A9.925 9.925 0 0012.012 2zm5.7 14.172c-.293.82-1.702 1.562-2.345 1.633-.57.062-1.312.285-3.805-.742-3.188-1.31-5.234-4.56-5.394-4.773-.16-.213-1.282-1.709-1.282-3.26 0-1.551.81-2.31 1.1-2.612.29-.302.637-.378.85-.378.212 0 .425.004.609.012.19.008.444-.072.696.537.254.617.869 2.122.944 2.274.075.152.126.33.025.53-.1.203-.152.33-.303.507-.152.177-.319.394-.455.53-.153.15-.312.314-.135.617.177.3.788 1.3 1.69 2.102.114.101.996.883 1.737.994.394.06.613-.027.818-.266.205-.24.877-1.02 1.11-1.37.234-.35.467-.29.77-.176.302.114 1.916.903 2.247 1.068.33.165.55.244.63.38.08.138.08.802-.213 1.622z"/>
                </svg>
              </motion.a>
            </motion.div>

            {/* Scroll To Top with Spring Entrance & Exit Animation */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button 
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToTop}
                  className="w-10 h-10 rounded-full bg-white text-gray-800 border border-gray-200 flex items-center justify-center shadow-md cursor-pointer"
                  aria-label="Scroll to top"
                >
                  <ChevronUp className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

    </footer>
  );
}
