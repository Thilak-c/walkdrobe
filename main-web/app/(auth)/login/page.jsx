"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function Login() {
  const router = useRouter();
  const signIn = useMutation(api.auth.signIn);
  const requestOTP = useMutation(api.auth.requestPasswordResetOTP);
  const verifyOTP = useMutation(api.auth.verifyPasswordResetOTP);
  const resetPassword = useMutation(api.auth.resetPasswordWithOTP);

  const token = getSessionToken();
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
  const [resetEmail, setResetEmail] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // Only redirect if we have a valid user session
    if (me === undefined) return; // Still loading
    if (me && token) {
      // Valid session exists, redirect to onboarding
      router.push("/onboarding");
    }
  }, [me, token, router]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result = await signIn({ email: form.email, password: form.password });

      if (result.status === "account_deleted") {
        // Redirect to account deleted page with deletion info
        const info = encodeURIComponent(JSON.stringify(result.deletionInfo));
        router.push(`/account-deleted?info=${info}`);
        setBusy(false);
        return;
      }

      // Determine if we're on HTTPS
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = `Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${isSecure ? '; Secure' : ''}`;

      if (result.status === "success") {
        document.cookie = `sessionToken=${result.sessionToken}; ${cookieOptions}`;
        router.push("/onboarding");
        return;
      }

      // Handle case where result doesn't have expected status
      if (result.sessionToken) {
        // Backward compatibility - old format
        document.cookie = `sessionToken=${result.sessionToken}; ${cookieOptions}`;
        router.push("/onboarding");
        return;
      }

      // If we get here, something unexpected happened
      setError("Login failed. Please try again.");
      setBusy(false);

    } catch (err) {
      // Convert technical errors to user-friendly messages
      const errorMessage = err.message || "Login failed";

      if (errorMessage.includes("Invalid credentials")) {
        setError("Incorrect email or password. Please check your details and try again.");
      } else if (errorMessage.includes("User not found")) {
        setError("No account found with this email. Please check your email or sign up.");
      } else if (errorMessage.includes("Password")) {
        setError("Incorrect password. Please try again.");
      } else if (errorMessage.includes("Email")) {
        setError("Please enter a valid email address.");
      } else if (errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        setError("Connection error. Please check your internet and try again.");
      } else if (errorMessage.includes("timeout")) {
        setError("Request timed out. Please try again.");
      } else {
        // Generic fallback for unknown errors
        setError("Unable to sign in. Please try again in a moment.");
      }

      setBusy(false);
    }
  };

  // Password reset handlers
  const handleRequestOTP = async () => {
    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }
    setResetBusy(true);
    setResetError("");

    try {
      const result = await requestOTP({ email: resetEmail });

      if (result.success && result.otp) {
        // Send OTP via email
        await fetch("/api/send-reset-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: result.email,
            otp: result.otp,
            userName: result.userName,
          }),
        });
        setResetStep(2);
      } else {
        setResetError(result.message || "Failed to send OTP");
      }
    } catch (err) {
      setResetError("Failed to send OTP. Please try again.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!resetOTP || resetOTP.length !== 6) {
      setResetError("Please enter a valid 6-digit OTP");
      return;
    }
    setResetBusy(true);
    setResetError("");

    try {
      const result = await verifyOTP({ email: resetEmail, otp: resetOTP });

      if (result.success) {
        setResetStep(3);
      } else {
        setResetError(result.message || "Invalid OTP");
      }
    } catch (err) {
      setResetError("Failed to verify OTP. Please try again.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setResetBusy(true);
    setResetError("");

    try {
      const result = await resetPassword({
        email: resetEmail,
        otp: resetOTP,
        newPassword: newPassword,
      });

      if (result.success) {
        setResetStep(4);
      } else {
        setResetError(result.message || "Failed to reset password");
      }
    } catch (err) {
      setResetError("Failed to reset password. Please try again.");
    } finally {
      setResetBusy(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep(1);
    setResetEmail("");
    setResetOTP("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 pt-12 sm:pt-6 bg-gray-50 overflow-hidden">
      {/* Background with Logo */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center"
      >
        <img
          src="/logo.png"
          alt="AesthetX Background Logo"
          className="w-full h-full object-cover opacity-1 blur-md transform scale-150 saturate-0"
        />
      </div>

      <motion.form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/70 backdrop-blur-3xl rounded-3xl shadow-5xl border border-gray-300/70 p-8 sm:p-12 space-y-6 sm:space-y-7 transition-all duration-300 ease-in-out"
        initial={{ scale: 0.8, opacity: 0, y: 80 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 10, duration: 0.8 }}
      >
        {/* Logo and Brand Info */}
        <div className="text-center mb-7 sm:mb-9">
          {/* <Link href="/">
            <img
              src="/logo.png"
              alt="AesthetX Logo"
              className="h-16 sm:h-20 object-contain mx-auto mb-2 sm:mb-3 transform hover:scale-110 transition-transform duration-300 ease-in-out filter drop-shadow-md"
            />
          </Link> */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">Welcome back</h1>
          <p className="text-sm sm:text-base text-gray-700 font-medium">Sign in to your <span className="text-gray-900 font-bold">AesthetX</span> account</p>
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            id="email"
            placeholder="your.email@example.com"
            className="w-full px-5 py-3.5 sm:px-6 sm:py-4 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all shadow-md bg-white/90 text-gray-900 placeholder-gray-600 appearance-none hover:border-gray-600"
            onChange={onChange}
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              className="w-full px-5 py-3.5 sm:px-6 sm:py-4 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all pr-12 sm:pr-14 shadow-md bg-white/90 text-gray-900 placeholder-gray-600 appearance-none hover:border-gray-600"
              onChange={onChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="  text-center">

            <p className="text-sm text-red-700 leading-relaxed">
              {error}
            </p>

          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-3.5 sm:py-4 rounded-xl hover:from-black hover:to-gray-950 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95"
        >
          {busy ? "Signing in..." : "Log in"}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium underline transition-colors"
          >
            Forgot your password?
          </button>
        </div>

        <p className="text-xs sm:text-sm text-center text-gray-700 mt-3 sm:mt-4">
          No account?
          <Link href="/signup" className="text-gray-900 hover:text-black font-bold underline ml-1 transition-colors hover:scale-105 inline-block transform hover:-translate-y-0.5 active:scale-95">
            Create one
          </Link>
        </p>
      </motion.form>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={closeResetModal}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-none"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r bg-black p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resetStep > 1 && resetStep < 4 && (
                    <button
                      onClick={() => setResetStep(resetStep - 1)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {resetStep === 1 && "Reset Password"}
                      {resetStep === 2 && "Enter OTP"}
                      {resetStep === 3 && "New Password"}
                      {resetStep === 4 && "Success!"}
                    </h3>
                    <p className="text-white/60 text-xs">
                      {resetStep === 1 && "We'll send you a code"}
                      {resetStep === 2 && "Check your email"}
                      {resetStep === 3 && "Create a strong password"}
                      {resetStep === 4 && "Password updated"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeResetModal}
                  className="text-white/60 hover:text-white text-2xl font-light"
                >
                  ×
                </button>
              </div>

              {/* Progress Steps */}
              {resetStep < 4 && (
                <div className="flex gap-1 px-4 pt-4">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${step <= resetStep ? "bg-gray-900" : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>
              )}

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Step 1: Email */}
                {resetStep === 1 && (
                  <>
                    <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mx-auto mb-4">
                      <Mail className="w-7 h-7 text-gray-700" />
                    </div>
                    <p className="text-gray-600 text-sm text-center mb-4">
                      Enter your email address and we'll send you a 6-digit code to reset your password.
                    </p>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all bg-white text-gray-900"
                    />
                  </>
                )}

                {/* Step 2: OTP */}
                {resetStep === 2 && (
                  <>
                    <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mx-auto mb-4">
                      <Mail className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm text-center mb-4">
                      We've sent a 6-digit code to <span className="font-semibold text-gray-900">{resetEmail}</span>
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resetOTP}
                      onChange={(e) => setResetOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                      data-lpignore="true"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all bg-white text-gray-900 text-center text-xl tracking-[0.5em] font-mono"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Didn't receive it? Check spam or{" "}
                      <button
                        onClick={handleRequestOTP}
                        disabled={resetBusy}
                        className="text-gray-900 font-semibold underline"
                      >
                        resend
                      </button>
                    </p>
                  </>
                )}

                {/* Step 3: New Password */}
                {resetStep === 3 && (
                  <>
                    <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mx-auto mb-4">
                      <Lock className="w-7 h-7 text-gray-700" />
                    </div>
                    <p className="text-gray-600 text-sm text-center mb-4">
                      Create a new password for your account. Make it strong!
                    </p>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 8 chars)"
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                          data-lpignore="true"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all bg-white text-gray-900 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all bg-white text-gray-900"
                      />
                    </div>
                  </>
                )}

                {/* Step 4: Success */}
                {resetStep === 4 && (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Password Reset Complete!</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Your password has been successfully updated. You can now log in with your new password.
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {resetError && (
                  <p className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                    {resetError}
                  </p>
                )}

                {/* Action Button */}
                <button
                  onClick={() => {
                    if (resetStep === 1) handleRequestOTP();
                    else if (resetStep === 2) handleVerifyOTP();
                    else if (resetStep === 3) handleResetPassword();
                    else closeResetModal();
                  }}
                  disabled={resetBusy}
                  className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-3 rounded-xl hover:from-black hover:to-gray-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {resetStep === 1 && "Send OTP"}
                      {resetStep === 2 && "Verify OTP"}
                      {resetStep === 3 && "Reset Password"}
                      {resetStep === 4 && "Back to Login"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 