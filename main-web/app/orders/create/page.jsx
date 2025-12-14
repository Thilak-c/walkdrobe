"use client";

import { useState } from "react";

export default function CreateOrderPage() {
  const [form, setForm] = useState({
    
      "order_id": "TEST12345",
      "order_date": "2025-10-04 10:00",
      "pickup_location": "Your Exact Pickup Location From Shiprocket",
      "billing_customer_name": "Thilak",
      "billing_last_name": "Narayan",
      "billing_address": "254, Patliputra Colony",
      "billing_address_2": "",
      "billing_city": "Patna",
      "billing_pincode": "800013",
      "billing_state": "Bihar",
      "billing_country": "India",
      "billing_email": "thilak@example.com",
      "billing_phone": "7979962614",
      "shipping_is_billing": true,
      "order_items": [
        { "name": "Premium Cotton T-Shirt", "sku": "TSHIRT001", "units": 2, "selling_price": 499 }
      ],
      "payment_method": "Prepaid",
      "sub_total": 998,
      "length": 30,
      "breadth": 25,
      "height": 10,
      "weight": 0.8
    
    
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function updateField(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] = { ...cur[keys[i]] };
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = { ...form };
      payload.order_items = payload.order_items.map((it) => ({
        ...it,
        units: Number(it.units),
        selling_price: Number(it.selling_price),
      }));

      const res = await fetch("/api/shiprocket/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Shiprocket Order</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-4 rounded-lg">
        <input placeholder="Order ID" value={form.order_id} onChange={(e) => updateField("order_id", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input type="datetime-local" value={form.order_date} onChange={(e) => updateField("order_date", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Pickup Location" value={form.pickup_location} onChange={(e) => updateField("pickup_location", e.target.value)} className="w-full p-2 rounded bg-transparent border" />

        <h2 className="text-lg font-medium mt-2">Billing Info</h2>
        <input placeholder="Customer Name" value={form.billing_customer_name} onChange={(e) => updateField("billing_customer_name", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Last Name" value={form.billing_last_name} onChange={(e) => updateField("billing_last_name", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Address" value={form.billing_address} onChange={(e) => updateField("billing_address", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="City" value={form.billing_city} onChange={(e) => updateField("billing_city", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Pincode" value={form.billing_pincode} onChange={(e) => updateField("billing_pincode", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="State" value={form.billing_state} onChange={(e) => updateField("billing_state", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Email" value={form.billing_email} onChange={(e) => updateField("billing_email", e.target.value)} className="w-full p-2 rounded bg-transparent border" />
        <input placeholder="Phone" value={form.billing_phone} onChange={(e) => updateField("billing_phone", e.target.value)} className="w-full p-2 rounded bg-transparent border" />

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.shipping_is_billing} onChange={(e) => updateField("shipping_is_billing", e.target.checked)} />
          <span>Shipping same as billing</span>
        </div>

        <h2 className="text-lg font-medium mt-2">Order Items</h2>
        {form.order_items.map((it, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input placeholder="Name" value={it.name} onChange={(e) => updateField(`order_items.${idx}.name`, e.target.value)} className="p-2 rounded border" />
            <input placeholder="SKU" value={it.sku} onChange={(e) => updateField(`order_items.${idx}.sku`, e.target.value)} className="p-2 rounded border" />
            <input type="number" placeholder="Units" value={it.units} onChange={(e) => updateField(`order_items.${idx}.units`, e.target.value)} className="p-2 rounded border w-20" />
            <input type="number" placeholder="Price" value={it.selling_price} onChange={(e) => updateField(`order_items.${idx}.selling_price`, e.target.value)} className="p-2 rounded border w-24" />
          </div>
        ))}
        <button type="button" onClick={() => setForm((p) => ({ ...p, order_items: [...p.order_items, { name: "", sku: "", units: 1, selling_price: 0 }] }))} className="px-3 py-1 rounded border">Add Item</button>

        <h2 className="text-lg font-medium mt-2">Dimensions & Payment</h2>
        <input type="number" placeholder="Sub Total" value={form.sub_total} onChange={(e) => updateField("sub_total", e.target.value)} className="p-2 rounded border w-32" />
        <input type="number" placeholder="Length (cm)" value={form.length} onChange={(e) => updateField("length", e.target.value)} className="p-2 rounded border w-24" />
        <input type="number" placeholder="Breadth (cm)" value={form.breadth} onChange={(e) => updateField("breadth", e.target.value)} className="p-2 rounded border w-24" />
        <input type="number" placeholder="Height (cm)" value={form.height} onChange={(e) => updateField("height", e.target.value)} className="p-2 rounded border w-24" />
        <input type="number" step="0.01" placeholder="Weight (kg)" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} className="p-2 rounded border w-24" />

        <button type="submit" disabled={loading} className="px-4 py-2 mt-4 rounded bg-blue-600 disabled:opacity-50">{loading ? "Creating..." : "Create Order"}</button>
      </form>

      {error && <div className="text-red-500 mt-4">{error}</div>}
      {result && <pre className="bg-gray-100 p-3 mt-4 rounded">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
