export async function POST(req) {
  try {
    const payload = await req.json();

    // Auto-copy billing → shipping if needed
    if (payload.shipping_is_billing) {
      payload.shipping_customer_name = payload.billing_customer_name;
      payload.shipping_last_name = payload.billing_last_name;
      payload.shipping_address = payload.billing_address;
      payload.shipping_address_2 = payload.billing_address_2 || "";
      payload.shipping_city = payload.billing_city;
      payload.shipping_pincode = payload.billing_pincode;
      payload.shipping_state = payload.billing_state;
      payload.shipping_country = payload.billing_country;
      payload.shipping_email = payload.billing_email;
      payload.shipping_phone = payload.billing_phone;
    }

    // Format order_date
    if (payload.order_date) {
      payload.order_date = payload.order_date.replace("T", " ").slice(0, 16);
    }

    const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
    const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

    // Login to Shiprocket
    const tokenRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));

    const ACCESS_TOKEN = tokenData.token;

    // Create order
    const createRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));

    return new Response(JSON.stringify(createData), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
