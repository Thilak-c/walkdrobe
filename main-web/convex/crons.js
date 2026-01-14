import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// OPTIMIZED: Re-enabled session cleanup cron
// Runs every 5 minutes to clean up inactive sessions
crons.interval(
  "cleanup inactive sessions",
  { minutes: 5 },
  internal.users.cleanupExpiredSessions
);

export default crons;
