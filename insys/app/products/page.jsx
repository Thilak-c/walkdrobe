"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import ProductTable from "@/components/ProductTable";
import { Search, Download, Package, Filter } from "lucide-react";
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
      // Search filter
      if (search) {
        const s = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(s) && !p.itemId?.toLowerCase().includes(s)) {
          return false;
        }
      }
      // Category filter
      if (category !== "all" && p.category !== category) {
        return false;
      }
      // Stock filter
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
    a.download = `walkdrobe-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const isLoading = products === undefined;

  // Page title based on category
  const pageTitle = category !== "all" ? category : "All Products";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">INVENTORY</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">{pageTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">{filteredProducts?.length || 0} products {category !== "all" ? `in ${category}` : "in inventory"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/barcode">
                <p className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-medium text-sm">
                  Barcode
                </p>
              </Link>
              <button
                onClick={exportCSV}
                disabled={!products?.length}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Stock Filter */}
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm text-gray-700 min-w-[140px]"
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                {/* Category Filter */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm text-gray-700 min-w-[140px]"
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
                  className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm text-gray-700 min-w-[140px]"
                >
                  <option value="name">Sort by Name</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <ProductTable products={filteredProducts} />
          )}
        </div>
      </main>
    </div>
  );
}
