// hooks/useGuestOrders.js
import { useState, useEffect } from 'react';

const GUEST_ORDERS_KEY = 'walkdrobe_guest_orders';

export function useGuestOrders() {
  const [guestOrders, setGuestOrders] = useState([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem(GUEST_ORDERS_KEY);
    if (savedOrders) {
      try {
        setGuestOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Error loading guest orders:', error);
        setGuestOrders([]);
      }
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(guestOrders));
  }, [guestOrders]);

  const addGuestOrder = (order) => {
    const newOrder = {
      ...order,
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    setGuestOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const getGuestOrderByNumber = (orderNumber) => {
    return guestOrders.find((order) => order.orderNumber === orderNumber);
  };

  const clearGuestOrders = () => {
    setGuestOrders([]);
    localStorage.removeItem(GUEST_ORDERS_KEY);
  };

  return {
    guestOrders,
    addGuestOrder,
    getGuestOrderByNumber,
    clearGuestOrders,
  };
}
