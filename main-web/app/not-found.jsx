"use client";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, Frown, Sparkles, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    // Set actual window size on client
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, #f3f4f6 0%, #ffffff 50%)",
            "radial-gradient(circle at 80% 50%, #f3f4f6 0%, #ffffff 50%)",
            "radial-gradient(circle at 50% 80%, #f3f4f6 0%, #ffffff 50%)",
            "radial-gradient(circle at 20% 50%, #f3f4f6 0%, #ffffff 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Mouse Follower Glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)",
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      {/* Floating Elements */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
          }}
          animate={{
            y: [null, Math.random() * windowSize.height],
            x: [null, Math.random() * windowSize.width],
            rotate: [0, 360],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {i % 3 === 0 ? (
            <Sparkles className="w-3 h-3 text-gray-400" />
          ) : i % 3 === 1 ? (
            <ShoppingBag className="w-3 h-3 text-gray-400" />
          ) : (
            <TrendingUp className="w-3 h-3 text-gray-400" />
          )}
        </motion.div>
      ))}

      <div className="max-w-4xl w-full text-center relative z-10">
        {/* Glitch Effect 404 */}
        <div className="mb-6 relative">
          <motion.h1
            className="text-[80px] md:text-[120px] font-normal leading-none relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <motion.span
              className="absolute inset-0 text-red-300"
              animate={{
                x: [-1, 1, -1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              404
            </motion.span>
            <motion.span
              className="absolute inset-0 text-blue-300"
              animate={{
                x: [1, -1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
            >
              404
            </motion.span>
            <span className="relative z-10">404</span>
          </motion.h1>
        </div>

        {/* Sad Face Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Frown className="w-20 h-20 mx-auto text-white" />
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-4"
            animate={{
              backgroundImage: [
                "linear-gradient(45deg, #fff 0%, #888 100%)",
                "linear-gradient(45deg, #888 0%, #fff 100%)",
                "linear-gradient(45deg, #fff 0%, #888 100%)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Lost in Style
          </motion.h2>
          <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto">
            Looks like this page went shopping and never came back! 
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="group relative px-8 py-4 bg-white text-black rounded-full text-sm font-bold overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </span>
          </motion.button>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255,255,255,0.5)" }}
              whileTap={{ scale: 0.9 }}
              className="px-8 py-4 bg-gradient-to-r from-gray-800 to-black border-2 border-white text-white rounded-full text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Take Me Home
              </span>
            </motion.button>
          </Link>

          <Link href="/shop">
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.9 }}
              className="px-8 py-4 bg-white text-black rounded-full text-sm font-bold"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Explore Shop
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {[
            { name: "New Arrivals", href: "/shop" },
            { name: "Best Sellers", href: "/shop" },
            { name: "Track Order", href: "/track-order" },
            { name: "Contact", href: "/contact" },
          ].map((link, index) => (
            <Link key={link.href} href={link.href}>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.1, backgroundColor: "#ffffff", color: "#000000" }}
                className="px-4 py-2 border border-white/30 text-white/70 rounded-full text-xs font-normal hover:border-white transition-all duration-300 cursor-pointer inline-block"
              >
                {link.name}
              </motion.span>
            </Link>
          ))}
        </motion.div>

        {/* Fun Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 2, duration: 3, repeat: Infinity }}
          className="mt-12 text-xs text-gray-600 italic"
        >
          "Error 404: Fashion sense found, page not found."
        </motion.p>
      </div>
    </div>
  );
}
