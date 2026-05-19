import { runBackup } from "./backup.js";

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

console.log("\n=======================================================");
console.log("⏰ AUTOMATED CONVEX-TO-MONGODB CRON SCHEDULER STARTED ⏰");
console.log("📊 Backup Cycle: Every 6 Hours");
console.log(`⏱️ Next Scheduled Sync: ${new Date(Date.now() + SIX_HOURS_IN_MS).toLocaleString()}`);
console.log("=======================================================\n");

// 1. Run the initial sync immediately on startup
async function startCron() {
  console.log("Initial startup sync triggered...");
  await runBackup();
  
  // 2. Schedule recurring sync tasks every 6 hours
  setInterval(async () => {
    const nextScheduledTime = new Date(Date.now() + SIX_HOURS_IN_MS).toLocaleString();
    console.log(`\n⏰ Scheduled cron job triggered: ${new Date().toLocaleString()}`);
    
    await runBackup();
    
    console.log(`\n😴 System sleeping... Next backup scheduled for: ${nextScheduledTime}\n`);
  }, SIX_HOURS_IN_MS);
}

startCron().catch(err => {
  console.error("Failed to start automated backup cron:", err);
});
