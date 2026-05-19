"use client";

import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Globe,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

export default function WebsiteDashboard() {
  const stats = useQuery(api.products.getAdminStats);
  const lowStock = useQuery(api.products.getLowStockProductsForAlerts, { threshold: 10 });
  const movements = useQuery(api.products.getInventoryMovements, { limit: 5 });

  const isLoading = stats === undefined;

  const categoryData = stats?.categories
    ? Object.entries(stats.categories)
        .sort((a, b) => b[1].stock - a[1].stock)
        .slice(0, 5)
    : [];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={14} className="text-blue-500 animate-pulse" />
                <p className="text-blue-500 text-[10px] font-extrabold uppercase tracking-widest">Website Store</p>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Inventory Overview</h1>
              <p className="text-slate-500 text-sm mt-1">Live analytics, stock metrics, and fulfillment status for Walkdrobe Patna.</p>
            </div>
            
            {/* Quick action links */}
            <div className="flex items-center gap-3">
              <Link
                href="/website/products"
                className="px-4.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 shadow-sm transition-all"
              >
                Catalog Manager
              </Link>
              <Link
                href="/website/add-product"
                className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Add Product</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Premium Glassmorphic Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Catalog Products"
              value={stats?.totalProducts || 0}
              icon={Package}
              loading={isLoading}
            />
            <StatCard
              label="Healthy Stock"
              value={stats?.inStock || 0}
              icon={CheckCircle}
              color="emerald"
              loading={isLoading}
            />
            <StatCard
              label="Low Stock Items"
              value={stats?.lowStock || 0}
              icon={AlertTriangle}
              color="amber"
              loading={isLoading}
            />
            <StatCard
              label="Out of Stock"
              value={stats?.outOfStock || 0}
              icon={XCircle}
              color="rose"
              loading={isLoading}
            />
            <StatCard
              label="Inventory Value"
              value={`₹${(stats?.totalValue || 0).toLocaleString("en-IN")}`}
              icon={IndianRupee}
              color="blue"
              loading={isLoading}
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* Central Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Low Stock Alerts */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Low Stock Alerts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Shoes requiring catalog reorder actions</p>
                  </div>
                  <Link
                    href="/website/alerts"
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>View alerts</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                    ))}
                  </div>
                ) : lowStock?.length > 0 ? (
                  <div className="space-y-3">
                    {lowStock.slice(0, 4).map((p) => {
                      const stockVal = p.currentStock || p.totalAvailable || 0;
                      return (
                        <div key={p._id} className="flex items-center gap-4 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all group">
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0">
                            {p.mainImage ? (
                              <img src={p.mainImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full p-2.5 flex items-center justify-center">
                                <Package className="text-slate-300 w-full h-full" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-slate-800 truncate group-hover:underline cursor-pointer">
                              {p.name}
                            </p>
                            <span className="font-mono text-[9px] font-bold text-slate-400 tracking-tight block mt-0.5">
                              SKU {p.itemId}
                            </span>
                          </div>

                          <div className={`px-3 py-1 rounded-xl text-[10px] font-bold shadow-sm ${
                            stockVal === 0
                              ? "bg-rose-50 border border-rose-100 text-rose-600"
                              : "bg-amber-50 border border-amber-100 text-amber-600"
                          }`}>
                            {stockVal === 0 ? "Depleted" : `${stockVal} left`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Stock Status: Excellent</h4>
                    <p className="text-slate-400 text-xs mt-1">All digital product inventory limits are well balanced.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Category Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-50">
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-500">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">By Segment</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Percentage store volumes</p>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-slate-50 rounded animate-pulse" />
                      <div className="h-2 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : categoryData.length > 0 ? (
                <div className="space-y-5.5">
                  {categoryData.map(([cat, data]) => {
                    const ratio = Math.min(100, (data.stock / (stats?.totalStock || 1)) * 100);
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">{cat}</span>
                          <span className="text-slate-800 font-extrabold">{data.stock} Pairs ({ratio.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-all duration-500"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs italic">
                  No segment breakdown available yet.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Recent Movements */}
          <div className="mt-6 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-50">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                <Layers size={15} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Recent Activity Log</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Chronological catalog and sales updates</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : movements?.length > 0 ? (
              <div className="divide-y divide-slate-100/60">
                {movements.map((m) => {
                  const isStockIn = m.type === "stock_in";
                  const isSale = m.type === "sale";
                  
                  return (
                    <div key={m._id} className="py-3.5 flex items-center justify-between text-xs group hover:bg-slate-50/20 px-1 rounded-xl transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Status Beacon */}
                        <div className={`p-2 rounded-xl flex items-center justify-center ${
                          isStockIn
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-150"
                            : isSale
                            ? "bg-slate-900 text-white"
                            : "bg-amber-50 text-amber-600 border border-amber-150"
                        }`}>
                          {isStockIn ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-700 truncate block">
                            {m.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 uppercase font-bold tracking-wider">
                            {isStockIn ? "Inventory Restock" : isSale ? "Sales Settlement" : "Log Adjustment"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className={`text-sm font-extrabold ${isStockIn ? "text-emerald-600" : "text-rose-500"}`}>
                          {isStockIn ? "+" : "-"}{m.quantity} Pairs
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap min-w-[70px] text-right">
                          {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs italic">
                No inventory log events available yet.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading, className = "" }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-150 text-emerald-600",
    amber: "bg-amber-50 border-amber-150 text-amber-600",
    rose: "bg-rose-50 border-rose-150 text-rose-500",
    blue: "bg-blue-50 border-blue-150 text-blue-600",
  };
  const design = colors[color] || "bg-slate-50 border-slate-150 text-slate-600";

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${className}`}>
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
