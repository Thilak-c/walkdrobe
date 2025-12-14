"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FiAlertTriangle, 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiMessageSquare,
  FiUserPlus,
  FiPhone,
  FiHelpCircle 
} from "react-icons/fi";

export default function AccountDeleted() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletionInfo, setDeletionInfo] = useState(null);

  useEffect(() => {
    // Get deletion info from URL params (passed from login)
    const info = searchParams.get('info');
    if (info) {
      try {
        setDeletionInfo(JSON.parse(decodeURIComponent(info)));
      } catch (error) {
        console.error('Failed to parse deletion info:', error);
      }
    }
  }, [searchParams]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateNewAccount = () => {
    router.push('/signup');
  };

  const handleContactSupport = () => {
    // You can customize this based on your support system
    const subject = encodeURIComponent('Account Deletion Inquiry');
    const body = encodeURIComponent(
      `Hello,\n\nI'm writing regarding my deleted account:\n\n` +
      `Email: ${deletionInfo?.email}\n` +
      `Name: ${deletionInfo?.name}\n` +
      `Deleted on: ${deletionInfo?.deletedAt ? formatDate(deletionInfo.deletedAt) : 'Unknown'}\n` +
      `Reason: ${deletionInfo?.reason}\n\n` +
      `I would like to discuss this account deletion. Please let me know how we can resolve this.\n\n` +
      `Thank you.`
    );
    
    // Replace with your actual support email
    window.location.href = `mailto:support@yourcompany.com?subject=${subject}&body=${body}`;
  };

  if (!deletionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <motion.div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 space-y-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle size={40} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Deleted</h1>
            <p className="text-lg text-gray-600">
              Your account has been removed by an administrator
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FiUser size={20} />
            Account Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{deletionInfo.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{deletionInfo.email}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FiCalendar className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm text-gray-600">Deleted On</p>
                  <p className="font-medium">{formatDate(deletionInfo.deletedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deletion Reason */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2 mb-3">
            <FiMessageSquare size={18} />
            Reason for Deletion
          </h3>
          <p className="text-red-800 bg-white p-4 rounded border border-red-200">
            {deletionInfo.reason}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notice</h3>
          <ul className="text-yellow-800 space-y-1 text-sm">
            <li>• Your account data has been moved to our secure archive</li>
            <li>• You can no longer access your previous account</li>
            <li>• This email address is now available for new registrations</li>
            <li>• Any subscriptions or services have been canceled</li>
          </ul>
        </div>

        {/* Action Options */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 text-center">What would you like to do?</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Create New Account */}
            <motion.button
              onClick={handleCreateNewAccount}
              className="p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-200 rounded-full flex items-center justify-center group-hover:bg-green-300 transition-colors">
                  <FiUserPlus size={24} className="text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Create New Account</h4>
                  <p className="text-sm text-green-700">
                    Start fresh with a new account using the same or different email
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Contact Support */}
            <motion.button
              onClick={handleContactSupport}
              className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center group-hover:bg-blue-300 transition-colors">
                  <FiHelpCircle size={24} className="text-blue-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Contact Support</h4>
                  <p className="text-sm text-blue-700">
                    Discuss the deletion or request account restoration
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Support Information */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <FiPhone size={16} />
            <span className="text-sm">Need immediate help?</span>
          </div>
          <p className="text-sm text-gray-600">
            Email: <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:underline">support@yourcompany.com</a>
            {" | "}
            Phone: <a href="tel:+1234567890" className="text-blue-600 hover:underline">+1 (234) 567-890</a>
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
} 