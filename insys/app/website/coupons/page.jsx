"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../main-web/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Tag,
  Percent,
  Users,
  X,
  Check,
  AlertCircle,
  Copy,
  Info,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Ticket
} from "lucide-react";
import toast from "react-hot-toast";

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [token, setToken] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "flat",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: null,
    perUserLimit: 1,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Get session token
  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const coupons = useQuery(api.coupons.getAllCoupons) || [];
  const updateCoupon = useMutation(api.coupons.updateCoupon);
  const deleteCoupon = useMutation(api.coupons.deleteCoupon);

  // Check if logged into insys
  const [isInsysAuth, setIsInsysAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("insys_auth");
    if (auth) {
      const authData = JSON.parse(auth);
      setIsInsysAuth(authData.isLoggedIn);
    }
  }, []);

  // Show loading state
  if (coupons === undefined) {
    return (
      <div className="flex h-screen bg-slate-50/50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm">Loading coupons...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated to insys
  if (!isInsysAuth) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Required</h2>
            <p className="text-slate-500 mb-6 text-sm">Please log in to access the coupon management page.</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCoupon) {
        await updateCoupon({
          couponId: editingCoupon._id,
          ...formData,
          discountValue: Number(formData.discountValue),
          minOrderValue: Number(formData.minOrderValue),
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
        });
        toast.success("Coupon updated successfully!");
      } else {
        // Use API route to create coupon
        const response = await fetch("/api/coupons/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            code: formData.code.toUpperCase(),
            discountValue: Number(formData.discountValue),
            minOrderValue: Number(formData.minOrderValue),
            maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
            perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to create coupon");
        }
        toast.success("Coupon created successfully!");
      }
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || null,
      perUserLimit: coupon.perUserLimit || 1,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (couponId) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteCoupon({ couponId });
        toast.success("Coupon deleted!");
      } catch (err) {
        toast.error(`Failed to delete: ${err.message}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "flat",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: null,
      perUserLimit: 1,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingCoupon(null);
    setShowAddModal(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!", {
      style: {
        background: "#0f172a",
        color: "#fff",
        borderRadius: "10px",
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-blue-500 tracking-widest text-[10px] font-bold uppercase mb-1">Website Store</p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Coupons & Offers</h1>
              <p className="text-slate-500 text-sm mt-1">Create promotional codes, flat discounts, and purchase incentives.</p>
            </div>
            <div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              {
                label: "Total Coupons",
                value: coupons.length,
                icon: Tag,
                color: "text-slate-600",
                bgColor: "bg-slate-500/10"
              },
              {
                label: "Active Campaigns",
                value: coupons.filter(c => c.isActive && new Date(c.validUntil) > new Date()).length,
                icon: Check,
                color: "text-emerald-600",
                bgColor: "bg-emerald-500/10"
              },
              {
                label: "Total Usages",
                value: coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0),
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-500/10"
              },
              {
                label: "Expired Campaigns",
                value: coupons.filter(c => new Date(c.validUntil) < new Date()).length,
                icon: AlertCircle,
                color: "text-rose-600",
                bgColor: "bg-rose-500/10"
              }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold mt-4 tracking-tight text-slate-800">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Actions & Filters */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Table Grid */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            {filteredCoupons.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Coupons Available</h3>
                <p className="text-slate-500 text-xs mt-1">There are no coupons configured at this moment.</p>
              </div>
            ) : (
              <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4">Promotional Code</th>
                      <th className="px-6 py-4">Campaign Description</th>
                      <th className="px-6 py-4 text-center">Discount Value</th>
                      <th className="px-6 py-4 text-right">Min Spend</th>
                      <th className="px-6 py-4 text-center">Usage Count</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCoupons.map((coupon) => {
                      const isExpired = new Date(coupon.validUntil) < new Date();
                      const isActive = coupon.isActive && !isExpired;
                      return (
                        <tr key={coupon._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-2">
                              <code className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-mono font-extrabold text-slate-700 border border-slate-200">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => copyCode(coupon.code)}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                title="Copy promo code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-slate-600 text-xs font-medium max-w-[280px]">
                            {coupon.description}
                            <div className="text-[10px] text-slate-400 font-normal mt-1">
                              Valid until {new Date(coupon.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <span className="inline-flex items-center gap-1 text-slate-800 text-xs font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl">
                              {coupon.discountType === "percentage" ? (
                                <>
                                  <Percent className="w-3 h-3 text-blue-500" />
                                  <span>{coupon.discountValue}% Off</span>
                                </>
                              ) : (
                                <>
                                  <IndianRupee className="w-3 h-3 text-blue-500" />
                                  <span>₹{coupon.discountValue} Flat</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right font-extrabold text-slate-700 text-xs">
                            ₹{coupon.minOrderValue}
                          </td>
                          <td className="px-6 py-4.5 text-center text-xs font-medium text-slate-600">
                            <span className="font-bold text-slate-800">{coupon.usageCount || 0}</span>
                            <span className="text-slate-400"> / {coupon.usageLimit || "∞"}</span>
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold shadow-sm justify-center ${
                              isActive
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                              <span>{isActive ? "Active" : isExpired ? "Expired" : "Inactive"}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(coupon)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Edit Coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(coupon._id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-100 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Coupon Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.validUntil) < new Date();
                  const isActive = coupon.isActive && !isExpired;
                  return (
                    <div key={coupon._id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <code className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-[11px] font-mono font-extrabold text-slate-700 border border-slate-200">{coupon.code}</code>
                          <button onClick={() => copyCode(coupon.code)} className="p-1 text-slate-400 hover:text-slate-600"><Copy className="w-3 h-3" /></button>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                          isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{coupon.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-slate-700">
                            {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Flat`}
                          </span>
                          <span className="text-[10px] text-slate-400">Min ₹{coupon.minOrderValue}</span>
                        </div>
                        <span className="text-[10px] text-slate-500"><span className="font-bold text-slate-700">{coupon.usageCount || 0}</span> / {coupon.usageLimit || "∞"} used</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">Until {new Date(coupon.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(coupon)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-100 cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(coupon._id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-100 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Creation Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Configuration Box</span>
                  <h2 className="text-xl font-bold tracking-tight">
                    {editingCoupon ? "Modify Coupon Campaign" : "Add Discount Campaign"}
                  </h2>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* Form Group: Details */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <Ticket className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Basic Promotional Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Promo Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none"
                        placeholder="e.g. PATNA200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Campaign Description *</label>
                      <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                        placeholder="e.g. Get ₹200 off on sports shoes"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Group: Financial Rules */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <IndianRupee className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Discount Thresholds & Rules</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Discount Type</label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="flat">Flat Amount (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Discount Value *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                        placeholder="e.g. 200"
                      />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Min Order Total *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                        placeholder="e.g. 999"
                      />
                    </div>

                    {formData.discountType === "percentage" && (
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Cap Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.maxDiscount}
                          onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                          placeholder="e.g. 500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Group: Limits & Schedule */}
                <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                    <Calendar className="w-4.5 h-4.5 text-slate-500" />
                    <h3>Usage Constraints & Schedule</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Max Usages</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit || ""}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                        placeholder="Unlimited"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Usage Limit Per Client</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.perUserLimit || ""}
                        onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value ? Number(e.target.value) : 1 })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Campaign Start Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Campaign Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {editingCoupon ? "Save Coupon Changes" : "Activate Promotion Code"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
