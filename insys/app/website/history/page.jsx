"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { History, Package, TrendingUp, TrendingDown, RefreshCw, Filter } from "lucide-react";

const typeColors = {
  stock_in: "bg-green-100 text-green-700",
  stock_out: "bg-red-100 text-red-700",
  adjustment: "bg-blue-100 text-blue-700",
  sale: "bg-purple-100 text-purple-700",
};

const typeIcons = {
  stock_in: TrendingUp,
  stock_out: TrendingDown,
  adjustment: RefreshCw,
  sale: Package,
};

export default function WebsiteHistoryPage() {
  const [limit, setLimit] = useState(50);
  const [typeFilter, setTypeFilter] = useState("all");

  const movements = useQuery(api.products.getInventoryMovements, { limit }) || [];

  const filteredMovements = typeFilter === "all" 
    ? movements 
    : movements.filter(m => m.type === typeFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">WEBSITE STORE</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Stock History</h1>
              <p className="text-gray-500 text-sm mt-1">Track all stock movements</p>
            </div>
            <div className="flex gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white border rounded-xl text-sm"
              >
                <option value="all">All Types</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="sale">Sale</option>
              </select>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-4 py-2 bg-white border rounded-xl text-sm"
              >
                <option value={25}>Last 25</option>
                <option value={50}>Last 50</option>
                <option value={100}>Last 100</option>
                <option value={200}>Last 200</option>
              </select>
            </div>
          </div>


          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Movements", value: movements.length, icon: History, color: "bg-gray-100" },
              { label: "Stock In", value: movements.filter(m => m.type === "stock_in").length, icon: TrendingUp, color: "bg-green-100" },
              { label: "Stock Out", value: movements.filter(m => m.type === "stock_out").length, icon: TrendingDown, color: "bg-red-100" },
              { label: "Adjustments", value: movements.filter(m => m.type === "adjustment").length, icon: RefreshCw, color: "bg-blue-100" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.color} p-4 rounded-xl`}>
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4" />
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Movements List */}
          {filteredMovements.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No stock movements found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Change</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMovements.map((movement) => {
                    const TypeIcon = typeIcons[movement.type] || History;
                    const isPositive = movement.type === "stock_in" || movement.quantity > 0;
                    return (
                      <tr key={movement._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {movement.timestamp ? new Date(movement.timestamp).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{movement.productName}</p>
                          <p className="text-xs text-gray-500">{movement.productId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${typeColors[movement.type] || "bg-gray-100"}`}>
                            <TypeIcon className="w-3 h-3" />
                            {movement.type?.replace("_", " ")}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}{movement.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {movement.previousStock} → {movement.newStock}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {movement.notes || movement.reason || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
