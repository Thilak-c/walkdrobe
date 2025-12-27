"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, Search, Edit2, Trash2, Plus, X, Save, Globe, Upload } from "lucide-react";
import { SIZE_CHART_DATA } from "../../../../main-web/components/SizeChart";
import toast from "react-hot-toast";
import Link from "next/link";

const SIZES = (SIZE_CHART_DATA && Array.isArray(SIZE_CHART_DATA)
  ? Array.from(new Set(SIZE_CHART_DATA.map(s => String(s.uk))))
      .sort((a, b) => parseFloat(a) - parseFloat(b))
  : ["41","42","43","44","45","46"]
);
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi"];
const CATEGORIES = ["Sneakers", "Boots", "Sandals", "Formal", "Sports", "Casual", "Loafers", "Slippers", "Heels"];

export default function WebsiteProducts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const products = useQuery(api.products.getAllProducts);
  const updateProductFull = useMutation(api.products.updateProductFull);
  const deleteProduct = useMutation(api.products.deleteProduct);

  let filtered = products || [];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.itemId.toLowerCase().includes(s));
  }
  if (filter === "in") filtered = filtered.filter(p => (p.currentStock || p.totalAvailable || 0) > 10);
  if (filter === "low") filtered = filtered.filter(p => (p.currentStock || p.totalAvailable || 0) > 0 && (p.currentStock || p.totalAvailable || 0) <= 10);
  if (filter === "out") filtered = filtered.filter(p => (p.currentStock || p.totalAvailable || 0) === 0);

  const handleEdit = (p) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      category: p.category || "",
      description: p.description || "",
      mainImage: p.mainImage || "",
      otherImages: p.otherImages || [],
      price: p.price,
      costPrice: p.costPrice || 0,
      color: p.color || "",
      secondaryColor: p.secondaryColor || "",
      sizes: p.availableSizes || [],
      sizeStock: p.sizeStock || {},
    });
  };

  const toggleSize = (size) => {
    const has = editForm.sizes.includes(size);
    const sizes = has ? editForm.sizes.filter(s => s !== size) : [...editForm.sizes, size];
    const sizeStock = { ...editForm.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setEditForm({ ...editForm, sizes, sizeStock });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editForm.name || !editForm.price) return toast.error("Name and price required");
    if (editForm.sizes.length === 0) return toast.error("Select at least one size");
    
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
      toast.success("Product updated!");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      await deleteProduct({ productId: p._id });
      toast.success("Deleted!");
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const uploadImage = async (file, isMain = true) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      toast.loading("Uploading...", { id: "upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        if (isMain) setEditForm(f => ({ ...f, mainImage: data.url }));
        else setEditForm(f => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Uploaded!", { id: "upload" });
      } else toast.error("Upload failed", { id: "upload" });
    } catch { toast.error("Upload failed", { id: "upload" }); }
  };

  const totalStock = Object.values(editForm.sizeStock || {}).reduce((sum, q) => sum + (q || 0), 0);
  const loading = products === undefined;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={16} className="text-gray-400" />
                <p className="text-gray-400 text-xs font-medium">WEBSITE STORE</p>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500">{filtered.length} products</p>
            </div>
            <Link href="/website/add-product" className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
              <Plus size={18} /> Add
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-3 border border-gray-200 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex gap-2">
              {[["all", "All"], ["in", "In Stock"], ["low", "Low"], ["out", "Out"]].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filter === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{l}</button>
              ))}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products found</p>
                <Link href="/website/add-product" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
                  <Plus size={16} /> Add Product
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {p.mainImage ? <img src={p.mainImage} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-gray-300" />}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.itemId}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.category || "-"}</td>
                        <td className="px-4 py-3 text-sm font-medium">₹{p.price}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${(p.currentStock || p.totalAvailable || 0) === 0 ? "text-red-500" : (p.currentStock || p.totalAvailable || 0) <= 10 ? "text-amber-500" : "text-gray-900"}`}>
                            {p.currentStock || p.totalAvailable || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${(p.currentStock || p.totalAvailable || 0) === 0 ? "bg-red-100 text-red-600" : (p.currentStock || p.totalAvailable || 0) <= 10 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                            {(p.currentStock || p.totalAvailable || 0) === 0 ? "Out" : (p.currentStock || p.totalAvailable || 0) <= 10 ? "Low" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(p)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                              <Edit2 size={16} className="text-gray-500" />
                            </button>
                            <button onClick={() => handleDelete(p)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <div>
                <h3 className="font-semibold text-lg">Edit Product</h3>
                <p className="text-sm text-gray-500">{editing.itemId}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900">
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Color</label>
                  <select value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900">
                    <option value="">Select</option>
                    {COLORS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Description</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm resize-none border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Images</label>
                <div className="flex gap-2 flex-wrap">
                  {editForm.mainImage ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden relative group border border-gray-200">
                      <img src={editForm.mainImage} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditForm({ ...editForm, mainImage: "" })} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <X className="text-white" size={16} />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white text-[8px] text-center">Main</span>
                    </div>
                  ) : (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Upload size={14} className="text-gray-400" />
                      <span className="text-[8px] text-gray-400">Main</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], true)} />
                    </label>
                  )}
                  {editForm.otherImages?.map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden relative group border border-gray-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditForm({ ...editForm, otherImages: editForm.otherImages.filter((_, j) => j !== i) })} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <X className="text-white" size={16} />
                      </button>
                    </div>
                  ))}
                  {(editForm.otherImages?.length || 0) < 4 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Plus size={14} className="text-gray-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], false)} />
                    </label>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Cost Price (₹)</label>
                  <input type="number" value={editForm.costPrice} onChange={e => setEditForm({ ...editForm, costPrice: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Selling Price (₹) *</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              {/* Sizes & Stock */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">Sizes & Stock</label>
                  <span className="text-sm font-bold text-gray-900">{totalStock} total</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${editForm.sizes?.includes(s) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
                  ))}
                </div>
                {editForm.sizes?.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {editForm.sizes.sort((a, b) => +a - +b).map(s => (
                      <div key={s} className="bg-gray-50 rounded-lg p-2">
                        <label className="text-xs text-gray-500">Size {s}</label>
                        <input type="number" min="0" value={editForm.sizeStock?.[s] || ""} onChange={e => setEditForm({ ...editForm, sizeStock: { ...editForm.sizeStock, [s]: parseInt(e.target.value) || 0 } })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-gray-900" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-xl">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 font-medium">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
