"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ruler } from "lucide-react";
import SizeChart from "@/components/SizeChart";

export default function SizeChartPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Size Chart</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ruler className="w-10 h-10 text-gray-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shoes Size Chart
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive size guide. Use the chart below to determine your correct shoe size.
          </p>
        </div>

        {/* Size Chart Component */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl overflow-hidden shadow-lg mb-8">
          <div className="bg-gray-50 border-b-2 border-gray-900 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Size Conversion Chart</h2>
            <p className="text-gray-600 text-sm mt-1">EURO, UK, and CM measurements</p>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-900">
                  <th className="py-4 px-4 text-left font-bold text-gray-900 border-r border-gray-900">EURO</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-900 border-r border-gray-900">UK</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-900">CM</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
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
                ].map((row, index) => (
                  <tr
                    key={row.euro}
                    className={`border-b border-gray-900 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 border-r border-gray-900">{row.euro}</td>
                    <td className="py-4 px-4 font-medium text-gray-900 border-r border-gray-900">{row.uk}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to Measure Section */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Ruler className="w-6 h-6" />
            How to Measure Your Foot
          </h3>
          <ol className="text-gray-700 text-sm md:text-base space-y-3 list-decimal list-inside">
            <li className="pl-2">
              <strong>Stand on a piece of paper</strong> with your heel against a wall or flat surface
            </li>
            <li className="pl-2">
              <strong>Mark the longest part of your foot</strong> - usually the tip of your big toe or second toe
            </li>
            <li className="pl-2">
              <strong>Measure the distance in centimeters (CM)</strong> from the heel to the mark
            </li>
            <li className="pl-2">
              <strong>Use the chart above</strong> to find your corresponding EURO, UK, and CM size
            </li>
          </ol>
        </div>

        {/* Tips Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-blue-900 font-semibold mb-2">💡 Pro Tip</h4>
            <p className="text-blue-800 text-sm">
              If you're between sizes, we recommend going up a size for a more comfortable fit, especially if you plan to wear thicker socks.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h4 className="text-green-900 font-semibold mb-2">✓ Best Practice</h4>
            <p className="text-green-800 text-sm">
              Measure your feet in the afternoon or evening when they're at their largest size. Feet tend to swell slightly throughout the day.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-gray-900 font-semibold mb-3">Important Notes</h4>
          <ul className="text-gray-600 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Sizes may vary slightly between different shoe brands and styles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>If you have wide feet, consider going up half a size</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>For athletic shoes, you may want extra room for movement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>Still unsure? Contact our customer service team for personalized assistance</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push("/shop")}
            className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}

