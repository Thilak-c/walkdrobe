"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import ProductTable from "@/components/ProductTable";
import { Search, Download, Package, Filter } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const products = useQuery(api.offStore.getAllProducts) || [];

  const stats = useQuery(api.offStore.getStats) || {};
  const categories = stats?.categories ? Object.keys(stats.categories) : [];

  const exportCSV = () => {
    if (!products?.length) return;
    
    const headers = ["Item ID", "Name", "Category", "Price", "Stock", "Status"];
    const rows = products.map(p => [
      p.itemId,
      `"${p.name}"`,
      p.category || "",
      p.price,
      p.currentStock,
      p.currentStock === 0 ? "Out of Stock" : p.currentStock <= 10 ? "Low Stock" : "In Stock"
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">INVENTORY</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">All Products</h1>
              <p className="text-gray-500 text-sm mt-1">{products?.length || 0} products in inventory</p>
            </div>
            <button
              onClick={exportCSV}
              disabled={!products?.length}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
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
            <ProductTable products={products} />
          )}
        </div>
      </main>
    </div>
  );
}
