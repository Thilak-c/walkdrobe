"use client";
import { useState } from "react";
import Navbar, { NavbarMobile } from "@/components/Navbar";
import FooterSimple from "@/components/FooterSimple";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId && !phone) {
      setError("Please enter Order ID or Phone Number");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Simulate API call - replace with actual tracking logic
    setTimeout(() => {
      setLoading(false);
      setError("Order not found. Please check your Order ID or Phone Number and try again.");
      setTracking(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="xl:block hidden h-[80px] xl:h-[100px]"></div>
      <div className="xl:hidden mb-14">
        <NavbarMobile />
      </div>
      <div className="hidden xl:block">
        <Navbar />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 mb-8">Enter your order details to check the delivery status.</p>

        <form onSubmit={handleTrack} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., WD20260104001"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>
          
          <div className="text-center text-gray-400 text-sm">or</div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter registered phone number"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                Track Order
              </>
            )}
          </button>
        </form>

        {/* Order Status Timeline (shown when tracking is found) */}
        {tracking && (
          <div className="border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-4">
              {[
                { icon: CheckCircle, label: "Order Placed", done: true },
                { icon: Package, label: "Processing", done: true },
                { icon: Truck, label: "Shipped", done: false },
                { icon: CheckCircle, label: "Delivered", done: false },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <step.icon className={`w-4 h-4 ${step.done ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={step.done ? 'text-gray-900' : 'text-gray-400'}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-500 text-sm mb-4">
            Can't find your order? Contact us with your order details and we'll help you track it.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:9122583392" className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Call: 9122583392
            </a>
            <a href="https://wa.me/919122583392" target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
}
