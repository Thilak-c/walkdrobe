"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Footprints, CheckCircle2, ChevronRight } from "lucide-react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { SIZE_CHART_DATA } from "@/components/SizeChart";

export default function SizeChartPage() {
  const router = useRouter();
  const [activeUnit, setActiveUnit] = useState("all");

  return (
    <div className="min-h-screen bg-white font-inter text-gray-900">
      {/* Navbars */}
      <div className="xl:hidden">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <main className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-[11px] md:text-xs text-gray-400 mb-8 font-inter">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-medium">Size Guide</span>
          </nav>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-2 font-inter">
              Walkdrobe Fit Guide
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-gray-900 font-light mb-3">
              Footwear Size Chart
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-inter max-w-xl mx-auto leading-relaxed">
              Find your exact shoe size across UK, US, EU, and Foot Length (CM) for a perfect fit every single time.
            </p>
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { id: "all", label: "All Units" },
              { id: "uk", label: "UK / IN" },
              { id: "us", label: "US" },
              { id: "euro", label: "EU" },
              { id: "cm", label: "Length (CM)" },
            ].map((unit) => (
              <button
                key={unit.id}
                onClick={() => setActiveUnit(unit.id)}
                className={`px-4 py-2 text-xs font-semibold tracking-wider font-inter transition-all duration-200 ${
                  activeUnit === unit.id
                    ? "bg-neutral-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>

          {/* Size Chart Table */}
          <div className="overflow-x-auto border border-gray-200/80 rounded-none mb-12 shadow-xs">
            <table className="w-full text-xs font-inter text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 font-bold uppercase tracking-wider text-gray-900 text-[10px]">
                  <th className="py-4 px-5 border-r border-gray-200 bg-gray-100/60">UK / IN</th>
                  <th className="py-4 px-5 border-r border-gray-200">US (Men)</th>
                  <th className="py-4 px-5 border-r border-gray-200">EU</th>
                  <th className="py-4 px-5 border-r border-gray-200">Length (CM)</th>
                  <th className="py-4 px-5">Fit Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {SIZE_CHART_DATA.map((row) => (
                  <tr key={row.uk} className="hover:bg-gray-50/80 transition-colors font-medium text-xs">
                    <td className="py-4 px-5 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/30">
                      UK {row.uk}
                    </td>
                    <td className="py-4 px-5 border-r border-gray-200">{row.us}</td>
                    <td className="py-4 px-5 border-r border-gray-200">{row.euro}</td>
                    <td className="py-4 px-5 border-r border-gray-200 font-mono text-gray-900">
                      {row.cm} cm
                    </td>
                    <td className="py-4 px-5 text-emerald-700 font-semibold text-[11px]">
                      True to Size
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How to Measure Step-by-Step */}
          <div className="p-6 md:p-8 bg-[#FAF8F5] border border-gray-200/60 rounded-none mb-8 text-left">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-gray-800" />
              Step-by-Step Measurement Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600">
              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-gray-900 block mb-1">Stand Against Wall</strong>
                  <span className="leading-relaxed">Place a piece of plain paper on the floor against a flat wall. Stand firm with your heel touching the wall.</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-gray-900 block mb-1">Mark Longest Point</strong>
                  <span className="leading-relaxed">Mark the longest part of your foot (usually your big toe or second toe) on the paper using a pencil.</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-gray-900 block mb-1">Measure CM Distance</strong>
                  <span className="leading-relaxed">Use a ruler to measure the distance in centimeters (CM) from the paper edge to your pencil mark.</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-gray-900 block mb-1">Match Your Size</strong>
                  <span className="leading-relaxed">Find your CM measurement in the table above to select your exact Walkdrobe shoe size.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tip Banner */}
          <div className="p-5 bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-left mb-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 font-inter leading-relaxed">
              <strong>Sizing Recommendation:</strong> Walkdrobe footwear fits <strong>True to Size</strong>. If you fall between two sizes or prefer a wider fit, we recommend selecting half a size larger.
            </p>
          </div>

          {/* Back Action */}
          <div className="text-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider font-inter transition-colors"
            >
              Back to Product
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
