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
          
          {/* Header Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-[32px] p-6 lg:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-850 mb-8"
          >
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-20 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-3">
                  <Sparkles size={11} className="animate-spin-slow" />
                  <span>Patna Retail Storefront Active</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight font-poppins">Offline Shop Hub</h1>
                <p className="text-slate-400 text-sm mt-1 max-w-xl">
                  Real-time offline boutique inventory dashboard. Track physical stocks, check stock warnings, and print SKU barcode tags.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/billing"
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag size={14} className="text-slate-900" />
                  <span>Create Invoice</span>
                </Link>
                <Link
                  href="/add-product"
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Stock Status Pie Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight font-poppins">Inventory Distribution</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Boutique items divided by physical health status</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                  <TrendingUp size={16} />
                </div>
              </div>
              
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : pieData.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
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
                            borderRadius: '16px',
                            color: '#fff',
                            padding: '10px 14px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center flex-wrap gap-5 mt-4">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-500">{item.name}</span>
                        <span className="text-xs font-extrabold text-slate-800">({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  No stock data configured yet.
                </div>
              )}
            </div>

            {/* Category Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight font-poppins">Inventory by Category</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Top active categories and pairs breakdown</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
                  <Layers size={16} />
                </div>
              </div>
              
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : categoryData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#0f172a', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: '#fff',
                          padding: '10px 14px',
                          fontSize: '11px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="stock" fill="#0f172a" radius={[0, 6, 6, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  No products registered in store categories.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight font-poppins">Depleted & Low Stocks</h3>
                <p className="text-[10px] text-slate-400 font-medium">{lowStock?.length || 0} items currently need immediate supply</p>
              </div>
              <Link 
                href="/products?stockFilter=low_stock"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span>Manage Alerts</span> <ArrowRight size={14} />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : lowStock?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStock.slice(0, 6).map((product, idx) => {
                  const isOut = product.currentStock === 0;
                  return (
                    <div 
                      key={product._id} 
                      className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-150 shadow-sm flex items-center justify-center">
                          {product.mainImage ? (
                            <img src={product.mainImage} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-350" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs tracking-tight group-hover:underline cursor-pointer">
                            {product.name}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 font-mono block mt-0.5">{product.itemId}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-bold shadow-xs ${
                          isOut
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
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-3xl">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800">All Stocked Up!</h4>
                <p className="text-slate-400 text-xs mt-1">No boutique products fall below threshold safety stocks.</p>
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
    <div className={`bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${className}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 shadow-xs border ${design}`}>
        <Icon size={16} />
      </div>
      <p className="text-xl font-extrabold text-slate-800 tracking-tight mt-1 group-hover:scale-[1.01] transition-transform duration-200">
        {value}
      </p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{title}</p>
      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{subtitle}</span>
    </div>
  );
}
