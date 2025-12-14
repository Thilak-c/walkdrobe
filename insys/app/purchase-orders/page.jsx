"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { ClipboardList, Plus, Package, X, Save, Truck, Check, Clock, Search, Printer } from "lucide-react";
import toast from "react-hot-toast";

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPO, setSelectedPO] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");

  const purchaseOrders = useQuery(api.insys.getPurchaseOrders, { limit: 100 });
  const suppliers = useQuery(api.insys.getSuppliers, { activeOnly: true });
  const products = useQuery(api.inventory.getAllInventory, {});
  const createPO = useMutation(api.insys.createPurchaseOrder);
  const updatePOStatus = useMutation(api.insys.updatePurchaseOrderStatus);
  const receivePO = useMutation(api.insys.receivePurchaseOrder);

  const filteredProducts = products?.filter(p =>
    p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.itemId?.toLowerCase().includes(searchProduct.toLowerCase())
  ).slice(0, 10) || [];

  const addItem = (product) => {
    const existing = poItems.find(i => i.itemId === product.itemId);
    if (existing) {
      setPoItems(poItems.map(i => i.itemId === product.itemId ? { ...i, quantity: i.quantity + 1, totalCost: (i.quantity + 1) * i.unitCost } : i));
    } else {
      setPoItems([...poItems, {
        productId: product._id,
        productName: product.name,
        itemId: product.itemId,
        quantity: 1,
        unitCost: product.costPrice || 0,
        totalCost: product.costPrice || 0,
      }]);
    }
    setSearchProduct("");
    toast.success(`Added ${product.name}`);
  };

  const updateItem = (itemId, field, value) => {
    setPoItems(poItems.map(i => {
      if (i.itemId === itemId) {
        const updated = { ...i, [field]: value };
        if (field === "quantity" || field === "unitCost") {
          updated.totalCost = updated.quantity * updated.unitCost;
        }
        return updated;
      }
      return i;
    }));
  };

  const removeItem = (itemId) => setPoItems(poItems.filter(i => i.itemId !== itemId));

  const subtotal = poItems.reduce((sum, i) => sum + i.totalCost, 0);

  const handleCreatePO = async () => {
    if (!selectedSupplier) { toast.error("Select a supplier"); return; }
    if (poItems.length === 0) { toast.error("Add items to order"); return; }

    try {
      await createPO({
        supplierId: selectedSupplier._id,
        supplierName: selectedSupplier.name,
        items: poItems,
        subtotal,
        total: subtotal,
        expectedDelivery: expectedDelivery || undefined,
        notes: notes || undefined,
        createdBy: "admin",
      });
      toast.success("Purchase Order created!");
      setShowCreateModal(false);
      setSelectedSupplier(null);
      setPoItems([]);
      setExpectedDelivery("");
      setNotes("");
    } catch (error) {
      toast.error("Failed to create PO");
    }
  };

  const handleStatusUpdate = async (poId, status) => {
    try {
      await updatePOStatus({ poId, status });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleReceive = async (poId) => {
    if (!confirm("Mark as received? This will add stock to inventory.")) return;
    try {
      await receivePO({ poId, receivedBy: "admin" });
      toast.success("PO received! Stock updated.");
      setSelectedPO(null);
    } catch (error) {
      toast.error("Failed to receive PO");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-600";
      case "sent": return "bg-blue-100 text-blue-600";
      case "confirmed": return "bg-yellow-100 text-yellow-600";
      case "received": return "bg-green-100 text-green-600";
      case "cancelled": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pt-12 lg:pt-0">
            <div>
              <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">PROCUREMENT</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Purchase Orders</h1>
              <p className="text-gray-500 text-sm mt-1">{purchaseOrders?.length || 0} orders</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
              <Plus size={18} />Create PO
            </button>
          </div>

          {/* PO List */}
          {purchaseOrders === undefined ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
              <p className="text-gray-500 mb-4">Create your first purchase order</p>
              <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
                <Plus size={16} className="inline mr-2" />Create PO
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">PO Number</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {purchaseOrders.map((po) => (
                      <tr key={po._id} onClick={() => setSelectedPO(po)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{po.poNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{po.supplierName}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{po.items?.length || 0}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">₹{po.total?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(po.status)}`}>{po.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900">Create Purchase Order</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier <span className="text-red-500">*</span></label>
                <select value={selectedSupplier?._id || ""} onChange={(e) => setSelectedSupplier(suppliers?.find(s => s._id === e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm">
                  <option value="">Select supplier</option>
                  {suppliers?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              {/* Add Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Search products..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                {searchProduct && filteredProducts.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-xl p-2 max-h-[150px] overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button key={p._id} onClick={() => addItem(p)} className="w-full text-left p-2 hover:bg-white rounded-lg text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400 ml-2">₹{p.costPrice || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              {poItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
                  <div className="space-y-2">
                    {poItems.map((item) => (
                      <div key={item.itemId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.itemId}</p>
                        </div>
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(item.itemId, "quantity", parseInt(e.target.value) || 1)}
                          min="1" className="w-16 px-2 py-1 text-center border rounded-lg text-sm" />
                        <span className="text-gray-400">×</span>
                        <input type="number" value={item.unitCost} onChange={(e) => updateItem(item.itemId, "unitCost", parseFloat(e.target.value) || 0)}
                          min="0" className="w-20 px-2 py-1 text-center border rounded-lg text-sm" />
                        <span className="text-sm font-medium w-20 text-right">₹{item.totalCost.toFixed(0)}</span>
                        <button onClick={() => removeItem(item.itemId)} className="p-1 hover:bg-red-100 rounded text-red-500"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                  <input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm" />
                </div>
              </div>

              <button onClick={handleCreatePO} className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium">
                <Save size={18} />Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900">PO #{selectedPO.poNumber}</h3>
              <button onClick={() => setSelectedPO(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-semibold">{selectedPO.supplierName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedPO.status)}`}>{selectedPO.status}</span>
              </div>

              <div className="space-y-2 mb-6">
                {selectedPO.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × ₹{item.unitCost}</p>
                    </div>
                    <p className="font-semibold">₹{item.totalCost}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-900 text-white rounded-xl mb-6">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">₹{selectedPO.total?.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedPO.status === "draft" && (
                  <button onClick={() => handleStatusUpdate(selectedPO._id, "sent")} className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium">
                    Mark as Sent
                  </button>
                )}
                {selectedPO.status === "sent" && (
                  <button onClick={() => handleStatusUpdate(selectedPO._id, "confirmed")} className="w-full py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-medium">
                    Mark as Confirmed
                  </button>
                )}
                {(selectedPO.status === "confirmed" || selectedPO.status === "sent") && (
                  <button onClick={() => handleReceive(selectedPO._id)} className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium">
                    <Check size={18} />Mark as Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
