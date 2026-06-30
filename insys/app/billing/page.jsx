"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import JsBarcode from "jsbarcode";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Printer,
    User,
    Phone,
    ShoppingBag,
    X,
    CreditCard,
    DollarSign,
    Percent,
    ArrowLeft,
    CheckCircle2,
    Layers,
    ChevronRight,
    QrCode,
    Store,
    Package
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function BillingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]); 
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [billNumber, setBillNumber] = useState("");
    const [logoBase64, setLogoBase64] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null); 
    const [posTab, setPosTab] = useState("catalog"); // "catalog" or "checkout"
    const printRef = useRef(null);
    const billBarcodeRef = useRef(null);

    useEffect(() => {
        if (showPrintPreview && billBarcodeRef.current && billNumber) {
            try {
                JsBarcode(billBarcodeRef.current, billNumber, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 14,
                    textMargin: 2,
                    margin: 0,
                    lineColor: "#000000",
                    height: 40,
                    width: 1.5
                });
            } catch (e) {
                console.error("Failed to render bill barcode", e);
            }
        }
    }, [showPrintPreview, billNumber]);

    const products = useQuery(api.offStore.getProductsForBilling, {});
    const removeSizeStock = useMutation(api.offStore.updateStock);
    const createBill = useMutation(api.offStore.createBill);

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

    // Generate bill number
    useEffect(() => {
        const date = new Date();
        const num = `WD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
        setBillNumber(num);
    }, []);

    // Filter products
    const filteredProducts = products?.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.itemId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Get stock for a specific size
    const getSizeStock = (product, size) => {
        if (!product?.sizeStock) return 0;
        return product.sizeStock[size] ?? 0;
    };

    // Load external script helper
    const loadScript = (src) => new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('window not available'));
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
    });

    // Generate PDF from element, trigger download and upload to server
    const generatePdfAndUpload = async (element, outBillNumber) => {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

            const html2canvas = window.html2canvas || window.html2canvas?.default || window.html2canvas;
            const jspdfGlobal = window.jspdf || window.jspdf?.default || window.jspdf;
            const jsPDF = (jspdfGlobal && (jspdfGlobal.jsPDF || jspdfGlobal.default || jspdfGlobal)) || window.jsPDF || window.jsPDF?.default;

            if (!html2canvas) throw new Error('html2canvas not available');
            if (!jsPDF) throw new Error('jsPDF not available');

            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({ unit: 'pt', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

            const blob = pdf.output('blob');

            try {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${outBillNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                toast.success('PDF invoice generated successfully');
            } catch (e) {
                console.warn('Download failed, opening in new tab', e);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }

            const reader = new FileReader();
            const pdfBase64 = await new Promise((res, rej) => {
                reader.onload = () => res(String(reader.result).split(',')[1]);
                reader.onerror = rej;
                reader.readAsDataURL(blob);
            });

            const saveRes = await fetch('/api/save-bill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billNumber: outBillNumber, pdfBase64 }),
            });
            if (!saveRes.ok) console.warn('Server save returned', await saveRes.text());

            return true;
        } catch (error) {
            console.error('PDF generation/upload failed:', error);
            toast.error('PDF generation failed: ' + (error?.message || error));
            return false;
        }
    };

    const getTotalStock = (product) => {
        if (!product?.sizeStock) return product?.currentStock ?? 0;
        return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    };

    const getCartQty = (productId, size) => {
        const item = cart.find(i => i._id === productId && i.size === size);
        return item?.quantity ?? 0;
    };

    const handleBarcodeScan = (barcode) => {
        if (!barcode) {
            toast.error("Scanned empty barcode");
            return;
        }

        const normalized = String(barcode).trim().replace(/[^\x20-\x7E]/g, "");
        const normalizeKey = (s) => String(s || "").trim().replace(/[^A-Za-z0-9]/g, "").toLowerCase();
        const lcKey = normalizeKey(normalized);

        const candidates = (products || []).map(p => {
            const pid = String(p.itemId || "");
            const pidKey = normalizeKey(pid);
            const exact = pidKey === lcKey && pidKey !== "";
            const contains = (pidKey && lcKey) ? (pidKey.includes(lcKey) || lcKey.includes(pidKey)) : false;
            return { product: p, pid, pidKey, exact, contains };
        }).filter(Boolean);

        const product = candidates.find(c => c.exact)?.product || candidates.find(c => c.contains)?.product;

        if (product) {
            if (product.availableSizes?.length > 0) {
                setSelectedProduct(product);
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("barcode-scan-success"));
                }
            } else {
                toast.error("Product has no sizes configured");
            }
            setSearchQuery("");
        } else {
            toast.error("Product not registered in offline store");
        }
    };

    const openSizeSelector = (product) => {
        if (getTotalStock(product) <= 0) {
            toast.error("Product is out of stock");
            return;
        }
        setSelectedProduct(product);
    };

    const addToCartWithSize = (size) => {
        if (!selectedProduct || !size) return;
        
        const stock = getSizeStock(selectedProduct, size);
        const existing = cart.find(i => i._id === selectedProduct._id && i.size === size);
        const currentQty = existing?.quantity ?? 0;
        
        if (currentQty >= stock) {
            toast.error(`Only ${stock} available in size ${size}`);
            return;
        }
        
        if (existing) {
            toast.success(`Updated ${selectedProduct.name} (Size ${size})`);
            setCart(prev => prev.map(item =>
                item._id === selectedProduct._id && item.size === size
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            toast.success(`Added ${selectedProduct.name} (Size ${size})`);
            setCart(prev => [...prev, { ...selectedProduct, size, quantity: 1 }]);
        }
        
        setSelectedProduct(null);
    };

    const updateQuantity = (productId, size, delta) => {
        const product = products?.find(p => p._id === productId);
        const stock = getSizeStock(product, size);
        const existing = cart.find(item => item._id === productId && item.size === size);
        
        if (!existing) return;
        
        const newQty = existing.quantity + delta;
        
        if (newQty <= 0) {
            setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
            return;
        }
        
        if (newQty > stock) {
            toast.error(`Only ${stock} available in size ${size}`);
            return;
        }
        
        setCart(prev => prev.map(item =>
            item._id === productId && item.size === size
                ? { ...item, quantity: newQty }
                : item
        ));
    };

    const removeFromCart = (productId, size) => {
        setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
        toast.success("Removed from invoice cart");
    };

    // Calculate totals (GST inclusive)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const baseAmount = afterDiscount / 1.18;
    const tax = afterDiscount - baseAmount;
    const total = afterDiscount;

    const handlePrint = () => {
        if (cart.length === 0) {
            toast.error("Invoice cart is empty");
            return;
        }
        
        for (const item of cart) {
            const product = products?.find(p => p._id === item._id);
            const stock = getSizeStock(product, item.size);
            if (stock < item.quantity) {
                toast.error(`${item.name} (Size ${item.size}): Only ${stock} left`);
                return;
            }
        }
        
        if (!customerInfo.name.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (!customerInfo.phone.trim()) {
            toast.error("Customer phone number is required");
            return;
        }
        setShowPrintPreview(true);
    };

    const executePrint = async () => {
        const printContent = printRef.current;
        const printWindow = window.open("", "", "width=600,height=900");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill - ${billNumber}</title>
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
                        
                        /* Layout & Structure */
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .justify-center { justify-content: center; }
                        .flex-col { flex-direction: column; }
                        .items-center { align-items: center; }
                        
                        /* Alignment & Transforms */
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .text-left { text-align: left; }
                        .uppercase { text-transform: uppercase; }
                        .tracking-wider { letter-spacing: 0.05em; }
                        .tracking-widest { letter-spacing: 0.1em; }
                        
                        /* Typography Weights & Classes */
                        .font-bold { font-weight: 800; }
                        .font-semibold { font-weight: 700; }
                        .font-extrabold { font-weight: 900; }
                        .font-mono { font-family: SFMono-Regular, Consolas, Menlo, monospace; font-weight: 600; }
                        
                        /* Font Size Override for thermal prints */
                        .text-\\[9px\\] { font-size: 12px; font-weight: 600; }
                        .text-\\[10px\\] { font-size: 12px; font-weight: 700; }
                        .text-\\[11px\\] { font-size: 13px; font-weight: 600; }
                        .text-xs { font-size: 13px; font-weight: 600; }
                        .text-sm { font-size: 14px; font-weight: 600; }
                        .text-base { font-size: 16px; font-weight: 800; }
                        .text-xl { font-size: 20px; font-weight: 900; }
                        
                        /* Color Contrast Enforcements */
                        body, p, span, td, th, div {
                            color: #000000 !important;
                        }
                        .text-slate-900, .text-slate-800, .text-slate-700, 
                        .text-slate-600, .text-slate-500, .text-slate-400,
                        .text-emerald-600, .text-gray-900, .text-gray-600, .text-gray-500 {
                            color: #000000 !important;
                        }
                        
                        /* Margins & Spacings */
                        .mt-0\\.5 { margin-top: 2px; }
                        .mt-1 { margin-top: 4px; }
                        .mt-2 { margin-top: 6px; }
                        .mt-3\\.5 { margin-top: 10px; }
                        .mt-3 { margin-top: 8px; }
                        .mt-4 { margin-top: 8px; }
                        .mt-5 { margin-top: 12px; }
                        .mt-6 { margin-top: 14px; }
                        .mb-0\\.5 { margin-bottom: 2px; }
                        .mb-1\\.5 { margin-bottom: 6px; }
                        .mb-1 { margin-bottom: 4px; }
                        .mb-2\\.5 { margin-bottom: 8px; }
                        .mb-4 { margin-bottom: 8px; }
                        .mb-5 { margin-bottom: 12px; }
                        .pb-3\\.5 { padding-bottom: 8px; }
                        .pb-4 { padding-bottom: 8px; }
                        .pb-5 { padding-bottom: 12px; }
                        .pt-3\\.5 { padding-top: 8px; }
                        .pt-4 { padding-top: 8px; }
                        .pt-5 { padding-top: 12px; }
                        .py-2\\.5 { padding-top: 6px; padding-bottom: 6px; }
                        .py-2 { padding-top: 4px; padding-bottom: 4px; }
                        .py-3\\.5 { padding-top: 10px; padding-bottom: 10px; }
                        .p-3 { padding: 8px; }
                        .p-6 { padding: 0; } /* Remove modal container styling on print */
                        .px-6 { padding-left: 0; padding-right: 0; }
                        .p-8 { padding: 8px; }
                        .p-4 { padding: 6px; }
                        
                        /* Space utilities */
                        .space-y-0\\.5 > * + * { margin-top: 2px; }
                        .space-y-1 > * + * { margin-top: 4px; }
                        .space-y-2 > * + * { margin-top: 6px; }
                        .space-y-3 > * + * { margin-top: 8px; }
                        
                        /* Borders & Rules */
                        .border-b-2 { border-bottom: 1.5px solid #000000; }
                        .border-t-2 { border-top: 1.5px solid #000000; }
                        .border-b { border-bottom: 1px solid #000000; }
                        .border-t { border-top: 1px solid #000000; }
                        .border-dashed { border-style: dashed; }
                        .border-slate-100, .border-slate-200, .border-slate-900, 
                        .border-gray-300, .border-gray-900 {
                            border-color: #000000 !important;
                        }
                        
                        /* Tables styling */
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th {
                            border-bottom: 1.5px solid #000000;
                            padding: 6px 0;
                            text-align: left;
                        }
                        td {
                            padding: 6px 0;
                            vertical-align: top;
                        }
                        tr.border-b {
                            border-bottom: 1px dashed #000000;
                        }
                        
                        /* Logo image */
                        img {
                            height: 36px;
                            width: auto;
                            max-width: 120px;
                            object-fit: contain;
                            margin: 0 auto;
                            display: block;
                            filter: grayscale(100%) contrast(150%);
                        }
                        
                        /* Net Total Highlight */
                        .bg-slate-900, .bg-gray-900 {
                            background: #000000 !important;
                        }
                        .bg-slate-900 *, .bg-gray-900 * {
                            color: #ffffff !important;
                        }
                        .text-white {
                            color: #ffffff !important;
                        }
                        .-mx-6, .-mx-8 {
                            margin-left: -4mm;
                            margin-right: -4mm;
                        }
                        .px-6, .px-8 {
                            padding-left: 4mm;
                            padding-right: 4mm;
                        }
                        
                        /* Details highlight box */
                        .bg-slate-50, .bg-gray-50 {
                            background: #ffffff !important;
                            border: 1px solid #000000 !important;
                            border-radius: 4px;
                        }
                        
                        svg {
                            display: block;
                            margin: 0 auto;
                            max-width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div>
                        ${printContent.innerHTML}
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

        try {
            const res = await createBill({
                billNumber,
                items: cart.map(item => ({
                    productId: item._id,
                    productName: item.name,
                    productImage: item.mainImage || undefined,
                    itemId: item.itemId,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity,
                })),
                customerName: customerInfo.name || undefined,
                customerPhone: customerInfo.phone || undefined,
                subtotal,
                discount,
                discountAmount,
                tax,
                total,
                paymentMethod,
                createdBy: "billing",
            });

            if (!res || !res.success) {
                console.error("createBill unexpected response:", res);
                toast.error("Failed to save bill catalog logs.");
            } else {
                const outNumber = res?.billNumber || billNumber;
                generatePdfAndUpload(printContent, outNumber).catch(e => console.error(e));
                toast.success("Bill printed & catalog stock updated!");
            }
        } catch (error) {
            console.error("Failed to save bill:", error);
            toast.error("Failed to save bill: " + (error?.message || error));
        }
        
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setPaymentMethod("cash");
        setDiscount(0);
        setShowPrintPreview(false);

        const date = new Date();
        setBillNumber(`WD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`);
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />

            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto pt-10 lg:pt-0">
                    
                    {/* Header */}
                    <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                            <Store size={13} className="text-emerald-600 animate-pulse" />
                            <p className="text-emerald-600 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest">Offline Store Operations</p>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Point of Sale</h1>
                        <p className="text-slate-500 text-[11px] sm:text-xs lg:text-sm mt-0.5">Register storefront invoices, print thermal sheets, and adjust stock quantities.</p>
                    </div>

                    {/* Mobile View Tab Switcher */}
                    <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl mb-4 gap-1 border border-slate-200/50">
                        <button
                            type="button"
                            onClick={() => setPosTab("catalog")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                posTab === "catalog"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            Catalog Shelf
                        </button>
                        <button
                            type="button"
                            onClick={() => setPosTab("checkout")}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                                posTab === "checkout"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <span>Checkout & Invoice</span>
                            {cart.length > 0 && (
                                <span className="bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono font-extrabold animate-pulse">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Left Column: POS Search */}
                        <div className={`lg:col-span-2 space-y-4 sm:space-y-6 ${posTab === "catalog" ? "block" : "hidden lg:block"}`}>
                            
                            {/* Search Controls */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-[11px] sm:text-xs mb-0.5">
                                    <QrCode size={14} className="text-slate-500 animate-pulse" />
                                    <span className="uppercase tracking-wider">Product Registration Gateway</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Barcode scan box */}
                                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all flex items-center justify-between">
                                        <BarcodeInput onScan={handleBarcodeScan} />
                                    </div>
                                    
                                    {/* Text Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Manual keyboard name search..."
                                            className="w-full pl-10 pr-3 py-2.5 sm:py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-xl sm:rounded-2xl text-xs font-bold focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Catalog Shelf Selection */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2 sm:pb-3">
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight font-poppins">
                                            {searchQuery ? `Search Results for "${searchQuery}"` : "Active Catalog Shelf"}
                                        </h3>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400">Click a product card to allocate stock details</p>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] bg-slate-50 border rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-0.5 sm:py-1 text-slate-500 font-bold">
                                        Showing {filteredProducts.slice(0, 16).length} items
                                    </span>
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-xs font-bold">No registered shoes match query criteria</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1">
                                        {filteredProducts.slice(0, 16).map(product => {
                                            const totalStock = getTotalStock(product);
                                            const isOutOfStock = totalStock <= 0;
                                            return (
                                                <button
                                                    key={product._id}
                                                    onClick={() => !isOutOfStock && openSizeSelector(product)}
                                                    disabled={isOutOfStock}
                                                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-left border flex flex-col justify-between h-42 sm:h-48 transition-all duration-300 relative group cursor-pointer ${
                                                        isOutOfStock 
                                                            ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                                                            : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-md hover:scale-[1.01]"
                                                    }`}
                                                >
                                                    <div className="w-full h-20 sm:h-24 bg-slate-100 rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 overflow-hidden relative flex items-center justify-center border border-slate-150">
                                                        {product.mainImage ? (
                                                            <img src={product.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        ) : (
                                                            <ShoppingBag className="text-slate-300" size={16} />
                                                        )}
                                                        {isOutOfStock && (
                                                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center">
                                                                <span className="text-[8px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-md">DEPLETED</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 truncate block leading-tight">{product.name}</p>
                                                        <span className="text-[8px] font-bold text-slate-400 font-mono block mt-0.5">{product.itemId}</span>
                                                        
                                                        <div className="flex items-center justify-between mt-1 sm:mt-2 border-t border-slate-50 pt-1 sm:pt-1.5">
                                                            <span className="text-xs font-extrabold text-slate-900">₹{product.price}</span>
                                                            <span className={`text-[8px] font-bold ${totalStock <= 5 ? "text-rose-500" : "text-slate-400"}`}>
                                                                {totalStock} left
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Checkout Sidebar */}
                        <div className={`space-y-4 sm:space-y-6 ${posTab === "checkout" ? "block" : "hidden lg:block"}`}>
                            
                            {/* Customer Specs */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-3.5 sm:space-y-4">
                                <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-800 tracking-wider uppercase block border-b border-slate-50 pb-2">Customer Specifications *</h3>
                                <div className="space-y-2.5 sm:space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                        <input
                                            type="text"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                            placeholder="Customer full name..."
                                            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-lg sm:rounded-xl text-xs font-bold focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                        <input
                                            type="tel"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                            placeholder="Mobile phone number..."
                                            className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-800 rounded-lg sm:rounded-xl text-xs font-bold focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terms of Payment */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                                <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-800 tracking-wider uppercase block border-b border-slate-50 pb-2">Payment Terms</h3>
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    {["cash", "card", "upi"].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-extrabold transition-all border capitalize cursor-pointer ${
                                                paymentMethod === method
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Discount Allocations */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                                <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-800 tracking-wider uppercase block border-b border-slate-50 pb-2">In-Store Discounts</h3>
                                <div className="flex gap-1.5 sm:gap-2">
                                    {[{ value: 10, label: "10% VIP" }].map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDiscount(d.value)}
                                            className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                discount === d.value
                                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const input = prompt("Enter discount percentage (0-100):", String(discount));
                                            if (input === null) return;
                                            const n = Number(input);
                                            if (Number.isFinite(n) && n >= 0 && n <= 100) {
                                                setDiscount(n);
                                            } else {
                                                toast.error("Invalid discount percentage");
                                            }
                                        }}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                            discount !== 10
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                        }`}
                                    >
                                        Custom: {discount}%
                                    </button>
                                </div>
                            </div>

                            {/* Invoice Cart Section */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-800 tracking-wider uppercase block">Cart Allocation</h3>
                                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">{cart.length} items allocated</span>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="py-8 sm:py-10 text-center">
                                        <ShoppingBag size={20} className="mx-auto mb-2 text-slate-300 opacity-70" />
                                        <p className="text-slate-400 text-xs font-bold">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[190px] sm:max-h-[220px] overflow-y-auto pr-1">
                                        {cart.map((item, idx) => (
                                            <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg overflow-hidden shrink-0 border shadow-xs flex items-center justify-center">
                                                    {item.mainImage ? (
                                                        <img src={item.mainImage} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="text-slate-300" size={14} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-0.5">Size {item.size} • ₹{item.price}</p>
                                                </div>
                                                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.size, -1)}
                                                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 cursor-pointer"
                                                    >
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="w-4 text-center text-[11px] sm:text-xs font-extrabold text-slate-800">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.size, 1)}
                                                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 cursor-pointer"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item._id, item.size)}
                                                        className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-md ml-0.5 cursor-pointer"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Calculations */}
                                {cart.length > 0 && (
                                    <div className="pt-3 sm:pt-4 border-t border-slate-100 space-y-2 text-xs font-semibold">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(0)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-emerald-600 font-bold">
                                                <span>VIP Discount ({discount}%)</span>
                                                <span>-₹{discountAmount.toFixed(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-400 text-[10px]">
                                            <span>Inclusive of standard GST (18%)</span>
                                            <span>₹{tax.toFixed(0)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-base sm:text-lg font-extrabold pt-2 sm:pt-3 border-t border-slate-100 text-slate-900">
                                            <span>Total Price</span>
                                            <span>₹{total.toFixed(0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Print Invoice Action Button */}
                            <button
                                onClick={handlePrint}
                                disabled={cart.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Printer size={14} />
                                <span>Generate & Print Bill</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Size Selector Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden z-10 flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight font-poppins">Select Shoe Size</h3>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="p-5">
                                {/* Product Summary */}
                                <div className="flex gap-3 mb-5 border-b border-slate-50 pb-4">
                                    <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden shrink-0 border shadow-sm flex items-center justify-center">
                                        {selectedProduct.mainImage ? (
                                            <img src={selectedProduct.mainImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingBag className="text-slate-300" size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-800 text-xs tracking-tight">{selectedProduct.name}</p>
                                        <span className="text-[9px] font-bold text-slate-400 font-mono block mt-0.5">{selectedProduct.itemId}</span>
                                        <p className="text-xs font-extrabold text-slate-900 mt-1.5">₹{selectedProduct.price}</p>
                                    </div>
                                </div>

                                {/* Sizes Grid Selection */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    {(selectedProduct.availableSizes || []).map(size => {
                                        const stock = getSizeStock(selectedProduct, size);
                                        const inCart = getCartQty(selectedProduct._id, size);
                                        const available = stock - inCart;
                                        const isDisabled = available <= 0;
                                        
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => !isDisabled && addToCartWithSize(size)}
                                                disabled={isDisabled}
                                                className={`py-3 rounded-2xl text-xs font-extrabold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                                                    isDisabled
                                                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-850 hover:bg-slate-900 hover:text-white"
                                                }`}
                                            >
                                                <span>UK {size}</span>
                                                <span className={`text-[8px] font-bold mt-0.5 block ${isDisabled ? "text-rose-300" : "text-slate-400 hover:text-white/80"}`}>
                                                    {available > 0 ? `${available} left` : "Out"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Preview Modal */}
            <AnimatePresence>
                {showPrintPreview && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPrintPreview(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <h3 className="font-extrabold text-slate-800 text-sm font-poppins">Invoice Thermal Sheet Preview</h3>
                                <button
                                    onClick={() => setShowPrintPreview(false)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Printable invoice layout */}
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                                <div ref={printRef} className="p-6 bg-white border rounded-2xl shadow-xs">
                                    {/* Header */}
                                    <div className="text-center pb-5 mb-5 border-b-2 border-slate-900">
                                        <div className="flex justify-center mb-2.5">
                                            <img src={logoBase64 || "/logo.png"} alt="Walkdrobe" className="h-9 w-auto max-w-[120px] object-contain" />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Premium Shoes Store</p>
                                        <div className="mt-3 text-[10px] text-slate-500 space-y-0.5 font-mono">
                                            <p>Boring Road, Patna, Bihar - 800001</p>
                                            <p>Phone: +91 9122583392</p>
                                        </div>
                                    </div>

                                    {/* Invoice metadata */}
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-5 pb-3.5 border-b border-dashed border-slate-200 font-mono">
                                        <div>
                                            <p className="font-bold text-slate-800 mb-0.5">Bill Number:</p>
                                            <p>{billNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800 mb-0.5">Invoice Date:</p>
                                            <p>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            <p className="mt-0.5">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    {/* Customer profile */}
                                    {customerInfo.name && (
                                        <div className="mb-5 pb-3.5 border-b border-dashed border-slate-200 text-[10px]">
                                            <p className="font-bold text-slate-400 tracking-wider uppercase mb-1.5">Customer details</p>
                                            <p className="font-bold text-slate-800">{customerInfo.name}</p>
                                            {customerInfo.phone && <p className="text-slate-500 font-mono mt-0.5">Phone: {customerInfo.phone}</p>}
                                        </div>
                                    )}

                                    {/* Items Table */}
                                    <div className="mb-5">
                                        <table className="w-full text-xs font-mono">
                                            <thead>
                                                <tr className="border-b-2 border-slate-900 text-slate-700">
                                                    <th className="text-left py-2 font-bold">Shoe Description</th>
                                                    <th className="text-center py-2 font-bold w-12">Qty</th>
                                                    <th className="text-right py-2 font-bold w-20">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cart.map((item, idx) => (
                                                    <tr key={idx} className={idx < cart.length - 1 ? "border-b border-slate-100" : ""}>
                                                        <td className="py-2.5 pr-2">
                                                            <p className="font-bold text-slate-800 truncate max-w-[150px]">{item.name}</p>
                                                            <p className="text-[9px] text-slate-400 mt-0.5">Size {item.size} • ₹{item.price}</p>
                                                        </td>
                                                        <td className="py-2.5 text-center text-slate-700">{item.quantity}</td>
                                                        <td className="py-2.5 text-right font-bold text-slate-800">₹{(item.price * item.quantity).toFixed(0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Calculations Breakdown */}
                                    <div className="border-t-2 border-slate-900 pt-3.5 space-y-2 text-[11px] font-mono">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(0)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-emerald-600 font-bold">
                                                <span>Discount ({discount}%)</span>
                                                <span>-₹{discountAmount.toFixed(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-500">
                                            <span>Incl. GST (18%)</span>
                                            <span>₹{tax.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-extrabold bg-slate-900 text-white -mx-6 px-6 py-3.5 mt-3.5">
                                            <span>NET TOTAL</span>
                                            <span>₹{total.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 font-mono">
                                        <p className="font-bold text-slate-800 mb-1">Payment Method: {paymentMethod.toUpperCase()}</p>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-dashed border-slate-200 text-center font-mono">
                                        <p className="text-[11px] font-bold text-slate-800">Thank you for visiting Walkdrobe!</p>
                                        <p className="text-[9px] text-slate-400 mt-2">Exchange permitted within 7 days against print invoice.</p>
                                        <div className="mt-4 flex justify-center">
                                            <svg ref={billBarcodeRef} className="max-w-[180px] h-auto" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-50 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setShowPrintPreview(false)}
                                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executePrint}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                                >
                                    <Printer size={14} />
                                    <span>Execute Thermal Print</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
