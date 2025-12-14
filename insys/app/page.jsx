"use client";

import { useQuery } from "convex/react";
import { api } from "../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import { Package, AlertTriangle, CheckCircle, XCircle, IndianRupee, TrendingUp, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";

export default function Dashboard() {
  const stats = useQuery(api.inventory.getInventoryStats);
  const lowStock = useQuery(api.inventory.getLowStockAlerts, { threshold: 10 });

  const pieData = stats ? [
    { name: "In Stock", value: stats.inStock, color: "#22c55e" },
    { name: "Low Stock", value: stats.lowStock, color: "#f59e0b" },
    { name: "Out of Stock", value: stats.outOfStock, color: "#ef4444" },
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">OVERVIEW</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Inventory Dashboard</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatsCard
              title="Total Products"
              value={isLoading ? "—" : stats?.totalProducts || 0}
              icon={Package}
              color="primary"
            />
            <StatsCard
              title="In Stock"
              value={isLoading ? "—" : stats?.inStock || 0}
              icon={CheckCircle}
              color="success"
            />
            <StatsCard
              title="Low Stock"
              value={isLoading ? "—" : stats?.lowStock || 0}
              icon={AlertTriangle}
              color="warning"
            />
            <StatsCard
              title="Out of Stock"
              value={isLoading ? "—" : stats?.outOfStock || 0}
              icon={XCircle}
              color="danger"
            />
            <StatsCard
              title="Total Value"
              value={isLoading ? "—" : `₹${(stats?.totalValue || 0).toLocaleString()}`}
              icon={IndianRupee}
              color="default"
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Stock Status Pie Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-poppins">Stock Status</h3>
                  <p className="text-sm text-gray-400">Distribution overview</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-xl">
                  <TrendingUp size={20} className="text-gray-500" />
                </div>
              </div>
              
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : pieData.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: '#0f172a', 
                            border: 'none', 
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '8px 12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </div>

            {/* Category Bar Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-poppins">Stock by Category</h3>
                  <p className="text-sm text-gray-400">Top categories</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Package size={20} className="text-gray-500" />
                </div>
              </div>
              
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : categoryData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#0f172a', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          padding: '8px 12px'
                        }}
                      />
                      <Bar dataKey="stock" fill="#0f172a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No categories found
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-poppins">Low Stock Alerts</h3>
                <p className="text-sm text-gray-400">{lowStock?.length || 0} items need attention</p>
              </div>
              <Link 
                href="/alerts"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                View All <ArrowRight size={16} />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : lowStock?.length > 0 ? (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((product, idx) => (
                  <div 
                    key={product._id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {product.mainImage ? (
                          <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${product.currentStock === 0 ? "text-red-500" : "text-amber-500"}`}>
                        {product.currentStock}
                      </p>
                      <p className="text-xs text-gray-400">units left</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">All Stocked Up!</h4>
                <p className="text-gray-500 text-sm">No products below the threshold</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
