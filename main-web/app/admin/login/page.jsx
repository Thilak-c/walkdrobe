"use client";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiShield, FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function AdminLogin() {
  const router = useRouter();
  const adminSignIn = useAction(api.auth.adminSignIn);
  const createSuperAdmin = useAction(api.auth.createSuperAdmin);

  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin
    const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
    if (m) {
      // Verify admin session - redirect if valid admin
      router.push("/admin");
    }
  }, [router]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      let result;
      if (isSetupMode) {
        // Create initial super admin
        result = await createSuperAdmin({ 
          email: form.email, 
          password: form.password, 
          name: form.name 
        });
      } else {
        // Regular admin login
        result = await adminSignIn({ email: form.email, password: form.password });
      }
      
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = `Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${isSecure ? '; Secure' : ''}`;
      document.cookie = `sessionToken=${result.sessionToken}; ${cookieOptions}`;
      router.push("/admin");
    } catch (err) {
      if (err.message.includes("Super admin already exists")) {
        setError("Super admin setup is complete. Please use regular admin login.");
        setIsSetupMode(false);
      } else if (err.message.includes("Admin privileges required")) {
        setError("Access denied. This account does not have admin privileges.");
      } else if (err.message.includes("Admin account is inactive")) {
        setError("Your admin account has been deactivated. Contact the super admin.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900 text-white">
      <motion.div
        className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <FiShield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            {isSetupMode ? "Setup Super Admin" : "Admin Portal"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSetupMode 
              ? "Create the first super admin account"
              : "Secure access to admin dashboard"
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {isSetupMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="email"
                type="email"
                placeholder="admin@yourcompany.com"
                value={form.email}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 pr-12 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isSetupMode ? "Creating Admin..." : "Signing in..."}
              </>
            ) : (
              <>
                <FiShield size={18} />
                {isSetupMode ? "Create Super Admin" : "Access Admin Panel"}
              </>
            )}
          </button>
        </form>

        {/* Toggle Setup Mode */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(!isSetupMode);
              setError("");
              setForm({ email: "", password: "", name: "" });
            }}
            className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
          >
            {isSetupMode 
              ? "Already have admin access? Sign in here"
              : "Need to setup initial admin? Click here"
            }
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {isSetupMode 
              ? "This creates the first super admin account. Only do this once during initial setup."
              : "Only users with admin or super admin roles can access this portal."
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
} 