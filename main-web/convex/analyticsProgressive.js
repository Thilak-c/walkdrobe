import { query } from "./_generated/server";
import { v } from "convex/values";

// Get page views for a single day
export const getPageViewsForDay = query({
  args: {
    dayOffset: v.number(), // 0 = today, 1 = yesterday, 2 = 2 days ago, etc.
  },
  handler: async (ctx, { dayOffset }) => {
    // Calculate the date for this day
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - dayOffset);
    
    // Start and end of the target day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // Fetch activities for this specific day only
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const pageViews = activities.filter(
      a => a.activityType === "page_view" && 
           a.timestamp >= startISO && 
           a.timestamp <= endISO
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
      }))
      .sort((a, b) => {
        const parseTime = (str) => {
          const timePart = str.split(' ')[1];
          const isPM = timePart.includes('pm');
          const hour = parseInt(timePart);
          return isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
        };
        return parseTime(a.hour) - parseTime(b.hour);
      });

    return {
      dayOffset,
      date: `${targetDate.getMonth() + 1}/${targetDate.getDate()}`,
      hourlyViews: hourlyData,
      totalViews: pageViews.length,
      uniqueVisitors: new Set(pageViews.map(a => a.sessionId)).size,
    };
  }
});
