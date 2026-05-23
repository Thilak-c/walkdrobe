"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  className = "",
  align = "left", // "left" or "right" or "full"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => 
    typeof opt === "object" ? opt.value === value : opt === value
  );

  const selectedLabel = selectedOption
    ? (typeof selectedOption === "object" ? selectedOption.label : selectedOption)
    : placeholder;

  const selectedIcon = selectedOption && typeof selectedOption === "object" ? selectedOption.icon : null;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${align === "full" ? "w-full" : ""} ${className}`}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold text-slate-700 transition-all focus:outline-none cursor-pointer w-full text-left"
        >
          <span className="flex items-center gap-1.5 truncate">
            {selectedIcon && <span className="shrink-0 text-slate-500">{selectedIcon}</span>}
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronDown
            size={13}
            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-30 mt-1.5 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden focus:outline-none ${
              align === "right" ? "right-0" : align === "left" ? "left-0" : "left-0 right-0"
            } ${align !== "full" ? "min-w-[140px]" : "w-full"}`}
          >
            <div className="py-1 max-h-60 overflow-y-auto divide-y divide-slate-50">
              {options.map((option, idx) => {
                const optValue = typeof option === "object" ? option.value : option;
                const optLabel = typeof option === "object" ? option.label : option;
                const optIcon = typeof option === "object" ? option.icon : null;
                const isSelected = optValue === value;

                return (
                  <button
                    key={`${optValue}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-3.5 py-2.5 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {optIcon && <span className={`shrink-0 ${isSelected ? "text-white" : "text-slate-450"}`}>{optIcon}</span>}
                    <span className="truncate">{optLabel}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
