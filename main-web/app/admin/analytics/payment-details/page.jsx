"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, TrendingUp, CreditCard, Banknote, ShoppingCart, XCircle, Sparkles } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const PAYMENT_COLORS = { razorpay: "#3B82F6", cod: "#F59E0B", hybrid: "#10B981", cancelled: "#EF4444" };

export default function PaymentDetailsAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaymentData() {
      setLoading(true);
      try {
        const { ConvexHttpClient } = await import("convex/browser");
        const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

        const endDate = new Date();
        const startDate = new Date();
        if (timeRange === "7d") {
          startDate.setDate(startDate.getDate() - 7);
        } else {
          startDate.setDate(startDate.getDate() - 30);
        }

        const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

        const data = await client.query(api.analytics.getPaymentMethodsAnalytics, {
          startDate: startDateStr,
          endDate: endDateStr,
        });

        setPaymentData(data);
      } catch (error) {
        console.error("Failed to load payment data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPaymentData();
  }, [timeRange]);


  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payment Details Analytics</h1>
            <p className="text-gray-600">Track payment methods and revenue trends</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            disabled={loading}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Loading payment data...
          </div>
        </div>
      ) : paymentData ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatsCard
              title="Total Orders"
              value={paymentData.totalOrders}
              icon={<ShoppingCart className="w-6 h-6" />}
              color="bg-blue-500"
            />
            <StatsCard
              title="Razorpay"
              value={paymentData.paymentMethods?.razorpay || 0}
              icon={<CreditCard className="w-6 h-6" />}
              color="bg-indigo-500"
            />
            <StatsCard
              title="Hybrid (20%+COD)"
              value={paymentData.paymentMethods?.hybrid || 0}
              icon={<Sparkles className="w-6 h-6" />}
              color="bg-emerald-500"
            />
            <StatsCard
              title="COD"
              value={paymentData.paymentMethods?.cod || 0}
              icon={<Banknote className="w-6 h-6" />}
              color="bg-amber-500"
            />
            <StatsCard
              title="Cancelled"
              value={paymentData.cancelledOrders || 0}
              icon={<XCircle className="w-6 h-6" />}
              color="bg-red-500"
            />
            <StatsCard
              title="Revenue"
              value={`₹${paymentData.totalRevenue?.toLocaleString() || 0}`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="bg-green-500"
            />
          </div>

          {/* Payment Methods Over Time */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Orders Over Time (Including Cancelled)</h2>
            {paymentData.dailyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={paymentData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels = { razorpay: "Razorpay", cod: "COD", hybrid: "Hybrid (20%+COD)", cancelled: "Cancelled" };
                      return [value, labels[name] || name];
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels = { razorpay: "Razorpay", cod: "COD", hybrid: "Hybrid", cancelled: "Cancelled" };
                      return labels[value] || value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="razorpay"
                    stackId="1"
                    stroke={PAYMENT_COLORS.razorpay}
                    fill={PAYMENT_COLORS.razorpay}
                    fillOpacity={0.6}
                    name="razorpay"
                  />
                  <Area
                    type="monotone"
                    dataKey="hybrid"
                    stackId="1"
                    stroke={PAYMENT_COLORS.hybrid}
                    fill={PAYMENT_COLORS.hybrid}
                    fillOpacity={0.6}
                    name="hybrid"
                  />
                  <Area
                    type="monotone"
                    dataKey="cod"
                    stackId="1"
                    stroke={PAYMENT_COLORS.cod}
                    fill={PAYMENT_COLORS.cod}
                    fillOpacity={0.6}
                    name="cod"
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    stackId="1"
                    stroke={PAYMENT_COLORS.cancelled}
                    fill={PAYMENT_COLORS.cancelled}
                    fillOpacity={0.6}
                    name="cancelled"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                No payment data available for this period
              </div>
            )}
          </div>

          {/* Distribution & Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Payment Method Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Razorpay", value: paymentData.paymentMethods?.razorpay || 0 },
                      { name: "Hybrid", value: paymentData.paymentMethods?.hybrid || 0 },
                      { name: "COD", value: paymentData.paymentMethods?.cod || 0 },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill={PAYMENT_COLORS.razorpay} />
                    <Cell fill={PAYMENT_COLORS.hybrid} />
                    <Cell fill={PAYMENT_COLORS.cod} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Revenue by Payment Method</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Razorpay",
                      revenue: paymentData.paymentMethodRevenue?.razorpay || 0,
                    },
                    {
                      name: "COD",
                      revenue: paymentData.paymentMethodRevenue?.cod || 0,
                    },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#10B981" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cancelled Orders Section */}
          {paymentData.cancelledOrders > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Cancelled Orders Breakdown
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Cancelled</span>
                    <span className="font-bold text-red-600">{paymentData.cancelledOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Razorpay Cancelled</span>
                    <span className="font-medium">{paymentData.cancelledByMethod?.razorpay || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">COD Cancelled</span>
                    <span className="font-medium">{paymentData.cancelledByMethod?.cod || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-600">Lost Revenue</span>
                    <span className="font-bold text-red-600">₹{paymentData.totalCancelledRevenue?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Order Status Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(paymentData.orderStatusBreakdown || {}).map(([status, count]) => ({
                        name: status.charAt(0).toUpperCase() + status.slice(1),
                        value: count,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {Object.keys(paymentData.orderStatusBreakdown || {}).map((status, index) => {
                        const colors = {
                          confirmed: "#10B981",
                          shipped: "#3B82F6",
                          delivered: "#22C55E",
                          cancelled: "#EF4444",
                          pending: "#F59E0B",
                        };
                        return <Cell key={`cell-${index}`} fill={colors[status] || "#6B7280"} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Daily Revenue Trend */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Daily Revenue by Payment Method</h2>
            {paymentData.dailyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={paymentData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels = {
                        razorpayRevenue: "Razorpay Revenue",
                        codRevenue: "COD Revenue",
                        totalRevenue: "Total Revenue",
                      };
                      return [`₹${value.toLocaleString()}`, labels[name] || name];
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels = {
                        razorpayRevenue: "Razorpay Revenue",
                        codRevenue: "COD Revenue",
                        totalRevenue: "Total Revenue",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="razorpayRevenue"
                    stroke={PAYMENT_COLORS.razorpay}
                    strokeWidth={2}
                    dot={false}
                    name="razorpayRevenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="codRevenue"
                    stroke={PAYMENT_COLORS.cod}
                    strokeWidth={2}
                    dot={false}
                    name="codRevenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="totalRevenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                No revenue data available for this period
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No payment data available
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, color }) {
  return (
    <div className="p-6 rounded-xl shadow-md bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
