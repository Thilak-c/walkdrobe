"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { AlertTriangle, Package, CheckCircle, X, Save } from "lucide-react";
import toast from "react-hot-toast";

const ALL_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12", "13"];

export default function AlertsPage() {
  const [threshold, setThreshold] = useState(10);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSizeStock, setEditSizeStock] = useState({});
  const [editSizes, setEditSizes] = useState([]);

  const lowStock = useQuery(api.offStore.getLowStock, { threshold });
  const updateSizeStock = useMutation(api.offStore.updateStock);

  const getTotalStock = (product) => {
    if (product.sizeStock) {
      return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    }
    return product.currentStock ?? 0;
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

  const handleSaveStock = async () => {
    if (!editingProduct) return;
    try {
      await updateSizeStock({
        id: editingProduct._id,
        sizeStock: editSizeStock,
        reason: "Manual update",
      });
      toast.success("Stock updated!");
      closeModal();
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  // Get low stock sizes for a product
  const getLowStockSizes = (product) => {
    if (!product.sizeStock) return [];
    return Object.entries(product.sizeStock)
      .filter(([_, qty]) => qty <= 3)
      .map(([size, qty]) => ({ size, qty }));
  };

  const outOfStock = lowStock?.filter(p => getTotalStock(p) === 0) || [];
  const lowStockItems = lowStock?.filter(p => getTotalStock(p) > 0) || [];
  const isLoading = lowStock === undefined;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">ALERTS</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Low Stock Alerts</h1>
              <p className="text-gray-500 text-sm mt-1">Products that need restocking</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-500">Threshold:</span>
              <select
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="bg-transparent border-0 text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
              >
                <option value={5}>5 units</option>
                <option value={10}>10 units</option>
                <option value={20}>20 units</option>
                <option value={50}>50 units</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Out of Stock Section */}
              {outOfStock.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-red-100 rounded-xl">
                      <AlertTriangle className="text-red-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 font-poppins">Out of Stock</h2>
                      <p className="text-sm text-gray-400">{outOfStock.length} products need immediate attention</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {outOfStock.map((product) => (
                      <ProductCard 
                        key={product._id} 
                        product={product} 
                        onEdit={() => startEditing(product)}
                        variant="danger"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Section */}
              {lowStockItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-amber-100 rounded-xl">
                      <AlertTriangle className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 font-poppins">Low Stock</h2>
                      <p className="text-sm text-gray-400">{lowStockItems.length} products running low</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {lowStockItems.map((product) => (
                      <ProductCard 
                        key={product._id} 
                        product={product} 
                        onEdit={() => startEditing(product)}
                        variant="warning"
                        getLowStockSizes={getLowStockSizes}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {lowStock?.length === 0 && (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                  <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-emerald-500" size={40} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">All Stocked Up!</h3>
                  <p className="text-gray-500">No products below the {threshold} unit threshold</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>


      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Restock - {editingProduct.name}</h3>
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

              {/* Available Sizes */}
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
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onEdit, variant, getLowStockSizes }) {
  const getTotalStock = (p) => {
    if (p.sizeStock) {
      return Object.values(p.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    }
    return p.currentStock ?? 0;
  };

  const totalStock = getTotalStock(product);
  const sizes = product.availableSizes || [];
  const sizeStock = product.sizeStock || {};
  const borderColor = variant === "danger" ? "border-red-100" : "border-amber-100";

  return (
    <div className={`bg-white rounded-2xl p-5 border ${borderColor} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
            {product.mainImage ? (
              <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="text-gray-300" size={24} />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-400">{product.category} • ₹{product.price?.toLocaleString()}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {sizes.length > 0 ? sizes.sort((a,b) => a-b).map(size => (
                <span key={size} className={`text-[10px] px-1.5 py-0.5 rounded ${
                  (sizeStock[size] || 0) === 0 ? "bg-red-100 text-red-600" : 
                  (sizeStock[size] || 0) <= 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {size}:{sizeStock[size] || 0}
                </span>
              )) : null}
            </div>
            <span className={`inline-block mt-2 badge ${variant === "danger" ? "badge-danger" : "badge-warning"}`}>
              {totalStock === 0 ? "Out of Stock" : `${totalStock} units total`}
            </span>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm shrink-0"
        >
          Restock
        </button>
      </div>
    </div>
  );
}
