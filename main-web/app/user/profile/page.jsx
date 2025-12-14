"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Phone, 
  Heart, 
  Mail, 
  Camera,
  Save,
  X,
  Plus,
  Sparkles,
  Settings,
  LogOut,
  Edit2,
  Check,
  Home
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePageRedesign() {
  const router = useRouter();
  
  const [token, setToken] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // Convex queries and mutations
  const me = useQuery(api.users.meByToken, { token: token || "" });
  const updateProfile = useMutation(api.users.updateUserProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [newInterest, setNewInterest] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    address: {
      state: "",
      city: "",
      pinCode: "",
      fullAddress: ""
    },
    interests: [],
    photoUrl: ""
  });

  const statesAndCities = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezu", "Ziro"],
    "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Haryana": ["Gurgaon", "Faridabad", "Chandigarh", "Panipat", "Hisar"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Solan"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar"],
    "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Serchhip"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer"],
    "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Lachung"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Vellore"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
  };

  const popularInterests = [
    "Baggy Shirts", "Oversized T-Shirts", "Crop Tops", "High Waist Jeans", 
    "Street Style", "Hip Hop", "Vintage", "Y2K Fashion", "Athleisure",
    "Cargo Pants", "Platform Shoes", "Chunky Sneakers", "Leather Jackets"
  ];

  // Get session token from cookies (client-side only)
  useEffect(() => {
    setIsClient(true);
    const getSessionToken = () => {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      return match ? match[1] : null;
    };
    
    const sessionToken = getSessionToken();
    setToken(sessionToken);
  }, []);

  // Populate form data when user data is loaded
  useEffect(() => {
    if (me) {
      setFormData({
        name: me.name || "",
        email: me.email || "",
        phoneNumber: me.phoneNumber || "",
        secondaryPhoneNumber: me.secondaryPhoneNumber || "",
        address: me.address && typeof me.address === 'object' ? me.address : {
          state: "",
          city: "",
          pinCode: "",
          fullAddress: me.address || ""
        },
        interests: me.interests || [],
        photoUrl: me.photoUrl || ""
      });
      setPreviewUrl(me.photoUrl || "");
    }
  }, [me]);

  // Redirect to login if no session token
  useEffect(() => {
    if (isClient && !token) {
      router.push('/login');
    }
  }, [token, router, isClient]);

  // Show loading while client is initializing
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-900 text-lg font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!me) {
    if (token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-900 text-lg font-medium">Loading your profile...</p>
            <p className="text-slate-600 text-sm mt-2">Please wait while we fetch your information</p>
          </div>
        </div>
      );
    } else {
      router.push('/login');
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-900 text-lg font-medium">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  }

  // Check if user is deleted or inactive
  if (me.isDeleted || me.isActive === false) {
    router.push('/login');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-900 text-lg font-medium">Redirecting to login...</p>
          <p className="text-slate-600 text-sm mt-2">Your account is not active</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 1024 * 1024) {
        compressImage(file, (compressedFile) => {
          setSelectedFile(compressedFile);
          createPreview(compressedFile);
          processPhoto(compressedFile);
          toast.success('Image compressed and ready to save!');
        });
      } else {
        setSelectedFile(file);
        createPreview(file);
        processPhoto(file);
      }
    }
  };

  const processPhoto = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      setFormData(prev => ({
        ...prev,
        photoUrl: base64String
      }));
      setPreviewUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const createPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file, callback) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      const maxSize = 800;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        callback(compressedFile);
      }, 'image/jpeg', 0.7);
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }

    try {
      setBusy(true);
      setError("");

      await updateProfile({
        userId: me._id,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber || undefined,
        secondaryPhoneNumber: formData.secondaryPhoneNumber || undefined,
        address: formData.address.state ? formData.address : undefined,
        interests: formData.interests,
        photoUrl: formData.photoUrl || undefined,
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSelectedFile(null);
    setPreviewUrl(formData.photoUrl || "");
    if (me) {
      setFormData({
        name: me.name || "",
        email: me.email || "",
        phoneNumber: me.phoneNumber || "",
        secondaryPhoneNumber: me.secondaryPhoneNumber || "",
        address: me.address && typeof me.address === 'object' ? me.address : {
          state: "",
          city: "",
          pinCode: "",
          fullAddress: me.address || ""
        },
        interests: me.interests || [],
        photoUrl: me.photoUrl || ""
      });
    }
  };

  const addInterest = (interest) => {
    const trimmedInterest = typeof interest === 'string' ? interest.trim() : interest;
    if (trimmedInterest && !formData.interests.includes(trimmedInterest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, trimmedInterest]
      }));
      toast.success(`Added "${trimmedInterest}" to your interests!`);
    }
  };

  const removeInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
    toast.success(`Removed "${interest}" from your interests!`);
  };

  const handleLogout = () => {
    document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
    toast.success("Logged out successfully!");
  };

  const tabs = [
    { id: "personal", label: "Personal", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "interests", label: "Interests", icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradiet-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shad-lg">
               <img src="/fav.png" alt="" />
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                AesthetX
              </span>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/">
                <button className="p-2 lg:p-3 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <Home className="w-5 h-5 text-slate-600" />
                </button>
              </Link>
              <button className="p-2 lg:p-3 hover:bg-slate-100 rounded-xl transition-all duration-200">
                <a href="/user/settings">
                <Settings className="w-5 h-5 text-slate-600" />
                </a>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 lg:p-3 hover:bg-rose-100 rounded-xl transition-all duration-200 group"
              >
                <LogOut className="w-5 h-5 text-slate-600 group-hover:text-rose-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Hero Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 lg:mb-12 overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative p-4 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 lg:gap-4">
              {/* Profile Photo with Glow */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                  {previewUrl || formData.photoUrl ? (
                    <img
                      src={previewUrl || formData.photoUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-4 border-white shadow-2xl">
                      <User className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-3 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200">
                      <Camera className="w-5 h-5 text-slate-900" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-xl lg:text-2xl font-normal mb-2">{formData.name}</h1>
                    <p className="text-slate-300 flex items-center justify-center lg:justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      {formData.email}
                    </p>
                  </div>

                  {/* Edit Toggle Button */}
                  <motion.button
                    onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                    disabled={busy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                      isEditing
                        ? "bg-white text-slate-900"
                        : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-5 h-5" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-5 h-5" />
                        Edit Profile
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="px-3 py-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30">
                    ✓ Active
                  </span>
                  <span className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/20">
                    Member since {new Date(me._creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-3 lg:p-10"
          >
            {activeTab === "personal" && (
              <div className="space-y-3">
                <h2 className="text-base font-normal text-slate-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      disabled={!isEditing}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-600"
                      />
                      <span className="absolute right-3 top-3 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">Primary Phone</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      disabled={!isEditing}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">Secondary Phone</label>
                    <input
                      type="tel"
                      value={formData.secondaryPhoneNumber}
                      disabled={!isEditing}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryPhoneNumber: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "address" && (
              <div className="space-y-3">
                <h2 className="text-base font-normal text-slate-900 mb-4">Address Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">State</label>
                    <select
                      value={formData.address.state}
                      disabled={!isEditing}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value, city: '' }
                      }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <option value="">Select State</option>
                      {Object.keys(statesAndCities).map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">City</label>
                    <select
                      value={formData.address.city}
                      disabled={!isEditing || !formData.address.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <option value="">Select City</option>
                      {formData.address.state && statesAndCities[formData.address.state]?.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-700 mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={formData.address.pinCode}
                      disabled={!isEditing}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, pinCode: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                        isEditing
                          ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-700 mb-2">Full Address</label>
                  <textarea
                    value={formData.address.fullAddress}
                    disabled={!isEditing}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, fullAddress: e.target.value }
                    }))}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-xl border-2 transition-all duration-200 resize-none ${
                      isEditing
                        ? "border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  />
                </div>
              </div>
            )}

            {activeTab === "interests" && (
              <div className="space-y-3">
                <h2 className="text-base font-normal text-slate-900 mb-4">Your Interests</h2>
                
                <div className="flex flex-wrap gap-3 mb-3">
                  {formData.interests.map((interest, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-full font-medium shadow-lg"
                    >
                      {interest}
                      {isEditing && (
                        <button
                          onClick={() => removeInterest(interest)}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </motion.span>
                  ))}
                </div>

                {isEditing && (
                  <>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add custom interest..."
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newInterest.trim()) {
                            addInterest(newInterest.trim());
                            setNewInterest('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newInterest.trim()) {
                            addInterest(newInterest.trim());
                            setNewInterest('');
                          }
                        }}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">Popular Interests:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {popularInterests.map((interest) => (
                          <button
                            key={interest}
                            onClick={() => addInterest(interest)}
                            disabled={formData.interests.includes(interest)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              formData.interests.includes(interest)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white border-2 border-slate-200 hover:border-slate-900"
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Save Button */}
        <AnimatePresence>
          {isEditing && (
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              disabled={busy}
              className="fixed bottom-8 right-8 p-5 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-full shadow-2xl hover:shadow-slate-500/50 transition-all duration-300 z-50 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="animate-spin w-7 h-7 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Check className="w-7 h-7 group-hover:rotate-12 transition-transform" />
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 right-8 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-xl z-50"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
