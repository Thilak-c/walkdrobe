"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link"; // Import Link for consistent navigation styling
import { Eye, EyeOff } from "lucide-react"; // Import Eye and EyeOff icons
import toast from "react-hot-toast";

export default function Signup() {
  const router = useRouter();
  const signup = useMutation(api.auth.signup);
  const signIn = useMutation(api.auth.signIn);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // OTP states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    // Clear error when user modifies form fields
    if (error) {
      setError("");
    }
  };

  const sendOtp = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!form.email || !form.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!form.password || form.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsSendingOtp(true);
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes in seconds
        toast.success("OTP sent to your email!");

        // Start countdown timer
        const interval = setInterval(() => {
          setOtpTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) return;
    await sendOtp();
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          otp: otp.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email verified successfully!");
        setIsVerifyingOtp(false); // Stop verifying state before account creation
        // Continue with account creation
        await createAccount();
      } else {
        toast.error(data.message || "Invalid OTP");
        setIsVerifyingOtp(false);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error("Failed to verify OTP. Please try again.");
      setIsVerifyingOtp(false);
    }
  };

  const createAccount = async () => {
    setBusy(true);
    setError("");
    try {
      console.log("Starting signup with:", { email: form.email, name: form.name });
      
      const signupResult = await signup({ email: form.email, password: form.password, name: form.name });
      console.log("Signup result:", signupResult);
      
      // Determine if we're on HTTPS
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = `Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${isSecure ? '; Secure' : ''}`;
      
      // If signup returns a session token directly, use it
      if (signupResult?.sessionToken) {
        document.cookie = `sessionToken=${signupResult.sessionToken}; ${cookieOptions}`;
        router.push("/onboarding");
        return;
      }
      
      console.log("Signing in after signup...");
      const signInResult = await signIn({ email: form.email, password: form.password });
      console.log("SignIn result:", signInResult);
      
      const sessionToken = signInResult?.sessionToken;
      if (!sessionToken) {
        throw new Error("No session token received");
      }
      
      document.cookie = `sessionToken=${sessionToken}; ${cookieOptions}`;
      router.push("/onboarding");
    } catch (err) {
      console.error('Signup error:', err);
      const msg = String(err?.message || "");

      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")) {
        setError("That email is already in use. Try logging in instead.");
        // Reset OTP state so user can try with different email
        setOtpSent(false);
        setOtp("");
        setOtpTimer(0);
      } else if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("constraint")) {
        setError("This email is already registered. Please log in instead.");
        setOtpSent(false);
        setOtp("");
        setOtpTimer(0);
      } else {
        setError("Could not create account. Please try again.");
        setOtpSent(false);
        setOtp("");
        setOtpTimer(0);
      }
    } finally {
      setBusy(false);
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!otpSent) {
      // First step: send OTP
      await sendOtp();
    } else {
      // Second step: verify OTP
      await verifyOtp();
    }
  }

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

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
            {otpSent ? "Verify Your Email" : "Create your account"}
          </h1>
          <p className="text-sm sm:text-base text-gray-700 font-medium">
            {otpSent
              ? "Enter the verification code sent to your email"
              : "Join the AesthetX community"
            }
          </p>
        </div>

        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
            Your Name
          </label>
          <input
            name="name"
            id="name"
            placeholder="Enter your name"
            className="w-full px-5 py-3.5 sm:px-6 sm:py-4 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all shadow-md bg-white/90 text-gray-900 placeholder-gray-600 appearance-none hover:border-gray-600"
            onChange={onChange}
            required
          />
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
              placeholder="Enter your password (min 8 chars)"
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

        {!otpSent ? (
          // Signup form
          <>
            {error && (
              <p className="text-xs sm:text-sm text-red-700 bg-red-100 p-3 sm:p-4 rounded-xl border border-red-300 shadow-md text-center animate-shake">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || isSendingOtp || !form.name.trim() || !form.email || !form.password || form.password.length < 8}
              className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-3.5 sm:py-4 rounded-xl hover:from-black hover:to-gray-950 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95"
            >
              {isSendingOtp ? "Sending OTP..." : "Send OTP & Continue"}
            </button>
          </>
        ) : (
          // OTP verification form
          <>
            {error && (
              <p className="text-xs sm:text-sm text-red-700 bg-red-100 p-3 sm:p-4 rounded-xl border border-red-300 shadow-md text-center animate-shake">
                {error}
              </p>
            )}



            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-gray-800 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                className="w-full px-5 py-3 sm:px-6 sm:py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all shadow-md bg-white/90 text-gray-900 placeholder-gray-600 text-center text-lg font-mono tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!otp || otp.length !== 6 || isVerifyingOtp || busy}
              className="w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-3.5 sm:py-4 rounded-xl hover:from-black hover:to-gray-950 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95"
            >
              {isVerifyingOtp ? "Verifying..." : busy ? "Creating Account..." : "Verify & Create Account"}
            </button>

            <div className="text-center space-y-2">

              <button
                type="button"
                onClick={resendOtp}
                disabled={otpTimer > 0 || isSendingOtp}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors text-sm underline"
              >
                {otpTimer > 0
                  ? `Resend in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                  : "Resend OTP"
                }
              </button>

            </div>
          </>
        )}

        <p className="text-xs sm:text-sm text-center text-gray-700 mt-3 sm:mt-4">
          Already have an account?
          <Link href="/login" className="text-gray-900 hover:text-black font-bold underline ml-1 transition-colors hover:scale-105 inline-block transform hover:-translate-y-0.5 active:scale-95">
            Log in
          </Link>
        </p>
      </motion.form>
    </div>
  );
} 