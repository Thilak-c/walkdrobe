"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  
  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpRefs = useRef([]);
  const createSessionMutation = useMutation(api.auth.createSessionForEmail);
  
  // Check if already logged in
  const getToken = () => {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  };
  
  const token = getToken();
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  
  useEffect(() => {
    if (me && token) {
      router.push(returnUrl);
    }
  }, [me, token, router, returnUrl]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleSendOTP = async () => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await res.json();

      if (result.success) {
        setStep(2);
        setResendTimer(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all filled
    if (newOtp.every(d => d) && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    const code = otpCode || otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });
      const result = await res.json();

      if (result.success) {
        // create session via Convex
        const sessionResp = await createSessionMutation({ email: email.trim().toLowerCase() });
        if (sessionResp && sessionResp.success && sessionResp.sessionToken) {
          const isSecure = window.location.protocol === "https:";
          const cookieOptions = `Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${isSecure ? "; Secure" : ""}`;
          document.cookie = `sessionToken=${sessionResp.sessionToken}; ${cookieOptions}`;
          router.push(returnUrl);
        } else {
          setError(sessionResp.message || "Failed to create session");
        }
      } else {
        setError(result.message || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-slate-50/40 flex flex-col font-poppins text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Header Spacer */}
      <header className="p-4 flex items-center justify-between max-w-sm w-full mx-auto">
        <motion.button 
          onClick={() => step === 2 ? setStep(1) : router.back()} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 rounded-xl cursor-pointer shadow-3xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 select-none">Walkdrobe Auth</span>
        <div className="w-8"></div>
      </header>

      {/* Main Content Card Container */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs w-full max-w-sm mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Sign In</h1>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wide">
                    Enter your email to receive a secure one-time code.
                  </p>
                </div>

                {/* Email Input */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="e.g., you@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none transition-all font-poppins placeholder-slate-400"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 items-center bg-rose-50 border border-rose-100/50 rounded-xl p-2.5 text-[10px] text-rose-600 font-bold leading-relaxed"
                    >
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSendOTP}
                  disabled={!email || loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>

                {/* Terms */}
                <p className="text-[9px] text-slate-400 text-center font-semibold leading-normal">
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="underline text-slate-650 hover:text-slate-900">Terms</Link> and{" "}
                  <Link href="/privacy" className="underline text-slate-650 hover:text-slate-900">Privacy Policy</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Verify OTP</h1>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wide truncate">
                    Code sent to <span className="text-slate-800 font-bold">{email}</span>
                  </p>
                </div>

                {/* OTP Input Grid */}
                <div className="space-y-3.5">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Enter 6-Digit OTP</label>
                  <div className="flex justify-center gap-1.5" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-9 h-11 sm:w-11 sm:h-13 text-center text-sm sm:text-base font-black text-slate-900 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl focus:outline-none transition-all font-mono"
                        maxLength={1}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 items-center bg-rose-50 border border-rose-100/50 rounded-xl p-2.5 text-[10px] text-rose-600 font-bold leading-relaxed justify-center"
                    >
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                {/* Verify Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleVerifyOTP()}
                  disabled={otp.some(d => !d) || loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </motion.button>

                {/* Resend and Actions panel */}
                <div className="space-y-3.5 pt-1">
                  <div className="text-center text-[10px]">
                    {resendTimer > 0 ? (
                      <p className="text-slate-400 font-semibold">
                        Resend code in <span className="text-slate-800 font-bold">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button onClick={handleResendOTP} className="text-slate-900 font-black uppercase tracking-wider underline cursor-pointer">
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="w-full text-slate-400 hover:text-slate-900 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Wrong email? <span className="underline text-slate-500 font-bold">Change address</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}