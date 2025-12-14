"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export default function PageViewTracker({ userId }) {
  const pathname = usePathname();
  const { trackPageView } = useActivityTracker(userId);
  const previousPath = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const hasTrackedInitial = useRef(false);

  // Wait a moment for user data to load before tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500); // Wait 500ms for user data to load

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only track after we're ready and have pathname
    if (pathname && isReady) {
      // Track initial page view
      if (!hasTrackedInitial.current) {
        hasTrackedInitial.current = true;
        trackPageView(pathname, {
          previousPage: previousPath.current,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined
        });
        previousPath.current = pathname;
      } else {
        // Track subsequent page views immediately
        trackPageView(pathname, {
          previousPage: previousPath.current,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined
        });
        previousPath.current = pathname;
      }
    }
  }, [pathname, isReady]);

  return null;
}
