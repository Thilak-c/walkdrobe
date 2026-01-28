// convexClient.js (at project root)
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://db.walkdrobe.in";
console.log("🔗 Convex URL:", convexUrl);

const convex = new ConvexReactClient(convexUrl);

export { ConvexProvider, convex };
