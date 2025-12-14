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
  FiUserPlus,
  FiSettings,
  FiPrinter
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

// Import custom components
import ReportCard from '@/components/admin/reports/ReportCard';
import ChartContainer from '@/components/admin/reports/ChartContainer';
import DataTable from '@/components/admin/reports/DataTable';
import ExportModal from '@/components/admin/reports/ExportModal';

// Import utilities
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  calculateGrowth,
  getGrowthType,
  formatDate,
  getDateRangeOptions,
  generateTimeSeriesData,
  generatePieChartData,
  getTopPerformers,
  generateSummaryStats,
  exportToCSV,
  generateColorPalette,
  calculateConversionRate,
  calculateAOV,
  generateTrendAnalysis
} from '@/lib/reportsUtils';

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

export default function EnhancedReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState(null);

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
        fill: true,
      },
      {
        label: 'Orders Count',
        data: salesPerformance?.orders || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
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
        backgroundColor: generateColorPalette(5),
        borderWidth: 2
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(productStats?.categories || {}),
    datasets: [
      {
        data: Object.values(productStats?.categories || {}).map(cat => cat.totalSales),
        backgroundColor: generateColorPalette(Object.keys(productStats?.categories || {}).length),
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue (₹)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Orders Count'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  // Export functions
  const handleExportOrders = () => {
    if (!allOrders) return;
    const ordersData = allOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Email': order.shippingDetails.email,
      'Customer Name': order.shippingDetails.fullName,
      'Total Amount': order.orderTotal,
      'Status': order.status,
      'Payment Status': order.paymentDetails.status,
      'Created At': formatDate(order.createdAt, 'datetime'),
      'Items Count': order.items.length
    }));
    setExportData(ordersData);
    setShowExportModal(true);
  };

  const handleExportProducts = () => {
    if (!allProducts) return;
    const productsData = allProducts.map(product => ({
      'Product Name': product.name,
      'Item ID': product.itemId,
      'Category': product.category,
      'Price': product.price,
      'Stock': product.currentStock,
      'In Stock': product.inStock ? 'Yes' : 'No',
      'Total Sales': product.buys || 0,
      'Created At': product.createdAt ? formatDate(product.createdAt, 'datetime') : 'N/A'
    }));
    setExportData(productsData);
    setShowExportModal(true);
  };

  const handleExportAnalytics = () => {
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
    setExportData(analyticsData);
    setShowExportModal(true);
  };

  const handleExport = (exportOptions) => {
    const { format, data, fields } = exportOptions;
    const filename = `report-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      exportToCSV(data, filename, fields);
    }
  };

  // Table columns for orders
  const orderColumns = [
    { key: 'orderNumber', label: 'Order #', sortable: true },
    { key: 'shippingDetails.email', label: 'Customer', sortable: true },
    { key: 'orderTotal', label: 'Amount', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'status', label: 'Status', sortable: true, render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'delivered' ? 'bg-green-100 text-green-800' :
        value === 'shipped' ? 'bg-blue-100 text-blue-800' :
        value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )},
    { key: 'createdAt', label: 'Date', sortable: true, render: (value) => formatDate(value, 'short') }
  ];

  // Table columns for products
  const productColumns = [
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'price', label: 'Price', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'currentStock', label: 'Stock', sortable: true },
    { key: 'inStock', label: 'Status', sortable: true, render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'In Stock' : 'Out of Stock'}
      </span>
    )},
    { key: 'buys', label: 'Sales', sortable: true, render: (value) => formatNumber(value || 0) }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Advanced Reports & Analytics</h1>
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

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard
          title="Total Revenue"
          value={formatCurrency(dashboardStats.totalSales || 0)}
          icon={<FiDollarSign className="h-8 w-8 text-green-500" />}
          change={advancedAnalytics?.revenueGrowth?.toFixed(1)}
          changeType={getGrowthType(advancedAnalytics?.revenueGrowth || 0)}
          subtitle="Revenue in selected period"
        />
        <ReportCard
          title="Total Orders"
          value={formatNumber(dashboardStats.totalOrders || 0)}
          icon={<FiShoppingCart className="h-8 w-8 text-blue-500" />}
          change={advancedAnalytics?.orderGrowth?.toFixed(1)}
          changeType={getGrowthType(advancedAnalytics?.orderGrowth || 0)}
          subtitle="Orders in selected period"
        />
        <ReportCard
          title="Total Customers"
          value={formatNumber(dashboardStats.totalCustomers || 0)}
          icon={<FiUsers className="h-8 w-8 text-purple-500" />}
          subtitle="Unique customers"
        />
        <ReportCard
          title="Net Profit"
          value={formatCurrency(dashboardStats.netProfit || 0)}
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
              <ChartContainer title="Sales Performance">
                <Line data={salesChartData} options={chartOptions} />
              </ChartContainer>
              <ChartContainer title="Order Status Distribution">
                <Doughnut data={orderStatusData} options={pieOptions} />
              </ChartContainer>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportCard
                title="Average Order Value"
                value={formatCurrency(advancedAnalytics?.averageOrderValue || 0)}
                icon={<FiTarget className="h-6 w-6 text-indigo-500" />}
              />
              <ReportCard
                title="Conversion Rate"
                value={formatPercentage(advancedAnalytics?.conversionRate || 0)}
                icon={<FiActivity className="h-6 w-6 text-orange-500" />}
              />
              <ReportCard
                title="Total Products"
                value={formatNumber(productStats?.total || 0)}
                icon={<FiPackage className="h-6 w-6 text-cyan-500" />}
              />
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="Revenue Trends">
                <Line data={salesChartData} options={chartOptions} />
              </ChartContainer>
              <ChartContainer title="Category Performance">
                <Pie data={categoryData} options={pieOptions} />
              </ChartContainer>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(productStats?.totalSales || 0)}</p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(productStats?.totalBuys || 0)}</p>
                  <p className="text-sm text-gray-600">Items Sold</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(productStats?.averagePrice || 0)}</p>
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
              <ReportCard
                title="In Stock"
                value={formatNumber(productStats?.inStock || 0)}
                icon={<FiCheckCircle className="h-6 w-6 text-green-500" />}
              />
              <ReportCard
                title="Out of Stock"
                value={formatNumber(productStats?.outOfStock || 0)}
                icon={<FiXCircle className="h-6 w-6 text-red-500" />}
              />
              <ReportCard
                title="Low Stock"
                value={formatNumber(productStats?.lowStock || 0)}
                icon={<FiAlertCircle className="h-6 w-6 text-yellow-500" />}
              />
              <ReportCard
                title="Total Products"
                value={formatNumber(productStats?.total || 0)}
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
                      <p className="font-semibold text-gray-900">{formatCurrency(data.totalSales)}</p>
                      <p className="text-sm text-gray-600">{formatNumber(data.totalBuys)} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DataTable
              data={allProducts || []}
              columns={productColumns}
              loading={!allProducts}
              onExport={handleExportProducts}
              title="Product Performance"
            />
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="Order Status Distribution">
                <Doughnut data={orderStatusData} options={pieOptions} />
              </ChartContainer>
              <ChartContainer title="Order Statistics">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-semibold">{formatNumber(orderStats?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(orderStats?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Today's Orders</span>
                    <span className="font-semibold">{formatNumber(orderStats?.todayOrders || 0)}</span>
                  </div>
                </div>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(orderStats?.pending || 0)}</p>
                <p className="text-sm text-yellow-700">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(orderStats?.confirmed || 0)}</p>
                <p className="text-sm text-blue-700">Confirmed</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-600">{formatNumber(orderStats?.shipped || 0)}</p>
                <p className="text-sm text-green-700">Shipped</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-2xl font-bold text-emerald-600">{formatNumber(orderStats?.delivered || 0)}</p>
                <p className="text-sm text-emerald-700">Delivered</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-600">{formatNumber(orderStats?.cancelled || 0)}</p>
                <p className="text-sm text-red-700">Cancelled</p>
              </div>
            </div>

            <DataTable
              data={allOrders || []}
              columns={orderColumns}
              loading={!allOrders}
              onExport={handleExportOrders}
              title="Order Details"
            />
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportCard
                title="Total Customers"
                value={formatNumber(dashboardStats.totalCustomers || 0)}
                icon={<FiUsers className="h-6 w-6 text-blue-500" />}
              />
              <ReportCard
                title="New Customers"
                value="0"
                icon={<FiUserPlus className="h-6 w-6 text-green-500" />}
                subtitle="In selected period"
              />
              <ReportCard
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
              <p className="text-gray-600 mb-6">Download your data in various formats for further analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={handleExportOrders}
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
                  onClick={handleExportProducts}
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
                  onClick={handleExportAnalytics}
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
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        data={exportData}
        title="Export Data"
      />
    </div>
  );
}
