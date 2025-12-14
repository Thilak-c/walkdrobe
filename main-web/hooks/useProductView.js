import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Hook to automatically track product views when a product card is rendered
 * @param {string} productId - The ID of the product to track
 * @param {object} options - Optional configuration
 * @param {string} options.viewType - Type of view (default: 'product_card')
 * @param {string} options.category - Product category for analytics
 * @param {boolean} options.enabled - Whether tracking is enabled (default: true)
 */
export function useProductView(productId, options = {}) {
  const {
    viewType = 'product_card',
    category = null,
    enabled = true
  } = options;

  const addViewMutation = useMutation(api.views.addView);
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track if enabled, productId exists, and we haven't already tracked this view
    if (!enabled || !productId || hasTracked.current) {
      return;
    }

    // Get session information
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const sessionId = typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('sessionId') || (() => {
          const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('sessionId', newSessionId);
          return newSessionId;
        })()
      : null;

    // Prepare view data
    const viewData = {
      productId: productId,
      viewedAt: new Date().toISOString(),
      sessionId: sessionId,
      viewType: viewType,
    };

    // Add optional fields only if they have values
    if (userAgent) {
      viewData.userAgent = userAgent;
    }
    if (referrer) {
      viewData.referrer = referrer;
    }
    if (category) {
      viewData.category = category;
    }

    // Track the view
    addViewMutation(viewData)
      .then(() => {
        hasTracked.current = true;
      })
      .catch((error) => {
        console.error('Failed to track product view:', error);
      });
  }, [productId, viewType, category, enabled, addViewMutation]);

  // Reset tracking flag when productId changes
  useEffect(() => {
    hasTracked.current = false;
  }, [productId]);
}
