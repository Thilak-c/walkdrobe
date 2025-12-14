import { NextResponse } from 'next/server';
import { shiprocketFetch } from 'lib/shiprocketClient';

export async function POST(request) {
  try {
    // expects { pickup_postcode, delivery_postcode, cod } in body
    const body = await request.json();
    const query = new URLSearchParams(body).toString();
    const data = await shiprocketFetch(`/courier/serviceability/?${query}`, { method: 'GET' });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}