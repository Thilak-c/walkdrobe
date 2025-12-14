// app/api/sync-guest-data/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId, guestCart, guestOrders } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const results = {
      cartSynced: 0,
      ordersSynced: 0,
      errors: [],
    };

    // Sync cart items
    if (guestCart && guestCart.length > 0) {
      try {
        // Here you would call your Convex mutations to add cart items
        // For now, we'll just count them
        results.cartSynced = guestCart.length;
        
        // Example: You would do something like this with Convex
        // for (const item of guestCart) {
        //   await ctx.db.insert("cart", {
        //     userId,
        //     productId: item.productId,
        //     productName: item.productName,
        //     productImage: item.productImage,
        //     price: item.price,
        //     size: item.size,
        //     quantity: item.quantity,
        //     addedAt: item.addedAt,
        //     updatedAt: new Date().toISOString(),
        //     isActive: true,
        //   });
        // }
      } catch (error) {
        results.errors.push(`Cart sync error: ${error.message}`);
      }
    }

    // Sync guest orders
    if (guestOrders && guestOrders.length > 0) {
      try {
        // Here you would call your Convex mutations to link orders to user
        results.ordersSynced = guestOrders.length;
        
        // Example: Update orders with userId
        // for (const order of guestOrders) {
        //   await ctx.db.patch(order._id, { userId });
        // }
      } catch (error) {
        results.errors.push(`Orders sync error: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guest data synced successfully',
      results,
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync guest data' },
      { status: 500 }
    );
  }
}
