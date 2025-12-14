"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, Plus, X, Upload, CheckCircle, Barcode as BarcodeIcon } from "lucide-react";
import Barcode from "@/components/Barcode";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const SIZES = ["6", "7", "8", "9", "10", "11", "12"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan"];
const CATEGORIES = ["Sneakers", "Boots", "Sandals", "Formal", "Sports", "Casual", "Loafers", "Slippers"];

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    color: "",
    sizes: [],
    sizeStock: {},
    costPrice: "",
    sellingPrice: "",
    description: "",
    mainImage: "",
  });

  const insertProduct = useMutation(api.products.insert);

  const handleSizeToggle = (size) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter(s => s !== size)
      : [...formData.sizes, size];
    
    const newSizeStock = { ...formData.sizeStock };
    if (!formData.sizes.includes(size)) {
      newSizeStock[size] = 0;
    } else {
      delete newSizeStock[size];
    }
    
    setFormData({ ...formData, sizes: newSizes, sizeStock: newSizeStock });
  };

  const handleSizeStockChange = (size, value) => {
    setFormData({
      ...formData,
      sizeStock: { ...formData.sizeStock, [size]: parseInt(value) || 0 }
    });
  };

  const calculateTotalStock = () => {
    return Object.values(formData.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name || !formData.sellingPrice) {
      toast.error("Please fill in required fields");
      return;
    }

    if (formData.sizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalStock = calculateTotalStock();
      
      await insertProduct({
        itemId: formData.sku,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.sellingPrice),
        costPrice: parseFloat(formData.costPrice) || 0,
        mainImage: formData.mainImage || "/placeholder-shoe.png",
        availableSizes: formData.sizes,
        sizeStock: formData.sizeStock,
        currentStock: totalStock,
        totalAvailable: totalStock,
        inStock: totalStock > 0,
        color: formData.color,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      toast.success("Product added successfully!");
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          sku: "",
          name: "",
          category: "",
          color: "",
          sizes: [],
          sizeStock: {},
          costPrice: "",
          sellingPrice: "",
          description: "",
          mainImage: "",
        });
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">INVENTORY</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Add New Product</h1>
            <p className="text-gray-500 text-sm mt-1">Add a new product to your inventory</p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">Product Added!</h3>
              <p className="text-gray-500 mb-6">Your product has been added to inventory</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Add Another
                </button>
                <button
                  onClick={() => router.push("/products")}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  View Products
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Package className="text-gray-600" size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 font-poppins">Basic Information</h2>
                    <p className="text-sm text-gray-400">Product details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* SKU with Barcode Preview */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU / Item ID <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g., WD-SNK-001"
                        className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm font-mono"
                        required
                      />
                      {formData.sku && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                          <Barcode value={formData.sku} width={150} height={50} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">This will be used as the barcode for scanning</p>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Nike Air Max 90"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                      required
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <input
                      type="text"
                      value={formData.brand || ""}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Nike, Adidas"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    >
                      <option value="">Select color</option>
                      {COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={formData.mainImage}
                      onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Product description..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sizes & Stock */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 font-poppins">Sizes & Stock</h2>
                    <p className="text-sm text-gray-400">Select sizes and set quantity for each</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{calculateTotalStock()}</p>
                    <p className="text-xs text-gray-400">Total units</p>
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Sizes <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`w-12 h-12 rounded-xl font-medium text-sm transition-all ${
                          formData.sizes.includes(size)
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock per Size */}
                {formData.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Quantity per Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.sizes.sort((a, b) => parseInt(a) - parseInt(b)).map(size => (
                        <div key={size} className="bg-gray-50 rounded-xl p-3">
                          <label className="block text-xs text-gray-500 mb-1">Size {size}</label>
                          <input
                            type="number"
                            value={formData.sizeStock[size] || ""}
                            onChange={(e) => handleSizeStockChange(size, e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 font-poppins mb-6">Pricing</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Your purchase price</p>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Customer price</p>
                  </div>
                </div>

                {/* Profit Margin */}
                {formData.costPrice && formData.sellingPrice && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-700">Profit Margin</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ₹{(parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice)).toFixed(2)}
                        <span className="text-sm font-normal ml-2">
                          ({(((parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice)) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Add Product
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
