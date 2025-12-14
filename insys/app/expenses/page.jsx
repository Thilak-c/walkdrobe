"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Wallet, Plus, X, Save, Trash2, Calendar, Filter } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["Rent", "Utilities", "Salary", "Supplies", "Marketing", "Maintenance", "Transport", "Other"];

export default function ExpensesPage() {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formData, setFormData] = useState({
    category: "", description: "", amount: "", paymentMethod: "cash", vendor: "", date: new Date().toISOString().split("T")[0],
    isRecurring: false, recurringFrequency: "", notes: ""
  });

  const expenses = useQuery(api.insys.getExpenses, {
    startDate: dateFilter.start || undefined,
    endDate: dateFilter.end || undefined,
    category: categoryFilter || undefined,
    limit: 100
  });
  const expenseStats = useQuery(api.insys.getExpenseStats, {
    startDate: dateFilter.start || undefined,
    endDate: dateFilter.end || undefined
  });
  const createExpense = useMutation(api.insys.createExpense);
  const deleteExpense = useMutation(api.insys.deleteExpense);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.amount) {
      toast.error("Fill required fields"); return;
    }
    try {
      await createExpense({ ...formData, amount: parseFloat(formData.amount), createdBy: "admin" });
      toast.success("Expense added!");
      setShowModal(false);
      setFormData({ category: "", description: "", amount: "", paymentMethod: "cash", vendor: "", date: new Date().toISOString().split("T")[0], isRecurring: false, recurringFrequency: "", notes: "" });
    } catch (error) { toast.error("Failed to add expense"); }
  };

  const handleDelete = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;
    try { await deleteExpense({ expenseId }); toast.success("Expense deleted"); }
    catch (error) { toast.error("Failed to delete"); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">FINANCE</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Expenses</h1>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
              <Plus size={18} />Add Expense
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{expenseStats?.total?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{expenseStats?.count || 0} entries</p>
            </div>
            {Object.entries(expenseStats?.byCategory || {}).slice(0, 2).map(([cat, amount]) => (
              <div key={cat} className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">{cat}</p>
                <p className="text-2xl font-bold text-gray-900">₹{amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
                <span className="text-gray-400">to</span>
                <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border-0 rounded-lg text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Expenses List */}
          {expenses === undefined ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Expenses</h3>
              <p className="text-gray-500 mb-4">Track your business expenses</p>
              <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
                <Plus size={16} className="inline mr-2" />Add Expense
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {expenses.map((expense) => (
                  <div key={expense._id} className="p-5 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{expense.category}</span>
                          <span className="text-xs text-gray-400">{expense.date}</span>
                          {expense.vendor && <span className="text-xs text-gray-400">• {expense.vendor}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-red-500">-₹{expense.amount?.toLocaleString()}</p>
                      <button onClick={() => handleDelete(expense._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Add Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Electricity bill" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00" min="0" step="0.01" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Optional" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm resize-none" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" id="recurring" checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="recurring" className="text-sm text-gray-700">Recurring expense</label>
                {formData.isRecurring && (
                  <select value={formData.recurringFrequency} onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                    className="ml-auto px-3 py-1 bg-white border rounded-lg text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium">
                <Save size={18} />Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
