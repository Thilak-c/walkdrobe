"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  Globe,
  Upload,
  Copy,
  ChevronRight,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const SIZES = ["41", "42", "43", "44", "45", "46"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi"];
const CATEGORIES = ["All", "Sneakers", "Sports"];

export default function WebsiteProducts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });

  // Fetch website inventory
  const products = useQuery(api.products.getProductsForWebsiteList);
  const updateProductFull = useMutation(api.products.updateProductFull);
  const deleteProduct = useMutation(api.products.deleteProduct);

  let filtered = products || [];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(s) || p.itemId.toLowerCase().includes(s)
    );
  }
  if (filter === "in") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) > 10);
  if (filter === "low") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) > 0 && (p.currentStock || p.totalAvailable || 0) <= 10);
  if (filter === "out") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) === 0);

  // Fetch full details only when editing
  const handleEdit = async (p) => {
    setLoadingProduct(true);
    try {
      const res = await fetch(`/api/get-product?id=${p._id}`);
      const fullProduct = await res.json();
      if (fullProduct.error) {
        toast.error("Failed to fetch product details.");
        return;
      }
      setEditing(fullProduct);
      setEditForm({
        name: fullProduct.name,
        category: fullProduct.category || "",
        description: fullProduct.description || "",
        mainImage: fullProduct.mainImage || "",
        otherImages: fullProduct.otherImages || [],
        price: fullProduct.price,
        costPrice: fullProduct.costPrice || 0,
        color: fullProduct.color || "",
        secondaryColor: fullProduct.secondaryColor || "",
        sizes: fullProduct.availableSizes || [],
        sizeStock: fullProduct.sizeStock || {},
      });
    } catch (err) {
      toast.error("Error loading product.");
    } finally {
      setLoadingProduct(false);
    }
  };

  const toggleSize = (size) => {
    const has = editForm.sizes.includes(size);
    const sizes = has ? editForm.sizes.filter((s) => s !== size) : [...editForm.sizes, size];
    const sizeStock = { ...editForm.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setEditForm({ ...editForm, sizes, sizeStock });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editForm.name || !editForm.price) return toast.error("Product name and selling price are required.");
    if (editForm.sizes.length === 0) return toast.error("Please configure at least one active size.");

    try {
      await updateProductFull({
        id: editing._id,
        name: editForm.name,
        category: editForm.category || undefined,
        description: editForm.description || undefined,
        mainImage: editForm.mainImage || "/placeholder.png",
        otherImages: editForm.otherImages.length > 0 ? editForm.otherImages : undefined,
        price: parseFloat(editForm.price),
        costPrice: editForm.costPrice ? parseFloat(editForm.costPrice) : undefined,
        color: editForm.color || undefined,
        secondaryColor: editForm.secondaryColor || undefined,
        availableSizes: editForm.sizes,
        sizeStock: editForm.sizeStock,
      });
      toast.success("Product successfully updated!");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Failed to update product details.");
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Are you sure you want to permanently delete "${p.name}"?`)) return;

    try {
      await deleteProduct({ _id: p._id });
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
    }
  };

  const uploadImage = async (file, isMain = true) => {
    const fd = new FormData();
    fd.append("file", file);
    
    if (isMain) setUploadingState(prev => ({ ...prev, main: true }));
    else setUploadingState(prev => ({ ...prev, secondary: true }));

    try {
      toast.loading("Uploading photo content...", { id: "upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        if (isMain) setEditForm((f) => ({ ...f, mainImage: data.url }));
        else setEditForm((f) => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Photo uploaded successfully!", { id: "upload" });
      } else {
        toast.error("Upload failed.", { id: "upload" });
      }
    } catch {
      toast.error("Upload failed.", { id: "upload" });
    } finally {
      if (isMain) setUploadingState(prev => ({ ...prev, main: false }));
      else setUploadingState(prev => ({ ...prev, secondary: false }));
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: {
        background: "#0f172a",
        color: "#fff",
        borderRadius: "10px",
      }
    });
  };

  const totalStock = Object.values(editForm.sizeStock || {}).reduce((sum, q) => sum + (q || 0), 0);
  const loading = products === undefined;

  // Profit Margins in Drawer
  const cp = parseFloat(editForm.costPrice) || 0;
  const sp = parseFloat(editForm.price) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-blue-500 tracking-widest text-[10px] font-bold uppercase mb-1">Website Store</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Product Catalog</h1>
              <p className="text-slate-500 text-sm mt-1">Manage catalog shoes, check availability statuses, and update item details.</p>
            </div>
            <div>
              <Link
                href="/website/add-product"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {!loading && products && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Active Catalog"
                value={products.length}
                icon={Package}
                color="blue"
              />
              <StatCard
                label="Healthy Stock"
                value={products.filter(p => (p.currentStock || p.totalAvailable || 0) > 10).length}
                icon={CheckCircle2}
                color="emerald"
              />
              <StatCard
                label="Low Stock Warning"
                value={products.filter(p => {
                  const st = p.currentStock || p.totalAvailable || 0;
                  return st > 0 && st <= 10;
                }).length}
                icon={AlertCircle}
                color="amber"
              />
              <StatCard
                label="Depleted (Out)"
                value={products.filter(p => (p.currentStock || p.totalAvailable || 0) === 0).length}
                icon={X}
                color="rose"
              />
            </div>
          )}

          {/* Search & Tabs Row */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search by name, SKU, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-sm focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Items" },
                { id: "in", label: "Healthy Stock" },
                { id: "low", label: "Low Stock" },
                { id: "out", label: "Depleted" }
              ].map((btn) => {
                const isActive = filter === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setFilter(btn.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Grid Table */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Retrieving catalog records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Shoes Found</h3>
                <p className="text-slate-500 text-xs mt-1">Add items or adjust your queries.</p>
                <Link href="/website/add-product" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold">
                  <Plus className="w-4 h-4" /> Add First Product
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4">Shoe Details</th>
                      <th className="px-6 py-4">SKU / Code</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-center">Stock Count</th>
                      <th className="px-6 py-4 text-center">Availability</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => {
                      const stockVal = p.currentStock || p.totalAvailable || 0;
                      const isOutOfStock = stockVal === 0;
                      const isLowStock = stockVal > 0 && stockVal <= 10;
                      
                      return (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-150 shadow-sm flex items-center justify-center relative">
                                {p.mainImage ? (
                                  <img src={p.mainImage} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-300" />
                                )}
                              </div>
                              <span className="font-bold text-slate-800 text-sm tracking-tight hover:underline cursor-pointer" onClick={() => handleEdit(p)}>
                                {p.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-500 tracking-tight">{p.itemId}</span>
                              <button
                                onClick={() => copyToClipboard(p.itemId, "SKU")}
                                className="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                                title="Copy SKU code"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-4.5 text-slate-600 text-xs font-semibold">
                            {p.category || "-"}
                          </td>

                          <td className="px-6 py-4.5 text-right font-extrabold text-slate-800 text-sm">
                            ₹{p.price?.toLocaleString("en-IN")}
                          </td>

                          <td className="px-6 py-4.5 text-center">
                            <span className={`text-sm font-extrabold ${isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-500 font-bold" : "text-slate-800"}`}>
                              {stockVal} Pairs
                            </span>
                          </td>

                          <td className="px-6 py-4.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold shadow-sm justify-center ${
                              isOutOfStock
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : isLowStock
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-rose-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                              <span>{isOutOfStock ? "Depleted" : isLowStock ? "Low Stock" : "In Stock"}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(p)}
                                disabled={loadingProduct}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                title="Edit Product Specs"
                              >
                                {loadingProduct ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Edit2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-100 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Product Editor Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Interactive Editor</span>
                  <h2 className="text-xl font-bold tracking-tight">Edit SKU #{editing.itemId}</h2>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Form Group: Specs */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <Package className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Shoe Specifications</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Color</label>
                      <select
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="">Select Color</option>
                        {COLORS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Group: Photo Media */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <ImageIcon className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Media & Visuals</h3>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {editForm.mainImage ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative group border shadow-sm bg-white">
                        <img src={editForm.mainImage} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, mainImage: "" })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white text-[8px] text-center font-bold">Cover</span>
                      </div>
                    ) : (
                      <label className="w-16 h-16 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white">
                        {uploadingState.main ? (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-300" />
                            <span className="text-[7px] text-slate-400 font-bold mt-1">Cover</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingState.main}
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], true)}
                        />
                      </label>
                    )}

                    {editForm.otherImages?.map((img, i) => (
                      <div key={i} className="w-16 h-16 rounded-xl overflow-hidden relative group border shadow-sm bg-white">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, otherImages: editForm.otherImages.filter((_, j) => j !== i) })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {(editForm.otherImages?.length || 0) < 4 && (
                      <label className="w-16 h-16 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white">
                        {uploadingState.secondary ? (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-slate-300" />
                            <span className="text-[7px] text-slate-400 mt-1 font-bold">Detail</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingState.secondary}
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], false)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Form Group: Pricing & Profit */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <IndianRupee className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Financials & Markup</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cost Price (₹)</label>
                      <input
                        type="number"
                        value={editForm.costPrice}
                        onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-extrabold focus:outline-none"
                      />
                    </div>

                    {cp > 0 && sp > 0 && (
                      <div className="col-span-2 p-3.5 bg-white border rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Projected Margin Markup</span>
                        <span className={`font-extrabold ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          ₹{profit.toFixed(0)} ({profitPercentage.toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Group: Sizes & Grid */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Layers className="w-4.5 h-4.5 text-slate-500" />
                      <h3>Sizes & Quantities</h3>
                    </div>
                    <span className="text-xs bg-white font-extrabold text-slate-700 px-3 py-1 rounded-xl shadow-sm border border-slate-200">
                      {totalStock} Pairs Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((s) => {
                        const isActive = editForm.sizes?.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSize(s)}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                              isActive
                                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    {editForm.sizes?.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1 animate-fadeIn">
                        {editForm.sizes
                          .sort((a, b) => +a - +b)
                          .map((s) => (
                            <div key={s} className="bg-white border rounded-xl p-2 text-center shadow-xs">
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">UK {s}</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.sizeStock?.[s] || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    sizeStock: { ...editForm.sizeStock, [s]: parseInt(e.target.value) || 0 },
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-slate-800"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Catalog Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-150 text-emerald-600",
    amber: "bg-amber-50 border-amber-150 text-amber-600",
    rose: "bg-rose-50 border-rose-150 text-rose-500",
    blue: "bg-blue-50 border-blue-150 text-blue-600",
  };
  const design = colors[color] || "bg-slate-50 border-slate-150 text-slate-600";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-3 shadow-xs border ${design}`}>
        <Icon size={16} />
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-slate-100 rounded-xl animate-pulse mt-2" />
      ) : (
        <p className="text-xl font-extrabold text-slate-800 tracking-tight mt-1 group-hover:scale-[1.02] transition-transform duration-200">
          {value}
        </p>
      )}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1.5">{label}</p>
    </div>
  );
}
