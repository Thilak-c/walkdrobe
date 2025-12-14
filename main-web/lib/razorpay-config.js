// Razorpay Configuration
export const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RDcVm4BfKKWhfj',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'UFLme0txKNEAV2uKKbng1sLC',
};

// Validate configuration
export const validateRazorpayConfig = () => {
  if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
    throw new Error('Razorpay API keys are not configured');
  }
  return true;
}; 