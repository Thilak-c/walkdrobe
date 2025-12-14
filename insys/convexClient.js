"use client";

import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }) {
  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}
