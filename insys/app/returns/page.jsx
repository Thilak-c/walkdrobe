"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import {
  Search, RotateCcw, ArrowLeftRight, Package, X, Printer, User, Phone, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [billNumber, setBillNumber] = useState("");
  const [foundBill, setFoundBill] = useState(null);
  const [returnType, setReturnType] = useState("return");
  const [selectedItems, setSelectedItems] = useState([]);
  const [exchangeItems, setExchangeItems] = useState([]);
  const [reason, setReason] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState(null);
  const [logoBase64, setLogoBase64] = useState("");
  const printRef = useRef(null);

  const getBill = useQuery(api.inventory.getBillByNumber, billNumber ? { billNumber } : "skip");
  const products = useQuery(api.inventory.getAllInventory, {});
  const returns = useQuery(api.insys.getReturns, { limit: 50 });
  const createReturn = useMutation(api.insys.createReturn);

  useEffect(() => {
    if (getBill) setFoundBill(getBill);
  }, [getBill]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {}
    };
    loadLogo();
  }, []);

  const handleBillSearch = () => {
    if (!billNumber.trim()) { toast.error("Enter bill number"); return; }
    setFoundBill(null);
    setSelectedItems([]);
  };

  const toggleItemSelection = (item, idx) => {
    const key = `${item.itemId}-${item.size}-${idx}`;
    if (selectedItems.find(i => i.key === key)) {
      setSelectedItems(selectedItems.filter(i => i.key !== key));
    } else {
      setSelectedItems([...selectedItems, { ...item, key, returnQty: item.quantity }]);
    }
  };

  const updateReturnQty = (key, qty) => {
    setSelectedItems(selectedItems.map(i => i.key === key ? { ...i, returnQty: Math.min(qty, i.quantity) } : i));
  };

  const addExchangeItem = (size) => {
    if (!selectedExchangeProduct || !size) return;
    const stock = selectedExchangeProduct.sizeStock?.[size] || 0;
    if (stock <= 0) { toast.error("Size out of stock"); return; }
    
    const existing = exchangeItems.find(i => i.itemId === selectedExchangeProduct.itemId && i.size === size);
    if (existing) {
      if (existing.quantity >= stock) { toast.error("Max stock reached"); return; }
      setExchangeItems(exchangeItems.map(i => 
        i.itemId === selectedExchangeProduct.itemId && i.size === size ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setExchangeItems([...exchangeItems, {
        productId: selectedExchangeProduct._id,
        productName: selectedExchangeProduct.name,
        productImage: selectedExchangeProduct.mainImage,
        itemId: selectedExchangeProduct.itemId,
        size,
        price: selectedExchangeProduct.price,
        quantity: 1,
      }]);
    }
    setSelectedExchangeProduct(null);
    toast.success(`Added ${selectedExchangeProduct.name} (Size ${size})`);
  };

  const removeExchangeItem = (itemId, size) => {
    setExchangeItems(exchangeItems.filter(i => !(i.itemId === itemId && i.size === size)));
  };

  const returnTotal = selectedItems.reduce((sum, i) => sum + (i.price * i.returnQty), 0);
  const exchangeTotal = exchangeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const difference = exchangeTotal - returnTotal;

  const handleProcessReturn = async () => {
    if (selectedItems.length === 0) { toast.error("Select items to return"); return; }
    if (!reason.trim()) { toast.error("Enter return reason"); return; }

    try {
      const result = await createReturn({
        originalBillNumber: foundBill.billNumber,
        type: returnType,
        items: selectedItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          productImage: i.productImage,
          itemId: i.itemId,
          size: i.size,
          price: i.price,
          quantity: i.returnQty,
        })),
        exchangeItems: returnType === "exchange" ? exchangeItems : undefined,
        customerName: foundBill.customerName,
        customerPhone: foundBill.customerPhone,
        reason,
        refundAmount: returnType === "return" ? returnTotal : Math.max(0, -difference),
        additionalPayment: returnType === "exchange" && difference > 0 ? difference : undefined,
        createdBy: "admin",
      });

      toast.success(`${returnType === "return" ? "Return" : "Exchange"} processed! #${result.returnNumber}`);
      setBillNumber("");
      setFoundBill(null);
      setSelectedItems([]);
      setExchangeItems([]);
      setReason("");
    } catch (error) {
      toast.error("Failed to process");
    }
  };

  const filteredProducts = products?.filter(p =>
    p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.itemId?.toLowerCase().includes(searchProduct.toLowerCase())
  ).slice(0, 12) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">TRANSACTIONS</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Returns & Exchanges</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab("new")} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "new" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
              <RotateCcw size={16} className="inline mr-2" />New Return
            </button>
            <button onClick={() => setActiveTab("history")} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === "history" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
              History
            </button>
          </div>

          {activeTab === "new" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Find Bill */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Find Original Bill</h3>
                  <div className="flex gap-2">
                    <input type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value.toUpperCase())} placeholder="Enter bill number (e.g., WD202412...)" className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-mono" />
                    <button onClick={handleBillSearch} className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800">
                      <Search size={18} />
                    </button>
                  </div>
                </div>

                {foundBill && (
                  <>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">Bill #{foundBill.billNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(foundBill.createdAt).toLocaleString()}</p>
                        </div>
                        <span className="text-lg font-bold">₹{foundBill.total?.toFixed(2)}</span>
                      </div>
                      {foundBill.customerName && (
                        <div className="flex gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1"><User size={14} />{foundBill.customerName}</span>
                          {foundBill.customerPhone && <span className="flex items-center gap-1"><Phone size={14} />{foundBill.customerPhone}</span>}
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-700 mb-2">Select items to return:</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {foundBill.items?.map((item, idx) => {
                          const key = `${item.itemId}-${item.size}-${idx}`;
                          const isSelected = selectedItems.find(i => i.key === key);
                          return (
                            <div key={key} onClick={() => toggleItemSelection(item, idx)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-red-50 border-2 border-red-200" : "bg-gray-50 hover:bg-gray-100"}`}>
                              <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                {item.productImage ? <img src={item.productImage} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-gray-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                <p className="text-xs text-gray-400">Size: {item.size} • Qty: {item.quantity} • ₹{item.price}</p>
                              </div>
                              {isSelected && (
                                <input type="number" value={isSelected.returnQty} onChange={(e) => { e.stopPropagation(); updateReturnQty(key, parseInt(e.target.value) || 1); }} onClick={(e) => e.stopPropagation()} min="1" max={item.quantity} className="w-16 px-2 py-1 text-center border rounded-lg text-sm" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Return Type */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Return Type</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setReturnType("return")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${returnType === "return" ? "bg-red-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                          <RotateCcw size={16} />Refund
                        </button>
                        <button onClick={() => setReturnType("exchange")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${returnType === "exchange" ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                          <ArrowLeftRight size={16} />Exchange
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Exchange Items & Summary */}
              <div className="space-y-4">
                {returnType === "exchange" && foundBill && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Exchange For</h3>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} placeholder="Search product..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm" />
                    </div>
                    {searchProduct && (
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto mb-3">
                        {filteredProducts.map(p => (
                          <button key={p._id} onClick={() => setSelectedExchangeProduct(p)} className="p-2 bg-gray-50 rounded-lg text-left hover:bg-gray-100">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">₹{p.price}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {exchangeItems.length > 0 && (
                      <div className="space-y-2">
                        {exchangeItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs font-medium">{item.productName}</p>
                              <p className="text-xs text-gray-400">Size: {item.size} • Qty: {item.quantity} • ₹{item.price}</p>
                            </div>
                            <button onClick={() => removeExchangeItem(item.itemId, item.size)} className="p-1 hover:bg-red-100 rounded text-red-500"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                {foundBill && selectedItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Reason for Return <span className="text-red-500">*</span></h3>
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm">
                      <option value="">Select reason</option>
                      <option value="Wrong size">Wrong size</option>
                      <option value="Defective product">Defective product</option>
                      <option value="Not as described">Not as described</option>
                      <option value="Changed mind">Changed mind</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {/* Summary */}
                {foundBill && selectedItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Return Value</span><span className="text-red-500">-₹{returnTotal.toFixed(2)}</span></div>
                      {returnType === "exchange" && <div className="flex justify-between"><span className="text-gray-500">Exchange Value</span><span className="text-blue-500">+₹{exchangeTotal.toFixed(2)}</span></div>}
                      <div className="flex justify-between pt-2 border-t font-bold text-lg">
                        <span>{difference > 0 ? "Customer Pays" : difference < 0 ? "Refund Amount" : "Even Exchange"}</span>
                        <span className={difference > 0 ? "text-blue-600" : difference < 0 ? "text-red-600" : "text-gray-600"}>₹{Math.abs(difference).toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={handleProcessReturn} className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium">
                      <RotateCcw size={18} />Process {returnType === "return" ? "Return" : "Exchange"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {returns?.length === 0 ? (
                <div className="p-16 text-center">
                  <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Returns Yet</h3>
                  <p className="text-gray-500">Returns and exchanges will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {returns?.map((ret) => (
                    <div key={ret._id} className="p-5 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">#{ret.returnNumber}</p>
                          <p className="text-xs text-gray-400">Original: {ret.originalBillNumber}</p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${ret.type === "return" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>{ret.type === "return" ? "Refund" : "Exchange"}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{ret.refundAmount?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{new Date(ret.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Size Selection Modal for Exchange */}
      {selectedExchangeProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Select Size</h3>
              <button onClick={() => setSelectedExchangeProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium mb-3">{selectedExchangeProduct.name} - ₹{selectedExchangeProduct.price}</p>
              <div className="grid grid-cols-4 gap-2">
                {selectedExchangeProduct.availableSizes?.map(size => {
                  const stock = selectedExchangeProduct.sizeStock?.[size] || 0;
                  return (
                    <button key={size} onClick={() => addExchangeItem(size)} disabled={stock <= 0} className={`p-3 rounded-xl text-sm font-medium transition-all ${stock > 0 ? "bg-gray-100 hover:bg-gray-900 hover:text-white" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`}>
                      {size}<span className="block text-[10px] opacity-60">{stock} left</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
