import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../main-web/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing product ID" }, { status: 400 });
  }

  try {
    const product = await convex.query(api.products.getProductForEdit, { id });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(product);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
