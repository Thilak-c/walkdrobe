import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Helper to call backup Convex mutations via HTTP
async function callBackupMutation(backupUrl, functionName, args) {
  const response = await fetch(`${backupUrl}api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: functionName,
      args: args,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backup mutation failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.value;
}

// This endpoint is called by Vercel Cron every hour
export async function GET(request) {
  try {
    // Verify this is a legitimate request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get("x-vercel-cron") === "true";
    const referer = request.headers.get("referer") || "";
    const isFromAdmin = referer.includes("/admin");

    // Allow: Vercel cron, correct secret, or requests from admin pages
    if (!isVercelCron && !isFromAdmin) {
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Primary Convex (your main database)
    const primaryClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Backup Convex URL
    const backupUrl = process.env.BACKUP_CONVEX_URL;
    if (!backupUrl) {
      return NextResponse.json({ error: "BACKUP_CONVEX_URL not configured" }, { status: 500 });
    }
    
    // Ensure URL ends with /
    const normalizedBackupUrl = backupUrl.endsWith("/") ? backupUrl : backupUrl + "/";

    const results = {
      timestamp: new Date().toISOString(),
      backupUrl: normalizedBackupUrl,
      users: { success: false, count: 0 },
      products: { success: false, count: 0 },
      orders: { success: false, count: 0 },
    };

    // 1. Sync Users (full mirror)
    try {
      console.log("Fetching users from primary...");
      const users = await primaryClient.query(api.backup.getAllUsers);
      console.log(`Got ${users?.length || 0} users, sending to backup...`);
      
      const syncResult = await callBackupMutation(normalizedBackupUrl, "backupReceiver:syncUsers", { users: users || [] });
      console.log("Users sync result:", syncResult);
      results.users = { success: true, synced: syncResult?.synced || 0, deleted: syncResult?.deleted || 0 };
    } catch (err) {
      console.error("Users sync failed:", err);
      results.users.error = err.message || "Unknown error";
    }

    // 2. Sync Products (full mirror)
    try {
      console.log("Fetching products from primary...");
      const products = await primaryClient.query(api.backup.getAllProducts);
      console.log(`Got ${products?.length || 0} products, sending to backup...`);
      
      const syncResult = await callBackupMutation(normalizedBackupUrl, "backupReceiver:syncProducts", { products: products || [] });
      console.log("Products sync result:", syncResult);
      results.products = { success: true, synced: syncResult?.synced || 0, deleted: syncResult?.deleted || 0 };
    } catch (err) {
      console.error("Products sync failed:", err);
      results.products.error = err.message || "Unknown error";
    }

    // 3. Sync Orders (full mirror)
    try {
      console.log("Fetching orders from primary...");
      const orders = await primaryClient.query(api.backup.getAllOrders);
      console.log(`Got ${orders?.length || 0} orders, sending to backup...`);
      
      const syncResult = await callBackupMutation(normalizedBackupUrl, "backupReceiver:syncOrders", { orders: orders || [] });
      console.log("Orders sync result:", syncResult);
      results.orders = { success: true, synced: syncResult?.synced || 0, deleted: syncResult?.deleted || 0 };
    } catch (err) {
      console.error("Orders sync failed:", err);
      results.orders.error = err.message || "Unknown error";
    }

    console.log("Hourly backup completed:", results);

    return NextResponse.json({
      success: true,
      message: "Hourly backup completed",
      results,
    });
  } catch (error) {
    console.error("Backup cron failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
