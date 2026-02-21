import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../main-web/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const body = await request.json();

    // Get first admin user from database
    const users = await convex.query(api.users.getAllUsers);
    const adminUser = users?.find(u => u.role === "admin" || u.role === "super_admin");

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "No admin user found. Please create an admin user first." },
        { status: 400 }
      );
    }

    // Create coupon with admin user ID
    const result = await convex.mutation(api.coupons.createCoupon, {
      ...body,
      createdBy: adminUser._id,
    });

    return NextResponse.json({ success: true, couponId: result.couponId });
  } catch (error) {
    console.error("Coupon creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}
