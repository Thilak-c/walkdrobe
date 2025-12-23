"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler } from "lucide-react";

const SIZE_CHART_DATA = [
  { euro: 36, uk: 3, cm: 22 },
  { euro: 37, uk: 4, cm: 23 },
  { euro: 38, uk: 4.5, cm: 23.5 },
  { euro: 39, uk: 5.5, cm: 24.5 },
  { euro: 40, uk: 6, cm: 25 },
  { euro: 41, uk: 7, cm: 26 },
  { euro: 42, uk: 7.5, cm: 26.5 },
  { euro: 43, uk: 8.5, cm: 27.5 },
  { euro: 44, uk: 9, cm: 28 },
  { euro: 45, uk: 10, cm: 29 },
];

export default function SizeChart({ isOpen, onClose, showHeader = true }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Shoes Size Chart</h3>
                  <p className="text-gray-500 text-sm mt-1">Find your perfect fit</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Size Chart Table */}
            <div className="border-2 border-gray-900 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-900">
                    <th className="py-4 px-4 text-left font-bold text-gray-900 border-r border-gray-900">EURO</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-900 border-r border-gray-900">UK</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-900">CM</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {SIZE_CHART_DATA.map((row, index) => (
                    <tr
                      key={row.euro}
                      className={`border-b border-gray-900 ${index === SIZE_CHART_DATA.length - 1 ? "" : ""}`}
                    >
                      <td className="py-4 px-4 font-medium text-gray-900 border-r border-gray-900">{row.euro}</td>
                      <td className="py-4 px-4 font-medium text-gray-900 border-r border-gray-900">{row.uk}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* How to Measure Section */}
            <div className="bg-gray-50 rounded-2xl p-5 mt-6">
              <h4 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                How to Measure
              </h4>
              <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                <li>Stand on a piece of paper with your heel against a wall</li>
                <li>Mark the longest part of your foot</li>
                <li>Measure the distance in centimeters (CM)</li>
                <li>Use the chart above to find your corresponding size</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> If you're between sizes, we recommend going up a size for a more comfortable fit.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export the size chart data for use in other components
export { SIZE_CHART_DATA };

