"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, IndianRupee, ShoppingBag, Wallet, FileText, X, Save } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showDayClose, setShowDayClose] = useState(false);
  const [dayCloseData, setDayCloseData] = useState({ openingCash: "", closingCash: "", notes: "" });

  const today = new Date().toISOString().split("T")[0];
  const todaySales = useQuery(api.insys.getTodaySales, {});
  const profitAnalytics = useQuery(api.insys.getProfitAnalytics, {
    startDate: dateRange.start || undefined, endDate: dateRange.end || undefined
  });
  const dailyReports = useQuery(api.insys.getDailyReports, { limit: 30 });
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
      toast.success("Day closed!");
      setShowDayClose(false);
      setDayCloseData({ openingCash: "", closingCash: "", notes: "" });
    } catch (error) { toast.error("Failed"); }
  };

  const handleExportBackup = () => {
    if (!backup) return;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `walkdrobe-backup-${today}.json`; a.click();
    toast.success("Backup downloaded!");
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

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
          <div className="flex gap-2 mb-6">
            {["overview", "profit", "daily"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                {tab === "overview" ? "Today" : tab === "profit" ? "Profit/Loss" : "Daily Reports"}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          {activeTab === "profit" && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <Calendar size={16} className="text-gray-400" />
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
                <span className="text-gray-400">to</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
                <button onClick={() => setDateRange({ start: "", end: "" })} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            </div>
          )}

          {/* Today's Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-emerald-100 rounded-xl"><IndianRupee className="w-5 h-5 text-emerald-500" /></div><span className="text-sm text-gray-500">Sales</span></div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.total?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-100 rounded-xl"><ShoppingBag className="w-5 h-5 text-blue-500" /></div><span className="text-sm text-gray-500">Bills</span></div>
                  <p className="text-2xl font-bold text-gray-900">{todaySales?.transactions || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-green-100 rounded-xl"><Wallet className="w-5 h-5 text-green-500" /></div><span className="text-sm text-gray-500">Cash</span></div>
                  <p className="text-2xl font-bold text-gray-900">₹{todaySales?.cash?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-purple-100 rounded-xl"><IndianRupee className="w-5 h-5 text-purple-500" /></div><span className="text-sm text-gray-500">Digital</span></div>
                  <p className="text-2xl font-bold text-gray-900">₹{((todaySales?.card || 0) + (todaySales?.upi || 0)).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Split</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={[{ name: "Cash", value: todaySales?.cash || 0 }, { name: "Card", value: todaySales?.card || 0 }, { name: "UPI", value: todaySales?.upi || 0 }].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {[0, 1, 2].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h3>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {todaySales?.bills?.slice(0, 8).map((bill) => (
                      <div key={bill._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div><p className="text-sm font-medium">#{bill.billNumber}</p><p className="text-xs text-gray-400">{bill.customerName || "Walk-in"}</p></div>
                        <p className="font-semibold">₹{bill.total?.toFixed(0)}</p>
                      </div>
                    ))}
                    {(!todaySales?.bills || todaySales.bills.length === 0) && <p className="text-center text-gray-400 py-8">No sales today</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profit/Loss Tab */}
          {activeTab === "profit" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{profitAnalytics?.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Cost</p>
                  <p className="text-2xl font-bold text-gray-900">₹{profitAnalytics?.totalCost?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Expenses</p>
                  <p className="text-2xl font-bold text-red-500">₹{profitAnalytics?.totalExpenses?.toLocaleString() || 0}</p>
                </div>
                <div className={`rounded-2xl p-5 border ${(profitAnalytics?.netProfit || 0) >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                  <p className={`text-2xl font-bold ${(profitAnalytics?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {(profitAnalytics?.netProfit || 0) >= 0 ? "" : "-"}₹{Math.abs(profitAnalytics?.netProfit || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{profitAnalytics?.profitMargin || 0}% margin</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Total Revenue</span><span className="font-semibold">₹{profitAnalytics?.totalRevenue?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Product Cost</span><span className="font-semibold text-red-500">-₹{profitAnalytics?.totalCost?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between p-3 bg-emerald-50 rounded-xl"><span>Gross Profit</span><span className="font-semibold text-emerald-600">₹{profitAnalytics?.grossProfit?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Operating Expenses</span><span className="font-semibold text-red-500">-₹{profitAnalytics?.totalExpenses?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl"><span>Refunds</span><span className="font-semibold text-red-500">-₹{profitAnalytics?.totalRefunds?.toLocaleString() || 0}</span></div>
                  <div className={`flex justify-between p-4 rounded-xl ${(profitAnalytics?.netProfit || 0) >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                    <span className="font-semibold">Net Profit</span>
                    <span className={`font-bold text-lg ${(profitAnalytics?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>₹{profitAnalytics?.netProfit?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Reports Tab */}
          {activeTab === "daily" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {dailyReports?.length === 0 ? (
                <div className="p-16 text-center"><BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports</h3><p className="text-gray-500">Close your first day to generate a report</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sales</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Bills</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Returns</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expenses</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dailyReports?.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{report.date}</td>
                          <td className="px-6 py-4 text-right">₹{report.totalSales?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{report.totalTransactions}</td>
                          <td className="px-6 py-4 text-right text-red-500">₹{report.totalReturns?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-red-500">₹{report.totalExpenses?.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${report.netRevenue >= 0 ? "text-emerald-600" : "text-red-600"}`}>₹{report.netRevenue?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Day Close Modal */}
      {showDayClose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Close Day - {today}</h3>
              <button onClick={() => setShowDayClose(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{todaySales?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400">{todaySales?.transactions || 0} transactions</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash</label>
                  <input type="number" value={dayCloseData.openingCash} onChange={(e) => setDayCloseData({ ...dayCloseData, openingCash: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Cash</label>
                  <input type="number" value={dayCloseData.closingCash} onChange={(e) => setDayCloseData({ ...dayCloseData, closingCash: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
              </div>
              {dayCloseData.openingCash && dayCloseData.closingCash && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700">Cash Difference: ₹{(parseFloat(dayCloseData.closingCash) - parseFloat(dayCloseData.openingCash) - (todaySales?.cash || 0)).toFixed(2)}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={dayCloseData.notes} onChange={(e) => setDayCloseData({ ...dayCloseData, notes: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm resize-none" placeholder="Any notes for today..." />
              </div>
              <button onClick={handleDayClose} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-medium">
                <Save size={18} />Close Day & Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
