"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomDropdown({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-56">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full bg-white border rounded-xl px-4 py-2 flex justify-between items-center shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-black`}
      >
        <span className={`truncate ${selected ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
          {selected || `Select ${label}`}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 text-gray-500"
        >
          ▼
        </motion.span>
      </button>

      {/* Options */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-20 mt-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden"
          >
            {options.map((opt) => (
              <motion.li
                key={opt}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                whileHover={{ scale: 1.02, backgroundColor: "#f3f4f6" }}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  opt === selected ? "bg-gray-100 font-semibold text-gray-700" : "text-gray-700"
                }`}
              >
                {opt}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
