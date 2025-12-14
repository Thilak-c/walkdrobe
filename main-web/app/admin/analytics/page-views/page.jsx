"use client";

import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Eye, Clock, Users } from "lucide-react";
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
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

// Helper: Generate last N days as YYYY-MM-DD
function getLast30Days() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

export default function PageViewsAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [aggregatedData, setAggregatedData] = useState({
    hourlyViews: [],
    topPages: [],
    deviceBreakdown: {},
    browserBreakdown: {},
    totalViews: 0,
    uniqueVisitors: 0,
  });
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    loaded: 0,
    total: 0,
    currentDate: null,
  });


  useEffect(() => {
    let isCancelled = false;

    async function loadProgressively() {
      const dates = getLast30Days();
      setLoadingState({ isLoading: true, loaded: 0, total: dates.length, currentDate: null });
      setAggregatedData({
        hourlyViews: [],
        topPages: [],
        deviceBreakdown: {},
        browserBreakdown: {},
        totalViews: 0,
        uniqueVisitors: 0,
      });

      const allHourlyData = [];
      const allTopPages = {};
      const allDevices = {};
      const allBrowsers = {};
      let totalViews = 0;
      const allVisitors = new Set();

      for (let i = 0; i < dates.length; i++) {
        if (isCancelled) break;

        const date = dates[i];
        setLoadingState((prev) => ({ ...prev, currentDate: date, loaded: i }));

        try {
          const { ConvexHttpClient } = await import("convex/browser");
          const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
          const dayData = await client.query(api.analytics.getAnalyticsForDay, { date });

          if (!dayData || dayData.error) continue;

          if (dayData.hourlyViews && Array.isArray(dayData.hourlyViews)) {
            dayData.hourlyViews.forEach((hourData) => {
              const [, m, d] = date.split("-");
              const hourStr = String(hourData.hour).padStart(2, "0");
              allHourlyData.push({
                hour: `${m}/${d} ${hourStr}:00`,
                views: hourData.views,
                uniqueVisitors: hourData.uniqueVisitors,
              });
            });
          }

          if (dayData.topPages && Array.isArray(dayData.topPages)) {
            dayData.topPages.forEach((page) => {
              allTopPages[page.path] = (allTopPages[page.path] || 0) + page.views;
            });
          }

          if (dayData.deviceBreakdown) {
            Object.entries(dayData.deviceBreakdown).forEach(([device, count]) => {
              allDevices[device] = (allDevices[device] || 0) + count;
            });
          }

          if (dayData.browserBreakdown) {
            Object.entries(dayData.browserBreakdown).forEach(([browser, count]) => {
              allBrowsers[browser] = (allBrowsers[browser] || 0) + count;
            });
          }

          if (dayData.meta) {
            totalViews += dayData.meta.totalViews || 0;
          }

          setAggregatedData({
            hourlyViews: [...allHourlyData],
            topPages: Object.entries(allTopPages)
              .map(([path, views]) => ({ page: path, views }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 10),
            deviceBreakdown: { ...allDevices },
            browserBreakdown: { ...allBrowsers },
            totalViews,
            uniqueVisitors: allVisitors.size,
          });

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to load ${date}:`, error);
        }
      }

      setLoadingState({ isLoading: false, loaded: dates.length, total: dates.length, currentDate: null });
    }

    loadProgressively();
    return () => { isCancelled = true; };
  }, [timeRange]);

  const { hourlyViews, topPages, deviceBreakdown, browserBreakdown, totalViews, uniqueVisitors } = aggregatedData;

  const deviceChartData = Object.entries(deviceBreakdown).map(([name, value]) => ({ name, value }));
  const browserChartData = Object.entries(browserBreakdown).map(([name, value]) => ({ name, value }));

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
            <h1 className="text-3xl font-bold mb-2">Page Views Analytics</h1>
            <p className="text-gray-600">Track page views and visitor trends</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            disabled={loadingState.isLoading}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Loading Progress */}
      {loadingState.isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">
              Loading {loadingState.currentDate}... ({loadingState.loaded}/{loadingState.total} days)
            </span>
            <span className="text-sm font-medium text-blue-700">
              {Math.round((loadingState.loaded / loadingState.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(loadingState.loaded / loadingState.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Views" value={totalViews} icon={<Eye className="w-6 h-6" />} color="bg-blue-500" />
        <StatsCard title="Unique Visitors" value={uniqueVisitors} icon={<Users className="w-6 h-6" />} color="bg-green-500" />
        <StatsCard title="Days Loaded" value={`${loadingState.loaded}/${loadingState.total}`} icon={<Clock className="w-6 h-6" />} color="bg-purple-500" />
        <StatsCard title="Status" value={loadingState.isLoading ? "Loading..." : "Complete"} icon={<TrendingUp className="w-6 h-6" />} color="bg-orange-500" />
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Page Views & Unique Visitors Over Time</h2>
        {hourlyViews.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-gray-500">Waiting for data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={hourlyViews}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} dot={false} name="Page Views" />
              <Line type="monotone" dataKey="uniqueVisitors" stroke="#10B981" strokeWidth={2} dot={false} name="Unique Visitors" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Pages & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Top Pages</h2>
          <div className="space-y-3">
            {topPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-bold text-gray-400">#{index + 1}</span>
                  <p className="text-sm truncate">{page.page}</p>
                </div>
                <span className="text-sm font-medium">{page.views}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Device Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {deviceChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Browser Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Browser Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={browserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
