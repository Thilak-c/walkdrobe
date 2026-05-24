import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../main-web/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const body = await request.json();

    // Get first admin user from database
    const users = await convex.query(api.users.getAllUsers);
    let adminUser = users?.find(u => u.role === "admin" || u.role === "super_admin");

    if (!adminUser) {
      if (users && users.length > 0) {
        // Fallback to first user in system
        adminUser = users[0];
      } else {
        // System is completely fresh - auto-initialize a default system administrator
        try {
          const res = await convex.mutation(api.auth.createSuperAdmin, {
            email: "admin@walkdrobe.in",
            password: "adminPassword123!",
            name: "System Admin"
          });
          if (res && res.userId) {
            adminUser = { _id: res.userId };
          }
        } catch (createErr) {
          console.error("Auto super-admin setup failed:", createErr);
        }
      }
    }

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
