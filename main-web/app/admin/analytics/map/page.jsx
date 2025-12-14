"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Users, Globe, Building, TrendingUp, ShoppingBag, IndianRupee, Package, Truck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function UserMapPage() {
  const activeUsersData = useQuery(api.analytics.getActiveUsers);
  const allOrders = useQuery(api.orders.getAllOrders, { limit: 1000 });
  
  const [stats, setStats] = useState({
    // Active users
    usersByCity: {},
    usersByCountry: {},
    // Orders
    ordersByCity: {},
    ordersByState: {},
    ordersByPincode: {},
    // Revenue
    revenueByState: {},
    revenueByCity: {},
    // Order status by location
    statusByState: {},
    // Daily trends by top states
    dailyByState: {},
    // Top customers by location
    topCustomerLocations: [],
    // Delivery stats
    deliveredByState: {},
    avgOrderValueByState: {},
  });

  useEffect(() => {
    if (!allOrders) return;

    const ordersByCity = {};
    const ordersByState = {};
    const ordersByPincode = {};
    const revenueByState = {};
    const revenueByCity = {};
    const statusByState = {};
    const dailyByState = {};
    const deliveredByState = {};
    const orderValuesByState = {};

    allOrders.forEach((order) => {
      const city = order.shippingDetails?.city || "Unknown";
      const state = order.shippingDetails?.state || "Unknown";
      const pincode = order.shippingDetails?.pincode || "Unknown";
      const amount = order.orderTotal || 0;
      const status = order.status || "unknown";
      const date = new Date(order.createdAt);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;

      // Orders count
      ordersByCity[city] = (ordersByCity[city] || 0) + 1;
      ordersByState[state] = (ordersByState[state] || 0) + 1;
      ordersByPincode[pincode] = (ordersByPincode[pincode] || 0) + 1;

      // Revenue
      revenueByState[state] = (revenueByState[state] || 0) + amount;
      revenueByCity[city] = (revenueByCity[city] || 0) + amount;

      // Order values for average calculation
      if (!orderValuesByState[state]) orderValuesByState[state] = [];
      orderValuesByState[state].push(amount);

      // Status by state
      if (!statusByState[state]) {
        statusByState[state] = { confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
      }
      if (statusByState[state][status] !== undefined) {
        statusByState[state][status]++;
      }

      // Delivered count
      if (status === "delivered") {
        deliveredByState[state] = (deliveredByState[state] || 0) + 1;
      }

      // Daily trends for top 5 states
      if (!dailyByState[dateKey]) dailyByState[dateKey] = { date: dateKey };
      dailyByState[dateKey][state] = (dailyByState[dateKey][state] || 0) + 1;
    });

    // Calculate average order value by state
    const avgOrderValueByState = {};
    Object.entries(orderValuesByState).forEach(([state, values]) => {
      avgOrderValueByState[state] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    });

    setStats({
      ordersByCity,
      ordersByState,
      ordersByPincode,
      revenueByState,
      revenueByCity,
      statusByState,
      dailyByState,
      deliveredByState,
      avgOrderValueByState,
      usersByCity: {},
      usersByCountry: {},
      topCustomerLocations: [],
    });
  }, [allOrders]);


  // Process active users
  useEffect(() => {
    if (!activeUsersData?.sessions) return;

    const usersByCity = {};
    const usersByCountry = {};

    activeUsersData.sessions.forEach((session) => {
      if (session.city) usersByCity[session.city] = (usersByCity[session.city] || 0) + 1;
      if (session.country) usersByCountry[session.country] = (usersByCountry[session.country] || 0) + 1;
    });

    setStats((prev) => ({ ...prev, usersByCity, usersByCountry }));
  }, [activeUsersData]);

  // Prepare chart data
  const topStates = Object.entries(stats.ordersByState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCities = Object.entries(stats.ordersByCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topPincodes = Object.entries(stats.ordersByPincode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const revenueByStateData = Object.entries(stats.revenueByState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, revenue: value }));

  const stateOrderData = topStates.map(([name, orders]) => ({
    name,
    orders,
    revenue: stats.revenueByState[name] || 0,
    delivered: stats.deliveredByState[name] || 0,
    avgValue: stats.avgOrderValueByState[name] || 0,
  }));

  const dailyTrendData = Object.values(stats.dailyByState)
    .sort((a, b) => {
      const [aM, aD] = a.date.split("/").map(Number);
      const [bM, bD] = b.date.split("/").map(Number);
      return aM - bM || aD - bD;
    })
    .slice(-14); // Last 14 days

  const top5States = topStates.slice(0, 5).map(([name]) => name);

  const totalOrders = allOrders?.length || 0;
  const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.orderTotal || 0), 0) || 0;
  const deliveredOrders = allOrders?.filter((o) => o.status === "delivered").length || 0;
  const activeUsers = activeUsersData?.count || 0;

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Geographic Analytics</h1>
          <p className="text-gray-600">Complete location-based insights for orders and users</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard title="Active Users" value={activeUsers} icon={<Users className="w-5 h-5" />} color="bg-blue-500" />
        <StatsCard title="Total Orders" value={totalOrders} icon={<ShoppingBag className="w-5 h-5" />} color="bg-green-500" />
        <StatsCard title="Delivered" value={deliveredOrders} icon={<Truck className="w-5 h-5" />} color="bg-emerald-500" />
        <StatsCard title="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}k`} icon={<IndianRupee className="w-5 h-5" />} color="bg-purple-500" />
        <StatsCard title="States" value={Object.keys(stats.ordersByState).length} icon={<Globe className="w-5 h-5" />} color="bg-orange-500" />
        <StatsCard title="Cities" value={Object.keys(stats.ordersByCity).length} icon={<Building className="w-5 h-5" />} color="bg-pink-500" />
      </div>

      {/* Orders & Revenue by State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Orders by State
          </h2>
          {stateOrderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stateOrderData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">No data</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-green-500" />
            Revenue by State
          </h2>
          {revenueByStateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueByStateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">No data</div>
          )}
        </div>
      </div>

      {/* Daily Trend by Top States */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Daily Orders Trend by Top States (Last 14 Days)
        </h2>
        {dailyTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {top5States.map((state, index) => (
                <Area
                  key={state}
                  type="monotone"
                  dataKey={state}
                  stackId="1"
                  stroke={COLORS[index]}
                  fill={COLORS[index]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">No trend data</div>
        )}
      </div>

      {/* Cities & Pincodes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-orange-500" />
            Top 10 Cities by Orders
          </h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {topCities.map(([city, count], index) => (
              <div key={city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{city}</p>
                    <p className="text-xs text-gray-500">₹{(stats.revenueByCity[city] || 0).toLocaleString()} revenue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{count}</p>
                  <p className="text-xs text-gray-500">orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Top 10 Pincodes
          </h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {topPincodes.map(([pincode, count], index) => (
              <div key={pincode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                  <p className="font-medium font-mono">{pincode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(count / topPincodes[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-red-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* State Performance Table */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">State Performance Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-semibold">State</th>
                <th className="text-right p-3 font-semibold">Orders</th>
                <th className="text-right p-3 font-semibold">Revenue</th>
                <th className="text-right p-3 font-semibold">Delivered</th>
                <th className="text-right p-3 font-semibold">Avg Order</th>
                <th className="text-right p-3 font-semibold">Delivery %</th>
              </tr>
            </thead>
            <tbody>
              {stateOrderData.slice(0, 15).map((state, index) => {
                const deliveryRate = state.orders > 0 ? ((state.delivered / state.orders) * 100).toFixed(0) : 0;
                return (
                  <tr key={state.name} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium">#{index + 1}</span>
                        <span className="font-medium">{state.name}</span>
                      </div>
                    </td>
                    <td className="text-right p-3 font-medium">{state.orders}</td>
                    <td className="text-right p-3 text-green-600 font-medium">₹{state.revenue.toLocaleString()}</td>
                    <td className="text-right p-3">{state.delivered}</td>
                    <td className="text-right p-3 text-purple-600">₹{state.avgValue}</td>
                    <td className="text-right p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        deliveryRate >= 70 ? "bg-green-100 text-green-700" :
                        deliveryRate >= 40 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {deliveryRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Live Active Users ({activeUsers})
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activeUsersData?.sessions?.length > 0 ? (
              activeUsersData.sessions.map((session) => (
                <div key={session._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="font-medium text-sm">{session.user ? session.user.name : "GUEST"}</p>
                      </div>
                      {session.city && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.city}, {session.country} {session.postal && `- ${session.postal}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 truncate">{session.currentPage}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{session.deviceType}</p>
                      <p>{Math.floor(session.sessionDuration / 60000)}m</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No active users</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Users by Country
          </h2>
          {Object.keys(stats.usersByCountry).length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.usersByCountry).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {Object.keys(stats.usersByCountry).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              No active user country data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }) {
  return (
    <div className="p-4 rounded-xl shadow-md bg-white">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-gray-500">{title}</h3>
        <div className={`${color} text-white p-1.5 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
