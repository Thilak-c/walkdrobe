// app/api/suggest/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/* ---------- config ---------- */
const FILE = path.join(process.cwd(), 'data', 'suggestions.json');
const MAX = 140;

/* ---------- helpers ---------- */
function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
  catch { return []; }
}
function save(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/* ---------- GET handler ---------- */
export async function GET(req) {
  try {
    const list = load();
    // Return suggestions in reverse order (newest first)
    return NextResponse.json({ suggestions: list.reverse() });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------- POST handler ---------- */
export async function POST(req) {
  try {
    const { text } = await req.json();
    if (typeof text !== 'string' || !text.trim() || text.length > MAX) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const list = load();
    list.push({ text: text.trim(), ts: new Date().toISOString() });
    save(list);

    /* optional: send yourself an email here */

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}