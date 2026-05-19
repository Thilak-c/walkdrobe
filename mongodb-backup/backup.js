import { MongoClient } from "mongodb";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";

// Initialize environment configurations
dotenv.config();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://db.walkdrobe.in";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/walkdrobe-backup";

// All 24 core Convex database tables to back up
const TABLES = [
  "users",
  "sessions",
  "passwordResetOTPs",
  "phoneOTPs",
  "trash",
  "products",
  "web_trash",
  "off_trash",
  "web_products",
  "off_products",
  "web_bills",
  "off_bills",
  "web_movements",
  "off_movements",
  "reviews",
  "cart",
  "wishlist",
  "orders",
  "recentlyViewed",
  "views",
  "dailyAccess",
  "reports",
  "chatSessions",
  "chatMessages"
];

const BACKUP_QUERY_PATH = "backup:getTableData";

export async function runBackup() {
  const timestamp = new Date().toISOString();
  console.log("\n=======================================================");
  console.log(`🚀 STARTING WALKDROBE DATABASE BACKUP: ${timestamp}`);
  console.log(`🔗 Primary Convex:  ${CONVEX_URL}`);
  console.log(`🔗 Target MongoDB:  ${MONGODB_URI}`);
  console.log("=======================================================\n");

  let mongoClient;
  let convexClient;
  
  try {
    // 1. Connect to Convex Client
    convexClient = new ConvexHttpClient(CONVEX_URL);

    // 2. Connect to MongoDB Client
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    
    // Select the DB from connection URI or default to walkdrobe-backup
    const db = mongoClient.db();
    
    const results = [];
    let totalSyncedBytes = 0;
    let totalSyncedRecords = 0;

    // 3. Process each table sequentially
    for (const tableName of TABLES) {
      process.stdout.write(`⏳ Fetching table: ${tableName.padEnd(22)}... `);
      
      try {
        // Query data from Convex using direct string path
        const records = await convexClient.query(BACKUP_QUERY_PATH, { tableName });
        
        if (!records) {
          console.log("❌ Failed (Returned null)");
          results.push({ table: tableName, success: false, count: 0, size: "0 B", error: "Returned null" });
          continue;
        }

        const count = records.length;
        
        // Calculate serialized byte size of this table
        const jsonStr = JSON.stringify(records);
        const byteSize = Buffer.byteLength(jsonStr, "utf8");
        totalSyncedBytes += byteSize;
        totalSyncedRecords += count;

        const sizeStr = formatBytes(byteSize);

        if (count === 0) {
          console.log(`⚠️  Empty (${sizeStr})`);
          results.push({ table: tableName, success: true, count: 0, size: sizeStr, status: "Empty" });
          continue;
        }

        // Get target MongoDB Collection
        const collection = db.collection(tableName);

        // Mirroring behavior: Clear old documents and insert new ones
        await collection.deleteMany({});
        
        // MongoDB _id mapping to avoid duplicate/invalid keys (Convex uses its own unique string _id)
        const mappedRecords = records.map(record => {
          const mapped = { ...record };
          if (mapped._id) {
            mapped.originalConvexId = mapped._id;
          }
          return mapped;
        });

        // Insert documents in bulk
        await collection.insertMany(mappedRecords);

        console.log(`✅ Synced ${count.toString().padStart(4)} records (${sizeStr})`);
        results.push({ table: tableName, success: true, count, size: sizeStr, status: "Success" });
        
      } catch (tableError) {
        console.log(`❌ Failed (${tableError.message})`);
        results.push({ table: tableName, success: false, count: 0, size: "0 B", error: tableError.message });
      }
    }

    // 4. Print Dashboard Summary
    console.log("\n=======================================================");
    console.log("📊 BACKUP COMPLETION SUMMARY:");
    console.log(`⏱️  Timestamp:       ${new Date().toLocaleString()}`);
    console.log(`📈 Total Records:   ${totalSyncedRecords.toLocaleString()} documents`);
    console.log(`💾 Total Data Size: ${formatBytes(totalSyncedBytes)}`);
    console.log("=======================================================");
    
    // Detail tables grid
    console.log("\n%-22s | %-10s | %-10s | %s".replace(/%/g, ""), "Table Name", "Records", "Size", "Status");
    console.log("------------------------------------------------------------------");
    for (const r of results) {
      const statusText = r.success ? (r.status === "Empty" ? "⚠️  Empty" : "✅ Success") : `❌ Error: ${r.error}`;
      console.log(
        `${r.table.padEnd(22)} | ${r.count.toString().padEnd(10)} | ${r.size.padEnd(10)} | ${statusText}`
      );
    }
    console.log("=======================================================\n");

    // Write a local backup transaction log
    const logCollection = db.collection("backup_history_logs");
    await logCollection.insertOne({
      timestamp: new Date(),
      totalRecords: totalSyncedRecords,
      totalBytes: totalSyncedBytes,
      formattedSize: formatBytes(totalSyncedBytes),
      details: results
    });

    return { success: true, totalRecords: totalSyncedRecords, totalBytes: totalSyncedBytes };
  } catch (error) {
    console.error("\n💥 CRITICAL SYSTEM ERROR IN BACKUP PROCESS:", error);
    return { success: false, error: error.message };
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Helper to format byte counts into human-readable strings
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// If executed directly
if (process.argv[1] && process.argv[1].endsWith("backup.js")) {
  runBackup();
}
