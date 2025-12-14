"use client";
import {
  Search,
  Instagram,
  Youtube,
  Users,
  Globe,
  Megaphone,
  Check,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import {
  INDIAN_STATES,
  validatePhoneNumber,
  validatePinCode,
} from "@/lib/indianStates";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
      <motion.div
        className="h-full bg-gradient-to-r from-gray-700 to-black rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

const stepVariants = {
  initial: { opacity: 0, x: 30, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -30, scale: 0.95 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ALL_INTERESTS = [
  "Baggy Shirts",
  "Oversized T-Shirts",
  "Crop Tops",
  "High Waist Jeans",
  "Low Rise Pants",
  "Mom Jeans",
  "Dad Sneakers",
  "Chunky Sneakers",
  "Platform Shoes",
  "Y2K Fashion",
  "Vintage",
  "Retro",
  "Street Style",
  "Hip Hop",
  "Skater Style",
  "Grunge",
  "Punk",
  "Goth",
  "Emo",
  "Chokers",
  "Oversized Hoodies",
  "Baggy Pants",
  "Cargo Pants",
  "Athleisure",
  "Streetwear",
  "Trendy Dresses",
  "Mini Skirts",
  "Micro Shorts",
  "Tank Tops",
  "Tube Tops",
  "Bralettes",
  "Mesh Tops",
  "Fishnet",
  "Leather Jackets",
  "Denim Jackets",
  "Oversized Blazers",
  "Trendy Accessories",
  "Chain Necklaces",
  "Hoop Earrings",
  "Statement Rings",
  "Trendy Bags",
  "Crossbody Bags",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const REFERRAL_SOURCES = [
  {
    label: "Google",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>`
  },
  {
    label: "Instagram",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>`
  },
  {
    label: "Friend",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`
  },
  {
    label: "Facebook",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>`
  },
  {
    label: "YouTube",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
    </svg>`
  },
  {
    label: "Other",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>`
  },
];

export default function Onboarding() {
  const router = useRouter();
  const token = getSessionToken();
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const ob = useQuery(
    api.users.getOnboarding,
    me?._id ? { userId: me._id } : "skip"
  );

  const saveProfile = useMutation(api.users.saveProfile);
  const savePhoneAndAddress = useMutation(api.users.savePhoneAndAddress);
  const setStep = useMutation(api.users.setOnboardingStep);
  const complete = useMutation(api.users.completeOnboarding);

  const [photoUrl, setPhotoUrl] = useState("/user.png");
  const [interests, setInterests] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  // Address and phone state
  const [selectedState, setSelectedState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");

  // Referral source
  const [referralSource, setReferralSource] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const step = useMemo(() => ob?.onboardingStep || 1, [ob]);
  const totalSteps = 4;

  useEffect(() => {
    if (me === undefined) return;
    if (!me) {
      router.push("/login");
      return;
    }
    if (ob?.onboardingCompleted) router.push("/");

    const ls = JSON.parse(localStorage.getItem("ob-cache") || "{}");
    setPhotoUrl(ob?.photoUrl ?? ls.photoUrl ?? "");
    setInterests(ob?.interests ?? ls.interests ?? []);

    // Load existing data
    if (ob?.phoneNumber && !ob?.phoneNumberLocked) {
      setPhoneNumber(ob.phoneNumber);
    }
    // Load address data from permanentAddress (backward compatibility) or address field
    if (ob?.permanentAddress && !ob?.permanentAddressLocked) {
      setSelectedState(ob.permanentAddress.state || "");
      setCity(ob.permanentAddress.city || "");
      setPinCode(ob.permanentAddress.pinCode || "");
      setFullAddress(ob.permanentAddress.fullAddress || "");
    } else if (ob?.address) {
      setSelectedState(ob.address.state || "");
      setCity(ob.address.city || "");
      setPinCode(ob.address.pinCode || "");
      setFullAddress(ob.address.fullAddress || "");
    }
  }, [me, ob, router]);

  useEffect(() => {
    localStorage.setItem("ob-cache", JSON.stringify({ photoUrl, interests }));
  }, [photoUrl, interests]);

  if (me === undefined || ob === undefined) return null;

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (data?.url) setPhotoUrl(data.url);
  };

  const nextFromProfile = async () => {
    if (!photoUrl) {
      toast.error("Please upload a profile picture");
      return;
    }
    await saveProfile({ userId: me._id, photoUrl, interests });
    await setStep({ userId: me._id, step: 2 });
  };

  const nextFromSizeInterests = async () => {
    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }
    if (interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    await saveProfile({ userId: me._id, interests, selectedSizes });
    await setStep({ userId: me._id, step: 3 });
  };

  const validateAndSaveAddress = async () => {
    setIsSubmitting(true);
    setErrors({});

    const newErrors = {};

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.message;
    }

    // Validate state
    if (!selectedState.trim()) {
      newErrors.state = "Please select a state";
    }

    // Validate city
    if (!city.trim()) {
      newErrors.city = "Please enter your city";
    }

    // Validate PIN code
    const pinValidation = validatePinCode(pinCode);
    if (!pinValidation.isValid) {
      newErrors.pinCode = pinValidation.message;
    }

    // Validate full address
    if (!fullAddress.trim()) {
      newErrors.fullAddress = "Please enter your full address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await savePhoneAndAddress({
        userId: me._id,
        phoneNumber: phoneValidation.cleanPhone,
        secondaryPhoneNumber: secondaryPhone,
        state: selectedState,
        city: city.trim(),
        pinCode: pinValidation.cleanPin,
        fullAddress: fullAddress.trim(),
      });
      await setStep({ userId: me._id, step: 4 });
    } catch (error) {
      setErrors({ submit: error.message });
      toast.error(error.message || "Failed to save contact details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finish = async () => {
    if (!referralSource) {
      toast.error("Please select how you found us");
      return;
    }
    await complete({ userId: me._id, referralSource });
    confetti({ particleCount: 160, spread: 70, origin: { y: 0.6 } });
    localStorage.removeItem("ob-cache");
    setTimeout(() => router.push("/"), 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 md:p-4 p-2 flex justify-center items-start">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-4 space-y-8"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/logo.png" alt="AesthetX" width={150} height={100} />
          </div>

          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </span>
          </div>
        </motion.div>

        <ProgressBar step={step} total={totalSteps} />

        <AnimatePresence mode="wait">
        {step === 1 && (
  <motion.div
    key="s1"
    variants={stepVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="space-y-10"
  >
    {/* Header Section */}
    <motion.div
      className="text-center space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center space-x-3 mb-4">
        <motion.div
          className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm "
          whileHover={{ scale: 1.15, rotate: 6 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
        >
         <img src="https://aesthetxways.com/favicon.png" alt="AesthetX" width={150} height={100} />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Welcome to <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AesthetX</span>
        </h2>
      </div>
      <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Let’s personalize your journey — set up your profile to unlock the best experience.
      </p>
    </motion.div>

    {/* Action Section */}
    <motion.div
      className="flex flex-col items-center space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Continue button */}
      <motion.div className="flex justify-center w-full" variants={itemVariants}>
        <motion.button
          onClick={nextFromProfile}
          // disabled={!photoUrl}
          className="group relative w-full max-w-sm py-3.5 bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-xl text-lg font-semibold shadow-lg overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="relative z-10 flex items-center justify-center">
            Continue
            <svg
              className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
          {/* Animated gradient glow */}
          <span className="absolute inset-0 bg-gradient-to-r from-gray-700/30 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
      </motion.div>
    </motion.div>
  </motion.div>
)}


          {step === 2 && (
            <motion.div
              key="s2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 px-4"
            >
              {/* Header */}
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-r from-gray-700 to-black rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Size & Style
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  Choose your perfect fits
                </p>
              </motion.div>

              {/* Sizes */}
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="space-y-3" variants={itemVariants}>
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="text-base font-medium text-gray-800">
                      Your Size
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZES.map((size, index) => (
                      <motion.button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSizes((prev) =>
                            prev.includes(size)
                              ? prev.filter((s) => s !== size)
                              : [...prev, size]
                          );
                        }}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedSizes.includes(size)
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Interests */}
                <motion.div className="space-y-3" variants={itemVariants}>
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <h3 className="text-base font-medium text-gray-800">
                      Your Style
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_INTERESTS.map((tag, index) => (
                      <motion.button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setInterests((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                        className={`px-3 py-2 text-sm rounded-lg border transition ${
                          interests.includes(tag)
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Continue button */}
              <motion.div
                className="flex justify-center"
                variants={itemVariants}
              >
                <motion.button
                  onClick={nextFromSizeInterests}
                  disabled={
                    selectedSizes.length === 0 || interests.length === 0
                  }
                  className="w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg text-base font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue
                  <svg
                    className="w-4 h-4 ml-1 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 px-4"
            >
              {/* Header */}
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-r from-gray-700 to-black rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Contact & Address
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  We’ll use this for deliveries and updates
                </p>
              </motion.div>

              {/* Form */}
              <motion.div
                className="space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* State + City */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={itemVariants}
                >
                  {/* State */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>State *</span>
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        if (errors.state)
                          setErrors((prev) => ({ ...prev, state: "" }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.state
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-red-600 text-xs">{errors.state}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>City *</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (errors.city)
                          setErrors((prev) => ({ ...prev, city: "" }));
                      }}
                      placeholder="Enter your city"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.city
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-600 text-xs">{errors.city}</p>
                    )}
                  </div>
                </motion.div>

                {/* PIN + Phone */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={itemVariants}
                >
                  {/* PIN */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>PIN Code *</span>
                    </label>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setPinCode(value);
                        if (errors.pinCode)
                          setErrors((prev) => ({ ...prev, pinCode: "" }));
                      }}
                      placeholder="6-digit PIN"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.pinCode
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      maxLength={6}
                    />
                    {errors.pinCode && (
                      <p className="text-red-600 text-xs">{errors.pinCode}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>Main Phone *</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setPhoneNumber(value);
                        if (errors.phoneNumber)
                          setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                      }}
                      placeholder="10-digit number"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.phoneNumber
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      maxLength={10}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-600 text-xs">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Secondary Phone */}
                <motion.div className="space-y-2" variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Secondary Phone (Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setSecondaryPhone(value);
                    }}
                    placeholder="Enter secondary phone"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    maxLength={10}
                  />
                </motion.div>

                {/* Full Address */}
                <motion.div className="space-y-2" variants={itemVariants}>
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Full Address *</span>
                  </label>
                  <textarea
                    value={fullAddress}
                    onChange={(e) => {
                      setFullAddress(e.target.value);
                      if (errors.fullAddress)
                        setErrors((prev) => ({ ...prev, fullAddress: "" }));
                    }}
                    placeholder="House no., street, area, landmark"
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none ${
                      errors.fullAddress
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.fullAddress && (
                    <p className="text-red-600 text-xs">{errors.fullAddress}</p>
                  )}
                </motion.div>
              </motion.div>

              {/* Continue Button */}
              <motion.div
                className="flex justify-center"
                variants={itemVariants}
              >
                <motion.button
                  onClick={validateAndSaveAddress}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg text-base font-medium shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <svg
                        className="w-4 h-4 ml-1 inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              {/* Title */}
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Search className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="md:text-3xl text-xl font-semibold text-gray-900">
                    How did you find us?
                  </h2>
                </div>
                <p className="text-gray-600 max-w-md mx-auto">
                  This helps us improve our reach and connect with more people like you
                </p>
              </motion.div>

              {/* Referral Source Options */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {REFERRAL_SOURCES.map((source, index) => (
                  <motion.button
                    key={source.label}
                    type="button"
                    onClick={() => setReferralSource(source.label)}
                    className={`group relative px-6 py-4 rounded-xl border-2 font-medium transition-all duration-300 ${
                      referralSource === source.label
                        ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 scale-105 shadow-lg ring-2 ring-purple-200"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:scale-105 hover:shadow-md"
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        referralSource === source.label 
                          ? "bg-purple-100" 
                          : "bg-gray-100 group-hover:bg-purple-100"
                      }`}>
                        <span 
                          className="w-5 h-5" 
                          dangerouslySetInnerHTML={{ __html: source.icon }} 
                        />
                      </div>
                      <span className="text-sm font-medium">{source.label}</span>
                    </div>
                    
                    {/* Selection indicator */}
                    {referralSource === source.label && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </motion.div>

              {/* Additional Options */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">Don't see your source?</p>
                  <button
                    onClick={() => setReferralSource("Other")}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      referralSource === "Other"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 text-gray-600 hover:border-purple-300"
                    }`}
                  >
                    Select "Other" above
                  </button>
                </div>
              </motion.div>

              {/* Fun fact section */}
              <motion.div
                className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900">Fun Fact!</p>
                    <p className="text-xs text-purple-700">
                      {referralSource === "Google" && "Most of our users discover us through search!"}
                      {referralSource === "Instagram" && "Instagram users love our trendy collections!"}
                      {referralSource === "Friend" && "Word of mouth is our best marketing!"}
                      {referralSource === "Facebook" && "Facebook community helps us grow!"}
                      {referralSource === "YouTube" && "YouTube viewers appreciate our style guides!"}
                      {referralSource === "Other" && "We love hearing about new discovery channels!"}
                      {!referralSource && "Your choice will help us understand our reach better!"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Progress indicator */}
              <motion.div
                className="text-center space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                </div>
                <p className="text-xs text-gray-500">Almost there! One more step...</p>
              </motion.div>

              {/* Finish Button */}
              <motion.div
                className="flex justify-center"
                variants={itemVariants}
              >
                <motion.button
                  onClick={finish}
                  disabled={!referralSource}
                  className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-xl flex items-center gap-3 overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: referralSource ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </motion.div>
                    Complete Setup
                    <motion.div
                      animate={{ x: referralSource ? 5 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </motion.div>
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
