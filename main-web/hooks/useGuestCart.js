// hooks/useGuestCart.js
import { useState, useEffect } from 'react';

const GUEST_CART_KEY = 'walkdrobe_guest_cart';

export function useGuestCart() {
  const [guestCart, setGuestCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) {
      try {
        setGuestCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setGuestCart([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
  }, [guestCart]);

  const addToGuestCart = (item) => {
    setGuestCart((prev) => {
      // Check if item already exists (same product and size)
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.size === item.size
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      } else {
        // Add new item
        return [...prev, { ...item, addedAt: new Date().toISOString() }];
      }
    });
  };

  const removeFromGuestCart = (productId, size) => {
    setGuestCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.size === size))
    );
  };

  const updateGuestCartQuantity = (productId, size, quantity) => {
    setGuestCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearGuestCart = () => {
    setGuestCart([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getGuestCartSummary = () => {
    const totalItems = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = guestCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return { totalItems, totalPrice, items: guestCart };
  };

  return {
    guestCart,
    addToGuestCart,
    removeFromGuestCart,
    updateGuestCartQuantity,
    clearGuestCart,
    getGuestCartSummary,
  };
}
