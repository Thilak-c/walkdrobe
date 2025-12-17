"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { AlertTriangle, Package, Globe, Search, Edit2, X, Save, Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteAlerts() {
  const [editing, setEditing] = useState(null);
  const [editStock, setEditStock] = useState({});
  const [search, setSearch] = useState("");

  const lowStock = useQuery(api.webStore.getLowStock, { threshold: 10 });
  const updateStock = useMutation(api.webStore.updateStock);

  const loading = lowStock === undefined;

  let filtered = lowStock || [];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.itemId.toLowerCase().includes(s));
  }

  const outOfStock = filtered.filter(p => p.totalStock === 0);
  const critical = filtered.filter(p => p.totalStock > 0 && p.totalStock <= 5);
  const low = filtered.filter(p => p.totalStock > 5);

  const handleEdit = (p) => {
    setEditing(p);
    setEditStock(p.sizeStock || {});
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateStock({ id: editing._id, sizeStock: editStock, reason: "Restock" });
      toast.success("Stock updated!");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-medium">WEBSITE STORE</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
            <p className="text-sm text-gray-500">{filtered.length} items need attention</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm text-gray-600">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{outOfStock.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={16} className="text-amber-500" />
                <span className="text-sm text-gray-600">Critical (≤5)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{critical.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">Low (≤10)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{low.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl p-3 border border-gray-200 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">All Stocked Up!</p>
                <p className="text-sm text-gray-500">No products below threshold</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <div key={p._id} className={`p-4 flex items-center gap-4 ${p.totalStock === 0 ? "bg-red-50/50" : p.totalStock <= 5 ? "bg-amber-50/50" : ""}`}>
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      {p.mainImage ? <img src={p.mainImage} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.itemId} • {p.category || "No category"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(p.sizeStock || {}).sort((a, b) => +a[0] - +b[0]).map(([s, q]) => (
                          <span key={s} className={`px-1.5 py-0.5 rounded text-xs ${q === 0 ? "bg-red-100 text-red-600" : q <= 2 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                            {s}:{q}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-bold ${p.totalStock === 0 ? "text-red-500" : p.totalStock <= 5 ? "text-amber-500" : "text-gray-900"}`}>
                        {p.totalStock}
                      </p>
                      <p className="text-xs text-gray-400">units</p>
                    </div>
                    <button onClick={() => handleEdit(p)} className="p-2 hover:bg-white rounded-lg border border-gray-200 bg-white shrink-0" title="Restock">
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Restock Product</h3>
                <p className="text-sm text-gray-500">{editing.name}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {(editing.availableSizes || []).map(s => (
                  <div key={s} className="bg-gray-50 rounded-lg p-2">
                    <label className="text-xs text-gray-500">Size {s}</label>
                    <input type="number" min="0" value={editStock[s] || ""} onChange={e => setEditStock({ ...editStock, [s]: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-gray-900" />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-100 rounded-lg flex justify-between">
                <span className="text-sm text-gray-600">New Total</span>
                <span className="font-bold text-gray-900">{Object.values(editStock).reduce((s, q) => s + (q || 0), 0)}</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2">
                <Save size={16} /> Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
