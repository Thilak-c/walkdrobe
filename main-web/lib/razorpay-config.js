// Razorpay Configuration
export const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_RtYKQ2F9glN6Vf",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "40zi1D5usnBIdgWSbIjHBWrt",
};

// Validate configuration
export const validateRazorpayConfig = () => {
  if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
    throw new Error("Razorpay API keys are not configured");
  }
  return true;
}; 