"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Trash2, Package, Globe, RotateCcw, Clock, X, Eye, Code } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteTrash() {
  const [viewing, setViewing] = useState(null);
  const [viewMode, setViewMode] = useState("normal"); // normal or raw

  const trash = useQuery(api.products.getTrash);
  const restoreProduct = useMutation(api.products.restoreFromTrashById);

  const loading = trash === undefined;

  const handleRestore = async (item) => {
    if (!confirm(`Restore "${item.name}"?`)) return;
    try {
      await restoreProduct({ trashId: item._id });
      toast.success("Product restored!");
      setViewing(null);
    } catch (err) {
      toast.error(err.message || "Failed to restore");
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
            <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
            <p className="text-sm text-gray-500">{trash?.length || 0} deleted products</p>
          </div>

          {/* Info Banner */}
          <div className="bg-gray-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Trash2 size={20} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Products in trash are never permanently deleted</p>
              <p className="text-xs text-gray-500 mt-1">Click on any item to view details or restore it</p>
            </div>
          </div>

          {/* Trash List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : trash?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">Trash is empty</p>
                <p className="text-sm text-gray-500 mt-1">Deleted products will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trash.map(item => (
                  <div 
                    key={item._id} 
                    onClick={() => setViewing(item)}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      {item.productData?.mainImage ? (
                        <img src={item.productData.mainImage} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <Package className="w-full h-full p-3 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.itemId}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-sm font-medium text-gray-900">₹{item.productData?.price}</p>
                      <p className="text-xs text-gray-400">{item.productData?.totalStock || 0} units</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(item); }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shrink-0"
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Deleted Product</h3>
                <p className="text-sm text-gray-500">{viewing.itemId}</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="p-4 border-b border-gray-100 flex gap-2 shrink-0">
              <button
                onClick={() => setViewMode("normal")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "normal" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Eye size={16} /> Normal View
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "raw" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Code size={16} /> Raw JSON
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {viewMode === "normal" ? (
                <div className="space-y-4">
                  {/* Product Image & Basic Info */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      {viewing.productData?.mainImage ? (
                        <img src={viewing.productData.mainImage} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-4 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900">{viewing.name}</h4>
                      <p className="text-sm text-gray-500">{viewing.productData?.category || "No category"}</p>
                      <p className="text-sm text-gray-400 mt-1">{viewing.productData?.description || "No description"}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">SKU</p>
                      <p className="font-mono text-sm">{viewing.itemId}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold">₹{viewing.productData?.price}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Cost Price</p>
                      <p className="font-semibold">₹{viewing.productData?.costPrice || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Stock</p>
                      <p className="font-semibold">{viewing.productData?.totalStock || 0} units</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="font-medium">{viewing.productData?.color || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Deleted At</p>
                      <p className="font-medium">{new Date(viewing.deletedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Sizes & Stock */}
                  {viewing.productData?.sizeStock && Object.keys(viewing.productData.sizeStock).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Size Stock</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(viewing.productData.sizeStock).sort((a, b) => +a[0] - +b[0]).map(([size, qty]) => (
                          <div key={size} className="bg-gray-100 rounded-lg px-3 py-2 text-center min-w-[60px]">
                            <p className="text-xs text-gray-500">Size {size}</p>
                            <p className="font-bold">{qty}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Images */}
                  {viewing.productData?.otherImages?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Other Images</p>
                      <div className="flex gap-2 flex-wrap">
                        {viewing.productData.otherImages.map((img, i) => (
                          <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(viewing, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-3 shrink-0">
              <button onClick={() => setViewing(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Close</button>
              <button onClick={() => handleRestore(viewing)} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 font-medium">
                <RotateCcw size={16} /> Restore Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
