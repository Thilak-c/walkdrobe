"use client";

import { useQuery } from "convex/react";
import { api } from "../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Store,
  Layers,
  Sparkles,
  ShoppingBag,
  Bell,
  RefreshCw,
  Plus
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = useQuery(api.inventory.getInventoryStats);
  const lowStock = useQuery(api.inventory.getLowStockAlerts, { threshold: 10 });

  const pieData = stats ? [
    { name: "Healthy Stock", value: stats.inStock || 0, color: "#10b981" },
    { name: "Low Stock Warning", value: stats.lowStock || 0, color: "#f59e0b" },
    { name: "Out of Stock", value: stats.outOfStock || 0, color: "#f43f5e" },
  ].filter(d => d.value > 0) : [];

  const categoryData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown)
      .map(([name, data]) => ({
        name: name.length > 12 ? name.slice(0, 12) + "..." : name,
        stock: data.stock,
        products: data.count,
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 6)
    : [];

  const isLoading = stats === undefined;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">



          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatBox
              title="Physical Catalog"
              value={isLoading ? "—" : stats?.totalProducts || 0}
              icon={Package}
              color="blue"
              subtitle="Registered SKU Models"
            />
            <StatBox
              title="Healthy Stock"
              value={isLoading ? "—" : stats?.inStock || 0}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Healthy units"
            />
            <StatBox
              title="Low stock alerts"
              value={isLoading ? "—" : stats?.lowStock || 0}
              icon={AlertTriangle}
              color="amber"
              subtitle="Below threshold count"
            />
            <StatBox
              title="Out of stock"
              value={isLoading ? "—" : stats?.outOfStock || 0}
              icon={XCircle}
              color="rose"
              subtitle="Completely depleted"
            />
            <StatBox
              title="Total Inventory Value"
              value={isLoading ? "—" : `₹${(stats?.totalValue || 0).toLocaleString("en-IN")}`}
              icon={IndianRupee}
              color="slate"
              subtitle="Valuation at Cost Price"
              className="col-span-2 sm:col-span-3 lg:col-span-1"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Stock Status Pie Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight font-poppins">Inventory Distribution</h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Boutique items divided by physical health status</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                  <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>

              {isLoading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : pieData.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-44 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#0f172a',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500">{item.name}</span>
                        <span className="text-[10px] sm:text-xs font-extrabold text-slate-800">({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 sm:h-64 flex items-center justify-center text-slate-400 text-xs">
                  No stock data configured yet.
                </div>
              )}
            </div>

            {/* Category Bar Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight font-poppins">Inventory by Category</h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Top active categories and pairs breakdown</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                  <Layers size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>

              {isLoading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : categoryData.length > 0 ? (
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: -15, right: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={75} />
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          padding: '8px 12px',
                          fontSize: '10px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="stock" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 sm:h-64 flex items-center justify-center text-slate-400 text-xs">
                  No products registered in store categories.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight font-poppins">Depleted & Low Stocks</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{lowStock?.length || 0} items currently need immediate supply</p>
              </div>
              <Link
                href="/products?stockFilter=low_stock"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span>Manage Alerts</span> <ArrowRight size={13} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-50 rounded-xl sm:rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : lowStock?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {lowStock.slice(0, 6).map((product, idx) => {
                  const isOut = product.currentStock === 0;
                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-150 shadow-xs flex items-center justify-center">
                          {product.mainImage ? (
                            <img src={product.mainImage} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4.5 h-4.5 text-slate-350" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs tracking-tight group-hover:underline cursor-pointer truncate max-w-[140px] sm:max-w-none">
                            {product.name}
                          </p>
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 font-mono block mt-0.5">{product.itemId}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] sm:text-[9px] font-bold shadow-xs ${isOut
                            ? "bg-rose-50 border-rose-100 text-rose-600"
                            : "bg-amber-50 border-amber-100 text-amber-600"
                          }`}>
                          <span className={`w-1 h-1 rounded-full ${isOut ? "bg-rose-500" : "bg-amber-500"}`} />
                          <span>{isOut ? "Sold Out" : `${product.currentStock} left`}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 sm:py-12 text-center border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">All Stocked Up!</h4>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">No boutique products fall below threshold safety stocks.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function StatBox({ title, value, icon: Icon, color, subtitle, className = "" }) {
  const themes = {
    emerald: "bg-emerald-50 border-emerald-150 text-emerald-600",
    amber: "bg-amber-50 border-amber-150 text-amber-600",
    rose: "bg-rose-50 border-rose-150 text-rose-500",
    blue: "bg-blue-50 border-blue-150 text-blue-600",
    slate: "bg-slate-50 border-slate-150 text-slate-600"
  };
  const design = themes[color] || themes.slate;

  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${className}`}>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-3 shadow-xs border ${design}`}>
        <Icon size={14} className="sm:w-4 sm:h-4" />
      </div>
      <p className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 sm:mt-1 group-hover:scale-[1.01] transition-transform duration-200">
        {value}
      </p>
      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{title}</p>
      <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block mt-0.5">{subtitle}</span>
    </div>
  );
}
