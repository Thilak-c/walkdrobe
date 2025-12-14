"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, IndianRupee, ShoppingBag, RotateCcw, Wallet, FileText, X, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showDayClose, setShowDayClose] = useState(false);
  const [dayCloseData, setDayCloseData] = useState({ openingCash: "", closingCash: "", notes: "" });

  const today = new Date().toISOString().split("T")[0];
  const todaySales = useQuery(api.insys.getTodaySales, {});
  const profitAnalytics = useQuery(api.insys.getProfitAnalytics, {
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined
  });
  const dailyReports = useQuery(api.insys.getDailyReports, { limit: 30 });
  const todayReport = useQuery(api.insys.getDailyReport, { date: today });
  const generateReport = useMutation(api.insys.generateDailyReport);
  const backup = useQuery(api.insys.getFullBackup, {});

  const handleDayClose = async () => {
    try {
      await generateReport({
        date: today,
        openingCash: parseFloat(dayCloseData.openingCash) || undefined,
        closingCash: parseFloat(dayCloseData.closingCash) || undefined,
        notes: dayCloseData.notes || undefined,
        closedBy: "admin"
      });
      toast.success("Day closed successfully!");
      setShowDayClose(false);
      setDayCloseData({ openingCash: "", closingCash: "", notes: "" });
    } catch (error) { toast.error("Failed to close day"); }
  };

  const handleExportBackup = () => {
    if (!backup) return;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walkdrobe-backup-${today}.json`;
    a.click();
    toast.success("Backup downloaded!");
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">ANALYTICS</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Reports</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDayClose(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-medium text-sm">
                <FileText size={16} />Close Day
              </button>
              <button onClick={handleExportBackup} disabled={!backup} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
                <Download size={16} />Backup
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {["overview", "profit", "daily"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                {tab === "overview" ? "Today's Overview" : tab === "profit" ? "Profit & Loss" : "Daily Reports"}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              {/* Today's Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-xl"><IndianRupee className="w-5 h-5 text-emerald-500" /></div>
                    <span className="text-sm text-gray-500">Today's Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.total?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">{todaySales?.transactions || 0} transactions</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-xl"><ShoppingBag className="w-5 h-5 text-green-500" /></div>
                    <span className="text-sm text-gray-500">Cash</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.cash?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl"><Wallet className="w-5 h-5 text-blue-500" /></div>
                    <span className="text-sm text-gray-500">Card</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.card?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl"><IndianRupee className="w-5 h-5 text-purple-500" /></div>
                    <span className="text-sm text-gray-500">UPI</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.upi?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Payment Method Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: "Cash", value: todaySales?.cash || 0 },
                          { name: "Card", value: todaySales?.card || 0 },
                          { name: "UPI", value: todaySales?.upi || 0 },
                        ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {[0, 1, 2].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Bills */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {todaySales?.bills?.slice(0, 10).map((bill) => (
                      <div key={bill._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium">#{bill.billNumber}</p>
                          <p className="text-xs text-gray-400">{bill.customerName || "Walk-in"}</p>
                        </div>
                        <p className="font-semibold">₹{bill.total?.toFixed(0)}</p>
                      </div>
                    ))}
                    {(!todaySales?.bills || todaySales.bills.length === 0) && (
                      <p className="text-center text-gray-400 py-8">No sales today</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">ANALYTICS</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Reports</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDayClose(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm">
                <FileText size={16} />Close Day
              </button>
              <button onClick={handleExportBackup} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
                <Download size={16} />Backup
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["overview", "daily", "profit"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                {tab === "overview" ? "Today's Sales" : tab === "daily" ? "Daily Reports" : "Profit & Loss"}
              </button>
            ))}
          </div>

          {/* Date Filter for Profit tab */}
          {activeTab === "profit" && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <Calendar size={16} className="text-gray-400" />
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
                <span className="text-gray-400">to</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
                <button onClick={() => setDateRange({ start: "", end: "" })} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            </div>
          )}

          {/* Today's Sales Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-xl"><IndianRupee className="w-5 h-5 text-emerald-600" /></div>
                    <span className="text-sm text-gray-500">Today's Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.total?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-xl"><ShoppingBag className="w-5 h-5 text-blue-600" /></div>
                    <span className="text-sm text-gray-500">Transactions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{todaySales?.transactions || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                    <span className="text-sm text-gray-500">Cash</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.cash?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-xl"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
                    <span className="text-sm text-gray-500">Card + UPI</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{((todaySales?.card || 0) + (todaySales?.upi || 0)).toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: "Cash", value: todaySales?.cash || 0 },
                          { name: "Card", value: todaySales?.card || 0 },
                          { name: "UPI", value: todaySales?.upi || 0 },
                        ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {[0, 1, 2].map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {[{ name: "Cash", color: COLORS[0] }, { name: "Card", color: COLORS[1] }, { name: "UPI", color: COLORS[2] }].map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Bills */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h3>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto">
                    {todaySales?.bills?.slice(0, 10).map((bill) => (
                      <div key={bill._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">#{bill.billNumber}</p>
                          <p className="text-xs text-gray-400">{bill.customerName || "Walk-in"} • {new Date(bill.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <p className="font-bold text-gray-900">₹{bill.total?.toFixed(0)}</p>
                      </div>
                    ))}
                    {(!todaySales?.bills || todaySales.bills.length === 0) && (
                      <p className="text-center text-gray-400 py-8">No sales today</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
