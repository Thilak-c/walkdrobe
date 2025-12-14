import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

export async function GET(req, { params }) {
  try {
    const { fileName } = await params;

    if (!fileName) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    // SECURITY: Sanitize filename - remove path traversal attempts
    const sanitizedFileName = path.basename(fileName);
    
    // SECURITY: Block if filename was modified (path traversal attempt)
    if (sanitizedFileName !== fileName) {
      console.warn(`Path traversal attempt blocked: ${fileName}`);
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // SECURITY: Check file extension
    const ext = path.extname(sanitizedFileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // SECURITY: Validate filename format (alphanumeric, dash, underscore, dot only)
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(sanitizedFileName)) {
      return NextResponse.json({ error: "Invalid filename format" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "uploads_files");
    const filePath = path.join(uploadsDir, sanitizedFileName);

    // SECURITY: Ensure resolved path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.warn(`Path escape attempt blocked: ${fileName}`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    // Map extension to MIME type
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("File serve error:", err);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
