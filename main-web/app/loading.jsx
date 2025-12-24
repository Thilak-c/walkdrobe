"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-end gap-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-3 h-3 rounded-full bg-gray-900"
              animate={{ y: [0, -12, 0] }}
              transition={{ delay: i * 0.12, repeat: Infinity, duration: 0.6 }}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium tracking-wider">WALKDROBE</p>
          <p className="text-gray-400 text-xs mt-1">Loading</p>
        </div>
      </div>
    </div>
  );
}
