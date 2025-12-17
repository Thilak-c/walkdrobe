"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Package, TrendingDown, IndianRupee } from "lucide-react";

export default function WebsiteDeadStockPage() {
  const [daysFilter, setDaysFilter] = useState(30);
  const deadStock = useQuery(api.webStore.getDeadStock, { daysOld: daysFilter }) || [];

  const totalValue = deadStock.reduce((sum, p) => sum + (p.stockValue || 0), 0);
  const totalItems = deadStock.reduce((sum, p) => sum + (p.totalStock || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">WEBSITE STORE</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Dead Stock</h1>
          <p className="text-gray-500 text-sm mt-1">Products with no movement</p>
        </div>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          className="px-4 py-2 bg-white border rounded-xl text-sm"
        >
          <option value={7}>Older than 7 days</option>
          <option value={30}>Older than 30 days</option>
          <option value={60}>Older than 60 days</option>
          <option value={90}>Older than 90 days</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dead Products</p>
              <p className="text-xl font-bold">{deadStock.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stuck Value</p>
              <p className="text-xl font-bold">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      {deadStock.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No dead stock found</p>
          <p className="text-sm text-gray-400 mt-1">All products are newer than {daysFilter} days</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stuck Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deadStock.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.itemId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{product.totalStock}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{product.price}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                    ₹{product.stockValue?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
