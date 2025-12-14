import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Track user activity
export const trackActivity = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    activityType: v.string(),
    actionType: v.optional(v.string()),
    page: v.string(),
    previousPage: v.optional(v.string()),
    actionData: v.optional(v.any()),
    deviceInfo: v.object({
      deviceType: v.string(),
      browser: v.string(),
      os: v.string(),
      screenResolution: v.optional(v.string())
    }),
    referrer: v.optional(v.string()),
    duration: v.optional(v.number()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    postal: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Insert activity record
    await ctx.db.insert("userActivity", {
      userId: args.userId,
      sessionId: args.sessionId,
      activityType: args.activityType,
      actionType: args.actionType,
      page: args.page,
      previousPage: args.previousPage,
      actionData: args.actionData,
      deviceType: args.deviceInfo.deviceType,
      browser: args.deviceInfo.browser,
      os: args.deviceInfo.os,
      screenResolution: args.deviceInfo.screenResolution,
      referrer: args.referrer,
      duration: args.duration,
      city: args.city,
      country: args.country,
      postal: args.postal,
      timestamp: new Date().toISOString(),
      isAnonymized: !args.userId
    });

    // Update or create active session
    const existingSession = await ctx.db
      .query("activeSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existingSession) {
      // Update existing session
      const updateData = {
        currentPage: args.page,
        lastActivity: new Date().toISOString(),
        pageViews: existingSession.pageViews + (args.activityType === 'page_view' ? 1 : 0),
        actionsCount: existingSession.actionsCount + (args.activityType === 'action' ? 1 : 0),
        sessionDuration: Date.now() - new Date(existingSession.sessionStart).getTime(),
        isActive: true
      };

      // If user just logged in (session was anonymous, now has userId), update userId
      if (args.userId && !existingSession.userId) {
        updateData.userId = args.userId;
      }

      await ctx.db.patch(existingSession._id, updateData);
    } else {
      // Create new session
      await ctx.db.insert("activeSessions", {
        sessionId: args.sessionId,
        userId: args.userId,
        currentPage: args.page,
        lastActivity: new Date().toISOString(),
        deviceType: args.deviceInfo.deviceType,
        browser: args.deviceInfo.browser,
        os: args.deviceInfo.os,
        city: args.city,
        country: args.country,
        postal: args.postal,
        pageViews: args.activityType === 'page_view' ? 1 : 0,
        actionsCount: args.activityType === 'action' ? 1 : 0,
        sessionStart: new Date().toISOString(),
        sessionDuration: 0,
        isActive: true
      });
    }

    return { success: true };
  }
});

// Get active users
export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const activeSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter by last activity time
    const recentlyActive = activeSessions.filter(
      session => session.lastActivity >= fiveMinutesAgo
    );

    // Batch fetch unique users to reduce DB calls
    const uniqueUserIds = [...new Set(recentlyActive.map(s => s.userId).filter(Boolean))];
    const userMap = new Map();

    // Fetch all users in parallel
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (user) {
          userMap.set(userId, {
            name: user.name || user.email,
            email: user.email
          });
        }
      })
    );

    // Map sessions with cached user data
    const sessionsWithUsers = recentlyActive.map((session) => ({
      ...session,
      user: session.userId ? userMap.get(session.userId) || null : null
    }));

    return {
      count: sessionsWithUsers.length,
      sessions: sessionsWithUsers
    };
  }
});

// Get user activity history
export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    activityType: v.optional(v.string())
  },
  handler: async (ctx, { userId, limit = 50, activityType }) => {
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    if (activityType) {
      return activities.filter(a => a.activityType === activityType);
    }

    return activities;
  }
});

// Get page analytics
export const getPageAnalytics = query({
  args: {
    page: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, { page, startDate, endDate }) => {
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_page", (q) => q.eq("page", page))
      .collect();

    // Filter by date range if provided
    let filtered = activities;
    if (startDate) {
      filtered = filtered.filter(a => a.timestamp >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(a => a.timestamp <= endDate);
    }

    const uniqueUsers = new Set(filtered.map(a => a.userId).filter(Boolean));
    const totalDuration = filtered.reduce((sum, a) => sum + (a.duration || 0), 0);

    return {
      totalViews: filtered.length,
      uniqueUsers: uniqueUsers.size,
      avgDuration: filtered.length > 0 ? totalDuration / filtered.length : 0,
      activities: filtered
    };
  }
});

// Get overall activity statistics
export const getActivityStats = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, { startDate, endDate }) => {
    // Limit to last 24 hours for better performance
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const effectiveStartDate = startDate || oneDayAgo;

    // Use index and limit the query
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .take(5000); // Limit to recent 5000 activities

    // Filter by date range
    let filtered = activities.filter(a => a.timestamp >= effectiveStartDate);
    if (endDate) {
      filtered = filtered.filter(a => a.timestamp <= endDate);
    }

    const uniqueUsers = new Set(filtered.map(a => a.userId).filter(Boolean));
    const uniqueSessions = new Set(filtered.map(a => a.sessionId));

    // Top pages
    const pageCount = {};
    filtered.forEach(a => {
      pageCount[a.page] = (pageCount[a.page] || 0) + 1;
    });
    const topPages = Object.entries(pageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Device breakdown
    const deviceBreakdown = {};
    filtered.forEach(a => {
      deviceBreakdown[a.deviceType] = (deviceBreakdown[a.deviceType] || 0) + 1;
    });

    // Browser breakdown
    const browserBreakdown = {};
    filtered.forEach(a => {
      browserBreakdown[a.browser] = (browserBreakdown[a.browser] || 0) + 1;
    });

    return {
      totalActivities: filtered.length,
      uniqueUsers: uniqueUsers.size,
      uniqueSessions: uniqueSessions.size,
      pageViews: filtered.filter(a => a.activityType === 'page_view').length,
      actions: filtered.filter(a => a.activityType === 'action').length,
      topPages,
      deviceBreakdown,
      browserBreakdown
    };
  }
});

// Get recent activities (for activity feed)
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    activityType: v.optional(v.string())
  },
  handler: async (ctx, { limit = 50, activityType }) => {
    // Fetch more than needed if filtering by type
    const fetchLimit = activityType ? limit * 3 : limit;

    let activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .take(fetchLimit);

    if (activityType) {
      activities = activities.filter(a => a.activityType === activityType).slice(0, limit);
    }

    // Batch fetch unique users to reduce DB calls
    const uniqueUserIds = [...new Set(activities.map(a => a.userId).filter(Boolean))];
    const userMap = new Map();

    // Fetch all users in parallel
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (user) {
          userMap.set(userId, {
            name: user.name || user.email,
            email: user.email
          });
        }
      })
    );

    // Map activities with cached user data
    const activitiesWithUsers = activities.map((activity) => ({
      ...activity,
      user: activity.userId ? userMap.get(activity.userId) || null : null
    }));

    return activitiesWithUsers;
  }
});

// Cleanup inactive sessions (public mutation)
export const cleanupInactiveSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const allSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    let cleanedCount = 0;
    for (const session of allSessions) {
      if (session.lastActivity < fiveMinutesAgo) {
        await ctx.db.patch(session._id, { isActive: false });
        cleanedCount++;
      }
    }

    return { success: true, cleanedCount };
  }
});

// Internal mutation for cron job
export const cleanupInactiveSessionsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const allSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    let cleanedCount = 0;
    for (const session of allSessions) {
      if (session.lastActivity < fiveMinutesAgo) {
        await ctx.db.patch(session._id, { isActive: false });
        cleanedCount++;
      }
    }

    return { success: true, cleanedCount };
  }
});

// Get session details
export const getSessionDetails = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (!session) {
      return null;
    }

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    return {
      session,
      activities,
      activityCount: activities.length
    };
  }
});

// Get page views analytics for a single day (for progressive loading)
export const getPageViewsForSingleDay = query({
  args: {
    dayOffset: v.number(), // 0 = today, 1 = yesterday, 2 = 2 days ago, etc.
  },
  handler: async (ctx, { dayOffset }) => {
    // Calculate the specific day
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const startDate = targetDate.toISOString();
    const endDate = nextDay.toISOString();
    // Fetch page view activities for specific date range
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const pageViews = activities.filter(
      a => a.activityType === "page_view" &&
        a.timestamp >= startDate &&
        a.timestamp <= endDate
    );

    // Group by hour
    const hourlyViews = {};
    const hourlyVisitors = {};

    pageViews.forEach(a => {
      const date = new Date(a.timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour % 12 || 12;
      const hourKey = `${month}/${day} ${displayHour}${ampm}`;

      hourlyViews[hourKey] = (hourlyViews[hourKey] || 0) + 1;

      if (!hourlyVisitors[hourKey]) {
        hourlyVisitors[hourKey] = new Set();
      }
      hourlyVisitors[hourKey].add(a.sessionId);
    });

    const hourlyData = Object.entries(hourlyViews)
      .map(([hour, views]) => ({
        hour,
        views,
        uniqueVisitors: hourlyVisitors[hour]?.size || 0
      }));

    return {
      hourlyViews: hourlyData,
      totalViews: pageViews.length,
      uniqueVisitors: new Set(pageViews.map(a => a.sessionId)).size,
    };
  }
});

// Get analytics for a single day (optimized for progressive loading)
export const getAnalyticsForDay = query({
  args: {
    date: v.string(), // Format: "YYYY-MM-DD"
  },
  handler: async (ctx, { date }) => {
    const startTime = Date.now();

    // Parse date and create day boundaries
    const [year, month, day] = date.split('-').map(Number);

    // Validate date
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date: ${date}`);
    }

    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const startTs = startOfDay.toISOString();
    const endTs = endOfDay.toISOString();

    console.log(`Querying analytics for ${date} (${startTs} to ${endTs})`);

    // Query with a reasonable limit and filter
    // Since we can't filter by timestamp range in Convex query directly,
    // we take recent activities and filter client-side
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .take(5000); // Limit to recent 5000 activities for performance

    const pageViews = activities.filter(
      a => a.activityType === "page_view" &&
        a.timestamp >= startTs &&
        a.timestamp <= endTs
    );

    // Aggregate into 24 hourly buckets (0-23)
    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      views: 0,
      uniqueVisitors: new Set(),
    }));

    const pageCount = {};
    const deviceCount = {};
    const browserCount = {};

    pageViews.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const hour = activityDate.getUTCHours();

      // Hourly aggregation
      hourlyBuckets[hour].views++;
      hourlyBuckets[hour].uniqueVisitors.add(activity.sessionId);

      // Top pages
      pageCount[activity.page] = (pageCount[activity.page] || 0) + 1;

      // Device breakdown
      deviceCount[activity.deviceType] = (deviceCount[activity.deviceType] || 0) + 1;

      // Browser breakdown
      browserCount[activity.browser] = (browserCount[activity.browser] || 0) + 1;
    });

    // Format hourly data
    const hourlyViews = hourlyBuckets.map(bucket => ({
      hour: bucket.hour,
      views: bucket.views,
      uniqueVisitors: bucket.uniqueVisitors.size,
    }));

    // Top pages
    const topPages = Object.entries(pageCount)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const durationMs = Date.now() - startTime;

    return {
      date,
      hourlyViews,
      topPages,
      deviceBreakdown: deviceCount,
      browserBreakdown: browserCount,
      meta: {
        date,
        startTs,
        endTs,
        durationMs,
        totalViews: pageViews.length,
        uniqueVisitors: new Set(pageViews.map(a => a.sessionId)).size,
      },
    };
  }
});

// Get page views analytics with time-based data (DEPRECATED - use getAnalyticsForDay)
export const getPageViewsAnalytics = query({
  args: {
    timeRange: v.optional(v.string())
  },
  handler: async (ctx, { timeRange = "24h" }) => {
    // Calculate time range
    let startTime;
    if (timeRange === "24h") {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    } else if (timeRange === "7d") {
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const startTimeISO = startTime.toISOString();

    // Fetch page view activities - no limit, get all data
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const pageViews = activities.filter(
      a => a.activityType === "page_view" && a.timestamp >= startTimeISO
    );

    // Calculate stats
    const totalViews = pageViews.length;
    const uniqueVisitors = new Set(pageViews.map(a => a.sessionId)).size;
    const totalDuration = pageViews.reduce((sum, a) => sum + (a.duration || 0), 0);
    const avgDuration = totalViews > 0 ? totalDuration / totalViews : 0;

    // Calculate bounce rate (sessions with only 1 page view)
    const sessionPageCounts = {};
    pageViews.forEach(a => {
      sessionPageCounts[a.sessionId] = (sessionPageCounts[a.sessionId] || 0) + 1;
    });
    const bouncedSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
    const bounceRate = uniqueVisitors > 0 ? (bouncedSessions / uniqueVisitors) * 100 : 0;

    // Group by hour for chart - always use hourly granularity
    const hourlyViews = {};
    const hourlyVisitors = {};

    pageViews.forEach(a => {
      const date = new Date(a.timestamp);
      let hourKey;

      if (timeRange === "24h") {
        // For 24h: just show hour (0:00, 1:00, etc.)
        hourKey = `${date.getHours()}:00`;
      } else {
        // For 7d and 30d: show date + hour (e.g., "12/30 1pm")
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 || 12;
        hourKey = `${month}/${day} ${displayHour}${ampm}`;
      }

      hourlyViews[hourKey] = (hourlyViews[hourKey] || 0) + 1;

      // Track unique visitors per hour
      if (!hourlyVisitors[hourKey]) {
        hourlyVisitors[hourKey] = new Set();
      }
      hourlyVisitors[hourKey].add(a.sessionId);
    });

    const hourlyData = Object.entries(hourlyViews)
      .map(([hour, views]) => ({
        hour,
        views,
        uniqueVisitors: hourlyVisitors[hour]?.size || 0
      }))
      .sort((a, b) => {
        if (timeRange === "24h") {
          return parseInt(a.hour) - parseInt(b.hour);
        }
        // For date-based sorting, extract date and hour
        const parseDateTime = (str) => {
          const [datePart, timePart] = str.split(' ');
          const [month, day] = datePart.split('/').map(Number);
          const isPM = timePart.includes('pm');
          const hour = parseInt(timePart);
          const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
          return new Date(2024, month - 1, day, hour24).getTime();
        };
        return parseDateTime(a.hour) - parseDateTime(b.hour);
      });

    // Top pages
    const pageCount = {};
    const pageVisitors = {};
    pageViews.forEach(a => {
      pageCount[a.page] = (pageCount[a.page] || 0) + 1;
      if (!pageVisitors[a.page]) {
        pageVisitors[a.page] = new Set();
      }
      pageVisitors[a.page].add(a.sessionId);
    });

    const topPages = Object.entries(pageCount)
      .map(([page, views]) => ({
        page,
        views,
        uniqueVisitors: pageVisitors[page].size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top pages trend over time - use same hourly format
    const pageHourlyViews = {};
    pageViews.forEach(a => {
      const date = new Date(a.timestamp);
      let hourKey;

      if (timeRange === "24h") {
        hourKey = `${date.getHours()}:00`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 || 12;
        hourKey = `${month}/${day} ${displayHour}${ampm}`;
      }

      if (!pageHourlyViews[hourKey]) {
        pageHourlyViews[hourKey] = {};
      }
      pageHourlyViews[hourKey][a.page] = (pageHourlyViews[hourKey][a.page] || 0) + 1;
    });

    const topPagesTrend = Object.entries(pageHourlyViews)
      .map(([hour, pages]) => {
        const dataPoint = { hour };
        topPages.forEach(topPage => {
          dataPoint[topPage.page] = pages[topPage.page] || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => {
        if (timeRange === "24h") {
          return parseInt(a.hour) - parseInt(b.hour);
        }
        // For date-based sorting
        const parseDateTime = (str) => {
          const [datePart, timePart] = str.split(' ');
          const [month, day] = datePart.split('/').map(Number);
          const isPM = timePart.includes('pm');
          const hour = parseInt(timePart);
          const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
          return new Date(2024, month - 1, day, hour24).getTime();
        };
        return parseDateTime(a.hour) - parseDateTime(b.hour);
      });

    // Device breakdown
    const deviceBreakdown = {};
    pageViews.forEach(a => {
      deviceBreakdown[a.deviceType] = (deviceBreakdown[a.deviceType] || 0) + 1;
    });

    // Browser breakdown
    const browserBreakdown = {};
    pageViews.forEach(a => {
      browserBreakdown[a.browser] = (browserBreakdown[a.browser] || 0) + 1;
    });

    return {
      totalViews,
      uniqueVisitors,
      avgDuration,
      bounceRate,
      hourlyViews: hourlyData,
      topPages,
      topPagesTrend,
      deviceBreakdown,
      browserBreakdown
    };
  }
});


// Get payment methods analytics from orders
export const getPaymentMethodsAnalytics = query({
  args: {
    startDate: v.optional(v.string()), // Format: "YYYY-MM-DD"
    endDate: v.optional(v.string()),   // Format: "YYYY-MM-DD"
  },
  handler: async (ctx, { startDate, endDate }) => {
    // Get all orders
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .collect();

    // Filter by date range if provided
    let filteredOrders = orders;
    
    if (startDate) {
      const startTs = new Date(startDate).getTime();
      filteredOrders = filteredOrders.filter(o => o.createdAt >= startTs);
    }
    
    if (endDate) {
      const endTs = new Date(endDate).setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter(o => o.createdAt <= endTs);
    }

    // Separate cancelled orders
    const activeOrders = filteredOrders.filter(o => o.status !== "cancelled");
    const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled");

    // Payment method breakdown (active orders only for revenue)
    const paymentMethods = {};
    const paymentMethodRevenue = {};
    const dailyPaymentData = {};

    // Order status breakdown
    const orderStatusBreakdown = {};
    filteredOrders.forEach(order => {
      const status = order.status || "unknown";
      orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1;
    });

    // Cancelled orders by payment method
    const cancelledByMethod = {};
    const cancelledRevenue = {};
    cancelledOrders.forEach(order => {
      const method = order.paymentDetails?.paymentMethod || "razorpay";
      const amount = order.orderTotal || 0;
      cancelledByMethod[method] = (cancelledByMethod[method] || 0) + 1;
      cancelledRevenue[method] = (cancelledRevenue[method] || 0) + amount;
    });

    activeOrders.forEach(order => {
      const method = order.paymentDetails?.paymentMethod || "razorpay";
      const amount = order.orderTotal || 0;
      const orderDate = new Date(order.createdAt);
      const dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;

      // Count by payment method
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      
      // Revenue by payment method
      paymentMethodRevenue[method] = (paymentMethodRevenue[method] || 0) + amount;

      // Daily breakdown
      if (!dailyPaymentData[dateKey]) {
        dailyPaymentData[dateKey] = {
          date: dateKey,
          razorpay: 0,
          cod: 0,
          hybrid: 0,
          cancelled: 0,
          razorpayRevenue: 0,
          codRevenue: 0,
          hybridRevenue: 0,
          total: 0,
          totalRevenue: 0,
        };
      }
      
      if (method === "cod") {
        dailyPaymentData[dateKey].cod++;
        dailyPaymentData[dateKey].codRevenue += amount;
      } else if (method === "hybrid") {
        dailyPaymentData[dateKey].hybrid++;
        dailyPaymentData[dateKey].hybridRevenue += amount;
      } else {
        dailyPaymentData[dateKey].razorpay++;
        dailyPaymentData[dateKey].razorpayRevenue += amount;
      }
      dailyPaymentData[dateKey].total++;
      dailyPaymentData[dateKey].totalRevenue += amount;
    });

    // Add cancelled orders to daily data
    cancelledOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
      
      if (!dailyPaymentData[dateKey]) {
        dailyPaymentData[dateKey] = {
          date: dateKey,
          razorpay: 0,
          cod: 0,
          cancelled: 0,
          razorpayRevenue: 0,
          codRevenue: 0,
          total: 0,
          totalRevenue: 0,
        };
      }
      dailyPaymentData[dateKey].cancelled++;
    });

    // Convert daily data to sorted array
    const dailyData = Object.values(dailyPaymentData)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Format for display
    const formattedDailyData = dailyData.map(day => {
      const [, m, d] = day.date.split('-');
      return {
        ...day,
        displayDate: `${m}/${d}`,
      };
    });

    return {
      paymentMethods,
      paymentMethodRevenue,
      dailyData: formattedDailyData,
      totalOrders: filteredOrders.length,
      activeOrders: activeOrders.length,
      cancelledOrders: cancelledOrders.length,
      cancelledByMethod,
      cancelledRevenue,
      totalCancelledRevenue: cancelledOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0),
      orderStatusBreakdown,
      totalRevenue: activeOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0),
    };
  }
});
