"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Search, Users, Phone, Mail, MapPin, ShoppingBag, IndianRupee, Calendar, X, Package } from "lucide-react";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customers = useQuery(api.insys.getCustomers, { searchQuery: searchQuery || undefined, limit: 100 });
  const purchaseHistory = useQuery(api.insys.getCustomerPurchaseHistory, 
    selectedCustomer?.phone ? { phone: selectedCustomer.phone } : "skip"
  );

  const isLoading = customers === undefined;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">DATABASE</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">{customers?.length || 0} customers in database</p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm" />
            </div>
          </div>

          {/* Customer List */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : customers?.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Yet</h3>
              <p className="text-gray-500">Customers will appear here after their first purchase</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Purchases</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers?.map((customer) => (
                      <tr key={customer._id} onClick={() => setSelectedCustomer(customer)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">{customer.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 flex items-center gap-1"><Phone size={14} />{customer.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                            <ShoppingBag size={14} />{customer.totalPurchases}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-semibold text-gray-900">₹{customer.totalSpent?.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm text-gray-500">{new Date(customer.lastVisit).toLocaleDateString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-600">{selectedCustomer.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-400">Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <ShoppingBag className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalPurchases}</p>
                  <p className="text-xs text-gray-500">Purchases</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <IndianRupee className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.totalSpent?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">{new Date(selectedCustomer.lastVisit).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">Last Visit</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <p className="text-sm flex items-center gap-2"><Phone size={16} className="text-gray-400" />{selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="text-sm flex items-center gap-2"><Mail size={16} className="text-gray-400" />{selectedCustomer.email}</p>}
                  {selectedCustomer.address && <p className="text-sm flex items-center gap-2"><MapPin size={16} className="text-gray-400" />{selectedCustomer.address}</p>}
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchase History</h4>
                {purchaseHistory?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No purchase history</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {purchaseHistory?.map((bill) => (
                      <div key={bill._id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">#{bill.billNumber}</p>
                            <p className="text-xs text-gray-400">{new Date(bill.createdAt).toLocaleString()}</p>
                          </div>
                          <p className="font-bold text-gray-900">₹{bill.total?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bill.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-white rounded px-2 py-1">
                              <Package size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-600">{item.productName}</span>
                            </div>
                          ))}
                          {bill.items?.length > 3 && <span className="text-xs text-gray-400">+{bill.items.length - 3} more</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
