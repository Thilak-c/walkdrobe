"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../main-web/convex/_generated/api";
import { Edit2, Save, X, Plus, Minus, Package, Barcode as BarcodeIcon, Eye } from "lucide-react";
import Barcode from "@/components/Barcode";
import toast from "react-hot-toast";

export default function ProductTable({ products, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState(0);
  const [quickAddId, setQuickAddId] = useState(null);
  const [quickAmount, setQuickAmount] = useState(0);
  const [showBarcodeId, setShowBarcodeId] = useState(null);

  const updateStock = useMutation(api.inventory.updateStock);
  const addStock = useMutation(api.inventory.addStock);
  const removeStock = useMutation(api.inventory.removeStock);

  const handleSaveStock = async (productId) => {
    try {
      await updateStock({
        productId,
        newStock: editStock,
        reason: "Manual adjustment",
      });
      toast.success("Stock updated successfully!");
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const handleQuickAdd = async (productId) => {
    if (quickAmount <= 0) return;
    try {
      await addStock({
        productId,
        quantity: quickAmount,
        reason: "Quick restock",
      });
      toast.success(`Added ${quickAmount} units`);
      setQuickAddId(null);
      setQuickAmount(0);
    } catch (error) {
      toast.error("Failed to add stock");
    }
  };

  const handleQuickRemove = async (productId, currentStock) => {
    if (quickAmount <= 0 || quickAmount > currentStock) return;
    try {
      await removeStock({
        productId,
        quantity: quickAmount,
        reason: "Quick removal",
      });
      toast.success(`Removed ${quickAmount} units`);
      setQuickAddId(null);
      setQuickAmount(0);
    } catch (error) {
      toast.error("Failed to remove stock");
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", class: "badge-danger" };
    if (stock <= 10) return { label: "Low Stock", class: "badge-warning" };
    return { label: "In Stock", class: "badge-success" };
  };

  if (!products?.length) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product, idx) => {
              const status = getStockStatus(product.currentStock);
              const isEditing = editingId === product._id;
              const isQuickAdd = quickAddId === product._id;

              return (
                <tr 
                  key={product._id} 
                  className="table-row-hover transition-colors"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {product.mainImage ? (
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{product.itemId}</p>
                        {/* Barcode toggle */}
                        <button
                          onClick={() => setShowBarcodeId(showBarcodeId === product._id ? null : product._id)}
                          className="text-xs text-blue-500 hover:text-blue-600 mt-1 flex items-center gap-1"
                        >
                          <BarcodeIcon size={12} />
                          {showBarcodeId === product._id ? "Hide" : "Show"} Barcode
                        </button>
                        {showBarcodeId === product._id && (
                          <div className="mt-2 p-2 bg-white border border-gray-200 rounded-lg inline-block">
                            <Barcode value={product.itemId} width={120} height={40} />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{product.category || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">₹{product.price?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-900">{product.currentStock}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveStock(product._id)}
                            className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : isQuickAdd ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={quickAmount}
                            onChange={(e) => setQuickAmount(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                            min="1"
                            placeholder="Qty"
                            autoFocus
                          />
                          <button
                            onClick={() => handleQuickAdd(product._id)}
                            className="p-1.5 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                            title="Add"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => handleQuickRemove(product._id, product.currentStock)}
                            className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            onClick={() => { setQuickAddId(null); setQuickAmount(0); }}
                            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(product._id); setEditStock(product.currentStock); }}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Edit stock"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setQuickAddId(product._id)}
                            className="p-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Quick add/remove"
                          >
                            <Plus size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
