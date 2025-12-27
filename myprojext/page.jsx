"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Phone, ArrowRight, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Sign in with email</h1>
                <p className="text-gray-500">Enter your email and we'll send a one-time code</p>
              </div>

              {/* Email Input */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-gray-900 focus-within:bg-white transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-xl font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Continue Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSendOTP}
                disabled={!email || loading}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {/* Terms */}
              <p className="text-xs text-gray-400 text-center">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline">Terms</Link> and{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
                <p className="text-gray-500">
                  Code sent to <span className="text-gray-900 font-medium">{email}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-4">
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-transparent focus:border-gray-900 focus:bg-white focus:outline-none transition-all"
                      maxLength={1}
                    />
                  ))}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Verify Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVerifyOTP()}
                disabled={otp.some(d => !d) || loading}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </motion.button>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-gray-400 text-sm">
                    Resend code in <span className="text-gray-900 font-medium">{resendTimer}s</span>
                  </p>
                ) : (
                  <button onClick={handleResendOTP} className="text-gray-900 font-medium text-sm underline">
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Change Email */}
              <button
                onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="w-full text-gray-500 text-sm"
              >
                Wrong email? <span className="text-gray-900 font-medium underline">Change</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
