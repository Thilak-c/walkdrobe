"use client";

import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, AlertTriangle, CheckCircle, XCircle, IndianRupee, TrendingUp, ArrowRight, Globe, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function WebsiteDashboard() {
  const stats = useQuery(api.webStore.getStats);
  const lowStock = useQuery(api.webStore.getLowStock, { threshold: 10 });
  const movements = useQuery(api.webStore.getMovements, { limit: 5 });

  const isLoading = stats === undefined;

  const categoryData = stats?.categories 
    ? Object.entries(stats.categories)
        .sort((a, b) => b[1].stock - a[1].stock)
        .slice(0, 5)
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-medium tracking-wide">WEBSITE STORE</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard label="Products" value={stats?.totalProducts || 0} icon={Package} loading={isLoading} />
            <StatCard label="In Stock" value={stats?.inStock || 0} icon={CheckCircle} color="green" loading={isLoading} />
            <StatCard label="Low Stock" value={stats?.lowStock || 0} icon={AlertTriangle} color="amber" loading={isLoading} />
            <StatCard label="Out of Stock" value={stats?.outOfStock || 0} icon={XCircle} color="red" loading={isLoading} />
            <StatCard label="Stock Value" value={`₹${(stats?.totalValue || 0).toLocaleString()}`} icon={IndianRupee} loading={isLoading} className="col-span-2 lg:col-span-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Low Stock */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
                <Link href="/website/alerts" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : lowStock?.length > 0 ? (
                <div className="space-y-2">
                  {lowStock.slice(0, 5).map(p => (
                    <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-gray-200">
                        {p.mainImage ? <img src={p.mainImage} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.itemId}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${p.totalStock === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        {p.totalStock} left
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>All products well stocked!</p>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-gray-400" />
                <h3 className="font-semibold text-gray-900">By Category</h3>
              </div>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map(([cat, data]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{cat}</span>
                        <span className="text-gray-900 font-medium">{data.stock}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${Math.min(100, (data.stock / (stats?.totalStock || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400">No categories yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-4 bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : movements?.length > 0 ? (
              <div className="space-y-2">
                {movements.map(m => (
                  <div key={m._id} className="flex items-center gap-3 p-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${m.type === "stock_in" ? "bg-green-500" : m.type === "sale" ? "bg-gray-900" : "bg-amber-500"}`} />
                    <span className="text-gray-600">{m.productName}</span>
                    <span className={`font-medium ${m.type === "stock_in" ? "text-green-600" : "text-red-600"}`}>
                      {m.type === "stock_in" ? "+" : "-"}{m.quantity}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-gray-400">No activity yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading, className = "" }) {
  const colors = {
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  const iconColor = colors[color] || "bg-gray-100 text-gray-600";
  
  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-200 ${className}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${iconColor}`}>
        <Icon size={16} />
      </div>
      {loading ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" /> : <p className="text-xl font-bold text-gray-900">{value}</p>}
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
