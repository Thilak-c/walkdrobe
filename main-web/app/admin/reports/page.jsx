"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiUsers, 
  FiPackage, 
  FiDollarSign, 
  FiDownload, 
  FiFilter, 
  FiCalendar,
  FiRefreshCw,
  FiEye,
  FiShoppingCart,
  FiStar,
  FiActivity,
  FiTarget,
  FiPieChart,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUserPlus
} from "react-icons/fi";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  // Convert dates to timestamps for Convex queries
  const startTimestamp = new Date(dateRange.start).getTime();
  const endTimestamp = new Date(dateRange.end).getTime();

  // Fetch all analytics data
  const dashboardStats = useQuery(api.products.getDashboardStats, {
    startDate: startTimestamp,
    endDate: endTimestamp
  });

  const orderStats = useQuery(api.orders.getOrderStats);
  const productStats = useQuery(api.products.getProductStats);
  const salesPerformance = useQuery(api.products.getSalesPerformanceFixed, {
    startDate: startTimestamp,
    endDate: endTimestamp,
    period: selectedPeriod
  });

  const advancedAnalytics = useQuery(api.products.getAdvancedAnalyticsFixed, {
    startDate: startTimestamp,
    endDate: endTimestamp,
    period: selectedPeriod
  });

  const detailedReports = useQuery(api.products.getDetailedReportsFixed, {
    startDate: startTimestamp,
    endDate: endTimestamp,
    reportType: "comprehensive"
  });

  const allOrders = useQuery(api.orders.getAllOrders, { limit: 1000 });
  const allProducts = useQuery(api.products.getAllProducts, { limit: 1000 });

  // Chart data preparation
  const salesChartData = {
    labels: salesPerformance?.labels || [],
    datasets: [
      {
        label: 'Sales Revenue',
        data: salesPerformance?.revenue || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Orders Count',
        data: salesPerformance?.orders || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const orderStatusData = {
    labels: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          orderStats?.pending || 0,
          orderStats?.confirmed || 0,
          orderStats?.shipped || 0,
          orderStats?.delivered || 0,
          orderStats?.cancelled || 0
        ],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(productStats?.categories || {}),
    datasets: [
      {
        data: Object.values(productStats?.categories || {}).map(cat => cat.totalSales),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Performance Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  // Export functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportOrders = () => {
    if (!allOrders) return;
    const ordersData = allOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Email': order.shippingDetails.email,
      'Customer Name': order.shippingDetails.fullName,
      'Total Amount': order.orderTotal,
      'Status': order.status,
      'Payment Status': order.paymentDetails.status,
      'Created At': new Date(order.createdAt).toLocaleString(),
      'Items Count': order.items.length
    }));
    exportToCSV(ordersData, `orders-${dateRange.start}-to-${dateRange.end}.csv`);
  };

  const exportProducts = () => {
    if (!allProducts) return;
    const productsData = allProducts.map(product => ({
      'Product Name': product.name,
      'Item ID': product.itemId,
      'Category': product.category,
      'Price': product.price,
      'Stock': product.currentStock,
      'In Stock': product.inStock ? 'Yes' : 'No',
      'Total Sales': product.buys || 0,
      'Created At': product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'
    }));
    exportToCSV(productsData, `products-${dateRange.start}-to-${dateRange.end}.csv`);
  };

  const exportAnalytics = () => {
    if (!advancedAnalytics) return;
    const analyticsData = [{
      'Total Revenue': advancedAnalytics.totalRevenue,
      'Total Orders': advancedAnalytics.totalOrders,
      'Total Customers': advancedAnalytics.totalCustomers,
      'Average Order Value': advancedAnalytics.averageOrderValue,
      'Conversion Rate': advancedAnalytics.conversionRate,
      'Revenue Growth': advancedAnalytics.revenueGrowth,
      'Order Growth': advancedAnalytics.orderGrowth,
      'Period': selectedPeriod,
      'Date Range': `${dateRange.start} to ${dateRange.end}`
    }];
    exportToCSV(analyticsData, `analytics-${dateRange.start}-to-${dateRange.end}.csv`);
  };

  const StatCard = ({ title, value, icon, change, changeType, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-2">
          {icon}
          {change && (
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (!dashboardStats || !orderStats || !productStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <FiRefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${(dashboardStats.totalSales || 0).toLocaleString()}`}
          icon={<FiDollarSign className="h-8 w-8 text-green-500" />}
          change={advancedAnalytics?.revenueGrowth?.toFixed(1)}
          changeType={advancedAnalytics?.revenueGrowth >= 0 ? 'positive' : 'negative'}
          subtitle="Revenue in selected period"
        />
        <StatCard
          title="Total Orders"
          value={(dashboardStats.totalOrders || 0).toLocaleString()}
          icon={<FiShoppingCart className="h-8 w-8 text-blue-500" />}
          change={advancedAnalytics?.orderGrowth?.toFixed(1)}
          changeType={advancedAnalytics?.orderGrowth >= 0 ? 'positive' : 'negative'}
          subtitle="Orders in selected period"
        />
        <StatCard
          title="Total Customers"
          value={(dashboardStats.totalCustomers || 0).toLocaleString()}
          icon={<FiUsers className="h-8 w-8 text-purple-500" />}
          subtitle="Unique customers"
        />
        <StatCard
          title="Net Profit"
          value={`₹${(dashboardStats.netProfit || 0).toLocaleString()}`}
          icon={<FiTrendingUp className="h-8 w-8 text-emerald-500" />}
          subtitle="Estimated profit (30% margin)"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <TabButton
          id="overview"
          label="Overview"
          icon={<FiBarChart2 />}
          isActive={activeTab === "overview"}
          onClick={setActiveTab}
        />
        <TabButton
          id="sales"
          label="Sales Analytics"
          icon={<FiTrendingUp />}
          isActive={activeTab === "sales"}
          onClick={setActiveTab}
        />
        <TabButton
          id="products"
          label="Product Performance"
          icon={<FiPackage />}
          isActive={activeTab === "products"}
          onClick={setActiveTab}
        />
        <TabButton
          id="orders"
          label="Order Analysis"
          icon={<FiShoppingCart />}
          isActive={activeTab === "orders"}
          onClick={setActiveTab}
        />
        <TabButton
          id="customers"
          label="Customer Insights"
          icon={<FiUsers />}
          isActive={activeTab === "customers"}
          onClick={setActiveTab}
        />
        <TabButton
          id="export"
          label="Export Data"
          icon={<FiDownload />}
          isActive={activeTab === "export"}
          onClick={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h3>
                <Line data={salesChartData} options={chartOptions} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                <Doughnut data={orderStatusData} options={pieOptions} />
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Average Order Value"
                value={`₹${(advancedAnalytics?.averageOrderValue || 0).toFixed(2)}`}
                icon={<FiTarget className="h-6 w-6 text-indigo-500" />}
              />
              <StatCard
                title="Conversion Rate"
                value={`${(advancedAnalytics?.conversionRate || 0).toFixed(1)}%`}
                icon={<FiActivity className="h-6 w-6 text-orange-500" />}
              />
              <StatCard
                title="Total Products"
                value={(productStats?.total || 0).toLocaleString()}
                icon={<FiPackage className="h-6 w-6 text-cyan-500" />}
              />
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                <Line data={salesChartData} options={chartOptions} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                <Pie data={categoryData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">₹{(productStats?.totalSales || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{(productStats?.totalBuys || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Items Sold</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">₹{(productStats?.averagePrice || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Average Price</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{Object.keys(productStats?.categories || {}).length}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="In Stock"
                value={(productStats?.inStock || 0).toLocaleString()}
                icon={<FiCheckCircle className="h-6 w-6 text-green-500" />}
              />
              <StatCard
                title="Out of Stock"
                value={(productStats?.outOfStock || 0).toLocaleString()}
                icon={<FiXCircle className="h-6 w-6 text-red-500" />}
              />
              <StatCard
                title="Low Stock"
                value={(productStats?.lowStock || 0).toLocaleString()}
                icon={<FiAlertCircle className="h-6 w-6 text-yellow-500" />}
              />
              <StatCard
                title="Total Products"
                value={(productStats?.total || 0).toLocaleString()}
                icon={<FiPackage className="h-6 w-6 text-blue-500" />}
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(productStats?.categories || {}).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{category}</p>
                      <p className="text-sm text-gray-600">{data.count} products</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{data.totalSales.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{data.totalBuys} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                <Doughnut data={orderStatusData} options={pieOptions} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-semibold">{(orderStats?.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold">₹{(orderStats?.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Today's Orders</span>
                    <span className="font-semibold">{(orderStats?.todayOrders || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-600">{(orderStats?.pending || 0).toLocaleString()}</p>
                <p className="text-sm text-yellow-700">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">{(orderStats?.confirmed || 0).toLocaleString()}</p>
                <p className="text-sm text-blue-700">Confirmed</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">{(orderStats?.shipped || 0).toLocaleString()}</p>
                <p className="text-sm text-green-700">Shipped</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-2xl font-bold text-emerald-600">{(orderStats?.delivered || 0).toLocaleString()}</p>
                <p className="text-sm text-emerald-700">Delivered</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-600">{(orderStats?.cancelled || 0).toLocaleString()}</p>
                <p className="text-sm text-red-700">Cancelled</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Customers"
                value={(dashboardStats.totalCustomers || 0).toLocaleString()}
                icon={<FiUsers className="h-6 w-6 text-blue-500" />}
              />
              <StatCard
                title="New Customers"
                value="0"
                icon={<FiUserPlus className="h-6 w-6 text-green-500" />}
                subtitle="In selected period"
              />
              <StatCard
                title="Active Customers"
                value="0"
                icon={<FiActivity className="h-6 w-6 text-purple-500" />}
                subtitle="Made purchases"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
              <div className="text-center py-8 text-gray-500">
                <FiUsers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Customer analytics coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
              <p className="text-gray-600 mb-6">Download your data in CSV format for further analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={exportOrders}
                  disabled={!allOrders}
                  className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart className="h-6 w-6 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Orders</p>
                    <p className="text-sm text-gray-600">All order data</p>
                  </div>
                </button>

                <button
                  onClick={exportProducts}
                  disabled={!allProducts}
                  className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPackage className="h-6 w-6 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Products</p>
                    <p className="text-sm text-gray-600">Product catalog data</p>
                  </div>
                </button>

                <button
                  onClick={exportAnalytics}
                  disabled={!advancedAnalytics}
                  className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiBarChart2 className="h-6 w-6 text-purple-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Analytics</p>
                    <p className="text-sm text-gray-600">Performance metrics</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs">
                    <option value="csv">CSV (Comma Separated Values)</option>
                    <option value="xlsx" disabled>Excel (Coming Soon)</option>
                    <option value="json" disabled>JSON (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
