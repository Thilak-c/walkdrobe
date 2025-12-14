// app/api/contact/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/* ---------- config ---------- */
const FILE = path.join(process.cwd(), 'data', 'contacts.json');

/* ---------- helpers ---------- */
function load() {
  try { 
    return JSON.parse(fs.readFileSync(FILE, 'utf-8')); 
  } catch { 
    return []; 
  }
}

function save(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

/* ---------- GET handler ---------- */
export async function GET(req) {
  try {
    const list = load();
    // Return messages in reverse order (newest first)
    return NextResponse.json({ messages: list.reverse() });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------- POST handler ---------- */
export async function POST(req) {
  try {
    const { name, email, message } = await req.json();
    
    // Validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    
    if (typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    const list = load();
    const newMessage = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    list.push(newMessage);
    save(list);

    /* Optional: Send email notification here */

    return NextResponse.json({ ok: true, message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------- PATCH handler (mark as read) ---------- */
export async function PATCH(req) {
  try {
    const { id } = await req.json();
    
    const list = load();
    const messageIndex = list.findIndex(m => m.id === id);
    
    if (messageIndex === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    list[messageIndex].read = true;
    save(list);
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------- DELETE handler ---------- */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    const list = load();
    const filteredList = list.filter(m => m.id !== id);
    
    if (list.length === filteredList.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    save(filteredList);
    
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
