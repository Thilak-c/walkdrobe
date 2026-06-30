"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import JsBarcode from "jsbarcode";
import {
  Search,
  Receipt,
  User,
  Phone,
  Eye,
  X,
  Printer,
  Calendar,
  CreditCard,
  SlidersHorizontal,
  IndianRupee,
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function BillsHistoryPage() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "week", "month"
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef(null);
  const [logoBase64, setLogoBase64] = useState("");

  // Load logo
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

  // Fetch all bills from the self-hosted Convex backend
  const bills = useQuery(api.offStore.getBills, { limit: 200 });
  const isLoading = bills === undefined;

  // Filter bills in-memory for instant responsive searching
  const filteredBills = (bills || []).filter((bill) => {
    // 1. Search Query Match (Customer Name, Customer Phone, Bill Number, SKU, or Product Name)
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      const nameMatch = bill.customerName?.toLowerCase().includes(s);
      const phoneMatch = bill.customerPhone?.toLowerCase().includes(s);
      const numMatch = bill.billNumber?.toLowerCase().includes(s);
      const itemMatch = bill.items?.some(
        (item) =>
          item.productName?.toLowerCase().includes(s) ||
          item.itemId?.toLowerCase().includes(s)
      );

      if (!nameMatch && !phoneMatch && !numMatch && !itemMatch) {
        return false;
      }
    }

    // 2. Payment Method Filter
    if (paymentFilter !== "all" && bill.paymentMethod !== paymentFilter) {
      return false;
    }

    // 3. Date Range Filter
    if (dateFilter !== "all" && bill.createdAt) {
      const billDate = new Date(bill.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - billDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === "today") {
        const todayStr = now.toISOString().split("T")[0];
        const billStr = billDate.toISOString().split("T")[0];
        if (todayStr !== billStr) return false;
      } else if (dateFilter === "week" && diffDays > 7) {
        return false;
      } else if (dateFilter === "month" && diffDays > 30) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const handlePrint = (bill) => {
    if (!bill) return;

    // Create printer preview window
    const printWindow = window.open("", "", "width=600,height=900");
    if (!printWindow) {
      toast.error("Please allow popups to print invoices");
      return;
    }

    // Calculate invoice financials
    const discountVal = bill.discount || 0;
    const subtotalVal = bill.subtotal || 0;
    const discountAmountVal = bill.discountAmount || 0;
    const taxVal = bill.tax || 0;
    const totalVal = bill.total || 0;

    let barcodeSvgHtml = "";
    try {
      const svg = printWindow.document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svg, bill.billNumber, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        textMargin: 2,
        margin: 0,
        lineColor: "#000000",
        height: 40,
        width: 1.5
      });
      barcodeSvgHtml = svg.outerHTML;
    } catch (e) {
      console.error("Failed to generate bill barcode", e);
    }

    const itemsRows = bill.items.map((item, idx) => `
      <tr style="border-bottom: 1px dashed #000000;">
        <td style="padding: 6px 0; max-width: 140px; font-size: 13px; vertical-align: top; font-weight: 600;">
          ${idx + 1}. ${item.productName}
          <div style="font-size: 11px; color: #000000; margin-top: 2px; font-weight: 500;">Size: ${item.size} • Rate: ₹${item.price}</div>
        </td>
        <td style="padding: 6px 0; text-align: center; vertical-align: top; font-size: 13px; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right; vertical-align: top; font-size: 13px; font-weight: 500;">₹${item.price}</td>
        <td style="padding: 6px 0; text-align: right; vertical-align: top; font-weight: bold; font-size: 13px;">₹${item.price * item.quantity}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              width: 80mm;
              margin: 0 auto;
              padding: 6mm 4mm;
              font-size: 14px;
              line-height: 1.45;
              color: #000000;
              background: #ffffff;
              -webkit-font-smoothing: antialiased;
              font-weight: 500;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 800; }
            .mb-2 { margin-bottom: 4px; }
            .mb-4 { margin-bottom: 8px; }
            .mb-6 { margin-bottom: 12px; }
            .mt-4 { margin-top: 8px; }
            .mt-6 { margin-top: 12px; }
            .pb-4 { padding-bottom: 8px; }
            .pt-4 { padding-top: 8px; }
            .border-b-2 { border-bottom: 1.5px solid #000000; }
            .border-t-2 { border-top: 1.5px solid #000000; }
            .border-dashed { border-style: dashed; }
            table { width: 100%; border-collapse: collapse; margin: 6px 0; }
            th, td { font-size: 13px; color: #000000 !important; }
            th { border-bottom: 1.5px solid #000000; padding: 6px 0; font-weight: bold; }
            td { padding: 6px 0; vertical-align: top; }
            svg { display: block; margin: 0 auto; max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="text-center pb-4 border-b-2 mb-4" style="border-color: #000000 !important;">
            ${logoBase64 ? `
              <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <img src="${logoBase64}" alt="Walkdrobe" style="height: 36px; width: auto; max-width: 120px; object-fit: contain; display: block; filter: grayscale(100%) contrast(150%);" />
              </div>
            ` : `
              <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">WALKDROBE</h2>
            `}
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">Premium Shoes Store</p>
            <p style="font-size: 10px; margin-top: 4px;">Boring Road, Patna, Bihar - 800001</p>
            <p style="font-size: 10px;">Phone: +91 9122583392</p>
          </div>

          <div class="mb-4" style="font-size: 12px; line-height: 1.4; border-bottom: 1px dashed #000000; padding-bottom: 8px;">
            <div><strong>Bill No:</strong> ${bill.billNumber}</div>
            <div><strong>Date:</strong> ${formatDate(bill.createdAt)}</div>
            <div><strong>Operator:</strong> ${bill.createdBy || "System"}</div>
            <div><strong>Customer:</strong> ${bill.customerName || "Walk-in Guest"}</div>
            ${bill.customerPhone ? `<div><strong>Phone:</strong> ${bill.customerPhone}</div>` : ""}
          </div>

          <table class="border-t-2 border-b-2 border-dashed" style="border-color: #000000 !important;">
            <thead>
              <tr style="border-bottom: 1.5px solid #000000;">
                <th style="padding: 6px 0; text-align: left; font-weight: bold;">Item Description</th>
                <th style="padding: 6px 0; text-align: center; width: 35px; font-weight: bold;">Qty</th>
                <th style="padding: 6px 0; text-align: right; width: 60px; font-weight: bold;">Rate</th>
                <th style="padding: 6px 0; text-align: right; width: 70px; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="font-size: 12px; margin-top: 8px; line-height: 1.5; border-bottom: 1.5px dashed #000000; padding-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Subtotal:</span>
              <span>₹${subtotalVal.toFixed(0)}</span>
            </div>
            ${discountVal > 0 ? `
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #000000; margin-bottom: 2px;">
              <span>Discount (${discountVal}%):</span>
              <span>-₹${discountAmountVal.toFixed(0)}</span>
            </div>` : ""}
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <span>GST Inclusive (18%):</span>
              <span>₹${taxVal.toFixed(0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; margin-top: 6px; border-top: 1.5px solid #000000; padding-top: 6px; background: #000000; color: #ffffff; padding: 6px 8px; margin-left: -4mm; margin-right: -4mm;">
              <span>NET TOTAL:</span>
              <span>₹${totalVal.toFixed(0)}</span>
            </div>
          </div>

          <div class="text-center mt-6" style="font-size: 11px;">
            <p style="font-weight: bold; margin-bottom: 4px;">Payment Method: ${(bill.paymentMethod || "CASH").toUpperCase()}</p>
            <p style="margin-top: 8px; font-weight: bold; font-size: 12px;">Thank you for visiting Walkdrobe!</p>
            <p style="margin-top: 2px; font-size: 10px;">Exchange permitted within 7 days against print invoice.</p>
            ${barcodeSvgHtml ? `
              <div style="margin-top: 12px; display: flex; justify-content: center;">
                ${barcodeSvgHtml}
              </div>
            ` : ""}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={13} className="text-emerald-600 animate-pulse" />
                <p className="text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest">Offline Store Operations</p>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Invoices & Bills</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                Browse historical sales invoices, verify transactions, search customer phone logs, and retrieve receipts.
              </p>
            </div>
          </div>

          {/* Search and Filters Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm mb-6 flex flex-col lg:flex-row items-center gap-3 sm:gap-4 justify-between animate-fadeIn">
            {/* Search Box */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bills by customer name, phone, invoice ID, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:w-auto lg:items-center lg:gap-3">
              {/* Payment Filter */}
              <div className="relative w-full lg:w-44">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="all">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative w-full lg:w-44">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary banner */}
          <div className="bg-slate-900/5 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between shadow-xs mb-6 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-slate-600 font-poppins">
                📊 Found <span className="font-extrabold text-slate-900">{filteredBills.length} billing receipts</span> matching filter queries.
              </p>
            </div>
            <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/40">
              Receipt History Logs
            </div>
          </div>

          {/* Invoices List Display */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-fadeIn">
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Retrieving database logs...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Billing Records Found</h3>
                <p className="text-slate-500 text-xs mt-1">Try adjusting search query filters or register a sale in Point of Sale.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="px-6 py-4">Bill Number</th>
                        <th className="px-6 py-4">Issued On</th>
                        <th className="px-6 py-4">Customer Details</th>
                        <th className="px-6 py-4 text-center">Items Count</th>
                        <th className="px-6 py-4 text-right">Invoice Total</th>
                        <th className="px-6 py-4 text-center">Payment</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-poppins">
                      {filteredBills.map((bill) => {
                        const itemsCount = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                        return (
                          <tr key={bill._id} className="hover:bg-slate-50/50 transition-colors group">
                            {/* Bill Number */}
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs font-black text-slate-800 tracking-tight">
                                #{bill.billNumber}
                              </span>
                            </td>

                            {/* Issued On */}
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-400" />
                                <span>{formatDate(bill.createdAt)}</span>
                              </div>
                            </td>

                            {/* Customer Details */}
                            <td className="px-6 py-4">
                              <div>
                                <span className="text-xs font-extrabold text-slate-800">
                                  {bill.customerName || "Walk-in Guest"}
                                </span>
                                {bill.customerPhone && (
                                  <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 flex items-center gap-1">
                                    <Phone size={10} className="shrink-0" />
                                    {bill.customerPhone}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Items Count */}
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-black text-slate-800 bg-slate-100 border px-2.5 py-0.5 rounded-lg">
                                {itemsCount} Pair{itemsCount !== 1 ? "s" : ""}
                              </span>
                            </td>

                            {/* Invoice Total */}
                            <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                              ₹{bill.total?.toLocaleString("en-IN")}
                            </td>

                            {/* Payment */}
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold shadow-xs capitalize ${
                                bill.paymentMethod === "cash"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : bill.paymentMethod === "upi"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-blue-50 border-blue-200 text-blue-700"
                              }`}>
                                <CreditCard size={10} />
                                <span>{bill.paymentMethod || "Cash"}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedBill(bill)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
                                  title="View Receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePrint(bill)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 border border-blue-100 rounded-xl transition-all shadow-xs cursor-pointer"
                                  title="Reprint Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transaction Ledger List (Sleek Phone UI/UX) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredBills.map((bill) => {
                    const itemsCount = bill.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                    
                    // Curate gorgeous payment method icons & colors for sleek fintech styling
                    const paymentMeta = {
                      cash: { icon: IndianRupee, bg: "bg-amber-50 text-amber-600 border-amber-100", label: "Cash" },
                      upi: { icon: Receipt, bg: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "UPI" },
                      card: { icon: CreditCard, bg: "bg-blue-50 text-blue-600 border-blue-100", label: "Card" }
                    };
                    const meta = paymentMeta[bill.paymentMethod?.toLowerCase()] || paymentMeta.cash;
                    const PayIcon = meta.icon;

                    const getTimeOnly = (isoString) => {
                      if (!isoString) return "";
                      try {
                        return new Date(isoString).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
                      } catch { return ""; }
                    };

                    return (
                      <div key={bill._id} className="p-3.5 space-y-2.5 bg-white hover:bg-slate-50/50 transition-colors">
                        {/* Header Row: Bill Number & Amount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${meta.bg}`}>
                              <PayIcon size={12} />
                            </div>
                            <span className="font-mono text-xs font-black text-slate-800 tracking-tight">
                              #{bill.billNumber}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-900 font-poppins">
                            ₹{bill.total?.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Customer & Timestamp Row */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 truncate block max-w-[150px]">
                              {bill.customerName || "Walk-in Guest"}
                            </span>
                            {bill.customerPhone && (
                              <span className="text-[9px] text-slate-400 font-mono font-bold block mt-0.5">
                                {bill.customerPhone}
                              </span>
                            )}
                          </div>
                          <div className="text-right text-slate-400 font-bold shrink-0">
                            <div>{formatDate(bill.createdAt).split(",")[0]}</div>
                            <div className="text-[9px] font-mono mt-0.5">{getTimeOnly(bill.createdAt)}</div>
                          </div>
                        </div>

                        {/* Info tags and Micro Actions */}
                        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-50">
                          {/* Info Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg text-slate-500 font-extrabold">
                              {itemsCount} Pair{itemsCount !== 1 ? "s" : ""}
                            </span>
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-extrabold capitalize ${meta.bg}`}>
                              {meta.label}
                            </span>
                          </div>

                          {/* Mini Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200/60 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye size={10} /> Details
                            </button>
                            <button
                              onClick={() => handlePrint(bill)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg transition-all cursor-pointer"
                              title="Reprint Receipt"
                            >
                              <Printer size={10} />
                            </button>
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

      {/* Invoice Details Sliding Modal / Drawer */}
      <AnimatePresence>
        {selectedBill && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBill(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
                <div>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Receipt Viewer</span>
                  <h2 className="text-lg font-bold tracking-tight">Invoice #{selectedBill.billNumber}</h2>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bill Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-poppins">
                  <div>
                    <span className="text-slate-400 block font-bold">Issued At</span>
                    <span className="text-slate-800 font-extrabold mt-0.5 block">{formatDate(selectedBill.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Payment Method</span>
                    <span className="text-slate-800 font-extrabold mt-0.5 block capitalize">{selectedBill.paymentMethod}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/50 pt-2">
                    <span className="text-slate-400 block font-bold">Customer Name</span>
                    <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedBill.customerName || "Walk-in Guest"}</span>
                  </div>
                  {selectedBill.customerPhone && (
                    <div className="col-span-2 border-t border-slate-200/50 pt-2">
                      <span className="text-slate-400 block font-bold">Phone Number</span>
                      <span className="text-slate-800 font-mono font-extrabold mt-0.5 block">{selectedBill.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3 font-poppins">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Itemized Breakdown</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {selectedBill.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-800 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                            SKU: {item.itemId} • Size: UK {item.size}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-slate-800">₹{item.price * item.quantity}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ₹{item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 text-xs font-poppins font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{selectedBill.subtotal?.toFixed(0)}</span>
                  </div>
                  {(selectedBill.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>VIP Discount ({selectedBill.discount}%)</span>
                      <span>-₹{selectedBill.discountAmount?.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Inclusive GST (18%)</span>
                    <span>₹{selectedBill.tax?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-3 border-t border-slate-200/50 text-slate-900">
                    <span>Total Bill</span>
                    <span>₹{selectedBill.total?.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-5 border-t border-slate-100 shrink-0 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => handlePrint(selectedBill)}
                  className="flex-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} /> Reprint Thermal Receipt
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
