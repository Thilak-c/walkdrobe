"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { Search, Truck, Plus, Phone, Mail, MapPin, X, Save, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "", paymentTerms: "", notes: ""
  });

  const suppliers = useQuery(api.insys.getSuppliers, { activeOnly: false });
  const createSupplier = useMutation(api.insys.createSupplier);
  const updateSupplier = useMutation(api.insys.updateSupplier);
  const deleteSupplier = useMutation(api.insys.deleteSupplier);

  const filteredSuppliers = suppliers?.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  ) || [];

  const resetForm = () => {
    setFormData({ name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "", paymentTerms: "", notes: "" });
    setEditingSupplier(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };
  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "", contactPerson: supplier.contactPerson || "", phone: supplier.phone || "",
      email: supplier.email || "", address: supplier.address || "", gstNumber: supplier.gstNumber || "",
      paymentTerms: supplier.paymentTerms || "", notes: supplier.notes || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { toast.error("Name and phone required"); return; }

    try {
      if (editingSupplier) {
        await updateSupplier({ supplierId: editingSupplier._id, updates: formData });
        toast.success("Supplier updated!");
      } else {
        await createSupplier(formData);
        toast.success("Supplier added!");
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save supplier");
    }
  };

  const handleDelete = async (supplierId) => {
    if (!confirm("Deactivate this supplier?")) return;
    try {
      await deleteSupplier({ supplierId });
      toast.success("Supplier deactivated");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">VENDORS</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Suppliers</h1>
              <p className="text-gray-500 text-sm mt-1">{suppliers?.length || 0} suppliers</p>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
              <Plus size={18} />Add Supplier
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
            </div>
          </div>

          {/* Suppliers List */}
          {suppliers === undefined ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Suppliers</h3>
              <p className="text-gray-500 mb-4">Add your first supplier to get started</p>
              <button onClick={openAddModal} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
                <Plus size={16} className="inline mr-2" />Add Supplier
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier._id} className={`bg-white rounded-2xl p-5 border ${supplier.isActive ? "border-gray-100" : "border-red-100 opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        {supplier.contactPerson && <p className="text-xs text-gray-400">{supplier.contactPerson}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(supplier)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(supplier._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-gray-400" />{supplier.phone}</p>
                    {supplier.email && <p className="flex items-center gap-2 text-gray-600"><Mail size={14} className="text-gray-400" />{supplier.email}</p>}
                    {supplier.address && <p className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-gray-400" />{supplier.address}</p>}
                  </div>
                  {supplier.gstNumber && <p className="mt-3 text-xs text-gray-400">GST: {supplier.gstNumber}</p>}
                  {!supplier.isActive && <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">Inactive</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input type="text" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30, COD" className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium">
                  <Save size={18} />{editingSupplier ? "Update" : "Add"} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
