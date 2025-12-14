"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AddProductPage() {
  const addProduct = useMutation(api.products.insert);
  const [form, setForm] = useState({
    name: "",
    subcategories: "",
    type: [],
    category: "",
    price: "",
    description: "",
    mainImage: "",
    otherImages: [],
    availableSizes: ["S", "M", "L", "XL"],
    sizeStock: {
      S: "10",
      M: "",
      L: "",
      XL: "",
      XXL: "",
    },
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      // Handle multiple select for type field
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setForm((prev) => ({ ...prev, [name]: selectedOptions }));
    } else {
      // Auto-capitalize text inputs (except price, description, and category dropdown)
      const capitalizedValue = (name === "price" || name === "description" || name === "category")
        ? value
        : value.toUpperCase();
      setForm((prev) => ({ ...prev, [name]: capitalizedValue }));
    }
  };

  const handleSizeToggle = (size) => {
    setForm((prev) => {
      const newAvailableSizes = prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size];
      return {
        ...prev,
        availableSizes: newAvailableSizes,
      };
    });
  };

  const handleSizeStockChange = (size, value) => {
    setForm((prev) => ({
      ...prev,
      sizeStock: {
        ...prev.sizeStock,
        [size]: value,
      },
    }));
  };

  // Upload single main image
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (data.url) {
      setForm((prev) => ({ ...prev, mainImage: data.url }));
    }
  };

  // Upload multiple other images and append instead of replacing
  const handleOtherImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }

    // Append new images to existing ones
    setForm((prev) => ({
      ...prev,
      otherImages: [...prev.otherImages, ...urls],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Calculate total stock from all available sizes
    const totalStock = Object.entries(form.sizeStock)
      .filter(([size]) => form.availableSizes.includes(size))
      .reduce((sum, [_, stock]) => sum + (parseInt(stock) || 0), 0);

    // Calculate if product is in stock based on total stock
    const inStock = totalStock > 0;

    await addProduct({
      itemId: crypto.randomUUID(),
      name: form.name,
      subcategories: form.subcategories,
      type: form.type,
      category: form.category,
      price: parseFloat(form.price),
      description: form.description,
      mainImage: form.mainImage,
      createdAt: new Date().toISOString(),
      otherImages: form.otherImages,
      availableSizes: form.availableSizes,
      sizeStock: Object.fromEntries(
        Object.entries(form.sizeStock).map(([size, stock]) => [
          size,
          stock ? parseInt(stock) : 0
        ])
      ),
      // Add these fields
      currentStock: totalStock,
      inStock: inStock,
    });

    alert("✅ Product Added Successfully!");
    setForm({
      name: "",
      subcategories: "",
      type: [],
      category: "",
      price: "",
      description: "",
      mainImage: "",
      otherImages: [],
      availableSizes: ["S", "M", "L", "XL", "XXL"],
      sizeStock: {
        S: "10",
        M: "",
        L: "",
        XL: "",
        XXL: "",
      },
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* subcategories */}
          <div>
            <label className="block text-sm font-medium mb-1">subcategories</label>
            <input
              type="text"
              name="subcategories"
              value={form.subcategories}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Types (Click to Select)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
              {[
                "Baggy Shirts", "Oversized T-Shirts", "Crop Tops", "High Waist Jeans", "Low Rise Pants", "Mom Jeans", "Dad Sneakers", "Chunky Sneakers", "Platform Shoes",
                "Y2K Fashion", "Vintage", "Retro", "Street Style", "Hip Hop", "Skater Style", "Grunge", "Punk", "Goth", "Emo", "Chokers", "Oversized Hoodies", "Baggy Pants",
                "Cargo Pants", "Athleisure", "Streetwear", "Trendy Dresses", "Mini Skirts", "Micro Shorts", "Tank Tops", "Tube Tops", "Bralettes", "Mesh Tops", "Fishnet",
                "Leather Jackets", "Denim Jackets", "Oversized Blazers", "Trendy Accessories", "Chain Necklaces", "Hoop Earrings", "Statement Rings", "Trendy Bags", "Crossbody Bags"
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      type: prev.type.includes(type)
                        ? prev.type.filter(t => t !== type)
                        : [...prev.type, type]
                    }));
                  }}
                  className={`px-3 py-2 lg:px-4 lg:py-2.5 text-sm lg:text-base font-medium rounded-lg border transition-all duration-200 ${form.type.includes(type)
                    ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:scale-105'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {form.type.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Selected types:</p>
                <div className="flex flex-wrap gap-2">
                  {form.type.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2"
                    >
                      {type}
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            type: prev.type.filter(t => t !== type)
                          }));
                        }}
                        className="text-blue-600 hover:text-blue-800 text-lg font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>-- Select Category --</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Sneakers">Sneakers</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full border rounded-lg px-3 py-2"
            ></textarea>
          </div>

          {/* Size-Based Inventory Management */}
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-r-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Size-Based Inventory Management</h3>
                  <p className="text-sm text-blue-700">Set stock levels for each available size</p>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Available Sizes</h4>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${form.availableSizes.includes(size)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Stock Inputs */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Stock for Each Size</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <div key={size} className={`p-4 rounded-lg border-2 transition-all ${form.availableSizes.includes(size)
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50 opacity-50"
                    }`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size {size}
                      {form.availableSizes.includes(size) && (
                        <span className="ml-2 text-xs text-blue-600">✓ Available</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={form.sizeStock[size]}
                      onChange={(e) => handleSizeStockChange(size, e.target.value)}
                      min="0"
                      disabled={!form.availableSizes.includes(size)}
                      className={`w-full border rounded-lg px-3 py-2 ${form.availableSizes.includes(size)
                        ? "border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                        : "border-gray-200 bg-gray-100"
                        }`}
                      placeholder="0"
                    />
                    {form.availableSizes.includes(size) && form.sizeStock[size] && (
                      <p className="text-xs text-gray-500 mt-1">
                        {parseInt(form.sizeStock[size])} units available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Summary */}
            {form.availableSizes.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Stock Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Available Sizes:</span>
                    <span className="font-medium">{form.availableSizes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Stock:</span>
                    <span className="font-medium">
                      {Object.entries(form.sizeStock)
                        .filter(([size]) => form.availableSizes.includes(size))
                        .reduce((sum, [_, stock]) => sum + (parseInt(stock) || 0), 0)
                      } units
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium mb-1">Main Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
            {form.mainImage && (
              <img
                src={form.mainImage}
                alt="Main"
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            )}
          </div>

          {/* Other Images */}
          <div>
            <label className="block text-sm font-medium mb-1">Other Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleOtherImagesUpload}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {form.otherImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {form.otherImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Other ${idx}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
