"use client";
import { useEffect, useState } from 'react';
import { useGuestCart } from '@/hooks/useGuestCart';
import { useGuestOrders } from '@/hooks/useGuestOrders';

export default function GuestDataSync({ userId, isLoggedIn }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const { guestCart, clearGuestCart, getGuestCartSummary } = useGuestCart();
  const { guestOrders, clearGuestOrders } = useGuestOrders();

  useEffect(() => {
    // Only sync once when user logs in and has guest data
    if (isLoggedIn && userId && !synced && !syncing) {
      const hasGuestData = guestCart.length > 0 || guestOrders.length > 0;
      
      if (hasGuestData) {
        syncGuestData();
      }
    }
  }, [isLoggedIn, userId, synced, syncing]);

  const syncGuestData = async () => {
    setSyncing(true);
    
    try {
      const response = await fetch('/api/sync-guest-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          guestCart,
          guestOrders,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        
        // Clear local storage after successful sync
        clearGuestCart();
        clearGuestOrders();
        
        setSynced(true);
        
        // Show success message
        if (data.results.cartSynced > 0 || data.results.ordersSynced > 0) {
          // You can show a toast notification here
        }
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}
