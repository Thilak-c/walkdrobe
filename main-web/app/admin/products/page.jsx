"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  X
} from "lucide-react";

// Animated Number Component
function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value || 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setDisplayValue(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return displayValue.toLocaleString();
}

// Toast Component
function Toast({ message, type = "success", onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600"
  }[type] || "bg-gray-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`fixed top-5 right-5 px-6 py-4 ${bgColor} text-white rounded-xl shadow-2xl flex items-center gap-4 z-50`}
    >
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="font-bold text-xl leading-none hover:scale-110 transition-transform"
      >
        ×
      </button>
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, trend, delay = 0 }) {
  const colorClasses = {
    green: "bg-green-100 text-green-600 border-green-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    red: "bg-red-100 text-red-600 border-red-200",
    yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-6 rounded-xl shadow-sm border ${colorClasses[color]} hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/50">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Update the ProductCard component to include trash functionality
function ProductCard({ product, onToggleHidden, onDelete, onEdit, onUpdateStock, onRestore, onPermanentDelete, index }) {
  const [showActions, setShowActions] = useState(false);

  const getStockStatus = () => {
    if (product.inStock === false) return { status: 'Out of Stock', color: 'red' };
    if (product.currentStock !== undefined && product.currentStock <= 0) return { status: 'Out of Stock', color: 'red' };
    if (product.currentStock !== undefined && product.currentStock < 10 && product.currentStock > 0) return { status: 'Low Stock', color: 'yellow' };
    if (product.currentStock !== undefined && product.currentStock >= 10) return { status: 'In Stock', color: 'green' };
    return { status: 'In Stock', color: 'green' }; // Default for products without currentStock
  };

  const stockInfo = getStockStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group ${product.isDeleted ? 'opacity-60 bg-gray-50' : ''
        }`}
    >
      <div className="p-6">
        {/* Product Image */}
        <div className="relative mb-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.mainImage || '/placeholder-product.jpg'}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.isDeleted ? 'bg-red-100 text-red-800' :
                stockInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                  stockInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
              }`}>
              {product.isDeleted ? 'In Trash' : stockInfo.status}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
            <span className="text-sm text-gray-500">
              {product.currentStock !== undefined ? `${product.currentStock} units` : '∞'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!product.isDeleted ? (
              <>
                <Link
                  href={`/admin/edit/${product.itemId}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Product"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onUpdateStock(product)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Update Stock"
                >
                  <Package className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleHidden(product)}
                  className={`p-2 rounded-lg transition-colors ${product.isHidden
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                    }`}
                  title={product.isHidden ? 'Show Product' : 'Hide Product'}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Move to Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onRestore(product)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Restore from Trash"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPermanentDelete(product)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Permanently Delete"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                >
                  {!product.isDeleted ? (
                    <>
                      <Link
                        href={`/product/${product.itemId}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Product
                      </Link>
                      <button
                        onClick={() => onUpdateStock(product)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Update Stock
                      </button>
                      <Link
                        href={`/admin/product/${product.itemId}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Link>
                      <button
                        onClick={() => onDelete(product)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onRestore(product)}
                        className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Restore from Trash
                      </button>
                      <button
                        onClick={() => onPermanentDelete(product)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Permanently Delete
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Update the main component to include the trash functionality and a
export default function ProductDashboard() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [toast, setToast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list"); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState({
    currentStock: 0,
    inStock: true,
    sizeStock: {}
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [showTrash, setShowTrash] = useState(false); // New state for trash filter

  // Queries
  const products = useQuery(api.products.getAll) || [];
  const productStats = useQuery(api.products.getProductStats);

  // Mutations
  const toggleHidden = useMutation(api.products.toggleHidden);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateProduct = useMutation(api.products.update);
  const updateStock = useMutation(api.products.updateProductStock);
  const moveToTrash = useMutation(api.products.moveToTrash);
  const restoreFromTrash = useMutation(api.products.restoreFromTrash);

  // Category stats
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const cat = p.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const subcategoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const subcat = p.subcategories || "Uncategorized";
      counts[subcat] = (counts[subcat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const typeCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.type && Array.isArray(p.type)) {
        p.type.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return counts;
  }, [products]);

  // Update the filteredProducts logic to properly filter low stock
  const filteredProducts = useMemo(() =>
    products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .filter(p => selectedCategory === "All" || (p.category || "Uncategorized") === selectedCategory)
      .filter(p => selectedSubcategory === "All" || (p.subcategories || "Uncategorized") === selectedSubcategory)
      .filter(p => {
        if (selectedType === "All") return true;
        return p.type && p.type.includes(selectedType);
      })
      .filter(p => {
        if (stockFilter === "All") return true;
        if (stockFilter === "In Stock") return p.inStock !== false && (p.currentStock === undefined || p.currentStock >= 10);
        if (stockFilter === "Out of Stock") return p.inStock === false || (p.currentStock !== undefined && p.currentStock <= 0);
        if (stockFilter === "Low Stock") return p.currentStock !== undefined && p.currentStock < 10 && p.currentStock > 0;
        return true;
      })
      .filter(p => {
        if (showTrash) return p.isDeleted === true;
        return p.isDeleted !== true; // Show non-deleted products by default
      })
      .sort((a, b) => {
        if (sortBy === "name" || sortBy === "category") {
          return sortOrder === "asc"
            ? (a[sortBy] || "").localeCompare(b[sortBy] || "")
            : (b[sortBy] || "").localeCompare(a[sortBy] || "");
        } else {
          return sortOrder === "asc"
            ? (a[sortBy] || 0) - (b[sortBy] || 0)
            : (b[sortBy] || 0) - (a[sortBy] || 0);
        }
      }), [products, search, sortBy, sortOrder, selectedCategory, selectedSubcategory, selectedType, stockFilter, showTrash]);

  // Handlers
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const handleToggleHidden = async (product) => {
    try {
      await toggleHidden({ itemId: product.itemId, isHidden: !product.isHidden });
      setToast({ message: `${product.name} is now ${product.isHidden ? "visible" : "hidden"}`, type: "success" });
    } catch (error) {
      setToast({ message: "Error updating product visibility", type: "error" });
    }
  };

  const handleDelete = async (product) => {
    if (confirm(`Are you sure you want to move "${product.name}" to trash?`)) {
      try {
        await moveToTrash({
          productId: product._id,
          deletedBy: "admin", // Pass a string value
          reason: "Moved to trash by admin"
        });
        setToast({ message: `Product "${product.name}" moved to trash!`, type: "success" });
      } catch (error) {
        setToast({ message: "Error moving product to trash", type: "error" });
      }
    }
  };

  const handleRestore = async (product) => {
    try {
      await restoreFromTrash({ productId: product._id });
      setToast({ message: `Product "${product.name}" restored from trash!`, type: "success" });
    } catch (error) {
      setToast({ message: "Error restoring product", type: "error" });
    }
  };

  const handlePermanentDelete = async (product) => {
    if (confirm(`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct({ productId: product._id });
        setToast({ message: `Product "${product.name}" permanently deleted!`, type: "success" });
      } catch (error) {
        setToast({ message: "Error permanently deleting product", type: "error" });
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,Category,Price,Stock Status,Current Stock,Total Sales,Created At\n" +
      filteredProducts.map(p =>
        `${p.name},${p.category || "Uncategorized"},${p.price},${p.inStock !== false ? "In Stock" : "Out of Stock"},${p.currentStock || "∞"},${(p.buys || 0) * (p.price || 0)},${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    try {
      await updateStock({
        productId: selectedProduct._id,
        stockData: {
          currentStock: parseInt(stockData.currentStock),
          inStock: stockData.inStock,
          sizeStock: stockData.sizeStock
        },
        updatedBy: "admin"
      });

      setToast({ message: "Stock updated successfully!", type: "success" });
      setShowStockModal(false);
      setSelectedProduct(null);
    } catch (error) {
      setToast({ message: "Error updating stock", type: "error" });
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockData({
      currentStock: product.currentStock || 0,
      inStock: product.inStock !== false,
      sizeStock: product.sizeStock || {}
    });
    setShowStockModal(true); // Changed from false to true
  };

  if (!products) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {showTrash ? 'Trash' : 'Product Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {showTrash ? 'Manage trashed products' : 'Manage your product catalog and inventory'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showTrash
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
          >
            <Trash2 className="w-4 h-4" />
            {showTrash ? 'View Active' : 'View Trash'}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {!showTrash && (
            <Link
              href="/admin/upload/"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-black">
                <AnimatedNumber value={products.length} />
              </p>
              <p className="text-xs text-gray-500">
                {filteredProducts.length} currently visible
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Package className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>All time products</span>
          </div>
        </motion.div>

        {/* In Stock Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-3xl font-bold text-black">
                <AnimatedNumber value={products.filter(p => p.inStock !== false && (p.currentStock === undefined || p.currentStock >= 10)).length} />
              </p>
              <p className="text-xs text-gray-500">
                {((products.filter(p => p.inStock !== false && (p.currentStock === undefined || p.currentStock >= 10)).length / products.length) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <Package className="w-4 h-4 mr-1" />
            <span>Available for sale</span>
          </div>
        </motion.div>

        {/* Low Stock Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-3xl font-bold text-black">
                <AnimatedNumber value={products.filter(p => p.currentStock !== undefined && p.currentStock < 10 && p.currentStock > 0).length} />
              </p>
              <p className="text-xs text-gray-500">
                Need restocking
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>Requires attention</span>
          </div>
        </motion.div>

        {/* Out of Stock Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-3xl font-bold text-black">
                <AnimatedNumber value={products.filter(p => p.inStock === false || (p.currentStock !== undefined && p.currentStock <= 0)).length} />
              </p>
              <p className="text-xs text-gray-500">
                {((products.filter(p => p.inStock === false || (p.currentStock !== undefined && p.currentStock <= 0)).length / products.length) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <XCircle className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span>Needs restocking</span>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Total Sales Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-black">
                ₹<AnimatedNumber value={products.reduce((sum, p) => sum + (p.buys || 0) * (p.price || 0), 0)} />
              </p>
              <p className="text-xs text-gray-500">
                Lifetime revenue
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>All time sales</span>
          </div>
        </motion.div>

        {/* Average Price Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-black">
                ₹<AnimatedNumber value={products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0} />
              </p>
              <p className="text-xs text-gray-500">
                Per product
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Price analysis</span>
          </div>
        </motion.div>

        {/* Categories Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-black">
                <AnimatedNumber value={Object.keys(categoryCounts).length} />
              </p>
              <p className="text-xs text-gray-500">
                Product categories
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <Package className="w-4 h-4 mr-1" />
            <span>Product variety</span>
          </div>
        </motion.div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Categories</option>
                  {Object.keys(categoryCounts).map(cat => (
                    <option key={cat} value={cat}>{cat} ({categoryCounts[cat]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Subcategories</option>
                  {Object.keys(subcategoryCounts).map(subcat => (
                    <option key={subcat} value={subcat}>{subcat} ({subcategoryCounts[subcat]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Types</option>
                  {Object.keys(typeCounts).map(type => (
                    <option key={type} value={type}>{type} ({typeCounts[type]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setSelectedSubcategory("All");
                  setSelectedType("All");
                  setStockFilter("All");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {(selectedCategory !== "All" || selectedSubcategory !== "All" || selectedType !== "All" || stockFilter !== "All" || search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory !== "All" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Category: {selectedCategory}
              <button
                onClick={() => setSelectedCategory("All")}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedSubcategory !== "All" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Subcategory: {selectedSubcategory}
              <button
                onClick={() => setSelectedSubcategory("All")}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedType !== "All" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Type: {selectedType}
              <button
                onClick={() => setSelectedType("All")}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {stockFilter !== "All" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              Stock: {stockFilter}
              <button
                onClick={() => setStockFilter("All")}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
              Search: "{search}"
              <button
                onClick={() => setSearch("")}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Products Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.itemId}
              product={product}
              onToggleHidden={handleToggleHidden}
              onDelete={handleDelete}
              onEdit={() => { }}
              onUpdateStock={openStockModal}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: "Product", key: "name" },
                    { label: "Category", key: "category" },
                    { label: "Price", key: "price" },
                    { label: "Stock", key: "currentStock" },
                    { label: "Status", key: "inStock" },
                    { label: "Sales", key: "buys" },
                    { label: "Created", key: "createdAt" },
                    { label: "Actions", key: "actions" }
                  ].map(col => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => col.key !== "actions" && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortBy === col.key && (
                          sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={product.mainImage || '/placeholder-product.jpg'}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">ID: {product.itemId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category || "Uncategorized"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{product.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.currentStock !== undefined ? `${product.currentStock} units` : '∞'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.inStock === false || (product.currentStock !== undefined && product.currentStock <= 0)
                          ? 'bg-red-100 text-red-800'
                          : product.currentStock !== undefined && product.currentStock < 10 && product.currentStock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        <span className={`w-2 h-2 mr-1.5 rounded-full ${product.inStock === false || (product.currentStock !== undefined && product.currentStock <= 0)
                            ? 'bg-red-400'
                            : product.currentStock !== undefined && product.currentStock < 10 && product.currentStock > 0
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                          }`}></span>
                        {product.inStock === false || (product.currentStock !== undefined && product.currentStock <= 0)
                          ? 'Out of Stock'
                          : product.currentStock !== undefined && product.currentStock < 10 && product.currentStock > 0
                            ? 'Low Stock'
                            : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.buys || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/edit/${product.itemId}`}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleHidden(product)}
                          className={`p-1 rounded transition-colors ${product.isHidden
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
                            }`}
                          title={product.isHidden ? 'Show' : 'Hide'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStockModal(product)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Update Stock"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showTrash ? 'No trashed products found' : 'No products found'}
          </h3>
          <p className="text-gray-500">
            {showTrash ? 'No products have been moved to trash yet.' : 'Try adjusting your filters or search criteria.'}
          </p>
        </div>
      )}

      {/* Stock Update Modal */}
      <AnimatePresence>
        {showStockModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Update Stock</h3>
                  <button
                    onClick={() => setShowStockModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedProduct.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={stockData.currentStock}
                      onChange={(e) => setStockData(prev => ({
                        ...prev,
                        currentStock: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current stock"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={stockData.inStock}
                      onChange={(e) => setStockData(prev => ({
                        ...prev,
                        inStock: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="inStock" className="text-sm font-medium text-gray-700">
                      Product is in stock
                    </label>
                  </div>

                  {/* Size-specific stock (if applicable) */}
                  {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock by Size
                      </label>
                      <div className="space-y-2">
                        {selectedProduct.availableSizes.map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600 w-16">{size}:</label>
                            <input
                              type="number"
                              value={stockData.sizeStock[size] || 0}
                              onChange={(e) => setStockData(prev => ({
                                ...prev,
                                sizeStock: {
                                  ...prev.sizeStock,
                                  [size]: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStock}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

