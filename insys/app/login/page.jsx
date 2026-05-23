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
    adminId: "Walkdrobe",
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
      router.push(type === "website" ? "/website" : "/");
    }, 500);
  };

  const handleBypass = () => {
    // Skip login, go directly to store selection
    setStep(2);
    toast.success("Login bypassed");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle modern gradient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/45 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/35 blur-3xl" />
      
      <div className="relative w-full max-w-sm sm:max-w-md animate-fadeIn">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-slate-150 p-2 mb-2">
            <img src="/logo.png" alt="Walkdrobe Logo" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-base font-bold text-slate-900 font-poppins tracking-tight">Walkdrobe</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-extrabold">INVENTORY SYSTEM</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-3xl overflow-hidden">
          {step === 1 ? (
            /* Step 1: Login Form */
            <form onSubmit={handleLogin} className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1 font-poppins">Welcome back</h2>
              <p className="text-slate-400 text-xs mb-6">Enter credentials to access inventory</p>

              <div className="space-y-4">
                {/* Admin ID */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admin ID</label>
                  <input
                    type="text"
                    value={credentials.adminId}
                    onChange={(e) => setCredentials({ ...credentials, adminId: e.target.value })}
                    placeholder="Enter admin ID"
                    className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-250/80 focus:border-slate-800 rounded-2xl text-xs focus:outline-none transition-all font-medium"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-250/80 focus:border-slate-800 rounded-2xl text-xs focus:outline-none transition-all pr-12 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Select Store Type */
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1 font-poppins">Select Store</h2>
              <p className="text-slate-400 text-xs mb-6">Choose inventory model to manage</p>

              <div className="space-y-3">
                {/* Website Option */}
                <button
                  type="button"
                  onClick={() => handleStoreSelect("website")}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-2xl border border-slate-150 transition-all text-left group hover:border-slate-800 hover:shadow-md cursor-pointer ${
                    storeType === "website" ? "border-slate-800 bg-blue-50/20" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-800">Website Store</h3>
                      <p className="text-[10px] text-slate-400">walkdrobe.in online inventory</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition-colors" />
                  </div>
                </button>

                {/* Offline Shop Option */}
                <button
                  type="button"
                  onClick={() => handleStoreSelect("offline")}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-2xl border border-slate-150 transition-all text-left group hover:border-slate-800 hover:shadow-md cursor-pointer ${
                    storeType === "offline" ? "border-slate-800 bg-emerald-50/20" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <Store className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-800">Offline Shop</h3>
                      <p className="text-[10px] text-slate-400">Patna physical store inventory</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition-colors" />
                  </div>
                </button>
              </div>

              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full mt-5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6">
          © 2026 Walkdrobe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
