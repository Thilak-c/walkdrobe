import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    // Create client per request to avoid stale connections
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    const data = await client.query(api.analytics.getAnalyticsForDay, { date });
    
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800", // 15min cache
      },
    });
  } catch (error) {
    console.error("Error fetching day analytics for", date, ":", error);
    return Response.json(
      { error: "Failed to fetch analytics", details: error.message },
      { status: 500 }
    );
  }
}
