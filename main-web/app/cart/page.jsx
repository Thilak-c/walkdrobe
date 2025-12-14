"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  X,
  Lock,
  Package,
  Truck,
  CreditCard,
  Heart
} from "lucide-react";

export default function CartPage() {
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

  // Cart data
  const userCart = useQuery(api.cart.getUserCart, me ? { userId: me._id } : "skip");
  const cartSummary = useQuery(api.cart.getCartSummary, me ? { userId: me._id } : "skip");
  
  // Cart mutations
  const updateCartQuantityMutation = useMutation(api.cart.updateCartQuantity);
  const removeFromCartMutation = useMutation(api.cart.removeFromCart);
  const clearCartMutation = useMutation(api.cart.clearCart);
  const toggleWishlistMutation = useMutation(api.wishlist.toggleWishlist);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    try {
      const result = await updateCartQuantityMutation({
        cartItemId,
        quantity: newQuantity,
      });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      const result = await removeFromCartMutation({ cartItemId });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    
    try {
      const result = await clearCartMutation({ userId: me._id });
      showToastMessage(result.message);
    } catch (error) {
      showToastMessage(error.message || 'Failed to clear cart');
    }
  };

  const handleMoveToWishlist = async (item) => {
    try {
      // First add to wishlist
      const wishlistResult = await toggleWishlistMutation({
        userId: me._id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price,
        category: item.category || 'General',
      });

      if (wishlistResult.success) {
        // Then remove from cart
        const cartResult = await removeFromCartMutation({ cartItemId: item._id });
        
        if (cartResult.success) {
          showToastMessage(`${item.productName} moved to wishlist successfully!`);
        } else {
          showToastMessage('Added to wishlist but failed to remove from cart');
        }
      } else {
        showToastMessage('Failed to add to wishlist');
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to move item to wishlist');
    }
  };

  const handleCheckout = () => {
    if (!userCart?.items || userCart.items.length === 0) {
      showToastMessage('Your cart is empty');
      return;
    }
    router.push('/checkout');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm mx-auto"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
          <p className="text-sm text-gray-600">Please login to view your cart and manage your items.</p>
          <div className="flex flex-col space-y-2">
            <Link href="/login" className="w-full">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                Login
              </motion.button>
            </Link>
            <Link href="/signup" className="w-full">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium border border-gray-900 hover:bg-gray-900 hover:text-white transition-colors text-sm"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!userCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 font-medium">Loading your cart...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-16 lg:pb-0">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-20">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 text-black lg:w-5 lg:h-5 mr-1.5 lg:mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm hidden text-black sm:inline">Back</span>
            </motion.button>
            
            <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 flex justify-center items-center space-x-1.5 lg:space-x-2">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7" />
              <span className="hidden sm:inline">Shopping Cart</span>
              <span className="sm:hidden">Cart</span>
            </h1>
            
            <div className="w-16 lg:w-20"></div> {/* Spacer for centering */}
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
            className="fixed top-16 lg:top-20 left-1/2 transform -translate-x-1/2 z-50 mx-3 max-w-xs w-full"
          >
            <div className="bg-gray-900 text-white px-3 py-2.5 rounded-lg shadow-2xl border border-gray-700 flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="font-medium text-sm">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-3 lg:px-8 py-4 lg:py-12"
      >
        {userCart.items && userCart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 lg:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Cart Items ({userCart.itemCount})</h2>
              </div>
              
              <div className="space-y-2.5 lg:space-y-4">
                {userCart.items.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg lg:rounded-2xl border border-gray-200 p-3 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-2.5 lg:space-x-4">
                      {/* Product Image */}
                      <div className="relative w-[80px] h-[100px] sm:w-14 sm:h-14 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-lg lg:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover object-center"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate">{item.productName}</h3>
                        <p className="text-gray-600 my-1 text-xs sm:text-sm">Size: {item.size}</p>
                        <div className="flex items-baseline space-x-1.5 sm:space-x-2 lg:space-x-3">
                  <span className="text-[13px] sm:text-base lg:text-lg font-bold text-gray-900"> <span className="text-green-800">₹</span>{item.price}</span>
                  <span className="text-[11px] sm:text-[13px] lg:text-base text-gray-400 line-through"><span className="text-gray-500">₹</span>{Math.round(item.price * 1.2)}</span>
                </div>
                        
                        {/* Mobile: Quantity Controls */}
                        <div className="flex items-center space-x-1.5 mt-1.5 lg:hidden">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            className="p-1 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </motion.button>
                          
                          <span className="w-6 text-center font-bold text-gray-900 text-xs">{item.quantity}</span>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            className="p-1 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Desktop: Quantity Controls */}
                      <div className="hidden lg:flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          className="p-2 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        
                        <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          className="p-2 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="mt-2.5 lg:mt-4 pt-2.5 lg:pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Item Total:</span>
                      <span className="font-bold text-[13px] sm:text-base lg:text-lg text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 lg:mt-4 flex items-center space-x-2">
                      {/* Remove from Cart Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRemoveItem(item._id)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-red-100 text-black hover:text-red-800 rounded-lg transition-colors border border-black/5 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Remove from Cart</span>
                      </motion.button>

                      {/* Add to Wishlist Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMoveToWishlist(item)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-pink-100 text-black hover:text-pink-800 rounded-lg transition-colors border border-black/5 hover:border-pink-300"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Move to Wishlist</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Cart Summary - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {/* Items */}
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({userCart.totalItems})</span>
                    <span>₹{(userCart.totalPrice * 1.2).toFixed(2)}</span>
                  </div>
                  
                  {/* Discount */}
                  <div className="flex justify-between text-green-600">
                    <span>Discount </span>
                    <span>- ₹{(userCart.totalPrice * 0.24).toFixed(2)}</span>
                  </div>
                  
                  {/* Coupon */}
                  <div className="flex justify-between text-gray-500">
                    <span>Coupons</span>
                    <span>No coupons available for now</span>
                  </div>
                  
                  {/* Protection Fee */}
                  <div className="flex justify-between text-gray-600">
                    <span>Protection Fee</span>
                    <span>₹{(userCart.totalItems * 9).toFixed(2)}</span>
                  </div>
                  
                  {/* Delivery Fee */}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className={userCart.totalPrice >= 999 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                      {userCart.totalPrice >= 999 ? 'Free' : '₹50.00'}
                    </span>
                  </div>
                  
                  {/* Shipping */}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{(userCart.totalPrice + (userCart.totalItems * 9) + (userCart.totalPrice >= 999 ? 0 : 50)).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Savings Info */}
                  <div className="text-center pt-2">
                    <span className="text-sm text-green-600 font-medium">
                      You saved ₹{(userCart.totalPrice * 0.24).toFixed(2)} on this order!
                    </span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Proceed to Checkout</span>
                </motion.button>
                
                
              </motion.div>
            </div>

            {/* Price Details Section - At the end of the page */}
            <div className="lg:col-span-3 mt-8 lg:mt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm"
              >
                {/* Header with Price Details and Collapsible Icon */}
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900">Price Details</h3>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Dashed Separator Line */}
                <div className="border-t border-dashed border-gray-300 mb-3 lg:mb-4"></div>
                
                {/* Price Breakdown */}
                <div className="space-y-3 lg:space-y-4">
                  {/* Price (1 item) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm lg:text-base font-bold text-gray-700">Price (1 item)</span>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-bold">i</span>
                      </div>
                    </div>
                    <span className="text-sm lg:text-base font-bold text-gray-900">₹{(userCart.totalPrice * 1.2).toFixed(2)}</span>
                  </div>
                  
                  {/* Discount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm lg:text-base font-bold text-gray-700">Discount </span>
                    <span className="text-sm lg:text-base font-bold text-green-600">- ₹{(userCart.totalPrice * 0.24).toFixed(2)}</span>
                  </div>
                  
                  {/* Coupons for you */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm lg:text-base font-bold text-gray-700">Coupons</span>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-bold">i</span>
                      </div>
                    </div>
                    <span className="text-sm lg:text-base font-bold text-gray-500">No coupons available for now</span>
                  </div>
                  
                  {/* Protect Promise Fee */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm lg:text-base font-bold text-gray-700">Protect Promise Fee</span>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-bold">i</span>
                      </div>
                    </div>
                    <span className="text-sm lg:text-base font-bold text-gray-900">₹{(userCart.totalItems * 9).toFixed(2)}</span>
                  </div>
                  
                  {/* Delivery Fee */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm lg:text-base font-bold text-gray-700">Delivery Fee</span>
                    <span className={`text-sm lg:text-base font-bold ${userCart.totalPrice >= 999 ? 'text-green-600' : 'text-gray-900'}`}>
                      {userCart.totalPrice >= 999 ? 'Free' : '₹50.00'}
                    </span>
                  </div>
                  
                  {/* Dashed Separator Line */}
                  <div className="border-t border-dashed border-gray-300 pt-3 lg:pt-4"></div>
                  
                  {/* Total Amount */}
                  <div className="flex items-center justify-between pt-2 lg:pt-3">
                    <span className="text-base lg:text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-base lg:text-lg font-bold text-gray-900">
                      ₹{(userCart.totalPrice + (userCart.totalItems * 9) + (userCart.totalPrice >= 999 ? 0 : 50)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Savings Banner */}
                <div className="mt-4 lg:mt-6 bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xs lg:text-sm">%</span>
                    </div>
                    <span className="text-sm lg:text-base font-bold text-green-800">
                      You saved ₹{(userCart.totalPrice * 0.24).toFixed(2)} on this order!
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 lg:py-24"
          >
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
              <ShoppingCart className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">Your cart is empty</h2>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 max-w-sm lg:max-w-md mx-auto px-3">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 lg:px-8 py-2.5 lg:py-4 bg-gray-900 text-white rounded-lg lg:rounded-xl font-semibold text-sm lg:text-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Package className="w-4 h-4 lg:w-6 lg:h-6" />
                <span>Start Shopping</span>
              </motion.button>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Bottom Navbar with Checkout */}
      {userCart.items && userCart.items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-3 py-2.5"
        >
          <div className="flex items-center justify-between">
            {/* Order Summary */}
            <div className="flex-1">
              <div className="text-xs text-gray-600">
                <span>Total ({userCart.totalItems} items): </span>
                <span className="font-bold text-[13px] text-gray-900">₹{(userCart.totalPrice + (userCart.totalItems * 9) + (userCart.totalPrice >= 999 ? 0 : 50)).toFixed(2)}</span>
              </div>
            </div>
            
            {/* Checkout Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg flex items-center space-x-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
} 