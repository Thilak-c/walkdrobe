// ============================================
// COPY THIS FILE TO YOUR BACKUP CONVEX PROJECT
// File: convex/backupReceiver.js
// FULL SYNC - Exact mirror of main database
// ============================================

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Sync users - FULL DATA (exact mirror)
export const syncUsers = mutation({
  args: {
    users: v.array(v.any()),
  },
  handler: async (ctx, { users }) => {
    // Get all existing backup records
    const existingBackups = await ctx.db.query("users_backup").collect();
    const existingMap = new Map(existingBackups.map((u) => [u.originalId, u]));
    const incomingIds = new Set(users.map((u) => u.originalId));

    let synced = 0;
    let deleted = 0;

    // Sync incoming users
    for (const user of users) {
      const existing = existingMap.get(user.originalId);

      if (existing) {
        // Update existing record with ALL data
        await ctx.db.patch(existing._id, {
          ...user,
          lastSyncAt: Date.now(),
        });
      } else {
        // Insert new record
        await ctx.db.insert("users_backup", {
          ...user,
          lastSyncAt: Date.now(),
        });
      }
      synced++;
    }

    // Delete records that no longer exist in main DB
    for (const backup of existingBackups) {
      if (!incomingIds.has(backup.originalId)) {
        await ctx.db.delete(backup._id);
        deleted++;
      }
    }

    return { synced, deleted };
  },
});

// Sync products - FULL DATA (exact mirror)
export const syncProducts = mutation({
  args: {
    products: v.array(v.any()),
  },
  handler: async (ctx, { products }) => {
    const existingBackups = await ctx.db.query("products_backup").collect();
    const existingMap = new Map(existingBackups.map((p) => [p.originalId, p]));
    const incomingIds = new Set(products.map((p) => p.originalId));

    let synced = 0;
    let deleted = 0;

    for (const product of products) {
      const existing = existingMap.get(product.originalId);

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...product,
          lastSyncAt: Date.now(),
        });
      } else {
        await ctx.db.insert("products_backup", {
          ...product,
          lastSyncAt: Date.now(),
        });
      }
      synced++;
    }

    // Delete records that no longer exist in main DB
    for (const backup of existingBackups) {
      if (!incomingIds.has(backup.originalId)) {
        await ctx.db.delete(backup._id);
        deleted++;
      }
    }

    return { synced, deleted };
  },
});

// Sync orders - FULL DATA (exact mirror)
export const syncOrders = mutation({
  args: {
    orders: v.array(v.any()),
  },
  handler: async (ctx, { orders }) => {
    const existingBackups = await ctx.db.query("orders_backup").collect();
    const existingMap = new Map(existingBackups.map((o) => [o.originalId, o]));
    const incomingIds = new Set(orders.map((o) => o.originalId));

    let synced = 0;
    let deleted = 0;

    for (const order of orders) {
      const existing = existingMap.get(order.originalId);

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...order,
          lastSyncAt: Date.now(),
        });
      } else {
        await ctx.db.insert("orders_backup", {
          ...order,
          lastSyncAt: Date.now(),
        });
      }
      synced++;
    }

    // Delete records that no longer exist in main DB
    for (const backup of existingBackups) {
      if (!incomingIds.has(backup.originalId)) {
        await ctx.db.delete(backup._id);
        deleted++;
      }
    }

    return { synced, deleted };
  },
});
