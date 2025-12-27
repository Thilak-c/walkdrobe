"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import {
    Search, Plus, Minus, Trash2, Printer,
    User, Phone, ShoppingBag, X
} from "lucide-react";
import toast from "react-hot-toast";

export default function BillingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]); // Each item: { ...product, size, quantity }
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [billNumber, setBillNumber] = useState("");
    const [logoBase64, setLogoBase64] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null); // For size selection
    const printRef = useRef(null);

    const products = useQuery(api.offStore.getAllProducts, {});
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

    // Get total stock across all sizes
    const getTotalStock = (product) => {
        if (!product?.sizeStock) return product?.currentStock ?? 0;
        return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    };

    // Get cart quantity for product+size
    const getCartQty = (productId, size) => {
        const item = cart.find(i => i._id === productId && i.size === size);
        return item?.quantity ?? 0;
    };

    // Handle barcode scan
    const handleBarcodeScan = (barcode) => {
        if (!barcode) {
            toast.error("Scanned empty barcode");
            return;
        }

        // Normalize scanned input: trim and remove non-printable chars
        const normalized = String(barcode).trim().replace(/[^\x20-\x7E]/g, "");

        // Normalize keys by removing non-alphanumeric characters so hyphens/slashes are equivalent
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

        console.debug("Barcode scan details", { barcode, normalized, lcKey, productsCount: products?.length || 0, sampleCandidates: candidates.slice(0,10).map(c=>({pid:c.pid,pidKey:c.pidKey,exact:c.exact,contains:c.contains})) });

        if (product) {
            if (product.availableSizes?.length > 0) {
                setSelectedProduct(product);
                // Notify barcode input to clear visible field after a short delay
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("barcode-scan-success"));
                }
            } else {
                toast.error("Product has no sizes configured");
            }
            // Clear manual search field only when a product is found
            setSearchQuery("");
        } else {
            toast.error("Product not found");
        }
    };

    // Open size selector
    const openSizeSelector = (product) => {
        if (getTotalStock(product) <= 0) {
            toast.error("Product is out of stock");
            return;
        }
        setSelectedProduct(product);
    };

    // Add to cart with size
    const addToCartWithSize = (size) => {
        if (!selectedProduct || !size) return;
        
        const stock = getSizeStock(selectedProduct, size);
        
        setCart(prev => {
            const existing = prev.find(i => i._id === selectedProduct._id && i.size === size);
            const currentQty = existing?.quantity ?? 0;
            
            if (currentQty >= stock) {
                toast.error(`Only ${stock} available in size ${size}`);
                return prev;
            }
            
            if (existing) {
                toast.success(`Added ${selectedProduct.name} (Size ${size})`);
                return prev.map(item =>
                    item._id === selectedProduct._id && item.size === size
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            
            toast.success(`Added ${selectedProduct.name} (Size ${size})`);
            return [...prev, { ...selectedProduct, size, quantity: 1 }];
        });
        
        setSelectedProduct(null);
    };

    // Update quantity
    const updateQuantity = (productId, size, delta) => {
        const product = products?.find(p => p._id === productId);
        const stock = getSizeStock(product, size);
        
        setCart(prev => prev.map(item => {
            if (item._id === productId && item.size === size) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                if (newQty > stock) {
                    toast.error(`Only ${stock} available in size ${size}`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    // Remove from cart
    const removeFromCart = (productId, size) => {
        setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
    };

    // Calculate totals (GST inclusive)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const baseAmount = afterDiscount / 1.18;
    const tax = afterDiscount - baseAmount;
    const total = afterDiscount;

    // Print bill
    const handlePrint = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        
        // Validate stock
        for (const item of cart) {
            const product = products?.find(p => p._id === item._id);
            const stock = getSizeStock(product, item.size);
            if (stock < item.quantity) {
                toast.error(`${item.name} (Size ${item.size}): Only ${stock} in stock`);
                return;
            }
        }
        
        if (!customerInfo.name.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (!customerInfo.phone.trim()) {
            toast.error("Customer phone is required");
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
                        /* 4x6 label: width 4in, height 6in (portrait) */
                        @page { size: 4in 6in; margin: 0.125in; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Courier New', monospace;
                            width: calc(4in - 0.25in);
                            height: calc(6in - 0.25in);
                            padding: 0.125in;
                            font-size: 13px; /* larger font for label printing */
                            color: #000;
                            background: white;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: 700; }
                        .font-semibold { font-weight: 600; }
                        .text-sm { font-size: 12px; }
                        .text-xs { font-size: 11px; }
                        .text-gray-900, .text-gray-600, .text-gray-500 { color: #000; }
                        .text-gray-400 { color: #444; }
                        .bg-gray-900 { background: #000; }
                        .bg-gray-50 { background: #f5f5f5; }
                        .border-b-2 { border-bottom: 2px solid #000; }
                        .border-t-2 { border-top: 2px solid #000; }
                        .border-b { border-bottom: 1px solid #ccc; }
                        .border-dashed { border-style: dashed; }
                        .mb-6 { margin-bottom: 8px; }
                        .mb-4 { margin-bottom: 6px; }
                        .mb-2 { margin-bottom: 4px; }
                        .mt-8 { margin-top: 12px; }
                        .mt-6 { margin-top: 10px; }
                        .mt-4 { margin-top: 8px; }
                        .mt-1 { margin-top: 2px; }
                        .pb-6 { padding-bottom: 8px; }
                        .pb-4 { padding-bottom: 6px; }
                        .pt-4 { padding-top: 6px; }
                        .py-3 { padding-top: 6px; padding-bottom: 6px; }
                        .px-8 { padding-left: 8px; padding-right: 8px; }
                        .p-8 { padding: 8px; }
                        .p-4 { padding: 6px; }
                        .space-y-3 > * + * { margin-top: 6px; }
                        .space-y-1 > * + * { margin-top: 4px; }
                        .rounded-lg { border-radius: 4px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 4px 0; }
                        th { text-align: left; }
                        img { height: 28mm; width: auto; max-width: 70mm; object-fit: contain; margin: 0 auto; display: block; }
                        .text-xl { font-size: 18px; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        @media print {
                            html, body { width: 4in; height: 6in; }
                        }
                    </style>
                </head>
                <body>
                    <div style="transform: scale(1); transform-origin: top left;">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
                printWindow.document.close();
                // Give browser a moment to layout before printing
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 250);

        // Save bill
        try {
            await createBill({
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
        } catch (error) {
            console.error("Failed to save bill:", error);
        }

        // Update stock for each item
        for (const item of cart) {
            try {
                await removeSizeStock({
                    productId: item._id,
                    size: item.size,
                    quantity: item.quantity,
                    reason: `Sale - Bill #${billNumber}`,
                    updatedBy: "billing",
                });
            } catch (error) {
                console.error(`Failed to update stock for ${item.name}:`, error);
            }
        }

        toast.success("Bill printed & stock updated!");
        
        // Reset
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setPaymentMethod("cash");
        setDiscount(0);
        setShowPrintPreview(false);

        // New bill number
        const date = new Date();
        setBillNumber(`WD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 lg:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 pt-12 lg:pt-0">
                        <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">POINT OF SALE</p>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Billing</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Product Search */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Search */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Scan Barcode or Search Product
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <BarcodeInput onScan={handleBarcodeScan} />
                                    </div>
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name..."
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                                    {filteredProducts.slice(0, 20).map(product => {
                                        const totalStock = getTotalStock(product);
                                        const isOutOfStock = totalStock <= 0;
                                        return (
                                            <button
                                                key={product._id}
                                                onClick={() => !isOutOfStock && openSizeSelector(product)}
                                                disabled={isOutOfStock}
                                                className={`p-3 rounded-xl transition-colors text-left group relative ${
                                                    isOutOfStock ? "bg-gray-100 opacity-60 cursor-not-allowed" : "bg-gray-50 hover:bg-gray-100"
                                                }`}
                                            >
                                                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 overflow-hidden relative">
                                                    {product.mainImage ? (
                                                        <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="text-gray-300" size={24} />
                                                        </div>
                                                    )}
                                                    {isOutOfStock && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded">OUT OF STOCK</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                                <p className="text-xs text-gray-400">{product.itemId}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                                                    <span className={`text-[10px] font-medium ${totalStock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                                                        {totalStock} left
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Cart & Bill */}
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Details <span className="text-red-500">*</span></h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                            placeholder="Customer name"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="tel"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                            placeholder="Phone number"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h3>
                                <div className="flex gap-2">
                                    {["cash", "card", "upi"].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                                                paymentMethod === method
                                                    ? "bg-gray-900 text-white"
                                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Discount */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Discount</h3>
                                <div className="flex gap-2">
                                    {[{ value: 0, label: "None" }, { value: 5, label: "5%" }, { value: 10, label: "10%" }, { value: 25, label: "25%" }].map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDiscount(d.value)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                discount === d.value
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cart */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Cart</h3>
                                    <span className="text-xs text-gray-400">{cart.length} items</span>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400">
                                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {cart.map((item, idx) => (
                                            <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                                                <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                    {item.mainImage ? (
                                                        <img src={item.mainImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="text-gray-300" size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-400">Size: {item.size} • ₹{item.price}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => updateQuantity(item._id, item.size, -1)} className="p-1 hover:bg-gray-200 rounded">
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.size, 1)} className="p-1 hover:bg-gray-200 rounded">
                                                        <Plus size={14} />
                                                    </button>
                                                    <button onClick={() => removeFromCart(item._id, item.size)} className="p-1 hover:bg-red-100 text-red-500 rounded ml-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Totals */}
                                {cart.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-emerald-600">Discount ({discount}%)</span>
                                                <span className="text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Incl. GST (5%)</span>
                                            <span className="text-gray-400">₹{tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                            <span>Total</span>
                                            <span>₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Print Button */}
                            <button
                                onClick={handlePrint}
                                disabled={cart.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Printer size={20} />
                                Print Bill
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Size Selection Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Select Size</h3>
                            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {/* Product Info */}
                            <div className="flex gap-3 mb-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                    {selectedProduct.mainImage ? (
                                        <img src={selectedProduct.mainImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="text-gray-300" size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                                    <p className="text-sm text-gray-400">{selectedProduct.itemId}</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">₹{selectedProduct.price}</p>
                                </div>
                            </div>

                            {/* Size Grid */}
                            <div className="grid grid-cols-4 gap-2">
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
                                            className={`py-3 rounded-xl text-sm font-medium transition-all relative ${
                                                isDisabled
                                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                                    : "bg-gray-50 text-gray-900 hover:bg-gray-900 hover:text-white"
                                            }`}
                                        >
                                            {size}
                                            <span className={`block text-[10px] mt-0.5 ${isDisabled ? "text-gray-300" : "text-gray-400"}`}>
                                                {available > 0 ? `${available} left` : "0"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {showPrintPreview && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Bill Preview</h3>
                            <button onClick={() => setShowPrintPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Bill Content */}
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
                                </div>
                            </div>

                            {/* Bill Info */}
                            <div className="flex justify-between text-xs text-gray-600 mb-6 pb-4 border-b border-dashed border-gray-300">
                                <div>
                                    <p className="font-semibold text-gray-900 mb-1">Bill No:</p>
                                    <p className="font-mono">{billNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 mb-1">Date:</p>
                                    <p>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <p className="mt-1">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {/* Customer */}
                            {customerInfo.name && (
                                <div className="mb-6 pb-4 border-b border-dashed border-gray-300">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</p>
                                    <p className="text-sm font-medium text-gray-900">{customerInfo.name}</p>
                                    {customerInfo.phone && <p className="text-xs text-gray-600 mt-1">Phone: {customerInfo.phone}</p>}
                                </div>
                            )}

                            {/* Items */}
                            <div className="mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-900">
                                            <th className="text-left py-3 font-semibold">Item</th>
                                            <th className="text-center py-3 font-semibold w-12">Qty</th>
                                            <th className="text-right py-3 font-semibold w-20">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item, idx) => (
                                            <tr key={idx} className={idx < cart.length - 1 ? "border-b border-gray-100" : ""}>
                                                <td className="py-3 pr-2">
                                                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">Size: {item.size} • ₹{item.price}</p>
                                                </td>
                                                <td className="py-3 text-center text-gray-700">{item.quantity}</td>
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
                                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-600">Discount ({discount}%)</span>
                                        <span className="text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Incl. GST (5%)</span>
                                    <span className="text-gray-500">₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold bg-gray-900 text-white -mx-8 px-8 py-4 mt-4">
                                    <span>TOTAL</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                                <p className="font-semibold text-gray-900 mb-2">Payment: {paymentMethod.toUpperCase()}</p>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 text-center">
                                <p className="text-sm font-medium text-gray-900 mb-2">Thank you for shopping!</p>
                                <p className="text-xs text-gray-500 mt-3">Exchange within 7 days with bill</p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowPrintPreview(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={executePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800">
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
