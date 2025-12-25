"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrophySpin } from "react-loading-indicators";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailOtpModal({ open, onClose, returnUrl }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [gifAvailable, setGifAvailable] = useState(true);
  const [step, setStep] = useState("closed"); // closed, opening, open, sending, sent, verifying, success
  const [gifPlaying, setGifPlaying] = useState(false);
  const GIF_DURATION = 1400; // ms to wait before showing next section (tuneable)
  const gifTimerRef = useRef(null);
  const createSession = useMutation(api.auth.createSessionForEmail);

  useEffect(() => {
    if (open) {
      setStep("opening");
      const t = setTimeout(() => setStep("open"), 20);
      return () => clearTimeout(t);
    } else {
      setStep("closed");
    }
  }, [open]);

  // lock background scroll / hide horizontal overflow while modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverflowX = document.documentElement.style.overflowX;
    const prevPaddingRight = document.body.style.paddingRight;
    if (open) {
      // prevent layout shift when hiding scrollbar by compensating with padding
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflowX = "hidden";
    }
    return () => {
      document.body.style.overflow = prevOverflow || "";
      document.documentElement.style.overflowX = prevOverflowX || "";
      document.body.style.paddingRight = prevPaddingRight || "";
      if (gifTimerRef.current) {
        clearTimeout(gifTimerRef.current);
        gifTimerRef.current = null;
      }
    };
  }, [open]);

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setStep("sending");
    // play GIF first
    setGifPlaying(true);
    if (gifTimerRef.current) clearTimeout(gifTimerRef.current);
    gifTimerRef.current = setTimeout(() => {
      setGifPlaying(false);
      gifTimerRef.current = null;
    }, GIF_DURATION);
    try {
      const res = await fetch("/api/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) setOtpSent(true);
      else alert(data.message || "Failed to send OTP");
    } catch (e) { console.error(e); alert("Failed to send OTP"); }
    finally { setLoading(false); setStep("sent"); }
  };

  const verifyOtp = async () => {
    if (!email || !otp) return;
    setLoading(true);
    setStep("verifying");
    // play GIF while verifying
    setGifPlaying(true);
    if (gifTimerRef.current) clearTimeout(gifTimerRef.current);
    gifTimerRef.current = setTimeout(() => {
      setGifPlaying(false);
      gifTimerRef.current = null;
    }, GIF_DURATION);
    try {
      const res = await fetch("/api/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!data.success) { alert(data.message || "OTP verification failed"); setLoading(false); setStep("open"); return; }

      const result = await createSession({ email });
      if (result && result.sessionToken) {
        // show success briefly
        setStep("success");
        await new Promise((r) => setTimeout(r, 700));
        document.cookie = `sessionToken=${encodeURIComponent(result.sessionToken)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
        onClose && onClose();
        if (returnUrl) router.push(returnUrl);
        else router.refresh();
      } else {
        alert("Failed to create session");
        setStep("open");
      }
    } catch (e) { console.error(e); alert("Verification failed"); setStep("open"); }
    finally { setLoading(false); }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="otp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => onClose && onClose()}
        >
          <motion.div
            key="otp-panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`bg-white rounded-2xl p-6 w-[90vw] max-w-[90vw] sm:w-full sm:max-w-md mx-auto origin-center overflow-y-auto transform`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold leading-tight">Sign in with Email</h3>
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} onClick={() => onClose && onClose()} className="text-gray-500 transition-transform">Close</motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key={"loading"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex justify-center py-6">
                    {otpSent ? (
                      gifAvailable ? (
                        <motion.img key="verifying-gif" src="/animations/otp-sending.gif" alt="Verifying..." onError={() => setGifAvailable(false)} className="mx-auto w-28 h-28 object-contain" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} />
                      ) : (
                        <TrophySpin color="#000000" size="medium" text={"Verifying..."} textColor="#a09494" />
                      )
                    ) : (
                      gifAvailable ? (
                        <motion.img key="sending-gif" src="/animations/otp-sending.gif" alt="Sending..." onError={() => setGifAvailable(false)} className="mx-auto w-28 h-28 object-contain" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} />
                      ) : (
                        <TrophySpin color="#000000" size="medium" text={"Sending....."} textColor="#a09494" />
                      )
                    )}
                  </motion.div>
                ) : (
                  !otpSent ? (
                    <motion.div key={"enter-email"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 border rounded-lg" />
                      <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} onClick={sendOtp} disabled={loading || !email} className="w-full py-3 bg-gray-900 text-white rounded-lg">Send OTP</motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key={"verify"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                      {gifPlaying && gifAvailable ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-center py-6">
                          <motion.img src="/animations/sending.gif" alt="Processing..." onError={() => setGifAvailable(false)} className="mx-auto w-28 h-28 object-contain" />
                        </motion.div>
                      ) : loading ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-6">
                          <TrophySpin color="#000000" size="medium" text={otpSent ? "Verifying..." : "Sending....."} textColor="#a09494" />
                        </motion.div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">OTP sent to {email}</p>
                          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="w-full px-4 py-3 border rounded-lg" />
                          <div className="flex gap-2">
                            <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} onClick={verifyOtp} disabled={loading || !otp} className={`flex-1 py-3 bg-gray-900 text-white rounded-lg ${step==='verifying' ? 'opacity-80' : ''}`}>Verify & Continue</motion.button>
                            <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} onClick={() => { setOtpSent(false); setOtp(""); }} className="py-3 px-4 border rounded-lg">Back</motion.button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
