import { NextResponse } from 'next/server';
import { shiprocketFetch } from 'lib/shiprocketClient';

export async function GET(request, { params }) {
  try {
    const { awb } = params; // route: /api/shiprocket/track/{awb}
    const data = await shiprocketFetch(`/courier/track/awb/${awb}`, { method: 'GET' });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
