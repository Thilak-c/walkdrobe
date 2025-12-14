// app/api/upload-2/route.js
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST = async (req) => {
  try {
    const data = await req.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // SECURITY: Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // SECURITY: Get and validate extension from original filename
    const originalExt = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // SECURITY: Generate safe random filename (ignore user-provided name)
    const safeFileName = `${Date.now()}-${randomBytes(8).toString("hex")}${originalExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "uploads_files");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return NextResponse.json({ url: `${baseUrl}/api/uploads/${safeFileName}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
};
