import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get current timestamp
const nowIso = () => new Date().toISOString();

// Add a new review
export const addReview = mutation({
  args: {
    productId: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    size: v.optional(v.string()),
    recommend: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Validate required fields
    if (!args.title.trim() || !args.comment.trim()) {
      throw new Error("Title and comment are required");
    }

    // Check if user already reviewed this product
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("isDeleted"), undefined))
      .unique();

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Create the review
    const reviewId = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: args.userId,
      userName: args.userName,
      rating: args.rating,
      title: args.title.trim(),
      comment: args.comment.trim(),
      size: args.size || "",
      recommend: args.recommend,
      verified: false, // Default to false, can be updated later
      helpful: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    return { id: reviewId, success: true };
  },
});

// Get reviews for a specific product
export const getProductReviews = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter(q => q.eq(q.field("isDeleted"), undefined))
      .order("desc")
      .collect();

    return reviews;
  },
});

// Get review statistics for a product
export const getProductReviewStats = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter(q => q.eq(q.field("isDeleted"), undefined))
      .collect();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendPercentage: 0,
      };
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    // Recommendation percentage
    const recommendCount = reviews.filter(review => review.recommend).length;
    const recommendPercentage = Math.round((recommendCount / totalReviews) * 100);

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      recommendPercentage,
    };
  },
});

// Mark review as helpful
export const markReviewHelpful = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await ctx.db.patch(args.reviewId, {
      helpful: review.helpful + 1,
      updatedAt: nowIso(),
    });

    return { success: true };
  },
});

// Delete a review (soft delete)
export const deleteReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    userId: v.id("users"), // User requesting deletion
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Only allow user to delete their own review
    if (review.userId !== args.userId) {
      throw new Error("You can only delete your own reviews");
    }

    await ctx.db.patch(args.reviewId, {
      isDeleted: true,
      deletedAt: nowIso(),
      deletedBy: args.userId,
    });

    return { success: true };
  },
}); 