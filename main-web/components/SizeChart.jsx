"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Footprints, CheckCircle2 } from "lucide-react";

const SIZE_CHART_DATA = [
  { uk: "6", us: "7", euro: "40", cm: "24.5" },
  { uk: "7", us: "8", euro: "41", cm: "25.4" },
  { uk: "8", us: "9", euro: "42", cm: "26.2" },
  { uk: "9", us: "10", euro: "43", cm: "27.1" },
  { uk: "10", us: "11", euro: "44", cm: "27.9" },
  { uk: "11", us: "12", euro: "45", cm: "28.8" },
];

export default function SizeChart({ isOpen, onClose, showHeader = true }) {
  const [activeUnit, setActiveUnit] = useState("all");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-t-2xl sm:rounded-none p-4 sm:p-8 max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 text-left font-inter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {showHeader && (
              <div className="flex items-start justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-neutral-900" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 font-inter">
                      Walkdrobe Fit Guide
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-serif text-gray-900 font-light">
                    Footwear Size Chart
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-inter mt-0.5">
                    UK, US, EU, and Foot Length (CM) conversions
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Horizontal Swipeable Unit Filter Pills for Mobile Phones */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-1 px-1 scrollbar-none">
              {[
                { id: "all", label: "All Units" },
                { id: "uk", label: "UK / IN" },
                { id: "us", label: "US" },
                { id: "euro", label: "EU" },
                { id: "cm", label: "CM (Length)" },
              ].map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => setActiveUnit(unit.id)}
                  className={`px-3 py-1.5 rounded-xs text-[11px] sm:text-xs font-semibold tracking-wider font-inter transition-all duration-200 whitespace-nowrap active:scale-95 ${
                    activeUnit === unit.id
                      ? "bg-neutral-900 text-white"
                      : "bg-gray-100/90 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>

            {/* Size Chart Table (Responsive Grid for Mobile) */}
            <div className="overflow-x-auto border border-gray-200 rounded-none mb-6 shadow-2xs">
              <table className="w-full text-xs font-inter text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-gray-100/80 border-b border-gray-200 font-bold uppercase tracking-wider text-gray-900 text-[9px] sm:text-[10px]">
                    <th className="py-2.5 px-3 border-r border-gray-200 bg-gray-200/50">UK / IN</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">US</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">EU</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Length</th>
                    <th className="py-2.5 px-3">Fit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {SIZE_CHART_DATA.map((row) => (
                    <tr
                      key={row.uk}
                      className="hover:bg-gray-50 transition-colors font-medium text-[11px] sm:text-xs"
                    >
                      <td className="py-2.5 px-3 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50">
                        UK {row.uk}
                      </td>
                      <td className="py-2.5 px-3 border-r border-gray-200">{row.us}</td>
                      <td className="py-2.5 px-3 border-r border-gray-200">{row.euro}</td>
                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono text-gray-900">
                        {row.cm} cm
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold text-[10px] sm:text-[11px] whitespace-nowrap">
                        True to Size
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* How to Measure Step-by-Step for Phones */}
            <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-gray-200/80 rounded-none mb-4 text-left">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-gray-800" />
                How to Measure Your Foot
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] sm:text-xs text-gray-600">
                <div className="flex gap-2.5 items-start">
                  <span className="w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Stand Against Wall</strong>
                    <span className="leading-tight">Place paper on floor against a flat wall. Stand with heel against wall.</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Mark Longest Point</strong>
                    <span className="leading-tight">Mark the tip of your longest toe on the paper with a pencil.</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Measure CM Distance</strong>
                    <span className="leading-tight">Measure distance in centimeters (CM) from wall edge to toe mark.</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Find Your Size</strong>
                    <span className="leading-tight">Match your CM reading to the chart above for your exact shoe size.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Tip Banner */}
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5 mb-5 text-left">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-emerald-900 font-inter leading-relaxed">
                <strong>Tip:</strong> All shoes fit <strong>True to Size</strong>. If between sizes, choose half a size larger.
              </p>
            </div>

            {/* Phone Friendly Close Button */}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider font-inter transition-colors active:scale-98"
            >
              Close Guide
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { SIZE_CHART_DATA };
