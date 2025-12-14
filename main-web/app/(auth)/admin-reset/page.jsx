"use client";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { FiKey, FiUser, FiLock, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function AdminPasswordReset() {
  const resetPassword = useAction(api.auth.resetAdminPassword);
  
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    // Validate passwords match
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      setBusy(false);
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setBusy(false);
      return;
    }

    try {
      const result = await resetPassword({ 
        email: form.email, 
        newPassword: form.newPassword 
      });
      setMessage(result.message);
      setForm({ email: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
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
          <div className="mx-auto w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
            <FiKey size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset Admin Password</h1>
          <p className="text-gray-400 text-sm">
            Reset password for your admin account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Admin Email Address</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="email"
                type="email"
                placeholder="Enter your admin email"
                value={form.email}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password (min 8 chars)"
                value={form.newPassword}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 pr-12 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-10 pr-12 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-300 text-sm">
              <div className="flex items-center gap-2">
                <FiCheck size={16} />
                {message}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Resetting Password...
              </>
            ) : (
              <>
                <FiKey size={18} />
                Reset Password
              </>
            )}
          </button>
        </form>

        {/* Navigation */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">After resetting, you can login with your new password</p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="/admin-login" className="text-blue-400 hover:text-blue-300 underline">
              Back to Admin Login
            </a>
            <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
              Regular User Login
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
          <p className="text-yellow-300 text-xs text-center">
            🔒 This tool resets passwords for admin accounts only. Make sure to use a strong password.
          </p>
        </div>
      </motion.div>
    </div>
  );
} 