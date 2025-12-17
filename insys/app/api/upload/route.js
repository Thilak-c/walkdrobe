import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Get file extension
    const ext = path.extname(file.name || ".png").toLowerCase() || ".png";
    const filename = `product_${Date.now()}${ext}`;
    
    // Save to public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the full URL so main-web can access it
    const baseUrl = process.env.NEXT_PUBLIC_INSYS_URL || "https://insys.walkdrobe.in";
    const url = `${baseUrl}/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: url,
      filename: filename,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST an image file to upload" 
  });
}
