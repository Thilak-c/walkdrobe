// ============================================
// COPY THIS FILE TO YOUR BACKUP CONVEX PROJECT
// File: convex/schema.js
// FULL SYNC - Uses v.any() to accept all fields
// ============================================

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users backup - accepts any fields from main DB
  users_backup: defineTable({
    originalId: v.string(),
    originalCreationTime: v.optional(v.number()),
    // All other fields are dynamic - using schemaValidation: false below
  }).index("by_originalId", ["originalId"]),

  // Products backup - accepts any fields from main DB
  products_backup: defineTable({
    originalId: v.string(),
    originalCreationTime: v.optional(v.number()),
  }).index("by_originalId", ["originalId"]),

  // Orders backup - accepts any fields from main DB
  orders_backup: defineTable({
    originalId: v.string(),
    originalCreationTime: v.optional(v.number()),
  }).index("by_originalId", ["originalId"]),

  // Sync logs
  sync_logs: defineTable({
    timestamp: v.number(),
    usersCount: v.number(),
    productsCount: v.number(),
    ordersCount: v.number(),
    usersDeleted: v.optional(v.number()),
    productsDeleted: v.optional(v.number()),
    ordersDeleted: v.optional(v.number()),
    status: v.string(),
  }),
}, {
  // IMPORTANT: Disable strict schema validation to accept any fields
  schemaValidation: false,
});
