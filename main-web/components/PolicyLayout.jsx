"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PolicyLayout({ title, lastUpdated, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const policyLinks = [
    { name: "Cancellation Policy", href: "/policy/cancellation" },
    { name: "Privacy Policy", href: "/policy/privacy" },
    { name: "Return Policy", href: "/policy/return" },
    { name: "Shipping Policy", href: "/policy/shipping" },
    { name: "Terms and Conditions", href: "/policy/terms" },
  ];

  return (
    <div className="min-h-screen min-h-[100vh] min-h-dvh bg-[#FAF9F6] font-sans text-slate-900 flex flex-col justify-between antialiased">
      <div className="flex-1 flex flex-col">
        {/* Top Spacer for Fixed Navbar */}
        <div className="h-24 sm:h-32 xl:h-36"></div>
        <div className="xl:hidden mb-6">
          <NavbarMobile />
        </div>
        <div className="hidden xl:block">
          <Navbar />
        </div>

        {/* Content Container */}
        <div className=" max-w-6xl  mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:py-10 w-full flex-1">
          {/* Top back button for mobile */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer font-inter"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
              <span>Back</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full font-inter">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Official Walkdrobe Policy
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Policy Navigation Bar (Shrinks on Scroll & Sits Cleanly Below Fixed Navbar) */}
            <div
              className={`lg:col-span-1 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl transition-all duration-300 sticky z-30 shadow-xs ${
                isScrolled
                  ? "top-24 sm:top-32 p-3 sm:p-4 shadow-md border-slate-300"
                  : "top-28 sm:top-36 p-5 sm:p-6"
              }`}
            >
              <div className={`transition-all duration-300 ${isScrolled ? "mb-2 sm:mb-3" : "mb-5"}`}>
                <h3 className={`font-serif font-bold text-slate-900 tracking-tight relative inline-block transition-all duration-300 ${
                  isScrolled ? "text-base sm:text-lg pb-1" : "text-xl sm:text-2xl pb-2"
                }`}>
                  Policy
                  <span className={`absolute bottom-0 left-0 bg-[#7A5C3E] transition-all duration-300 ${
                    isScrolled ? "w-8 h-0.5" : "w-12 h-0.5"
                  }`}></span>
                </h3>
              </div>

              {/* Navigation Links: Horizontal scroll on mobile, vertical on desktop */}
              <nav className={`font-inter transition-all duration-300 flex lg:flex-col overflow-x-auto no-scrollbar py-0.5 ${
                isScrolled ? "gap-1 sm:space-y-1" : "gap-1.5 sm:space-y-2.5"
              }`}>
                {policyLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`whitespace-nowrap shrink-0 block font-semibold transition-all rounded-xl ${
                        isScrolled
                          ? "text-[11px] sm:text-xs py-1 px-2.5"
                          : "text-xs sm:text-sm py-1.5 px-3"
                      } ${
                        isActive
                          ? "bg-[#7A5C3E] text-white shadow-xs font-bold"
                          : "text-slate-650 hover:text-[#7A5C3E] hover:bg-slate-50"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Main Policy Content Area */}
            <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-10 shadow-xs space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-inter">
                  {title}
                </h1>
                {lastUpdated && (
                  <p className="text-xs text-slate-400 font-medium mt-1 font-inter">
                    Last Updated: {lastUpdated}
                  </p>
                )}
                <div className="h-0.5 bg-slate-100 w-full mt-4"></div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed font-inter space-y-5">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
