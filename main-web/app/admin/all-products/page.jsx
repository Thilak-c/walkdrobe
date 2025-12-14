"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { FiShare2, FiEye, FiEdit, FiClock, FiTrendingUp, FiEyeOff } from "react-icons/fi";

// Animated Number Counter
function AnimatedNumber({ value, duration = 800 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(1, Math.floor(duration / (value || 1)));
    const timer = setInterval(() => {
      start += Math.ceil(value / (duration / stepTime));
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setDisplayValue(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  return displayValue.toLocaleString();
}

// Premium Toast
function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor =
    type === "success" ? "bg-green-600" :
    type === "error" ? "bg-red-600" : "bg-gray-800";

  return (
    <div className={`fixed top-5 right-5 px-5 py-3 ${bgColor} text-white rounded-xl shadow-xl flex items-center gap-4 animate-toast z-50`}>
      <span>{message}</span>
      <button onClick={onClose} className="font-bold text-xl leading-none hover:scale-110 transition-transform">
        ×
      </button>
      <style jsx>{`
        @keyframes toast-slide {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast { animation: toast-slide 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

// Share Button
function ShareButton() {
  const [toast, setToast] = useState(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToast("✅ Product URL copied!");
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition transform hover:scale-105 shadow flex items-center gap-1"
      >
        <FiShare2 /> Share
      </button>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default function AllProductsPage() {
  const products = useQuery(api.products.getAll);
  const [search, setSearch] = useState("");

  // Filtered products by search
  const filteredProducts = useMemo(() => 
    products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [], 
    [products, search]
  );

  // Category overview
  const categoryStats = useMemo(() => {
    const stats = {};
    (products || []).forEach(p => {
      const cat = p.category || "Uncategorized";
      if (!stats[cat]) stats[cat] = { count: 0, totalBuys: 0, totalSales: 0 };
      stats[cat].count += 1;
      stats[cat].totalBuys += p.buys || 0;
      stats[cat].totalSales += (p.buys || 0) * (p.price || 0);
    });
    return stats;
  }, [products]);

  if (!products) return (
    <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
      Loading products...
    </div>
  );

  if (products.length === 0) return (
    <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
      No products found.
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900">All Products</h1>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/2 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow"
          />
        </div>

        {/* Category Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(categoryStats).map(([category, stats], idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition transform hover:-translate-y-1">
              <h2 className="text-lg font-semibold text-gray-700">{category}</h2>
              <p className="text-gray-500 text-sm mt-1">Products: <strong>{stats.count}</strong></p>
              <p className="text-gray-500 text-sm mt-1">Total Buys: <strong>{stats.totalBuys}</strong></p>
              <p className="text-gray-500 text-sm mt-1">Total Sales: <strong>₹{stats.totalSales.toLocaleString()}</strong></p>
            </div>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => {
            const totalSales = product.buys * product.price;

            return (
              <div key={product.itemId} className="relative bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-transform transform hover:-translate-y-2 group overflow-hidden">
                
                {/* Product Image */}
                <Link href={`/admin/product/${product.itemId}`} className="relative block overflow-hidden">
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-t-3xl transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {product.isHidden && <span className="bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs"><FiEyeOff /> Hidden</span>}
                    {product.buys > 50 && <span className="bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs"><FiTrendingUp /> Hot</span>}
                  </div>
                  {new Date(product.createdAt) > new Date(Date.now() - 7*24*60*60*1000) && (
                    <span className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs"><FiClock /> New</span>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-5 space-y-2">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{product.name}</h2>
                  <p className="text-gray-500 text-sm">{product.category || "Uncategorized"}</p>
                  <p className="text-black font-semibold text-lg">₹{product.price.toLocaleString()}</p>

                  {/* Buys & Total Sales */}
                  <div className="flex justify-between items-center text-gray-800 text-sm">
                    <span>Buys: <strong className="text-blue-600"><AnimatedNumber value={product.buys} /></strong></span>
                    <span>Total: <strong className="text-green-600">₹<AnimatedNumber value={totalSales} /></strong></span>
                  </div>

                  {/* Other Images Scroll */}
                  {product.otherImages?.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto snap-x scrollbar-hide">
                      {product.otherImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Extra ${idx}`}
                          className="w-12 h-12 object-cover rounded-lg border hover:scale-110 transition-transform snap-start"
                        />
                      ))}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex justify-between items-center mt-4 gap-2">
                    <Link
                      href={`/admin/product/${product.itemId}`}
                      className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                    >
                      <FiEye /> View
                    </Link>
                    <Link
                      href={`/admin/edit/${product.itemId}/`}
                      className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                    >
                      <FiEdit /> Edit
                    </Link>
                    <ShareButton />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
