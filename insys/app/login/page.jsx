"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Eye, EyeOff, Store, Globe, ArrowRight, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = login, 2 = select store type
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({
    adminId: "",
    password: "",
  });
  
  const [storeType, setStoreType] = useState(null); // "website" or "offline"

  // Demo credentials (replace with actual auth)
  const VALID_CREDENTIALS = {
    adminId: "admin",
    password: "walkdrobe123"
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (
        credentials.adminId === VALID_CREDENTIALS.adminId &&
        credentials.password === VALID_CREDENTIALS.password
      ) {
        setStep(2);
        toast.success("Login successful!");
      } else {
        toast.error("Invalid credentials");
      }
      setIsLoading(false);
    }, 800);
  };

  const handleStoreSelect = (type) => {
    setStoreType(type);
    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem("insys_auth", JSON.stringify({
      isLoggedIn: true,
      storeType: type,
      loginTime: new Date().toISOString()
    }));

    setTimeout(() => {
      toast.success(`Welcome to ${type === "website" ? "Website" : "Offline Shop"} Inventory`);
      router.push("/");
    }, 500);
  };

  const handleBypass = () => {
    // Skip login, go directly to store selection
    setStep(2);
    toast.success("Login bypassed");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-dots opacity-50" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Walkdrobe</h1>
          <p className="text-gray-400 text-sm tracking-wider">INVENTORY SYSTEM</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {step === 1 ? (
            /* Step 1: Login Form */
            <form onSubmit={handleLogin} className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-8">Enter your credentials to continue</p>

              <div className="space-y-5">
                {/* Admin ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
                  <input
                    type="text"
                    value={credentials.adminId}
                    onChange={(e) => setCredentials({ ...credentials, adminId: e.target.value })}
                    placeholder="Enter admin ID"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Bypass Button */}
              {/* <button
                type="button"
                onClick={handleBypass}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm"
              >
                <Zap size={16} />
                Quick Bypass (Dev Mode)
              </button> */}

              {/* Demo credentials hint */}
              {/* <p className="text-center text-xs text-gray-400 mt-6">
                Demo: admin / walkdrobe123
              </p> */}
            </form>
          ) : (
            /* Step 2: Select Store Type */
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">Select Store</h2>
              <p className="text-gray-400 text-sm mb-8">Choose which inventory to manage</p>

              <div className="space-y-4">
                {/* Website Option */}
                <button
                  onClick={() => handleStoreSelect("website")}
                  disabled={isLoading}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left group hover:border-gray-900 hover:shadow-lg ${
                    storeType === "website" ? "border-gray-900 bg-gray-50" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Website Store</h3>
                      <p className="text-sm text-gray-400">walkdrobe.in online inventory</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                  </div>
                </button>

                {/* Offline Shop Option */}
                <button
                  onClick={() => handleStoreSelect("offline")}
                  disabled={isLoading}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left group hover:border-gray-900 hover:shadow-lg ${
                    storeType === "offline" ? "border-gray-900 bg-gray-50" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                      <Store className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Offline Shop</h3>
                      <p className="text-sm text-gray-400">Patna physical store inventory</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                  </div>
                </button>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep(1)}
                className="w-full mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Walkdrobe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
