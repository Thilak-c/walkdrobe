import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, userId, orderTotal, paymentMethod } = body;

    if (!code || !orderTotal || !paymentMethod) {
      return NextResponse.json(
        { valid: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate coupon using Convex
    const result = await convex.query(api.coupons.validateCoupon, {
      code: code.toUpperCase(),
      userId: userId || undefined,
      orderTotal,
      paymentMethod,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
