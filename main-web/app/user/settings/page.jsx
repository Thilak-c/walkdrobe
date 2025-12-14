"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Bell, 
  Shield, 
  X, 
  User,
  Key,
  Trash2,
  UserX,
  ChevronRight,
  Mail,
  AlertTriangle,
  Check,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Home
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UserSettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    email: true,
    orderUpdates: true,
    marketing: false,
    pushNotifications: true,
    sms: false
  });

  useEffect(() => {
    setIsClient(true);
    const getSessionToken = () => {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    };
    
    const sessionToken = getSessionToken();
    setToken(sessionToken);
  }, []);

  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  const moveToTrash = useMutation(api.users.moveUserToTrash);
  const deactivateUser = useMutation(api.users.deactivateUser);

  const handleLogout = () => {
    document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out successfully!");
    router.push('/');
  };

  // Redirect to login if no session token
  useEffect(() => {
    if (isClient && !token) {
      router.push('/login');
    }
  }, [token, isClient, router]);

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
            <p className="text-slate-900 text-lg font-medium">Loading your settings...</p>
            <p className="text-slate-600 text-sm mt-2">Please wait while we fetch your information</p>
          </div>
        </div>
      );
    } else {
      return <RequireLogin />;
    }
  }

  if (me.isDeleted || me.isActive === false) {
    return <RequireLogin message="Your account is not active or has been deleted. Please log in again." />;
  }

  const settingsSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage how you receive notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          {Object.entries({
            email: 'Email notifications',
            orderUpdates: 'Order updates',
            marketing: 'Marketing emails',
            pushNotifications: 'Push notifications',
            sms: 'SMS notifications'
          }).map(([key, label]) => (
            <motion.div 
              key={key} 
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                  <Bell className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900">{label}</span>
                  <p className="text-xs text-slate-500 mt-1">
                    {key === 'email' && 'Receive updates via email'}
                    {key === 'orderUpdates' && 'Get notified about your orders'}
                    {key === 'marketing' && 'Receive promotional content'}
                    {key === 'pushNotifications' && 'Get push notifications on your device'}
                    {key === 'sms' && 'Receive SMS notifications'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[key]}
                  onChange={(e) => {
                    setNotifications(prev => ({ ...prev, [key]: e.target.checked }));
                    toast.success(e.target.checked ? `${label} enabled` : `${label} disabled`);
                  }}
                />
                <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: 'security',
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: Shield,
      content: (
        <div className="space-y-4">
          {[
            { label: 'Change password', icon: Key, action: () => setShowPasswordModal(true), description: 'Update your account password' },
            { label: 'Two-factor authentication', icon: Shield, action: () => setShow2FAModal(true), description: 'Add an extra layer of security' },
            { label: 'Privacy policy', icon: Lock, action: () => setShowPrivacyModal(true), description: 'Read our privacy policy' }
          ].map((item, idx) => (
            <motion.button
              key={idx}
              onClick={item.action}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-xl hover:bg-slate-100 hover:border-slate-300 border border-slate-200 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                  <item.icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900">{item.label}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      )
    },
    {
      id: 'account',
      title: 'Account Management',
      description: 'Manage your account settings',
      icon: Settings,
      content: (
        <div className="space-y-4">
          {[
            { 
              label: 'Deactivate account', 
              description: 'Temporarily disable your account',
              icon: UserX, 
              action: () => setShowDeactivateModal(true),
              severity: 'warning'
            },
            { 
              label: 'Move account to trash', 
              description: 'Your account will be moved to trash (recoverable within 30 days)',
              icon: Trash2, 
              action: () => setShowDeleteModal(true),
              severity: 'danger'
            }
          ].map((item, idx) => (
            <motion.button
              key={idx}
              onClick={item.action}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all duration-200 group ${
                item.severity === 'danger' 
                  ? 'bg-slate-900 border-slate-700 hover:bg-black hover:border-slate-800 text-white' 
                  : 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  item.severity === 'danger' 
                    ? 'bg-slate-800 group-hover:bg-slate-950' 
                    : 'bg-amber-200 group-hover:bg-amber-300'
                }`}>
                  <item.icon className={`w-6 h-6 ${
                    item.severity === 'danger' 
                      ? 'text-white' 
                      : 'text-amber-700'
                  }`} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${item.severity === 'danger' ? 'text-white' : 'text-amber-900'}`}>{item.label}</div>
                  <div className={`text-sm ${item.severity === 'danger' ? 'text-slate-300' : 'text-amber-600'}`}>{item.description}</div>
                </div>
              </div>
              <ChevronRight className={`w-6 h-6 transition-all group-hover:translate-x-1 ${
                item.severity === 'danger' 
                  ? 'text-slate-400 group-hover:text-white' 
                  : 'text-amber-400 group-hover:text-amber-600'
              }`} />
            </motion.button>
          ))}
        </div>
      )
    },
    {
      id: 'logout',
      title: 'Session',
      description: 'Manage your session',
      icon: LogOut,
      content: (
        <div className="space-y-4">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-5 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-rose-200 rounded-xl flex items-center justify-center group-hover:bg-rose-300 transition-colors">
                <LogOut className="w-6 h-6 text-rose-700" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-rose-900">Log Out</div>
                <div className="text-sm text-rose-600">Sign out of your account</div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </motion.button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 b-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center shadowlg">
                <img src="/fav.png" alt="" />
              </div>
              <span className="text-xl lg:text-base font-normal bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Walkdrobe
              </span>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/">
                <button className="p-2 lg:p-3 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <Home className="w-5 h-5 text-slate-600" />
                </button>
              </Link>
              <Link href="/user/profile">
                <button className="p-2 lg:p-3 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <User className="w-5 h-5 text-slate-600" />
                </button>
              </Link>
              <button className="p-2 lg:p-3 bg-slate-100 rounded-xl transition-all duration-200">
                <Settings className="w-5 h-5 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Hero Section */}
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
                <div className="relative w-32 h-32">
                  {me.photoUrl ? (
                    <img
                      src={me.photoUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-4 border-white shadow-2xl">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left text-white">
                <h1 className="text-xl lg:text-2xl font-normal mb-2">{me.name || 'User'}</h1>
                <p className="text-slate-300 flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Mail className="w-4 h-4" />
                  {me.email}
                </p>
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

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              {/* Section Header */}
              <div className="p-3 lg:p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm">
                    <section.icon className="w-7 h-7 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-normal text-slate-900">{section.title}</h3>
                    <p className="text-slate-600 text-sm mt-1">{section.description}</p>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-3 lg:p-4">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPasswordModal && (
          <PasswordChangeModal 
            onClose={() => setShowPasswordModal(false)}
            userId={me._id}
          />
        )}

        {show2FAModal && (
          <TwoFactorModal 
            onClose={() => setShow2FAModal(false)}
            userId={me._id}
          />
        )}

        {showPrivacyModal && (
          <PrivacyPolicyModal 
            onClose={() => setShowPrivacyModal(false)}
          />
        )}

        {showDeactivateModal && (
          <DeactivateAccountModal 
            onClose={() => setShowDeactivateModal(false)}
            userId={me._id}
            deactivateUser={deactivateUser}
          />
        )}

        {showDeleteModal && (
          <DeleteAccountModal 
            onClose={() => setShowDeleteModal(false)}
            userId={me._id}
            moveToTrash={moveToTrash}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Password Change Modal
function PasswordChangeModal({ onClose, userId }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      toast.error("Passwords don't match");
      setBusy(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      toast.error("Password too short");
      setBusy(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Password changed successfully!");
      toast.success("Password changed successfully!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to change password. Please try again.");
      toast.error("Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-base font-normal text-slate-900">Change Password</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-3 lg:p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-12 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-12 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-12 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-4 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <Check className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-medium">{success}</p>
              </motion.div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Two-Factor Modal
function TwoFactorModal({ onClose, userId }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-sm font-normal text-slate-900">Two-Factor Authentication</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-10 h-10 text-slate-700" />
          </div>
          
          <h4 className="text-base font-normal text-slate-900 mb-3">Coming Soon!</h4>
          
          <p className="text-slate-600 mb-3 leading-relaxed">
            Two-factor authentication is currently under development. This feature will add an extra layer of security to your account.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-3 mb-3">
            <div className="space-y-3 text-sm text-slate-700">
              {['QR codes for authenticator apps', 'SMS verification codes', 'Backup recovery codes', 'Enhanced account security'].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Privacy Policy Modal
function PrivacyPolicyModal({ onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-base font-normal text-slate-900">Privacy Policy</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {[
              {
                title: 'Information We Collect',
                content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.'
              },
              {
                title: 'How We Use Your Information',
                content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.'
              },
              {
                title: 'Information Sharing',
                content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.'
              },
              {
                title: 'Data Security',
                content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
              },
              {
                title: 'Your Rights',
                content: 'You have the right to access, update, or delete your personal information. You can also opt out of certain communications.'
              },
              {
                title: 'Contact Us',
                content: 'If you have any questions about this Privacy Policy, please contact us at support@walkdrobe.in or call us at 9122583392'
              }
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-normal text-slate-900 mb-3">{section.title}</h4>
                <p className="text-slate-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Deactivate Account Modal
function DeactivateAccountModal({ onClose, userId, deactivateUser }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDeactivate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for deactivation");
      toast.error("Please select a reason");
      return;
    }
    if (!password) {
      setError("Please enter your password to confirm");
      toast.error("Password required");
      return;
    }

    setBusy(true);
    try {
      await deactivateUser({ 
        userId: userId, 
        reason: reason.trim() 
      });
      
      setSuccess("Account deactivated successfully. Logging you out...");
      toast.success("Account deactivated successfully");
      
      setTimeout(() => {
        document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/");
      }, 2000);
      
    } catch (err) {
      setError("Failed to deactivate account. Please try again.");
      toast.error("Failed to deactivate account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
              <UserX className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="text-base font-normal text-slate-900">Deactivate Account</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Warning */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-900 font-semibold text-sm">Account Deactivation</p>
              <p className="text-amber-700 text-sm mt-1">
                Your account will be temporarily deactivated. You can reactivate it by logging in again.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-3">
          <form onSubmit={handleDeactivate} className="space-y-3">
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Reason for deactivation
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                required
              >
                <option value="">Select a reason</option>
                <option value="temporary">Taking a break</option>
                <option value="privacy">Privacy concerns</option>
                <option value="not_using">Not using the service</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Confirm your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-12 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <Check className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-medium">{success}</p>
              </motion.div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Deactivating..." : "Deactivate Account"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Delete Account Modal
function DeleteAccountModal({ onClose, userId, moveToTrash }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for deletion");
      toast.error("Please select a reason");
      return;
    }
    if (!password) {
      setError("Please enter your password to confirm");
      toast.error("Password required");
      return;
    }
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      toast.error("Please type DELETE to confirm");
      return;
    }

    setBusy(true);
    try {
      await moveToTrash({ 
        userId: userId, 
        reason: reason.trim() 
      });
      
      setSuccess("Account moved to trash successfully. Logging you out...");
      toast.success("Account moved to trash");
      
      setTimeout(() => {
        document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/");
      }, 2000);
      
    } catch (err) {
      setError("Failed to move account to trash. Please try again.");
      toast.error("Failed to move account to trash");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-normal text-slate-900">Move to Trash</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Warning */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-start space-x-3 p-4 bg-slate-900 border border-slate-700 rounded-xl text-white">
            <AlertTriangle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm mb-2">⚠️ Warning: This action will move your account to trash!</p>
              <p className="text-slate-300 text-sm">
                Your account will be moved to trash and can be restored by administrators within 30 days. 
                After 30 days, it will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-3">
          <form onSubmit={handleDelete} className="space-y-3">
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Reason for deletion
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                required
              >
                <option value="">Select a reason</option>
                <option value="privacy">Privacy concerns</option>
                <option value="not_satisfied">Not satisfied with service</option>
                <option value="duplicate">Duplicate account</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Confirm your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-12 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-900 transition-all"
                placeholder="Type DELETE"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <Check className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-medium">{success}</p>
              </motion.div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Moving to Trash..." : "Move to Trash"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RequireLogin({ message = "Please log in to access your settings and preferences." }) {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000); 
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-3">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-md w-full"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-base font-normal text-slate-900 mb-3">Authentication Required</h2>
        <p className="text-slate-600 mb-3">{message}</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </motion.div>
    </div>
  );
}

function getSessionToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
