// convexClient.js (at project root)
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://db.walkdrobe.in"
);

export { ConvexProvider, convex };
