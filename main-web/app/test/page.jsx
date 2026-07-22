"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TestPage() {
  // Query all products from Convex db using category:getAll
  const products = useQuery(api.category.getAll);

  if (products === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading products from Convex database...</p>
        </div>
      </div>
    );
  }

  if (products === null || products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center border border-gray-100">
          <h1 className="text-2xl font-serif text-gray-900 mb-2">No Products Found</h1>
          <p className="text-gray-500 text-sm">The products table in the Convex database is currently empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-serif text-gray-900 tracking-wide font-light">Convex Products Directory</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 font-inter">
              Inspect all active shoes currently stored in the database ({products.length} items)
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-inter">
              Convex Connected
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white border border-gray-200/60 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              {/* Product Image Panel */}
              <div className="relative aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-xs">No image uploaded</div>
                )}
                
                {/* Item ID tag */}
                <div className="absolute top-3 right-3 bg-neutral-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase font-inter rounded-md">
                  {product.itemId}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#7A5C3E] uppercase font-inter">
                      {product.category || "General"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-inter ${
                      product.inStock 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {product.inStock ? "IN STOCK" : "OUT OF STOCK"}
                    </span>
                  </div>

                  <h3 className="text-gray-900 font-semibold text-base mb-2 font-inter tracking-wide leading-snug">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-500 text-xs font-light leading-relaxed mb-4 font-inter line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {/* Detailed Specs Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-xs font-inter text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold tracking-wider uppercase">Price</span>
                      <span className="font-bold text-gray-900 text-sm">₹{product.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold tracking-wider uppercase">Color</span>
                      <span className="font-medium text-gray-800">{product.color || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold tracking-wider uppercase">Current Stock</span>
                      <span className="font-semibold text-gray-800">{product.currentStock ?? 0} units</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold tracking-wider uppercase">Sizes</span>
                      <span className="font-medium text-gray-800">{product.availableSizes?.join(", ") || "None"}</span>
                    </div>
                  </div>

                  {/* Views & Sales Stats */}
                  <div className="flex items-center justify-between text-[10px] font-inter text-gray-400 pt-1">
                    <span>Views: {product.views || 0}</span>
                    <span>Buys: {product.buys || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
