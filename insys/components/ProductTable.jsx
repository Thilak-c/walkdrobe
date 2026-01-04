"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../main-web/convex/_generated/api";
import { Save, X, Package, Barcode as BarcodeIcon, Edit2, Plus, Trash2, Upload } from "lucide-react";
import Barcode from "@/components/Barcode";
import toast from "react-hot-toast";

const ALL_SIZES = ["41","42","43","44","45","46"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan"];
const CATEGORIES = ["All", "Sneakers", "Sports"];

export default function ProductTable({ products }) {
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showBarcodeId, setShowBarcodeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingOther, setUploadingOther] = useState(false);

  // Fetch full product data only when editing
  const editingProduct = useQuery(
    api.offStore.getProduct,
    editingProductId ? { id: editingProductId } : "skip"
  );

  const updateProduct = useMutation(api.offStore.updateProduct);
  const moveToTrash = useMutation(api.offStore.moveToTrash);

  const getTotalStock = (product) => {
    if (product.sizeStock) {
      return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    }
    return product.currentStock ?? 0;
  };

  const handleSave = async () => {
    if (!editingProductId) return;
    setIsSaving(true);
    try {
      await updateProduct({
        id: editingProductId,
        name: editForm.name,
        category: editForm.category,
        description: editForm.description,
        mainImage: editForm.mainImage,
        otherImages: editForm.otherImages,
        price: parseFloat(editForm.price) || 0,
        costPrice: parseFloat(editForm.costPrice) || 0,
        color: editForm.color,
        secondaryColor: editForm.secondaryColor,
        availableSizes: editForm.sizes,
        sizeStock: editForm.sizeStock,
      });
      toast.success("Product updated!");
      closeModal();
    } catch (error) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Move "${product.name}" to trash?`)) return;
    try {
      await moveToTrash({ id: product._id });
      toast.success("Moved to trash!");
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const printLabel = (itemId) => {
    if (!itemId) return;
    try {
      const inline = document.querySelector(`svg[data-item="${itemId}"]`);
      if (inline && inline.outerHTML) {
        const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Label</title><style>@page{size:50mm 25mm;margin:0}html,body{margin:0;padding:0}body{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center}.label{width:40mm}</style></head><body><div class="label">${inline.outerHTML}</div><script>setTimeout(()=>{window.print();setTimeout(()=>window.close(),200)},200);</script></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) alert('Please allow popups to print barcode');
        return;
      }
    } catch (e) {}
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Label</title><style>@page{size:50mm 25mm;margin:0}html,body{margin:0;padding:0;background:#fff}body{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center}.label{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center;box-sizing:border-box}.label svg{width:100%;height:auto;display:block}</style></head><body><div class="label"><svg id="barcode"></svg></div><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><script>try{JsBarcode(document.getElementById('barcode'),${JSON.stringify(itemId)},{format:'CODE128',displayValue:true,font:'monospace',fontOptions:'bold',fontSize:12,textMargin:4,margin:0,lineColor:'#000000',height:60,width:1.8});}catch(e){console.error(e);}setTimeout(()=>{window.print();setTimeout(()=>window.close(),200);},300);</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) alert('Please allow popups to print barcode');
  };

  const startEditing = (product) => {
    setEditingProductId(product._id);
    // Form will be populated when editingProduct data loads
  };

  // Populate form when full product data is loaded
  const populateForm = () => {
    if (editingProduct && Object.keys(editForm).length === 0) {
      setEditForm({
        name: editingProduct.name || "",
        category: editingProduct.category || "",
        description: editingProduct.description || "",
        mainImage: editingProduct.mainImage || "",
        otherImages: editingProduct.otherImages || [],
        price: editingProduct.price?.toString() || "",
        costPrice: editingProduct.costPrice?.toString() || "",
        color: editingProduct.color || "",
        secondaryColor: editingProduct.secondaryColor || "",
        sizes: editingProduct.availableSizes || [],
        sizeStock: editingProduct.sizeStock || {},
      });
    }
  };

  // Call populateForm when editingProduct changes
  if (editingProduct && Object.keys(editForm).length === 0) {
    populateForm();
  }

  const closeModal = () => {
    setEditingProductId(null);
    setEditForm({});
  };

  const toggleSize = (size) => {
    const newSizes = editForm.sizes.includes(size)
      ? editForm.sizes.filter(s => s !== size)
      : [...editForm.sizes, size];
    
    const newSizeStock = { ...editForm.sizeStock };
    if (!editForm.sizes.includes(size)) {
      newSizeStock[size] = 0;
    } else {
      delete newSizeStock[size];
    }
    
    setEditForm({ ...editForm, sizes: newSizes, sizeStock: newSizeStock });
  };

  const updateSizeQty = (size, value) => {
    setEditForm({
      ...editForm,
      sizeStock: { ...editForm.sizeStock, [size]: Math.max(0, parseInt(value) || 0) }
    });
  };

  const calculateTotalStock = () => {
    return Object.values(editForm.sizeStock || {}).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", class: "badge-danger" };
    if (stock <= 10) return { label: "Low Stock", class: "badge-warning" };
    return { label: "In Stock", class: "badge-success" };
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      toast.loading("Uploading...", { id: "upload-main" });
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setEditForm({ ...editForm, mainImage: data.url });
        toast.success("Image uploaded!", { id: "upload-main" });
      } else {
        toast.error(data.error || "Upload failed", { id: "upload-main" });
      }
    } catch {
      toast.error("Upload failed", { id: "upload-main" });
    } finally {
      setUploadingMain(false);
    }
  };

  const handleOtherImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remainingSlots = 5 - (editForm.otherImages?.length || 0);
    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingOther(true);
    toast.loading(`Uploading ${filesToUpload.length} image(s)...`, { id: "upload-other" });
    const uploadedUrls = [];
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) uploadedUrls.push(data.url);
      } catch {}
    }
    if (uploadedUrls.length > 0) {
      setEditForm({ ...editForm, otherImages: [...(editForm.otherImages || []), ...uploadedUrls] });
      toast.success(`${uploadedUrls.length} image(s) uploaded!`, { id: "upload-other" });
    } else {
      toast.error("Upload failed", { id: "upload-other" });
    }
    setUploadingOther(false);
    e.target.value = "";
  };

  const removeOtherImage = (idx) => {
    setEditForm({
      ...editForm,
      otherImages: editForm.otherImages.filter((_, i) => i !== idx)
    });
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
                              <Barcode value={product.itemId} width={100} height={35} dataItem={product.itemId} />
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(product)}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => printLabel(product.itemId)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Full Edit Product Modal */}
      {editingProductId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {!editingProduct ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading product...</p>
              </div>
            ) : (
              <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Product</h3>
                <p className="text-xs text-gray-400">{editingProduct.itemId}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <select
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="">Select color</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <select
                    value={editForm.secondaryColor}
                    onChange={(e) => setEditForm({ ...editForm, secondaryColor: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="">None</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.costPrice}
                    onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm resize-none"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
                <div className="flex gap-3 items-start">
                  {editForm.mainImage && (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative group shrink-0">
                      <img src={editForm.mainImage} alt="Main" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, mainImage: "" })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 ${uploadingMain ? 'opacity-50' : ''}`}>
                    <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" disabled={uploadingMain} />
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-500">{uploadingMain ? "Uploading..." : "Upload new image"}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images (up to 5)</label>
                <div className="flex flex-wrap gap-2">
                  {(editForm.otherImages || []).map((img, idx) => (
                    <div key={idx} className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden relative group">
                      <img src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeOtherImage(idx)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {(editForm.otherImages?.length || 0) < 5 && (
                    <label className={`w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 ${uploadingOther ? 'opacity-50' : ''}`}>
                      <input type="file" accept="image/*" multiple onChange={handleOtherImagesUpload} className="hidden" disabled={uploadingOther} />
                      {uploadingOther ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Plus size={16} className="text-gray-400" />
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Sizes & Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Sizes</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALL_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        editForm.sizes?.includes(size)
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {editForm.sizes?.length > 0 && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock per Size</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {editForm.sizes.sort((a,b) => parseInt(a) - parseInt(b)).map(size => (
                        <div key={size} className="bg-gray-50 rounded-lg p-2">
                          <label className="block text-[10px] text-gray-500 mb-1 text-center">Size {size}</label>
                          <input
                            type="number"
                            value={editForm.sizeStock?.[size] ?? 0}
                            onChange={(e) => updateSizeQty(size, e.target.value)}
                            className="w-full px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-600">Total Stock</span>
                  <span className="text-lg font-bold">{calculateTotalStock()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={closeModal} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
