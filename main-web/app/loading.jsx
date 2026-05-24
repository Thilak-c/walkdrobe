"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50/40 flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Logo container with bounce */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <img 
            src="/logo.png" 
            alt="Walkdrobe Logo" 
            className="h-10 w-auto object-contain select-none pointer-events-none" 
          />
        </motion.div>

      
       
      </div>
    </div>
  );
}
