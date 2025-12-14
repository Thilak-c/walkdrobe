"use client";
import { FiEdit, FiUpload, FiBox, FiShoppingCart, FiUsers, FiBarChart2, FiActivity, FiRefreshCw } from "react-icons/fi";
import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bar } from "react-chartjs-2";
import 'chart.js/auto';
import Link from "next/link";
import toast from "react-hot-toast";
// Animated Number Component
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = Math.max(1, Math.floor(duration / (value || 1)));
    const timer = setInterval(() => {
      start += Math.ceil((value || 0) / (duration / stepTime));
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setDisplayValue(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return displayValue.toLocaleString();
}

export default function AdminHomePage() {
  const products = useQuery(api.products.getAll) || [];
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Manual sync to backup database
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/backup", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      });
      const data = await res.json();
      
      if (data.success) {
        setLastSync(new Date().toLocaleTimeString());
        toast.success(
          `Sync complete! Users: ${data.results.users.synced}, Products: ${data.results.products.synced}, Orders: ${data.results.orders.synced}`,
          { duration: 4000 }
        );
      } else {
        toast.error("Sync failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      toast.error("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Period state for each card
  const [salesPeriod, setSalesPeriod] = useState("today");
  const [buysPeriod, setBuysPeriod] = useState("today");
  const [productsPeriod, setProductsPeriod] = useState("today");

  const today = new Date();

  const calculateMetric = (items, period, metric = "sales") => {
    return items.reduce((sum, p) => {
      if (!p.createdAt) return sum;
      const created = new Date(p.createdAt);

      const matchPeriod = () => {
        switch (period) {
          case "today":
            return created.getDate() === today.getDate() &&
                   created.getMonth() === today.getMonth() &&
                   created.getFullYear() === today.getFullYear();
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return created.getDate() === yesterday.getDate() &&
                   created.getMonth() === yesterday.getMonth() &&
                   created.getFullYear() === yesterday.getFullYear();
          case "weekly":
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return created >= weekAgo && created <= today;
          case "monthly":
            return created.getMonth() === today.getMonth() &&
                   created.getFullYear() === today.getFullYear();
          case "year":
            return created.getFullYear() === today.getFullYear();
          default:
            return false;
        }
      };

      if (matchPeriod()) {
        if (metric === "sales") return sum + (p.buys * p.price || 0);
        if (metric === "buys") return sum + (p.buys || 0);
        if (metric === "products") return sum + 1;
      }
      return sum;
    }, 0);
  };

  const todaySales = calculateMetric(products, salesPeriod, "sales");
  const totalBuys = calculateMetric(products, buysPeriod, "buys");
  const totalProducts = calculateMetric(products, productsPeriod, "products");
  const lifetimeSales = products.reduce((sum, p) => sum + (p.buys * p.price || 0), 0);

  // Chart Data
  const chartData = {
    labels: products.map(p => p.name),
    datasets: [
      {
        label: 'Buys',
        data: products.map(p => p.buys),
        backgroundColor: 'rgba(0,0,0,0.2)',
      },
      {
        label: 'Total Sales',
        data: products.map(p => p.buys * p.price),
        backgroundColor: 'rgba(0,0,0,0.4)',
      }
    ],
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-[100%]  bg-gray-100 text-gray-900 p-6">
      {/* Header */}
   

      {/* Sync Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {lastSync && <p className="text-sm text-gray-500">Last sync: {lastSync}</p>}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-md ${
            syncing 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg"
          }`}
        >
          <FiRefreshCw className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Backup"}
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Sales" value={`₹${todaySales}`} period={salesPeriod} setPeriod={setSalesPeriod} />
        <StatsCard title="Buys" value={totalBuys} period={buysPeriod} setPeriod={setBuysPeriod} />
        <StatsCard title="Products" value={totalProducts} period={productsPeriod} setPeriod={setProductsPeriod} />
        <StatsCard title="Lifetime Sales" value={`₹${lifetimeSales}`} />
      </div>

      {/* Charts */}
     
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  {/* Buys & Sales Chart */}
  <div className="bg-white p-4 rounded-xl shadow-md">
    <h2 className="text-xl font-semibold mb-2">Buys & Sales per Product</h2>
    <Bar data={chartData} options={{ responsive: true }} />
  </div>

  {/* Mega Navigation Section */}
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
    {[
      { label: "products", href: "/admin/products", icon: <FiEdit size={24} /> },
      { label: "Upload Product", href: "/admin/upload", icon: <FiUpload size={24} /> },
      { label: "All Products", href: "/admin/all-products", icon: <FiBox size={24} /> },
      { label: "Orders", href: "/admin/orders", icon: <FiShoppingCart size={24} /> },
      { label: "Users", href: "/admin/users", icon: <FiUsers size={24} /> },
      { label: "Analytics", href: "/admin/analytics", icon: <FiActivity size={24} /> },
      { label: "Reports", href: "/admin/reports", icon: <FiBarChart2 size={24} /> }
    ].map((btn, idx) => (
      <Link
        key={idx}
        href={btn.href}
        className="flex flex-col justify-center items-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl transform hover:scale-105 transition group"
      >
        <div className="w-12 h-12 mb-2 flex justify-center items-center bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition text-indigo-600">
          {btn.icon}
        </div>
        <p className="text-center font-medium text-gray-700 group-hover:text-indigo-600 transition">{btn.label}</p>
      </Link>
    ))}
  </div>
</div>

      {/* Products Grid */}
    {/* Quick Product Search + Products Overview */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Quick Search */}
  <div className="col-span-3 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105">
    <h2 className="text-xl font-semibold mb-4">Quick Product Search</h2>
    <input
      type="text"
      placeholder="Search products..."
      className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
    {filteredProducts.length === 0 && <p className="mt-2 text-gray-500 text-sm">No products found.</p>}
  </div>

  {/* Products Overview */}
  <div className="md:col-span-2">
    <h2 className="text-2xl font-bold mb-4">Products Overview</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map(p => (
        <div key={p.itemId} className="bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:scale-105 relative overflow-hidden group">
          <img src={p.mainimg} alt={p.name} className="w-full h-40 object-cover rounded-t-xl" />
          
          <div className="p-4">
            <h3 className="font-semibold text-lg">{p.name}</h3>
            <p className="text-sm text-gray-500">{p.category || "Uncategorized"}</p>
            <p className="font-bold mt-1">₹{p.price.toLocaleString()}</p>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-center items-center text-white text-center p-4">
            <p className="mb-1 text-sm">Buys: <strong>{p.buys || 0}</strong></p>
            <p className="mb-1 text-sm">Total Sales: <strong>₹{(p.buys * p.price || 0).toLocaleString()}</strong></p>
            <Link href={`/admin/product/${p.itemId}`} className="mt-2 px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-700 text-sm font-medium">
              View / Edit
            </Link>
          </div>

          {/* Buys badge */}
          {p.buys > 0 && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {p.buys} Buys
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, period, setPeriod }) {
  return (
    <div className="p-6 rounded-xl shadow-md bg-white transform hover:scale-105 transition relative">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold">
        <AnimatedNumber value={parseInt(value.toString().replace(/[^0-9]/g,''))} />
      </p>
      {setPeriod && (
        <select
          className="mt-2 w-full border border-gray-300 rounded p-1 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="year">Year</option>
        </select>
      )}
    </div>
  );
}
