"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { AlertTriangle, Plus, Package, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AlertsPage() {
  const [threshold, setThreshold] = useState(10);
  const [restockModal, setRestockModal] = useState(null);
  const [restockAmount, setRestockAmount] = useState(0);

  const lowStock = useQuery(api.inventory.getLowStockAlerts, { threshold });
  const addStock = useMutation(api.inventory.addStock);

  const handleRestock = async () => {
    if (!restockModal || restockAmount <= 0) return;
    try {
      await addStock({
        productId: restockModal._id,
        quantity: restockAmount,
        reason: "Restock from alerts",
      });
      toast.success(`Added ${restockAmount} units to ${restockModal.name}`);
      setRestockModal(null);
      setRestockAmount(0);
    } catch (error) {
      toast.error("Failed to restock");
    }
  };

  const outOfStock = lowStock?.filter(p => p.currentStock === 0) || [];
  const lowStockItems = lowStock?.filter(p => p.currentStock > 0) || [];
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
                    {outOfStock.map((product, idx) => (
                      <div 
                        key={product._id} 
                        className="bg-white rounded-2xl p-5 border border-red-100 flex items-center justify-between hover:shadow-lg transition-shadow"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
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
                            <span className="inline-block mt-1 badge badge-danger">Out of Stock</span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setRestockModal(product); setRestockAmount(10); }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
                        >
                          <Plus size={18} />
                          Restock
                        </button>
                      </div>
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
                    {lowStockItems.map((product, idx) => (
                      <div 
                        key={product._id} 
                        className="bg-white rounded-2xl p-5 border border-amber-100 flex items-center justify-between hover:shadow-lg transition-shadow"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
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
                            <span className="inline-block mt-1 badge badge-warning">{product.currentStock} units left</span>
                          </div>
                        </div>
                        <button
                          onClick={() => { setRestockModal(product); setRestockAmount(10); }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
                        >
                          <Plus size={18} />
                          Restock
                        </button>
                      </div>
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

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 font-poppins">Restock Product</h3>
              <button
                onClick={() => setRestockModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0">
                {restockModal.mainImage ? (
                  <img src={restockModal.mainImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-gray-300" size={20} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{restockModal.name}</p>
                <p className="text-sm text-gray-400">Current stock: {restockModal.currentStock} units</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add quantity</label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-lg font-semibold"
                min="1"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRestockModal(null)}
                className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={restockAmount <= 0}
                className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
