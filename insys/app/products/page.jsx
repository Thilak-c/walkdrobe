"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import ProductTable from "@/components/ProductTable";
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
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Set category from URL on mount and when URL changes
  useEffect(() => {
    if (urlCategory) {
      setCategory(urlCategory);
    } else {
      setCategory("all");
    }
  }, [urlCategory]);

  const products = useQuery(api.offStore.getProductsForList) || [];
  const stats = useQuery(api.offStore.getStats) || {};
  const categories = stats?.categories ? Object.keys(stats.categories) : [];

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      if (search) {
        const s = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(s) && !p.itemId?.toLowerCase().includes(s)) {
          return false;
        }
      }
      if (category !== "all" && p.category !== category) {
        return false;
      }
      const stock = p.totalStock ?? 0;
      if (stockFilter === "in_stock" && stock <= 10) return false;
      if (stockFilter === "low_stock" && (stock === 0 || stock > 10)) return false;
      if (stockFilter === "out_of_stock" && stock !== 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "stock") return (b.totalStock ?? 0) - (a.totalStock ?? 0);
      if (sortBy === "price") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

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
  const pageTitle = category !== "all" ? category : "All Products";

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={14} className="text-emerald-600 animate-pulse" />
                <p className="text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest">Offline Shop Operations</p>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">{pageTitle}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {filteredProducts?.length || 0} items registered {category !== "all" ? `in ${category}` : "in store inventory"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/barcode"
                className="px-4.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 shadow-sm transition-all"
              >
                Barcode Generator
              </Link>
              <button
                onClick={exportCSV}
                disabled={!products?.length}
                className="px-4.5 py-2.5 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <Link
                href="/add-product"
                className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {!isLoading && products.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Physical Catalog"
                value={products.length}
                icon={Package}
                color="blue"
              />
              <StatCard
                label="Healthy Stock"
                value={products.filter(p => (p.totalStock ?? 0) > 10).length}
                icon={CheckCircle2}
                color="emerald"
              />
              <StatCard
                label="Low Stock Warning"
                value={products.filter(p => {
                  const st = p.totalStock ?? 0;
                  return st > 0 && st <= 10;
                }).length}
                icon={AlertCircle}
                color="amber"
              />
              <StatCard
                label="Depleted (Out)"
                value={products.filter(p => (p.totalStock ?? 0) === 0).length}
                icon={X}
                color="rose"
              />
            </div>
          )}

          {/* Filters Row */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-4 justify-between">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search products by name or barcode ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs text-slate-700 focus:outline-none transition-all min-w-[140px]"
              >
                <option value="all">All Stock Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs text-slate-700 focus:outline-none transition-all min-w-[140px]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs text-slate-700 focus:outline-none transition-all min-w-[140px]"
              >
                <option value="name">Sort by Name</option>
                <option value="stock">Sort by Stock</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-sm">
              <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Retrieving storefront inventory...</p>
            </div>
          ) : (
            <ProductTable products={filteredProducts} />
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
    <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 shadow-xs border ${design}`}>
        <Icon size={16} />
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-slate-100 rounded-xl animate-pulse mt-2" />
      ) : (
        <p className="text-xl font-extrabold text-slate-800 tracking-tight mt-1 group-hover:scale-[1.02] transition-transform duration-200">
          {value}
        </p>
      )}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1.5">{label}</p>
    </div>
  );
}
