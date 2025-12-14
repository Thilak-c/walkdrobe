// import { NextResponse } from "next/server";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "@/convex/_generated/api";

// // Primary Convex (your main database)
// const primaryClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// // Backup Convex (your self-hosted backup database)
// const backupClient = new ConvexHttpClient(process.env.BACKUP_CONVEX_URL);

// export async function POST(request) {
//   try {
//     // Verify backup secret (prevent unauthorized access)
//     const authHeader = request.headers.get("authorization");
//     if (authHeader !== `Bearer ${process.env.BACKUP_SECRET}`) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const results = {
//       timestamp: new Date().toISOString(),
//       users: { success: false, count: 0 },
//       products: { success: false, count: 0 },
//       orders: { success: false, count: 0 },
//     };

//     // 1. Backup Users
//     try {
//       const users = await primaryClient.query(api.backup.getAllUsers);
//       if (users && users.length > 0) {
//         await backupClient.mutation(api.backupReceiver.syncUsers, { users });
//         results.users = { success: true, count: users.length };
//       }
//     } catch (err) {
//       console.error("Users backup failed:", err);
//       results.users.error = err.message;
//     }

//     // 2. Backup Products
//     try {
//       const products = await primaryClient.query(api.backup.getAllProducts);
//       if (products && products.length > 0) {
//         await backupClient.mutation(api.backupReceiver.syncProducts, { products });
//         results.products = { success: true, count: products.length };
//       }
//     } catch (err) {
//       console.error("Products backup failed:", err);
//       results.products.error = err.message;
//     }

//     // 3. Backup Orders
//     try {
//       const orders = await primaryClient.query(api.backup.getAllOrders);
//       if (orders && orders.length > 0) {
//         await backupClient.mutation(api.backupReceiver.syncOrders, { orders });
//         results.orders = { success: true, count: orders.length };
//       }
//     } catch (err) {
//       console.error("Orders backup failed:", err);
//       results.orders.error = err.message;
//     }

//     // Log backup completion
//     console.log("Backup completed:", results);

//     return NextResponse.json({
//       success: true,
//       message: "Backup completed",
//       results,
//     });
//   } catch (error) {
//     console.error("Backup failed:", error);
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }

// // GET endpoint to check backup status
// export async function GET() {
//   return NextResponse.json({
//     status: "Backup endpoint ready",
//     info: "POST to this endpoint with Bearer token to trigger backup",
//   });
// }
