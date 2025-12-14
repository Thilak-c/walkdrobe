"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../main-web/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import {
    Search, Plus, Minus, Trash2, Printer, Receipt,
    User, Phone, ShoppingBag, X, Check
} from "lucide-react";
import toast from "react-hot-toast";

export default function BillingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [billNumber, setBillNumber] = useState("");
    const [logoBase64, setLogoBase64] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0); // 0, 5, or 10 percent
    const [selectedProduct, setSelectedProduct] = useState(null); // For size selection modal
    const [selectedSize, setSelectedSize] = useState("");
    const printRef = useRef(null);

    const products = useQuery(api.inventory.getAllInventory, {});
    const removeStock = useMutation(api.inventory.removeStock);
    const createBill = useMutation(api.inventory.createBill);

    // Load logo as base64 for printing
    useEffect(() => {
        const loadLogo = async () => {
            try {
                const response = await fetch("/logo.png");
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoBase64(reader.result);
                };
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

    // Filter products based on search
    const filteredProducts = products?.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.itemId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Get current stock for a product (total or by size)
    const getProductStock = (productId, size = null) => {
        const product = products?.find(p => p._id === productId);
        if (!product) return 0;
        
        // If size is specified and product has size stock
        if (size && product.sizeStock) {
            return product.sizeStock[size] ?? 0;
        }
        
        return product?.currentStock ?? product?.totalAvailable ?? 0;
    };

    // Get total stock across all sizes
    const getTotalStock = (product) => {
        if (product.sizeStock) {
            return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
        }
        return product?.currentStock ?? product?.totalAvailable ?? 0;
    };

    // Get quantity already in cart for a product+size combo
    const getCartQuantity = (productId, size = null) => {
        if (size) {
            const item = cart.find(item => item._id === productId && item.selectedSize === size);
            return item?.quantity ?? 0;
        }
        // Total quantity of this product in cart (all sizes)
        return cart.filter(item => item._id === productId).reduce((sum, item) => sum + item.quantity, 0);
    };

    // Handle barcode scan
    const handleBarcodeScan = (barcode) => {
        const product = products?.find(p => p.itemId === barcode);
        if (product) {
            handleProductClick(product);
        } else {
            toast.error("Product not found");
        }
        setSearchQuery("");
    };

    // Handle product click - show size selector if product has sizes
    const handleProductClick = (product) => {
        const hasSizes = product.availableSizes?.length > 0 || product.sizeStock;
        
        if (hasSizes) {
            setSelectedProduct(product);
            setSelectedSize("");
        } else {
            // No sizes, add directly
            addToCartDirect(product, null);
        }
    };

    // Add product to cart (called after size selection or for products without sizes)
    const addToCartDirect = (product, size) => {
        const stock = size ? getProductStock(product._id, size) : getTotalStock(product);
        
        if (stock <= 0) {
            toast.error(`${product.name}${size ? ` (Size ${size})` : ""} is out of stock`);
            return;
        }

        setCart(prev => {
            // For sized products, match by product ID + size
            const existing = size 
                ? prev.find(item => item._id === product._id && item.selectedSize === size)
                : prev.find(item => item._id === product._id && !item.selectedSize);
            
            const currentQty = existing?.quantity ?? 0;
            
            if (currentQty >= stock) {
                toast.error(`Only ${stock} available${size ? ` for size ${size}` : ""}`);
                return prev;
            }
            
            if (existing) {
                toast.success(`Added ${product.name}${size ? ` (${size})` : ""}`);
                return prev.map(item =>
                    (item._id === product._id && item.selectedSize === size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            toast.success(`Added ${product.name}${size ? ` (${size})` : ""}`);
            return [...prev, { ...product, selectedSize: size, quantity: 1 }];
        });
    };

    // Confirm size selection and add to cart
    const confirmSizeSelection = () => {
        if (!selectedProduct) return;
        
        if (!selectedSize) {
            toast.error("Please select a size");
            return;
        }
        
        addToCartDirect(selectedProduct, selectedSize);
        setSelectedProduct(null);
        setSelectedSize("");
    };

    // Update quantity
    const updateQuantity = (cartItemId, delta) => {
        setCart(prev => prev.map(item => {
            // Use a unique identifier combining product ID and size
            const itemKey = `${item._id}-${item.selectedSize || "nosize"}`;
            const targetKey = cartItemId;
            
            if (itemKey === targetKey) {
                const stock = item.selectedSize 
                    ? getProductStock(item._id, item.selectedSize) 
                    : getTotalStock(products?.find(p => p._id === item._id));
                
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                if (newQty > stock) {
                    toast.error(`Only ${stock} available${item.selectedSize ? ` for size ${item.selectedSize}` : ""}`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    // Remove from cart (by cart item key)
    const removeFromCart = (cartItemKey) => {
        setCart(prev => prev.filter(item => {
            const itemKey = `${item._id}-${item.selectedSize || "nosize"}`;
            return itemKey !== cartItemKey;
        }));
    };

    // Calculate totals (GST is inclusive in price)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    // GST is included in price: Price = Base + 18% GST, so Base = Price / 1.18
    const baseAmount = afterDiscount / 1.18;
    const tax = afterDiscount - baseAmount; // GST amount included in price
    const total = afterDiscount; // Total is same as afterDiscount since GST is inclusive

    // Print bill
    const handlePrint = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        
        // Validate stock before printing
        for (const item of cart) {
            const stock = getProductStock(item._id);
            if (stock < item.quantity) {
                toast.error(`${item.name}: Only ${stock} in stock, but ${item.quantity} in cart`);
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
        const printWindow = window.open("", "", "width=400,height=600");
        printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${billNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 10px; 
              max-width: 320px; 
              margin: 0 auto;
              font-size: 12px;
              color: #1f2937;
            }
            .p-6 { padding: 15px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-2xl { font-size: 18px; }
            .text-xl { font-size: 16px; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .text-gray-900 { color: #111827; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-white { color: #fff; }
            .bg-gray-900 { background: #111827; }
            .bg-gray-50 { background: #f9fafb; }
            .border-b-2 { border-bottom: 2px solid; }
            .border-t-2 { border-top: 2px solid; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-gray-900 { border-color: #111827; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-100 { border-color: #f3f4f6; }
            .border-dashed { border-style: dashed; }
            .mb-6 { margin-bottom: 20px; }
            .mb-4 { margin-bottom: 15px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mt-8 { margin-top: 30px; }
            .mt-6 { margin-top: 24px; }
            .mt-4 { margin-top: 15px; }
            .mt-3 { margin-top: 12px; }
            .mt-2 { margin-top: 8px; }
            .mt-1 { margin-top: 4px; }
            .pb-6 { padding-bottom: 20px; }
            .pb-4 { padding-bottom: 15px; }
            .pb-3 { padding-bottom: 10px; }
            .pt-6 { padding-top: 20px; }
            .pt-4 { padding-top: 15px; }
            .pt-3 { padding-top: 10px; }
            .py-4 { padding-top: 15px; padding-bottom: 15px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .px-8 { padding-left: 20px; padding-right: 20px; }
            .px-6 { padding-left: 15px; padding-right: 15px; }
            .p-8 { padding: 25px; }
            .p-4 { padding: 15px; }
            .p-3 { padding: 10px; }
            .space-y-3 > * + * { margin-top: 10px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .rounded-xl { border-radius: 10px; }
            .rounded-lg { border-radius: 8px; }
            .tracking-wider { letter-spacing: 0.05em; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .w-full { width: 100%; }
            .w-14 { width: 50px; }
            .w-12 { width: 40px; }
            .w-16 { width: 50px; }
            .w-20 { width: 60px; }
            .h-14 { height: 50px; }
            .h-12 { height: 40px; }
            .flex { display: flex; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 4px; }
            th { text-align: left; }
            img, .print-logo { max-width: 100%; height: auto; display: block; }
            .print-logo { height: 48px; width: auto; margin: 0 auto; }
            .h-12 { height: 48px; }
            .w-auto { width: auto; }
            .-mx-8 { margin-left: -25px; margin-right: -25px; }
            @media print {
              body { padding: 0; }
              .p-6 { padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();

        // Save bill to database
        try {
            await createBill({
                billNumber,
                items: cart.map(item => ({
                    productId: item._id,
                    productName: item.name,
                    productImage: item.mainImage || undefined,
                    itemId: item.itemId,
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

        // Update stock for each item in cart
        const updateStockPromises = cart.map(async (item) => {
            try {
                await removeStock({
                    productId: item._id,
                    quantity: item.quantity,
                    reason: `Sale - Bill #${billNumber}`,
                    updatedBy: "billing",
                });
            } catch (error) {
                console.error(`Failed to update stock for ${item.name}:`, error);
            }
        });

        // Wait for all stock updates
        Promise.all(updateStockPromises).then(() => {
            toast.success("Bill saved & stock updated!");
        }).catch(() => {
            toast.error("Some stock updates failed");
        });

        // Clear cart after printing
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setPaymentMethod("cash");
        setDiscount(0);
        setShowPrintPreview(false);
        toast.success("Bill printed successfully!");

        // Generate new bill number
        const date = new Date();
        const num = `WD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
        setBillNumber(num);
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
                            {/* Barcode Scanner Input */}
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
                                        const stock = getTotalStock(product);
                                        const isOutOfStock = stock <= 0;
                                        return (
                                            <button
                                                key={product._id}
                                                onClick={() => { if (!isOutOfStock) handleProductClick(product); }}
                                                disabled={isOutOfStock}
                                                className={`p-3 rounded-xl transition-colors text-left group relative ${
                                                    isOutOfStock 
                                                        ? "bg-gray-100 opacity-60 cursor-not-allowed" 
                                                        : "bg-gray-50 hover:bg-gray-100"
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
                                                    <span className={`text-[10px] font-medium ${stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                                                        {stock} left
                                                    </span>
                                                </div>
                                                {!isOutOfStock && (
                                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] bg-gray-900 text-white px-2 py-1 rounded-full">
                                                            + Add
                                                        </span>
                                                    </div>
                                                )}
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
                                    {[
                                        { value: "cash", label: "Cash" },
                                        { value: "card", label: "Card" },
                                        { value: "upi", label: "UPI" },
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${paymentMethod === method.value
                                                ? "bg-gray-900 text-white"
                                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            {method.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Discount */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Discount</h3>
                                <div className="flex gap-2">
                                    {[
                                        { value: 0, label: "No Discount" },
                                        { value: 5, label: "5%" },
                                        { value: 10, label: "10%" },
                                    ].map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDiscount(d.value)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${discount === d.value
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
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                        {cart.map(item => {
                                            const cartItemKey = `${item._id}-${item.selectedSize || "nosize"}`;
                                            return (
                                                <div key={cartItemKey} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
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
                                                        <div className="flex items-center gap-2">
                                                            {item.selectedSize && (
                                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                                    Size: {item.selectedSize}
                                                                </span>
                                                            )}
                                                            <p className="text-xs text-gray-400">₹{item.price} × {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateQuantity(cartItemKey, -1)}
                                                            className="p-1 hover:bg-gray-200 rounded"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(cartItemKey, 1)}
                                                            className="p-1 hover:bg-gray-200 rounded"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(cartItemKey)}
                                                            className="p-1 hover:bg-red-100 text-red-500 rounded ml-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                            <span className="text-gray-400">Incl. GST (18%)</span>
                                            <span className="text-gray-400">₹{tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                            <span>Total</span>
                                            <span>₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
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
                            {/* Header with Logo */}
                            <div className="text-center pb-6 mb-6 border-b-2 border-gray-900">
                                <div className="flex justify-center mb-3">
                                    <img
                                        src={logoBase64 || "/logo.png"}
                                        alt="Walkdrobe"
                                        className="h-12 w-auto print-logo"
                                    />
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
                                    <p className="font-mono">{billNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 mb-1">Date & Time:</p>
                                    <p>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <p className="mt-1">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            {customerInfo.name && (
                                <div className="mb-6 pb-4 border-b border-dashed border-gray-300">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">CUSTOMER</p>
                                    <p className="text-sm font-medium text-gray-900">{customerInfo.name}</p>
                                    {customerInfo.phone && <p className="text-xs text-gray-600 mt-1">Phone: {customerInfo.phone}</p>}
                                </div>
                            )}

                            {/* Items Table */}
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
                                        {cart.map((item, idx) => (
                                            <tr key={item._id} className={idx < cart.length - 1 ? "border-b border-gray-100" : ""}>
                                                <td className="py-3 pr-2">
                                                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{item.itemId}</p>
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
                                    <span className="text-gray-600">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-600">Discount ({discount}%)</span>
                                        <span className="text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Incl. GST (18%)</span>
                                    <span className="text-gray-500">₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold bg-gray-900 text-white -mx-8 px-8 py-4 mt-4">
                                    <span>GRAND TOTAL</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                                <p className="font-semibold text-gray-900 mb-2">Payment Method: {paymentMethod.toUpperCase()}</p>
                                <p>Amount Received: ₹{total.toFixed(2)}</p>
                                <p>Change: ₹0.00</p>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 text-center">
                                <p className="text-sm font-medium text-gray-900 mb-2">Thank you for shopping with us!</p>
                                <p className="text-xs text-gray-500 mt-3">Exchange within 7 days with original bill</p>
                                <p className="text-xs text-gray-500 mt-1">No refund on sale items</p>
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <p className="text-[10px] text-gray-400">Follow us @walkdrobe.in</p>
                                    <p className="text-[10px] text-gray-400 mt-2">This is a computer generated bill</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowPrintPreview(false)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executePrint}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Size Selection Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Select Size</h3>
                            <button 
                                onClick={() => { setSelectedProduct(null); setSelectedSize(""); }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {/* Product Info */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
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
                                    <p className="text-sm text-gray-500">₹{selectedProduct.price}</p>
                                    {selectedProduct.color && (
                                        <p className="text-xs text-gray-400">Color: {selectedProduct.color}</p>
                                    )}
                                </div>
                            </div>

                            {/* Size Options */}
                            <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes</p>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {(selectedProduct.availableSizes || Object.keys(selectedProduct.sizeStock || {})).map(size => {
                                    const sizeStock = selectedProduct.sizeStock?.[size] ?? 0;
                                    const inCart 
