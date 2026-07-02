"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Clock,
  User,
  Phone,
  Mail,
  Home,
  Copy,
  ExternalLink,
  Download,
  Star,
  AlertCircle
} from "lucide-react";

export default function OrderDetailsPage({ params }) {
  const router = useRouter();
  const { orderNumber } = React.use(params);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Shiprocket tracking state
  const [shiprocketTracking, setShiprocketTracking] = useState(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  
  useEffect(() => {
    if (me) {
      setIsLoggedIn(true);
    } else if (token && !me) {
      setIsLoggedIn(false);
    }
  }, [me, token]);

  const order = useQuery(
    api.orders.getOrderByNumber,
    orderNumber ? { orderNumber } : "skip"
  );

  // Fetch Shiprocket tracking data
  const fetchShiprocketTracking = async () => {
    if (!order || !order.shiprocketDetails?.shipmentId) {
      return;
    }

    setIsLoadingTracking(true);
    setTrackingError(null);

    try {
      const response = await fetch(`/api/shiprocket/track?orderNumber=${orderNumber}`);
      const data = await response.json();

      if (data.success) {
        setShiprocketTracking(data.tracking);
      } else {
        setTrackingError(data.error || 'Failed to fetch tracking data');
      }
    } catch (error) {
      console.error('Error fetching Shiprocket tracking:', error);
      setTrackingError('Failed to fetch tracking data');
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Fetch tracking data when order is loaded
  useEffect(() => {
    if (order && order.shiprocketDetails?.shipmentId) {
      fetchShiprocketTracking();
    }
  }, [order?.shiprocketDetails?.shipmentId]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      showToastMessage("Order number copied!");
    } catch (error) {
      showToastMessage("Failed to copy");
    }
  };

  const generateInvoice = (order) => {
    // Create professional invoice HTML content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${order.orderNumber} - WALKDROBE</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f8fafc; 
            color: #1e293b; 
            line-height: 1.6;
            font-size: 14px;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .company-logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
          }
          
          .company-details {
            display: flex;
            flex-direction: column;
            gap: 15px;
            position: relative;
            z-index: 1;
          }
          
          .company-detail {
            text-align: center;
            opacity: 0.8;
          }
          
          .company-detail strong {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
            opacity: 0.7;
          }
          
          .invoice-meta {
            background: #f8fafc;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .meta-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .meta-section h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 600;
          }
          
          .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .meta-item:last-child {
            border-bottom: none;
          }
          
          .meta-label {
            font-weight: 500;
            color: #475569;
            font-size: 13px;
          }
          
          .meta-value {
            font-weight: 600;
            color: #1e293b;
            font-size: 13px;
            text-align: right;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #dbeafe; color: #1e40af; }
          .status-shipped { background: #e9d5ff; color: #7c3aed; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          
          .invoice-number {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 6px;
          }
          
          .order-date {
            color: #64748b;
            font-size: 13px;
          }
          
          .customer-section {
            background: white;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-title::before {
            content: '';
            width: 3px;
            height: 16px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
          }
          
          .customer-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .customer-info h4 {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .customer-details {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border-left: 3px solid #3b82f6;
          }
          
          .customer-detail {
            margin-bottom: 6px;
            font-size: 13px;
            color: #1e293b;
          }
          
          .customer-detail:last-child {
            margin-bottom: 0;
          }
          
          .items-section {
            background: white;
            padding: 20px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            font-size: 12px;
          }
          
          .items-table th {
            background: #f8fafc;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          
          .items-table tr:last-child td {
            border-bottom: none;
          }
          
          .item-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 3px;
            font-size: 12px;
          }
          
          .item-details {
            font-size: 10px;
            color: #64748b;
          }
          
          .item-price {
            font-weight: 600;
            color: #1e293b;
            font-size: 12px;
          }
          
          .item-total {
            font-weight: 700;
            color: #1e293b;
            font-size: 14px;
          }
          
          .total-section {
            background: #f8fafc;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .total-row:last-child {
            border-bottom: none;
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
          }
          
          .payment-section {
            background: white;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
          }
          
          .payment-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 16px;
          }
          
          .payment-card {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .payment-card h5 {
            font-size: 11px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
          }
          
          .payment-info {
            font-size: 13px;
            color: #1e293b;
            margin-bottom: 6px;
          }
          
          .payment-info:last-child {
            margin-bottom: 0;
          }
          
          .footer {
            background: #1e293b;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          
          .footer-content {
            max-width: 600px;
            margin: 0 auto;
          }
          
          .footer-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
          }
          
          .footer-text {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 6px;
            line-height: 1.5;
          }
          
          .footer-divider {
            width: 50px;
            height: 2px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            margin: 16px auto;
            border-radius: 1px;
          }
          
          .footer-legal {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #334155;
          }
          
          /* Mobile-first responsive design */
          @media (min-width: 640px) {
            .header { padding: 40px; }
            .company-logo { font-size: 32px; }
            .company-details { 
              flex-direction: row; 
              justify-content: center; 
              gap: 40px; 
            }
            .invoice-meta { padding: 30px 40px; }
            .meta-grid { 
              flex-direction: row; 
              gap: 40px; 
            }
            .customer-section { padding: 30px 40px; }
            .customer-grid { 
              flex-direction: row; 
              gap: 40px; 
            }
            .items-section { padding: 30px 40px; }
            .items-table { font-size: 14px; }
            .items-table th { padding: 16px 20px; }
            .items-table td { padding: 20px; }
            .item-name { font-size: 14px; }
            .item-details { font-size: 12px; }
            .item-price { font-size: 14px; }
            .item-total { font-size: 16px; }
            .total-section { padding: 30px 40px; }
            .payment-section { padding: 30px 40px; }
            .payment-grid { 
              flex-direction: row; 
              gap: 20px; 
            }
            .footer { padding: 40px; }
            .footer-title { font-size: 18px; }
            .footer-text { font-size: 14px; }
          }
          
          @media print {
            body { background: white; }
            .invoice-container { 
              margin: 0; 
              box-shadow: none; 
              border-radius: 0;
            }
            .header { background: #1e293b !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="company-logo">WALKDROBE</div>
            <div class="company-details">
              <div class="company-detail">
                <strong>Email</strong>
                support@walkdrobe.in
              </div>
              <div class="company-detail">
                <strong>Phone</strong>
                +91 98765 43210
              </div>
              <div class="company-detail">
                <strong>GST</strong>
                27ABCDE1234F1Z5
              </div>
            </div>
          </div>

          <!-- Invoice Meta -->
          <div class="invoice-meta">
            <div class="meta-grid">
              <div class="meta-section">
                <h3>Invoice Details</h3>
                <div class="meta-item">
                  <span class="meta-label">Invoice Number</span>
                  <span class="meta-value">#${order.orderNumber}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Order Date</span>
                  <span class="meta-value">${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Status</span>
                  <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
              </div>
              <div class="meta-section">
                <h3>Customer Information</h3>
                <div class="meta-item">
                  <span class="meta-label">Customer</span>
                  <span class="meta-value">${order.shippingDetails?.fullName || 'Customer'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Phone</span>
                  <span class="meta-value">${order.shippingDetails?.phone || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Email</span>
                  <span class="meta-value">${order.shippingDetails?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Address -->
          <div class="customer-section">
            <div class="section-title">Shipping Address</div>
            <div class="customer-grid">
              <div class="customer-info">
                <h4>Billing Address</h4>
                <div class="customer-details">
                  <div class="customer-detail">${order.shippingDetails?.fullName || 'Customer'}</div>
                  <div class="customer-detail">${order.shippingDetails?.phone || ''}</div>
                  <div class="customer-detail">${order.shippingDetails?.email || ''}</div>
                  <div class="customer-detail">${order.shippingDetails?.address || ''}</div>
                  <div class="customer-detail">${order.shippingDetails?.city || ''}, ${order.shippingDetails?.state || ''}</div>
                  <div class="customer-detail">${order.shippingDetails?.country || 'India'} - ${order.shippingDetails?.pincode || ''}</div>
                </div>
              </div>
              ${order.estimatedDeliveryDate ? `
              <div class="customer-info">
                <h4>Delivery Information</h4>
                <div class="customer-details">
                  <div class="customer-detail">
                    <strong>Expected Delivery:</strong><br>
                    ${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Order Items -->
          <div class="items-section">
            <div class="section-title">Order Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      <div class="item-details">SKU: ${item.size}-${item.name.replace(/\s+/g, '-').toUpperCase()}</div>
                    </td>
                    <td><span class="item-price">${item.size}</span></td>
                    <td><span class="item-price">${item.quantity}</span></td>
                    <td><span class="item-price">₹${item.price.toFixed(2)}</span></td>
                    <td><span class="item-total">₹${(item.price * item.quantity).toFixed(2)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal</span>
              <span>₹${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Total Amount</span>
              <span>₹${order.orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Information -->
          ${order.paymentDetails ? `
          <div class="payment-section">
            <div class="section-title">Payment Information</div>
            <div class="payment-grid">
              <div class="payment-card">
                <h5>Payment Status</h5>
                <div class="payment-info"> Payment Successful</div>
                <div class="payment-info">Amount: ₹${order.paymentDetails.amount?.toFixed(2) || order.orderTotal.toFixed(2)}</div>
                <div class="payment-info">Method: Razorpay</div>
              </div>
              ${order.paymentDetails.razorpayOrderId ? `
              <div class="payment-card">
                <h5>Transaction Details</h5>
                <div class="payment-info">Order ID: ${order.paymentDetails.razorpayOrderId}</div>
                ${order.paymentDetails.razorpayPaymentId ? `<div class="payment-info">Payment ID: ${order.paymentDetails.razorpayPaymentId}</div>` : ''}
                <div class="payment-info">Status: ${order.paymentDetails.status || 'Completed'}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div class="footer-content">
              <div class="footer-title">Thank You for Your Purchase!</div>
              <div class="footer-text">
                We appreciate your business and hope you enjoy your new items. 
                If you have any questions or need assistance, please don't hesitate to contact us.
              </div>
              <div class="footer-divider"></div>
              <div class="footer-text">
                <strong>Contact Support:</strong><br>
                Email: support@walkdrobe.in | Phone: +91 98765 43210
              </div>
              <div class="footer-legal">
                This is a computer-generated invoice. No signature required.<br>
                WALKDROBE - Premium Fashion & Lifestyle Store
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.orderNumber}-WALKDROBE.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToastMessage("Professional invoice generated successfully!");
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatDetailedDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "confirmed": return "text-blue-600 bg-blue-50 border-blue-200";
      case "shipped": return "text-purple-600 bg-purple-50 border-purple-200";
      case "delivered": return "text-green-600 bg-green-50 border-green-200";
      case "cancelled": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getDeliveryStatusIcon = (status) => {
    switch (status) {
      case "order_placed": return { icon: <Calendar className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" };
      case "processing": return { icon: <Package className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-600" };
      case "shipped": return { icon: <Truck className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" };
      case "out_for_delivery": return { icon: <Truck className="w-5 h-5" />, color: "bg-orange-100 text-orange-600" };
      case "delivered": return { icon: <Check className="w-5 h-5" />, color: "bg-green-100 text-green-600" };
      default: return { icon: <Clock className="w-5 h-5" />, color: "bg-gray-100 text-gray-600" };
    }
  };


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 sm:px-6">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
          <button 
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading order...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.userId !== me._id) {
    // console.log(order)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 sm:px-6">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <button 
            onClick={() => router.push("/orders")}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50"
          >
            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-center sm:text-left">
              <span className="text-sm">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Order Details</h1>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 mb-4 shadow-xs relative overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs font-bold text-blue-600 tracking-wider uppercase">Order Receipt</span>
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                  {order.orderNumber}
                </h2>
                <button 
                  onClick={copyOrderNumber} 
                  className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg active:scale-95 transition-all"
                  title="Copy Order Number"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={'px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border tracking-wider ' + getStatusColor(order.status)}>
                  {order.status.toUpperCase()}
                </span>
                <span className="text-gray-400 text-[11px] sm:text-xs font-medium">
                  {formatDetailedDate(order.createdAt)}
                </span>
              </div>

              {order.estimatedDeliveryDate && (
                <div className="flex items-center space-x-1.5 text-blue-600 bg-blue-50/50 border border-blue-100/50 px-2.5 py-1 rounded-xl w-fit mt-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span className="text-[11px] sm:text-xs font-semibold">
                    Expected: {formatDate(order.estimatedDeliveryDate)}
                  </span>
                </div>
              )}
            </div>

             <div className="border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0 flex justify-between items-center sm:block sm:text-right">
               {order.paymentDetails?.paymentMethod === "cod" ? (
                 <>
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:block">Cash Due on Delivery</span>
                   <div className="text-xl sm:text-3xl font-black text-amber-700 tracking-tight sm:mt-1">
                     ₹{(order.paymentDetails.remainingCOD !== undefined ? order.paymentDetails.remainingCOD : order.orderTotal).toFixed(2)}
                   </div>
                 </>
               ) : (
                 <>
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:block">Amount Paid</span>
                   <div className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight sm:mt-1">
                     ₹{order.orderTotal.toFixed(2)}
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">Purchased Items</h3>
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{order.items.length} Product{order.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-4 border border-slate-100 rounded-xl hover:shadow-xs transition-shadow">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100">
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        width={80}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                        <span>Size: <span className="text-slate-800 font-bold">{item.size}</span></span>
                        <span className="text-slate-300">•</span>
                        <span>Qty: <span className="text-slate-800 font-bold">{item.quantity}</span></span>
                        <span className="text-slate-300">•</span>
                        <span>₹{item.price.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-base font-extrabold text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-slate-100 pt-3 mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-700">₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  
                  {order.paymentDetails?.paymentMethod === "cod" && order.paymentDetails?.codCharge > 0 && (
                    <div className="flex justify-between text-amber-800 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100/50 text-[10px] sm:text-xs font-semibold mt-1">
                      <span>COD Reservation Fee (Paid Online):</span>
                      <span className="font-bold">₹{order.paymentDetails.codCharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-1 border-t border-slate-50">
                    <span>Grand Total:</span>
                    <span>₹{order.orderTotal.toFixed(2)}</span>
                  </div>

                  {order.paymentDetails?.paymentMethod === "cod" && order.paymentDetails?.remainingCOD > 0 && (
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50 text-[11px] sm:text-xs font-extrabold mt-1">
                      <span>Remaining Cash on Delivery:</span>
                      <span className="font-mono">₹{order.paymentDetails.remainingCOD.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment</span>
              </h3>
              <div className="space-y-2 text-sm">
                {order.paymentDetails?.paymentMethod === "cod" ? (
                  <div className="flex items-center space-x-2 text-amber-600 mb-3 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <Check className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs">COD Confirmed</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600 mb-3">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Payment Successful</span>
                  </div>
                )}

                {order.paymentDetails ? (
                  <>
                    {order.paymentDetails.paymentMethod === "cod" ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">COD Balance Due:</span>
                          <span className="font-medium text-amber-700">₹{(order.paymentDetails.remainingCOD !== undefined ? order.paymentDetails.remainingCOD : order.orderTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-50 font-bold">
                          <span className="text-gray-800">Total Value:</span>
                          <span className="font-bold text-gray-900">₹{order.orderTotal.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium">₹{order.paymentDetails.amount?.toFixed(2) || order.orderTotal.toFixed(2)}</span>
                      </div>
                    )}

                    {order.paymentDetails.currency && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{order.paymentDetails.currency}</span>
                      </div>
                    )}
                    {order.paymentDetails.razorpayOrderId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Razorpay Order ID:</span>
                        <span className="font-medium text-xs font-mono select-all truncate max-w-[150px]">{order.paymentDetails.razorpayOrderId}</span>
                      </div>
                    )}
                    {order.paymentDetails.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize text-xs bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.2">{order.paymentDetails.status}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium capitalize">{order.paymentDetails.paymentMethod || "prepaid"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payer Name:</span>
                      <span className="font-medium">{order.shippingDetails?.fullName || "Customer"}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <p>Payment details not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Shipping Address</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{order.shippingDetails.fullName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{order.shippingDetails.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{order.shippingDetails.email}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-start space-x-2">
                    <Home className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{order.shippingDetails.address}</p>
                      <p className="text-gray-600">{order.shippingDetails.city}, {order.shippingDetails.state}</p>
                      <p className="text-gray-600">{order.shippingDetails.country} - {order.shippingDetails.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Tracking */}
            {order.deliveryDetails && order.deliveryDetails.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold mb-3 flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Tracking</span>
                </h3>
                <div className="space-y-4">
                  {order.deliveryDetails
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((detail, idx) => {
                      const { icon, color } = getDeliveryStatusIcon(detail.status);
                      return (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className={'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + color}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
                              <p className="font-medium text-gray-900 capitalize text-sm">
                                {detail.status.replace('_', ' ')}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {formatDate(detail.timestamp)}
                              </p>
                            </div>
                            <p className="text-gray-600 text-sm">{detail.message}</p>
                            {detail.location && (
                              <p className="text-gray-500 text-xs mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {detail.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Shiprocket Live Tracking */}
            {order.shiprocketDetails?.shipmentId && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Live Tracking</span>
                  </h3>
                  <button
                    onClick={fetchShiprocketTracking}
                    disabled={isLoadingTracking}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {isLoadingTracking ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {isLoadingTracking && !shiprocketTracking && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                  </div>
                )}

                {trackingError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {trackingError}
                  </div>
                )}

                {shiprocketTracking && (
                  <div className="space-y-4">
                    {/* Tracking Header */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      {shiprocketTracking.awbCode && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">AWB Code:</span>
                          <span className="font-mono font-medium">{shiprocketTracking.awbCode}</span>
                        </div>
                      )}
                      {shiprocketTracking.courierName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Courier:</span>
                          <span className="font-medium">{shiprocketTracking.courierName}</span>
                        </div>
                      )}
                      {shiprocketTracking.currentStatus && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium capitalize">{shiprocketTracking.currentStatus}</span>
                        </div>
                      )}
                      {shiprocketTracking.expectedDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected:</span>
                          <span className="font-medium text-blue-600">
                            {new Date(shiprocketTracking.expectedDeliveryDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {shiprocketTracking.trackingUrl && (
                        <a
                          href={shiprocketTracking.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Track on Shiprocket</span>
                        </a>
                      )}
                    </div>

                    {/* Tracking Activities */}
                    {shiprocketTracking.activities && shiprocketTracking.activities.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Shipment History</h4>
                        <div className="space-y-3">
                          {shiprocketTracking.activities.map((activity, idx) => (
                            <div key={idx} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{activity.status}</p>
                                {activity.location && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    {activity.location}
                                  </p>
                                )}
                                {activity.date && (
                                  <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold mb-3">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => generateInvoice(order)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate Invoice</span>
                </button>
                
                {order.status === "delivered" && (
                  <button
                    onClick={() => router.push('/products')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                  >
                    <Star className="w-4 h-4" />
                    <span>Write Review</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
