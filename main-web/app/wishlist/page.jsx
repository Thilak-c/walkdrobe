"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Trash2, 
  Package,
  ShoppingCart,
  ArrowLeft,
  Lock,
  Check
} from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
      setToken(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Get user data
  const me = useQuery(api.users.meByToken, token ? { token } : "skip");
  
  useEffect(() => {
    if (me) {
      setIsLoggedIn(true);
    } else if (token && !me) {
      setIsLoggedIn(false);
    }
  }, [me, token]);

  // Wishlist and cart data
  const userWishlist = useQuery(api.wishlist.getUserWishlist, me ? { userId: me._id } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");
  
  // Mutations
  const removeFromWishlistMutation = useMutation(api.wishlist.removeFromWishlist);
  const clearWishlistMutation = useMutation(api.wishlist.clearWishlist);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const result = await removeFromWishlistMutation({ 
        userId: me._id, 
        productId 
      });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || 'Failed to remove item from wishlist');
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) return;
    
    try {
      const result = await clearWishlistMutation({ userId: me._id });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || 'Failed to clear wishlist');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto px-6"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Login Required</h2>
          <p className="text-gray-600">Please login to view and manage your wishlist.</p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Login
              </motion.button>
            </Link>
            <Link href="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-gray-900 rounded-xl font-medium border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!userWishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your wishlist...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </motion.button>
            
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Heart className="w-6 h-6 lg:w-7 lg:h-7 text-red-500" />
              <span>My Wishlist</span>
            </h1>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </motion.header>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 mx-4 max-w-sm w-full"
          >
            <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12"
      >
        {userWishlist.items && userWishlist.items.length > 0 ? (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Wishlist Items ({userWishlist.itemCount})</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearWishlist}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Wishlist</span>
              </motion.button>
            </div>
            
            {/* Wishlist Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userWishlist.items.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Product Card */}
                  <ProductCard
                    img={item.productImage}
                    name={item.productName}
                    category={item.category}
                    price={item.price}
                    productId={item.productId}
                    className="w-full"
                  />
                  
                  {/* Delete Icon Overlay */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <p className="text-gray-600">Manage your wishlist items</p>
                </div>
                <div className="flex space-x-3">
                  <Link href="/">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <Package className="w-4 h-4" />
                      <span>Continue Shopping</span>
                    </motion.button>
                  </Link>
                  
                  {cartSummary && cartSummary.totalItems > 0 && (
                    <Link href="/cart">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>View Cart ({cartSummary.totalItems})</span>
                      </motion.button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Empty Wishlist State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 lg:py-24"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Start building your wishlist by adding products you love! You can save items for later and add them to your cart when you're ready to buy.
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Package className="w-6 h-6" />
                <span>Start Shopping</span>
              </motion.button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 