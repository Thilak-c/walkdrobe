import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Generate unique session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    // SessionStorage unavailable, use in-memory
    return generateSessionId();
  }
};

// Detect device type
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
};

// Detect browser
const getBrowser = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
};

// Detect OS
const getOS = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// Get device info
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      screenResolution: undefined
    };
  }
  
  return {
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    screenResolution: `${window.screen.width}x${window.screen.height}`
  };
};

// Get user location from IP
const getUserLocation = async () => {
  try {
    // Using ipapi.co for free IP geolocation
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      console.log('Location detected:', data.city, data.country_name, data.postal);
      return {
        city: data.city,
        country: data.country_name,
        region: data.region,
        postal: data.postal
      };
    } else {
      console.error('Location API response not ok:', response.status);
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }
  return null;
};

export const useActivityTracker = (userId) => {
  const trackActivityMutation = useMutation(api.analytics.trackActivity);
  const sessionId = useRef(getSessionId());
  const pageStartTime = useRef(Date.now());
  const locationData = useRef(null);
  const locationFetched = useRef(false);
  const locationPromise = useRef(null);

  // Fetch location once per session
  useEffect(() => {
    if (!locationFetched.current) {
      locationFetched.current = true;
      // Store the promise so we can wait for it
      locationPromise.current = getUserLocation().then(location => {
        locationData.current = location;
        console.log('Location fetched and stored:', location);
        return location;
      });
    }
  }, []);

  // Track page view
  const trackPageView = async (page, metadata = {}) => {
    if (!sessionId.current) return;
    
    try {
      // Wait for location to be fetched (with timeout)
      if (locationPromise.current && !locationData.current) {
        console.log('Waiting for location...');
        await Promise.race([
          locationPromise.current,
          new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
        ]);
      }
      
      const payload = {
        userId: userId || undefined,
        sessionId: sessionId.current,
        activityType: 'page_view',
        page,
        deviceInfo: getDeviceInfo(),
      };
      
      // Add location if available
      if (locationData.current) {
        if (locationData.current.city) payload.city = locationData.current.city;
        if (locationData.current.country) payload.country = locationData.current.country;
        if (locationData.current.postal) payload.postal = locationData.current.postal;
        console.log('Sending location:', payload.city, payload.country, payload.postal);
      } else {
        console.log('No location data available yet');
      }
      
      // Only add optional fields if they have values
      if (metadata.previousPage) {
        payload.previousPage = metadata.previousPage;
      }
      if (typeof document !== 'undefined' && document.referrer) {
        payload.referrer = document.referrer;
      }
      if (metadata.duration) {
        payload.duration = metadata.duration;
      }
      
      await trackActivityMutation(payload);
      
      pageStartTime.current = Date.now();
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  // Track action
  const trackAction = async (actionType, actionData = {}) => {
    if (!sessionId.current) return;
    
    try {
      const payload = {
        userId: userId || undefined,
        sessionId: sessionId.current,
        activityType: 'action',
        actionType,
        page: typeof window !== 'undefined' ? window.location.pathname : '/',
        deviceInfo: getDeviceInfo()
      };
      
      // Only add actionData if it has content
      if (actionData && Object.keys(actionData).length > 0) {
        payload.actionData = actionData;
      }
      
      await trackActivityMutation(payload);
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  // Track event
  const trackEvent = async (eventName, eventData = {}) => {
    if (!sessionId.current) return;
    
    try {
      const payload = {
        userId: userId || undefined,
        sessionId: sessionId.current,
        activityType: 'event',
        actionType: eventName,
        page: typeof window !== 'undefined' ? window.location.pathname : '/',
        deviceInfo: getDeviceInfo()
      };
      
      // Only add eventData if it has content
      if (eventData && Object.keys(eventData).length > 0) {
        payload.actionData = eventData;
      }
      
      await trackActivityMutation(payload);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  // Track page duration on unmount
  useEffect(() => {
    return () => {
      const duration = Date.now() - pageStartTime.current;
      if (duration > 1000 && sessionId.current) {
        // Track page duration when leaving
        trackActivityMutation({
          userId: userId || undefined,
          sessionId: sessionId.current,
          activityType: 'page_view',
          page: typeof window !== 'undefined' ? window.location.pathname : '/',
          deviceInfo: getDeviceInfo(),
          duration
        }).catch(err => console.error('Failed to track page duration:', err));
      }
    };
  }, []);

  return {
    trackPageView,
    trackAction,
    trackEvent,
    sessionId: sessionId.current
  };
};
