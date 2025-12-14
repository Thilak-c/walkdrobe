"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { FiUserCheck, FiShield } from "react-icons/fi";

export default function PromoteAdmin() {
  const promoteUser = useMutation(api.users.promoteUserToAdmin);
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await promoteUser({ email, role });
      setMessage(result.message);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <FiUserCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Promote User to Admin</h1>
          <p className="text-gray-600 text-sm">
            Temporary setup tool - Use this to promote your account to admin
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the email to promote"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Admin Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Promoting...
              </>
            ) : (
              <>
                <FiShield size={18} />
                Promote to {role === "super_admin" ? "Super Admin" : "Admin"}
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            After promotion, you can login at <a href="/admin/login" className="text-green-600 underline">/admin/login</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
} 