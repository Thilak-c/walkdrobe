"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../main-web/convex/_generated/api";
import { Save, X, Package, Barcode as BarcodeIcon, Edit2, Plus } from "lucide-react";
import Barcode from "@/components/Barcode";
import toast from "react-hot-toast";

const ALL_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12", "13"];

export default function ProductTable({ products }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSizeStock, setEditSizeStock] = useState({});
  const [editSizes, setEditSizes] = useState([]);
  const [showBarcodeId, setShowBarcodeId] = useState(null);

  const updateSizeStock = useMutation(api.inventory.updateSizeStock);

  const getTotalStock = (product) => {
    if (product.sizeStock) {
      return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    }
    return product.currentStock ?? 0;
  };

  const handleSaveStock = async () => {
    if (!editingProduct) return;
    try {
      await updateSizeStock({
        productId: editingProduct._id,
        sizeStock: editSizeStock,
        availableSizes: editSizes.sort((a, b) => parseInt(a) - parseInt(b)),
        updatedBy: "admin",
      });
      toast.success("Stock updated!");
      closeModal();
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setEditSizeStock(product.sizeStock || {});
    setEditSizes(product.availableSizes || []);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setEditSizeStock({});
    setEditSizes([]);
  };

  const toggleSize = (size) => {
    if (editSizes.includes(size)) {
      setEditSizes(editSizes.filter(s => s !== size));
      const newStock = { ...editSizeStock };
      delete newStock[size];
      setEditSizeStock(newStock);
    } else {
      setEditSizes([...editSizes, size]);
      setEditSizeStock({ ...editSizeStock, [size]: 0 });
    }
  };

  const updateSizeQty = (size, value) => {
    setEditSizeStock(prev => ({
      ...prev,
      [size]: Math.max(0, parseInt(value) || 0)
    }));
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
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const totalStock = getTotalStock(product);
                const status = getStockStatus(totalStock);
                const sizes = product.availableSizes || [];
                const sizeStock = product.sizeStock || {};

                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                          {product.mainImage ? (
                            <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{product.itemId}</p>
                          <button
                            onClick={() => setShowBarcodeId(showBarcodeId === product._id ? null : product._id)}
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                            <BarcodeIcon size={10} /> Barcode
                          </button>
                          {showBarcodeId === product._id && (
                            <div className="mt-2">
                              <Barcode value={product.itemId} width={100} height={35} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category || "—"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {sizes.length > 0 ? sizes.sort((a,b) => a-b).map(size => (
                          <span key={size} className={`text-[10px] px-1.5 py-0.5 rounded ${
                            (sizeStock[size] || 0) === 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                          }`}>
                            {size}:{sizeStock[size] || 0}
                          </span>
                        )) : <span className="text-xs text-gray-400">—</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Total: {totalStock}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => startEditing(product)}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Edit Stock - {editingProduct.name}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {editingProduct.mainImage ? (
                    <img src={editingProduct.mainImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-full h-full p-3 text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{editingProduct.name}</p>
                  <p className="text-xs text-gray-400">{editingProduct.itemId}</p>
                  <p className="text-sm font-bold mt-1">₹{editingProduct.price}</p>
                </div>
              </div>

              {/* Available Sizes Selection */}
              <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {ALL_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      editSizes.includes(size)
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Stock per Size */}
              {editSizes.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-700 mb-2">Stock per Size</p>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {editSizes.sort((a,b) => parseInt(a) - parseInt(b)).map(size => (
                      <div key={size}>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Size {size}</label>
                        <input
                          type="number"
                          value={editSizeStock[size] ?? 0}
                          onChange={(e) => updateSizeQty(size, e.target.value)}
                          className="w-full px-2 py-2 text-center border border-gray-200 rounded-lg text-sm"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Stock</span>
                <span className="text-lg font-bold">{Object.values(editSizeStock).reduce((s,q) => s + (q||0), 0)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSaveStock} className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2">
                <Save size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
