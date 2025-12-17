"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, Plus, X, Upload, CheckCircle, Globe, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const SIZES = ["5", "6", "7", "8", "9", "10", "11", "12", "13"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi"];
const CATEGORIES = ["Sneakers", "Boots", "Sandals", "Formal", "Sports", "Casual", "Loafers", "Slippers", "Heels"];

export default function WebsiteAddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    sku: "", name: "", category: "", color: "", secondaryColor: "",
    sizes: [], sizeStock: {}, costPrice: "", sellingPrice: "",
    description: "", mainImage: "", otherImages: [],
  });

  const addProduct = useMutation(api.webStore.addProduct);

  const toggleSize = (size) => {
    const has = form.sizes.includes(size);
    const sizes = has ? form.sizes.filter(s => s !== size) : [...form.sizes, size];
    const sizeStock = { ...form.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setForm({ ...form, sizes, sizeStock });
  };

  const totalStock = Object.values(form.sizeStock).reduce((sum, q) => sum + (q || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || !form.sellingPrice) return toast.error("Fill required fields");
    if (form.sizes.length === 0) return toast.error("Select at least one size");

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
        color: form.color || undefined,
        secondaryColor: form.secondaryColor || undefined,
      });
      setSuccess(true);
      toast.success("Product added!");
    } catch (err) {
      toast.error(err.message || "Failed to add");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ sku: "", name: "", category: "", color: "", secondaryColor: "", sizes: [], sizeStock: {}, costPrice: "", sellingPrice: "", description: "", mainImage: "", otherImages: [] });
    setSuccess(false);
  };

  const uploadImage = async (file, isMain = true) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      toast.loading("Uploading...", { id: "upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        if (isMain) setForm(f => ({ ...f, mainImage: data.url }));
        else setForm(f => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Uploaded!", { id: "upload" });
      } else {
        toast.error(data.error || "Upload failed", { id: "upload" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed - check if main-web is running", { id: "upload" });
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center max-w-md">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Product Added!</h2>
            <p className="text-gray-500 mb-6">Successfully added to website inventory</p>
            <div className="flex gap-3 justify-center">
              <button onClick={reset} className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">Add Another</button>
              <Link href="/website/products" className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">View Products</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0">
            <Link href="/website" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft size={14} /> Back
            </Link>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-medium">WEBSITE STORE</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={18} className="text-gray-400" /> Basic Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">SKU *</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="WD-001" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm font-mono border-0 focus:ring-2 focus:ring-gray-900" required />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900">
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Color</label>
                  <select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900">
                    <option value="">Select</option>
                    {COLORS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm resize-none border-0 focus:ring-2 focus:ring-gray-900" placeholder="Optional description" />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Images</h3>
              <div className="flex gap-3 flex-wrap">
                {form.mainImage ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden relative group border border-gray-200">
                    <img src={form.mainImage} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, mainImage: "" })} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <X className="text-white" size={20} />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white text-[10px] text-center">Main</span>
                  </div>
                ) : (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">Main</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], true)} />
                  </label>
                )}
                {form.otherImages.map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden relative group border border-gray-200">
                    <img src={img} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, otherImages: form.otherImages.filter((_, j) => j !== i) })} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <X className="text-white" size={20} />
                    </button>
                  </div>
                ))}
                {form.otherImages.length < 4 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400">
                    <Plus size={18} className="text-gray-400" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], false)} />
                  </label>
                )}
              </div>
            </div>

            {/* Sizes & Stock */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Sizes & Stock</h3>
                <span className="text-sm text-gray-900 font-bold">{totalStock} total</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {SIZES.map(s => (
                  <button key={s} type="button" onClick={() => toggleSize(s)} className={`w-10 h-10 rounded-lg text-sm font-medium transition ${form.sizes.includes(s) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
                ))}
              </div>
              {form.sizes.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.sizes.sort((a, b) => +a - +b).map(s => (
                    <div key={s} className="bg-gray-50 rounded-lg p-2">
                      <label className="text-xs text-gray-500">Size {s}</label>
                      <input type="number" min="0" value={form.sizeStock[s] || ""} onChange={e => setForm({ ...form, sizeStock: { ...form.sizeStock, [s]: parseInt(e.target.value) || 0 } })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Cost Price (₹)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Selling Price (₹) *</label>
                  <input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" required />
                </div>
              </div>
              {form.costPrice && form.sellingPrice && +form.costPrice > 0 && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg flex justify-between text-sm">
                  <span className="text-gray-600">Profit</span>
                  <span className="font-bold text-gray-900">₹{(+form.sellingPrice - +form.costPrice).toFixed(0)} ({(((+form.sellingPrice - +form.costPrice) / +form.costPrice) * 100).toFixed(0)}%)</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button type="button" onClick={reset} className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Reset</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
