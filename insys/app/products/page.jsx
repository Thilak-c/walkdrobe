"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import ProductTable from "@/components/ProductTable";
import Dropdown from "@/components/Dropdown";
import {
  Search,
  Download,
  Package,
  Filter,
  Store,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Activity,
  Sparkles,
  Layers
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // "all", "sneakers", "sports", "accessories"
  const [activeSubTab, setActiveSubTab] = useState("all"); // "all", "watch", "belts", "lighter", "glasses", "perfume", "belt", etc.
  const [sortBy, setSortBy] = useState("sku");
  const [visibleCount, setVisibleCount] = useState(15);

  // Reset visible count when filters or search change
  useEffect(() => {
    setVisibleCount(15);
  }, [search, stockFilter, activeTab, activeSubTab, sortBy]);

  const ACCESSORIES_LIST = ["watch", "belts", "lighter", "glasses", "perfume", "belt"];
  
  const isProductCategory = (p, catName) => {
    const main = p.mainCategory?.toLowerCase() || "";
    const sub = p.category?.toLowerCase() || "";
    
    if (catName === "sneakers") {
      return sub === "sneakers";
    }
    if (catName === "sports") {
      return sub === "sports";
    }
    if (catName === "accessories") {
      return main === "accessories" || ACCESSORIES_LIST.includes(sub) || sub === "accessories";
    }
    return false;
  };

  // Set category from URL on mount and when URL changes
  useEffect(() => {
    if (urlCategory) {
      const cat = urlCategory.toLowerCase();
      if (cat === "sneakers") {
        setActiveTab("sneakers");
        setActiveSubTab("all");
      } else if (cat === "sports") {
        setActiveTab("sports");
        setActiveSubTab("all");
      } else if (ACCESSORIES_LIST.includes(cat) || cat === "accessories") {
        setActiveTab("accessories");
        if (ACCESSORIES_LIST.includes(cat)) {
          setActiveSubTab(cat);
        } else {
          setActiveSubTab("all");
        }
      } else {
        setActiveTab("all");
        setActiveSubTab("all");
      }
    } else {
      setActiveTab("all");
      setActiveSubTab("all");
    }
  }, [urlCategory]);

  const products = useQuery(api.offStore.getProductsForList);
  const stats = useQuery(api.offStore.getStats) || {};

  // Filter and sort products
  const filteredProducts = (products || [])
    .filter(p => {
      if (search) {
        const s = search.trim().toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(s);
        let matchesSku = false;
        const itemId = p.itemId?.toLowerCase() || "";
        if (itemId.includes(s)) {
          const parts = itemId.split('-');
          const suffix = parts[parts.length - 1];
          if (suffix && suffix.includes(s)) {
            matchesSku = true;
          } else {
            const parsedS = parseInt(s, 10);
            const parsedSuffix = parseInt(suffix, 10);
            if (!isNaN(parsedS) && !isNaN(parsedSuffix) && parsedS === parsedSuffix) {
              matchesSku = true;
            } else if (/[a-zA-Z\-]/.test(s)) {
              matchesSku = true;
            }
          }
        }
        if (!matchesName && !matchesSku) {
          return false;
        }
      }
      
      // Main tab filter
      if (activeTab === "sneakers" && !isProductCategory(p, "sneakers")) return false;
      if (activeTab === "sports" && !isProductCategory(p, "sports")) return false;
      if (activeTab === "accessories") {
        if (!isProductCategory(p, "accessories")) return false;
        // Subtab filter for accessories
        if (activeSubTab !== "all") {
          const sub = p.category?.toLowerCase() || "";
          if (activeSubTab === "belts") {
            if (sub !== "belts" && sub !== "belt") return false;
          } else if (sub !== activeSubTab) {
            return false;
          }
        }
      }

      const stock = p.totalStock ?? 0;
      if (stockFilter === "in_stock" && stock <= 10) return false;
      if (stockFilter === "low_stock" && (stock === 0 || stock > 10)) return false;
      if (stockFilter === "out_of_stock" && stock !== 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "sku") return (a.itemId || "").localeCompare(b.itemId || "", undefined, { numeric: true, sensitivity: "base" });
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "stock") return (b.totalStock ?? 0) - (a.totalStock ?? 0);
      if (sortBy === "price") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  useEffect(() => {
    if (visibleCount >= filteredProducts.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 15, filteredProducts.length));
      }
    }, { threshold: 0.1 });
    
    const target = document.getElementById("load-more-trigger");
    if (target) observer.observe(target);
    
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const exportCSV = () => {
    if (!filteredProducts?.length) return;
    
    const headers = ["Item ID", "Name", "Category", "Price", "Stock", "Status"];
    const rows = filteredProducts.map(p => [
      p.itemId,
      `"${p.name}"`,
      p.category || "",
      p.price,
      p.totalStock ?? 0,
      (p.totalStock ?? 0) === 0 ? "Out of Stock" : (p.totalStock ?? 0) <= 10 ? "Low Stock" : "In Stock"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walkdrobe-offline-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const isLoading = products === undefined;
  const pageTitle = activeTab !== "all" 
    ? (activeTab === "accessories" && activeSubTab !== "all" 
        ? `Accessories: ${activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)}` 
        : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) 
    : "All Products";

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={13} className="text-emerald-600 animate-pulse" />
                <p className="text-emerald-600 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest">Offline Shop Operations</p>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">{pageTitle}</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                {filteredProducts?.length || 0} items registered {activeTab !== "all" ? `in ${activeTab}` : "in store inventory"}
              </p>
            </div>
            <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full md:w-auto">
              <Link
                href="/barcode"
                className="px-2 py-2 sm:px-4.5 sm:py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm transition-all cursor-pointer text-center justify-center flex items-center w-full"
              >
                <span className="sm:hidden">Barcode</span>
                <span className="hidden sm:inline">Barcode Generator</span>
              </Link>
              <button
                onClick={exportCSV}
                disabled={!products || !products.length}
                className="px-2 py-2 sm:px-4.5 sm:py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer w-full"
              >
                <Download size={12} className="shrink-0" />
                <span className="sm:hidden">Export</span>
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <Link
                href="/add-product"
                className="px-2 py-2 sm:px-4.5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full"
              >
                <Plus className="w-3 h-3 shrink-0" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Product</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard
              label="Physical Catalog"
              value={products?.length || 0}
              icon={Package}
              color="blue"
              loading={isLoading}
            />
            <StatCard
              label="Healthy Stock"
              value={(products || []).filter(p => (p.totalStock ?? 0) > 10).length}
              icon={CheckCircle2}
              color="emerald"
              loading={isLoading}
            />
            <StatCard
              label="Low Stock Warning"
              value={(products || []).filter(p => {
                const st = p.totalStock ?? 0;
                return st > 0 && st <= 10;
              }).length}
              icon={AlertCircle}
              color="amber"
              loading={isLoading}
            />
            <StatCard
              label="Depleted (Out)"
              value={(products || []).filter(p => (p.totalStock ?? 0) === 0).length}
              icon={X}
              color="rose"
              loading={isLoading}
            />
          </div>

          {/* Category Dashboard */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Category Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* All Items Card */}
              <button
                type="button"
                onClick={() => { setActiveTab("all"); setActiveSubTab("all"); }}
                className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  activeTab === "all"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]"
                    : "bg-white border-slate-200/60 hover:border-slate-350 text-slate-800"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 shadow-xs border ${
                  activeTab === "all" ? "bg-white/10 border-white/10 text-white" : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                  <Layers size={14} />
                </div>
                <div>
                  <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${activeTab === "all" ? "text-white" : "text-slate-800"}`}>
                    {products?.length || 0}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider block mt-1 ${activeTab === "all" ? "text-slate-300" : "text-slate-450"}`}>
                    All Products
                  </p>
                </div>
              </button>

              {/* Sneakers Card */}
              <button
                type="button"
                onClick={() => { setActiveTab("sneakers"); setActiveSubTab("all"); }}
                className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  activeTab === "sneakers"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]"
                    : "bg-white border-slate-200/60 hover:border-slate-350 text-slate-800"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 shadow-xs border ${
                  activeTab === "sneakers" ? "bg-white/10 border-white/10 text-white" : "bg-blue-50 border-blue-100 text-blue-600"
                }`}>
                  <Activity size={14} />
                </div>
                <div>
                  <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${activeTab === "sneakers" ? "text-white" : "text-slate-800"}`}>
                    {products?.filter(p => isProductCategory(p, "sneakers")).length || 0}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider block mt-1 ${activeTab === "sneakers" ? "text-slate-300" : "text-slate-450"}`}>
                    Sneakers
                  </p>
                </div>
              </button>

              {/* Sports Card */}
              <button
                type="button"
                onClick={() => { setActiveTab("sports"); setActiveSubTab("all"); }}
                className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  activeTab === "sports"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]"
                    : "bg-white border-slate-200/60 hover:border-slate-350 text-slate-800"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 shadow-xs border ${
                  activeTab === "sports" ? "bg-white/10 border-white/10 text-white" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                }`}>
                  <TrendingDown size={14} className="rotate-180" />
                </div>
                <div>
                  <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${activeTab === "sports" ? "text-white" : "text-slate-800"}`}>
                    {products?.filter(p => isProductCategory(p, "sports")).length || 0}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider block mt-1 ${activeTab === "sports" ? "text-slate-300" : "text-slate-455"}`}>
                    Sports
                  </p>
                </div>
              </button>

              {/* Accessories Card */}
              <button
                type="button"
                onClick={() => { setActiveTab("accessories"); setActiveSubTab("all"); }}
                className={`text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  activeTab === "accessories"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]"
                    : "bg-white border-slate-200/60 hover:border-slate-350 text-slate-800"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 shadow-xs border ${
                  activeTab === "accessories" ? "bg-white/10 border-white/10 text-white" : "bg-purple-50 border-purple-100 text-purple-600"
                }`}>
                  <Sparkles size={14} />
                </div>
                <div>
                  <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${activeTab === "accessories" ? "text-white" : "text-slate-800"}`}>
                    {products?.filter(p => isProductCategory(p, "accessories")).length || 0}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider block mt-1 ${activeTab === "accessories" ? "text-slate-300" : "text-slate-455"}`}>
                    Accessories
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Information Banner & Subtabs */}
          <div className="mb-5 sm:mb-6 space-y-3">
            {/* Banner info */}
            <div className="bg-slate-900/5 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse shrink-0" />
                <p className="text-xs font-semibold text-slate-600 font-poppins">
                  💡 You have a total of <span className="font-extrabold text-slate-900">{filteredProducts.length} items</span> in the <span className="font-extrabold uppercase text-slate-900">{activeTab === "all" ? "All Categories" : activeTab === "accessories" && activeSubTab !== "all" ? `Accessories (${activeSubTab})` : activeTab}</span> category.
                </p>
              </div>
              <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/40">
                Convenient Dashboard
              </div>
            </div>

            {/* Accessories Subtabs */}
            {activeTab === "accessories" && (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-2.5 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none animate-fadeIn">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 px-2">Filter sub:</span>
                {[
                  { id: "all", label: "All Accessories" },
                  { id: "watch", label: "Watch" },
                  { id: "belts", label: "Belts / Belt" },
                  { id: "lighter", label: "Lighter" },
                  { id: "glasses", label: "Glasses" },
                  { id: "perfume", label: "Perfume" },
                ].map((subItem) => {
                  const isActive = activeSubTab === subItem.id;
                  return (
                    <button
                      key={subItem.id}
                      type="button"
                      onClick={() => setActiveSubTab(subItem.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {subItem.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm mb-5 sm:mb-6 flex flex-col lg:flex-row items-center gap-3 sm:gap-4 justify-between">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name or barcode ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:w-auto lg:items-center lg:gap-3">
              {/* Stock Filter */}
              <Dropdown
                value={stockFilter}
                onChange={setStockFilter}
                align="full"
                className="w-full lg:min-w-[145px]"
                options={[
                  { value: "all", label: "All Status" },
                  { value: "in_stock", label: "In Stock" },
                  { value: "low_stock", label: "Low Stock" },
                  { value: "out_of_stock", label: "Out of Stock" }
                ]}
              />

              {/* Sort */}
              <Dropdown
                value={sortBy}
                onChange={setSortBy}
                align="full"
                className="w-full lg:min-w-[145px]"
                options={[
                  { value: "sku", label: "Sort: SKU / ID" },
                  { value: "name", label: "Sort: Name" },
                  { value: "stock", label: "Sort: Stock" },
                  { value: "price", label: "Sort: Price" }
                ]}
              />
            </div>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <ProductTableSkeleton />
          ) : (
            <>
              <ProductTable products={visibleProducts} />
              {visibleCount < filteredProducts.length && (
                <div id="load-more-trigger" className="h-14 flex items-center justify-center my-6">
                  <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-150 text-emerald-600",
    amber: "bg-amber-50 border-amber-150 text-amber-600",
    rose: "bg-rose-50 border-rose-150 text-rose-500",
    blue: "bg-blue-50 border-blue-150 text-blue-600",
  };
  const design = colors[color] || "bg-slate-50 border-slate-150 text-slate-600";

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-3 shadow-xs border ${design}`}>
        <Icon size={14} className="sm:w-4 sm:h-4" />
      </div>
      {loading ? (
        <div className="h-6 w-16 sm:w-20 bg-slate-100 rounded-lg animate-pulse mt-1.5" />
      ) : (
        <p className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 sm:mt-1 group-hover:scale-[1.02] transition-transform duration-200">
          {value}
        </p>
      )}
      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1.5">{label}</p>
    </div>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-pulse">
      {/* Mobile Skeleton Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-150 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-2.5 w-16 bg-slate-100 rounded-md animate-pulse" />
                </div>
                <div className="h-3 w-20 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="text-right flex flex-col justify-between items-end py-1">
                <div className="h-3.5 w-12 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-2">
              <div className="flex justify-between">
                <div className="h-2.5 w-12 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4.5 w-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Skeleton Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="px-6 py-4">Shoe Details</th>
              <th className="px-6 py-4">SKU / Code</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-center">Stock Count</th>
              <th className="px-6 py-4 text-center">Availability</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-slate-50 last:border-0">
                {/* Shoe Details */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-150 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-3 w-20 bg-slate-100/70 rounded-md animate-pulse" />
                    </div>
                  </div>
                </td>

                {/* SKU Code */}
                <td className="px-6 py-4.5">
                  <div className="h-4 w-24 bg-slate-100 rounded-lg animate-pulse" />
                </td>

                {/* Category */}
                <td className="px-6 py-4.5">
                  <div className="h-4 w-16 bg-slate-100 rounded-lg animate-pulse" />
                </td>

                {/* Price */}
                <td className="px-6 py-4.5 text-right">
                  <div className="h-4 w-12 bg-slate-100 rounded-lg ml-auto animate-pulse" />
                </td>

                {/* Stock Count */}
                <td className="px-6 py-4.5">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex gap-1 justify-center">
                      <div className="h-4.5 w-9 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-4.5 w-9 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-4.5 w-9 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-3 w-16 bg-slate-100/70 rounded-md animate-pulse" />
                  </div>
                </td>

                {/* Availability */}
                <td className="px-6 py-4.5 text-center">
                  <div className="h-6 w-20 bg-slate-100 rounded-full mx-auto animate-pulse" />
                </td>

                {/* Actions */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
