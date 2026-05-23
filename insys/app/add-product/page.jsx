"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import Dropdown from "@/components/Dropdown";
import {
  Package,
  Plus,
  X,
  Upload,
  CheckCircle2,
  Store,
  ArrowLeft,
  Tag,
  DollarSign,
  Layers,
  Palette,
  Eye,
  IndianRupee,
  BadgeAlert,
  Percent,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SIZES = ["41", "42", "43", "44", "45", "46"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi"];
const CATEGORIES = ["All", "Sneakers", "Sports"];

export default function OfflineAddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    color: "",
    secondaryColor: "",
    sizes: [],
    sizeStock: {},
    costPrice: "",
    sellingPrice: "",
    description: "",
    mainImage: "",
    otherImages: [],
  });

  const addProduct = useMutation(api.offStore.addProduct);

  const toggleSize = (size) => {
    const has = form.sizes.includes(size);
    const sizes = has ? form.sizes.filter((s) => s !== size) : [...form.sizes, size];
    const sizeStock = { ...form.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setForm({ ...form, sizes, sizeStock });
  };

  const totalStock = Object.values(form.sizeStock).reduce((sum, q) => sum + (q || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || !form.sellingPrice) return toast.error("Please fill in all required fields.");
    if (form.sizes.length === 0) return toast.error("Please configure stock for at least one size.");

    setLoading(true);
    try {
      await addProduct({
        itemId: form.sku,
        name: form.name,
        category: form.category || undefined,
        description: form.description || undefined,
        price: parseFloat(form.sellingPrice),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        mainImage: form.mainImage || "/placeholder.png",
        otherImages: form.otherImages.length > 0 ? form.otherImages : undefined,
        availableSizes: form.sizes,
        sizeStock: form.sizeStock,
        currentStock: totalStock,
        totalAvailable: totalStock,
        inStock: totalStock > 0,
        color: form.color || undefined,
        secondaryColor: form.secondaryColor || undefined,
      });
      setSuccess(true);
      toast.success("Product successfully added to offline inventory!");
    } catch (err) {
      toast.error(err.message || "Failed to save product details.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      sku: "",
      name: "",
      category: "",
      color: "",
      secondaryColor: "",
      sizes: [],
      sizeStock: {},
      costPrice: "",
      sellingPrice: "",
      description: "",
      mainImage: "",
      otherImages: [],
    });
    setSuccess(false);
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
      if (data.success && data.url) {
        if (isMain) setForm((f) => ({ ...f, mainImage: data.url }));
        else setForm((f) => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Photo uploaded successfully!", { id: "upload" });
      } else {
        toast.error(data.error || "Upload process failed.", { id: "upload" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed - Verify backend systems are active.", { id: "upload" });
    } finally {
      if (isMain) setUploadingState(prev => ({ ...prev, main: false }));
      else setUploadingState(prev => ({ ...prev, secondary: false }));
    }
  };

  const cp = parseFloat(form.costPrice) || 0;
  const sp = parseFloat(form.sellingPrice) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  if (success) {
    return (
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/60 p-8 shadow-md text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight font-poppins">Product Saved!</h3>
            <p className="text-slate-500 text-sm mt-2">Item was successfully registered in Walkdrobe Patna's offline stock.</p>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={reset}
                className="flex-1 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push("/products")}
                className="flex-1 px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
              >
                View Inventory
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-3xl mx-auto pt-12 lg:pt-0">
          
          {/* Header Section */}
          <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
            <Link
              href="/products"
              className="p-2.5 sm:p-3 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={14} className="text-emerald-600 animate-pulse" />
                <p className="text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest">Offline Shop Operations</p>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Add Inventory</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Register new shoe products into the physical storefront stock.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Box 1: SKU & Core Specs */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Core Specifications</h3>
                  <p className="text-[10px] text-slate-400">Basic catalog metadata and stock item classification</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                
                {/* SKU Code */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">SKU ID / Item Code *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g., WD-SNK-029"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs font-mono font-extrabold focus:outline-none transition-all"
                    required
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Must be unique. This acts as the printable barcode.</span>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Shoe Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Nike Air Max Pulse"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs font-bold focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Category *</label>
                  <Dropdown
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    placeholder="Select Category"
                    align="full"
                    className="w-full"
                    options={CATEGORIES.filter(c => c !== "All").map(c => ({ value: c, label: c }))}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Primary Color</label>
                  <Dropdown
                    value={form.color}
                    onChange={(val) => setForm({ ...form, color: val })}
                    placeholder="None"
                    align="full"
                    className="w-full"
                    options={COLORS.map(c => ({ value: c, label: c }))}
                  />
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Secondary Accent Color</label>
                  <Dropdown
                    value={form.secondaryColor}
                    onChange={(val) => setForm({ ...form, secondaryColor: val })}
                    placeholder="None"
                    align="full"
                    className="w-full"
                    options={COLORS.map(c => ({ value: c, label: c }))}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Product Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide detailed material info, designer attributes, or shoe tech specifics..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs focus:outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Visual Media Assets */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Media & Visual Assets</h3>
                  <p className="text-[10px] text-slate-400">High-resolution brand photos and detail snaps</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Cover Image */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Cover Picture *</label>
                  {form.mainImage ? (
                    <div className="w-full h-36 sm:h-44 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 group">
                      <img src={form.mainImage} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, mainImage: "" })}
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white font-bold text-xs gap-1.5 transition-all"
                      >
                        <X className="w-4 h-4" /> Remove Cover
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-36 sm:h-44 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50">
                      {uploadingState.main ? (
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-300 mb-2" />
                          <span className="text-xs font-bold text-slate-500">Upload Cover Photo</span>
                          <span className="text-[9px] text-slate-400 mt-1">PNG, JPG, WEBP (Square preferred)</span>
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
                </div>

                {/* Additional Detail Pictures */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Detail Pictures (Up to 4)</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {form.otherImages.map((img, i) => (
                      <div key={i} className="h-16 sm:h-20 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, otherImages: form.otherImages.filter((_, j) => j !== i) })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {form.otherImages.length < 4 && (
                      <label className="h-16 sm:h-20 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50">
                        {uploadingState.secondary ? (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-slate-400" />
                            <span className="text-[9px] text-slate-400 font-bold mt-1">Detail Snap</span>
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
              </div>
            </div>

            {/* Box 3: Sizing Inventory Metrics */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Sizing & Stock Allocations</h3>
                    <p className="text-[10px] text-slate-400">Specify current in-stock quantities per active UK shoe size</p>
                  </div>
                </div>
                
                <div className="w-fit px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-xl text-white shadow-xs text-xs font-bold font-mono self-start sm:self-auto">
                  {totalStock} Pairs Allocated
                </div>
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2.5">Toggle Available Sizes *</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(s => {
                      const active = form.sizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSize(s)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center cursor-pointer ${
                            active
                              ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50"
                          }`}
                        >
                          UK {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.sizes.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 pt-1 animate-fadeIn">
                    {form.sizes.sort((a,b)=>+a-+b).map(s => (
                      <div key={s} className="bg-slate-50/50 border border-slate-200/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-xs text-center">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">UK {s}</label>
                        <input
                          type="number"
                          min="0"
                          value={form.sizeStock[s] || ""}
                          onChange={(e) => setForm({
                            ...form,
                            sizeStock: { ...form.sizeStock, [s]: parseInt(e.target.value) || 0 }
                          })}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-lg sm:rounded-xl text-center text-xs font-bold focus:outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Box 4: Markup & Cost Calculations */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                  <IndianRupee size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Financials & Margins</h3>
                  <p className="text-[10px] text-slate-400">Configure purchase costs, retail selling price, and forecast profitability</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Cost Price */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Purchase Cost Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={form.costPrice}
                      onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 sm:pr-4 sm:py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs font-bold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Store Selling Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={form.sellingPrice}
                      onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 sm:pr-4 sm:py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs font-extrabold focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Profit Graph & Live Metrics */}
                {cp > 0 && sp > 0 && (
                  <div className="col-span-1 md:col-span-2 bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-700 block">Forecast Profit Margin</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Calculated net margins based on store retail price</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-extrabold block ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          ₹{profit.toFixed(0)} Profit
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">+{profitPercentage.toFixed(0)}% Margin</span>
                      </div>
                    </div>

                    {/* Dynamic Cost-to-Selling Graph */}
                    <div className="h-5 bg-slate-100 rounded-xl overflow-hidden flex relative border border-slate-200/50">
                      <div
                        className="h-full bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white transition-all duration-350"
                        style={{ width: `${Math.max(20, Math.min(80, (cp / sp) * 100))}%` }}
                      >
                        Cost ({((cp / sp) * 100).toFixed(0)}%)
                      </div>
                      <div className="h-full bg-emerald-500 flex-1 flex items-center justify-center text-[8px] font-bold text-white animate-pulse">
                        Margin ({Math.max(0, 100 - (cp / sp) * 100).toFixed(0)}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3 pt-2 sm:pt-4">
              <Link
                href="/products"
                className="flex-1 px-4 py-3 sm:px-5 sm:py-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center cursor-pointer text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-3 px-4 py-3 sm:px-5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-xs font-semibold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Product Spec...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save to Store Inventory</span>
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  );
}
