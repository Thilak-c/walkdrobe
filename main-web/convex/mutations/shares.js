// convex/mutations/shares.js
import { mutation } from "../_generated/server"; // relative path works better

export const recordShare = mutation(async ({ db }, { itemId, user }) => {
  if (!itemId) throw new Error("Missing itemId");

  await db.insert("shares", {
    itemId,
    user: user || "anonymous",
    createdAt: new Date().toISOString(),
  });

  return { success: true }; // always return something
});
