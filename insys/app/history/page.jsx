"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Clock, Package, 
  Receipt, User, Phone, X, Printer, Search
} from "lucide-react";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedBill, setSelectedBill] = useState(null);
  const [logoBase64, setLogoBase64] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef(null);
  
  const movements = useQuery(api.offStore.getMovements, { limit: 100 });
  const bills = useQuery(api.offStore.getBills, { limit: 100 });
  
  const isLoadingStock = movements === undefined;
  const isLoadingBills = bills === undefined;

  // Filter data based on search
  const filteredMovements = movements?.filter(m => 
    m.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.productId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredBills = bills?.filter(b =>
    b.billNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customerPhone?.includes(searchQuery) ||
    b.items?.some(item => item.productName?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Load logo for printing
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to load logo:", error);
      }
    };
    loadLogo();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "stock_in":
        return <ArrowUpCircle className="text-emerald-500" size={20} />;
      case "stock_out":
        return <ArrowDownCircle className="text-red-500" size={20} />;
      default:
        return <RefreshCw className="text-blue-500" size={20} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "stock_in": return { label: "Stock Added", class: "badge-success" };
      case "stock_out": return { label: "Stock Removed", class: "badge-danger" };
      case "size_update": return { label: "Size Update", class: "badge-info" };
      case "adjustment": return { label: "Adjustment", class: "badge-warning" };
      case "sale": return { label: "Sale", class: "badge-danger" };
      case "return": return { label: "Return", class: "badge-success" };
      default: return { label: type, class: "badge-info" };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return mins <= 1 ? "Just now" : `${mins} mins ago`;
    }
    
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Reprint bill
  const handleReprint = () => {
    if (!selectedBill || !printRef.current) return;
    
    const printContent = printRef.current;
    const printWindow = window.open("", "", "width=350,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${selectedBill.billNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 76mm;
              padding: 2mm; 
              font-size: 11px; 
              color: #000;
              background: white;
              position: relative;
            }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 24px; font-weight: bold; color: rgba(200, 0, 0, 0.2); pointer-events: none; z-index: 1000; white-space: nowrap; }
            .content { position: relative; z-index: 1; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-sm { font-size: 10px; }
            .text-xs { font-size: 9px; }
            .text-gray-900, .text-gray-600, .text-gray-500 { color: #000; }
            .text-gray-400 { color: #666; }
            .text-white { color: #fff; }
            .text-emerald-600 { color: #000; }
            .bg-gray-900 { background: #000; }
            .bg-gray-50 { background: #f5f5f5; }
            .border-b { border-bottom: 1px solid #ccc; }
            .border-t { border-top: 1px solid #ccc; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-gray-900 { border-color: #000; }
            .border-gray-300 { border-color: #ccc; }
            .border-dashed { border-style: dashed; }
            .mb-6 { margin-bottom: 4mm; }
            .mb-4 { margin-bottom: 3mm; }
            .mb-3 { margin-bottom: 2mm; }
            .mb-2 { margin-bottom: 2mm; }
            .mt-8 { margin-top: 5mm; }
            .mt-6 { margin-top: 4mm; }
            .mt-4 { margin-top: 3mm; }
            .mt-2 { margin-top: 2mm; }
            .mt-1 { margin-top: 1mm; }
            .pb-6 { padding-bottom: 4mm; }
            .pb-4 { padding-bottom: 3mm; }
            .pt-6 { padding-top: 4mm; }
            .pt-4 { padding-top: 3mm; }
            .py-3 { padding-top: 2mm; padding-bottom: 2mm; }
            .px-8 { padding-left: 3mm; padding-right: 3mm; }
            .p-8 { padding: 3mm; }
            .p-4 { padding: 2mm; }
            .space-y-3 > * + * { margin-top: 2mm; }
            .space-y-1 > * + * { margin-top: 1mm; }
            .rounded-lg { border-radius: 2mm; }
            .w-full { width: 100%; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 1mm 0; }
            th { text-align: left; }
            img { height: 10mm; width: auto; max-width: 30mm; object-fit: contain; margin: 0 auto; display: block; }
            .-mx-8 { margin-left: -3mm; margin-right: -3mm; }
            .text-xl { font-size: 14px; }
            .h-10 { height: 10mm; }
            .w-auto { width: auto; }
            .max-w-\\[120px\\] { max-width: 30mm; }
            .object-contain { object-fit: contain; }
            @media print {
              body { width: 76mm; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">REPRINTED</div>
          <div class="content">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">ACTIVITY</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">History</h1>
            <p className="text-gray-500 text-sm mt-1">Track all inventory and billing activity</p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "stock" ? "Search by product name, ID, or reason..." : "Search by bill number, customer, or product..."}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setActiveTab("stock"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "stock"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Package size={18} />
              Stock History
            </button>
            <button
              onClick={() => { setActiveTab("billing"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "billing"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Receipt size={18} />
              Billing History
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {activeTab === "stock" ? (
              // Stock History Tab
              isLoadingStock ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading stock history...</p>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                    {searchQuery ? "No Results Found" : "No Stock History"}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ? `No stock movements match "${searchQuery}"` : "Stock movements will appear here when you make changes"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredMovements.map((movement, index) => {
                    const typeInfo = getTypeLabel(movement.type);
                    return (
                      <div key={movement._id || index} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-100 rounded-xl shrink-0">
                            {getIcon(movement.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-900">{movement.productName}</p>
                                <p className="text-sm text-gray-400">{movement.productId}</p>
                              </div>
                              <span className={`badge ${typeInfo.class} self-start`}>{typeInfo.label}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Stock:</span>
                                <span className="font-semibold text-gray-600">{movement.previousStock}</span>
                                <span className="text-gray-300">→</span>
                                <span className="font-semibold text-gray-900">{movement.newStock}</span>
                                <span className={`font-medium ${movement.type === "stock_in" ? "text-emerald-500" : "text-red-500"}`}>
                                  ({movement.type === "stock_in" ? "+" : "-"}{movement.quantity})
                                </span>
                              </div>
                              {movement.reason && <span className="text-sm text-gray-400">• {movement.reason}</span>}
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatDate(movement.createdAt)}</span>
                              <span>•</span>
                              <span>by {movement.createdBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Billing History Tab
              isLoadingBills ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading billing history...</p>
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Receipt className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                    {searchQuery ? "No Results Found" : "No Bills Yet"}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ? `No bills match "${searchQuery}"` : "Bills will appear here when you create them from billing"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredBills.map((bill, index) => (
                    <div 
                      key={bill._id || index} 
                      className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-emerald-100 rounded-xl shrink-0">
                          <Receipt className="text-emerald-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">Bill #{bill.billNumber}</p>
                              <p className="text-sm text-gray-400">{bill.items?.length || 0} items</p>
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{bill.total?.toFixed(2)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {bill.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                                {item.productImage ? (
                                  <img src={item.productImage} alt="" className="w-6 h-6 rounded object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-300" />
                                )}
                                <span className="text-xs text-gray-600 truncate max-w-[80px]">{item.productName}</span>
                                {item.size && <span className="text-[10px] text-gray-400">({item.size})</span>}
                                <span className="text-xs text-gray-400">×{item.quantity}</span>
                              </div>
                            ))}
                            {bill.items?.length > 3 && (
                              <span className="text-xs text-gray-400 self-center">+{bill.items.length - 3} more</span>
                            )}
                          </div>
                          {(bill.customerName || bill.customerPhone) && (
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                              {bill.customerName && (
                                <span className="flex items-center gap-1"><User size={14} />{bill.customerName}</span>
                              )}
                              {bill.customerPhone && (
                                <span className="flex items-center gap-1"><Phone size={14} />{bill.customerPhone}</span>
                              )}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                            <span>{formatDate(bill.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">{bill.paymentMethod || "Cash"}</span>
                            <span>•</span>
                            <span>by {bill.createdBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900">Bill #{selectedBill.billNumber}</h3>
              <button onClick={() => setSelectedBill(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Bill Content for Print */}
            <div ref={printRef} className="p-8 bg-white">
              {/* Header */}
              <div className="text-center pb-6 mb-6 border-b-2 border-gray-900">
                <div className="flex justify-center mb-3">
                  <img src={logoBase64 || "/logo.png"} alt="Walkdrobe" className="h-10 w-auto max-w-[120px] object-contain" />
                </div>
                <p className="text-sm text-gray-600 mt-2">Premium Footwear Store</p>
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <p>Boring Road, Patna, Bihar - 800001</p>
                  <p>Phone: +91 9122583392</p>
                  <p>www.walkdrobe.in</p>
                </div>
              </div>

              {/* Bill Info */}
              <div className="flex justify-between text-xs text-gray-600 mb-6 pb-4 border-b border-dashed border-gray-300">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Bill No:</p>
                  <p className="font-mono">{selectedBill.billNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 mb-1">Date & Time:</p>
                  <p>{formatFullDate(selectedBill.createdAt)}</p>
                  <p className="mt-1">{formatTime(selectedBill.createdAt)}</p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedBill.customerName && (
                <div className="mb-6 pb-4 border-b border-dashed border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBill.customerName}</p>
                  {selectedBill.customerPhone && (
                    <p className="text-xs text-gray-600 mt-1">Phone: {selectedBill.customerPhone}</p>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-3 font-semibold">Item</th>
                      <th className="text-center py-3 font-semibold w-12">Qty</th>
                      <th className="text-right py-3 font-semibold w-16">Rate</th>
                      <th className="text-right py-3 font-semibold w-20">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items?.map((item, idx) => (
                      <tr key={idx} className={idx < selectedBill.items.length - 1 ? "border-b border-gray-100" : ""}>
                        <td className="py-3 pr-2">
                          <p className="font-medium text-gray-900 truncate max-w-[140px]">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{item.size ? `Size: ${item.size} • ` : ""}{item.itemId}</p>
                        </td>
                        <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-700">₹{item.price}</td>
                        <td className="py-3 text-right font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-900 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Discount ({selectedBill.discount}%)</span>
                    <span className="text-emerald-600">-₹{selectedBill.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Incl. GST (5%)</span>
                  <span className="text-gray-500">₹{selectedBill.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold bg-gray-900 text-white -mx-8 px-8 py-4 mt-4">
                  <span>GRAND TOTAL</span>
                  <span>₹{selectedBill.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 mb-2">Payment Method: {(selectedBill.paymentMethod || "cash").toUpperCase()}</p>
                <p>Amount Received: ₹{selectedBill.total?.toFixed(2)}</p>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-dashed border-gray-300 text-center">
                <p className="text-sm font-medium text-gray-900 mb-2">Thank you for shopping with us!</p>
                <p className="text-xs text-gray-500 mt-3">Exchange within 7 days with original bill</p>
                <p className="text-xs text-gray-500 mt-1">No refund on sale items</p>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-[10px] text-gray-400">Follow us @walkdrobe.in</p>
                </div>
              </div>
            </div>

            {/* Reprint Button */}
            <div className="p-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedBill(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={handleReprint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium"
              >
                <Printer size={18} />
                Reprint Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
