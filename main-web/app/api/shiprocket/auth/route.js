2// Directory: app/api/shiprocket/auth/route.js
// Next.js 15 App Router - Route handler for Shiprocket auth

import { NextResponse } from 'next/server';

const SHIPROCKET_BASE = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
const EMAIL = process.env.SHIPROCKET_EMAIL;
const PASSWORD = process.env.SHIPROCKET_PASSWORD;

export async function POST(request) {
  try {
    if (!EMAIL || !PASSWORD) {
      return NextResponse.json({ error: 'Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in environment' }, { status: 500 });
    }

    const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });

    // data contains token: store it client-side or use server-side for following requests
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
