import { NextResponse } from "next/server";

const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || "http://localhost:3000";

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

    // Forward to main-web's upload API
    // Create a new File object with proper name for main-web
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = new Blob([buffer], { type: file.type });
    
    const uploadFormData = new FormData();
    uploadFormData.append("image", blob, file.name);

    console.log("Uploading to:", `${MAIN_WEB_URL}/api/upload`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response;
    try {
      response = await fetch(`${MAIN_WEB_URL}/api/upload`, {
        method: "POST",
        body: uploadFormData,
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.message);
      return NextResponse.json(
        { error: `Cannot connect to main-web at ${MAIN_WEB_URL}. Is it running?` },
        { status: 503 }
      );
    }
    
    clearTimeout(timeoutId);

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const text = await response.text();
      console.error("Response not JSON:", text);
      return NextResponse.json(
        { error: "Invalid response from main-web" },
        { status: 500 }
      );
    }
    
    console.log("Upload result:", result);

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || "Upload failed on main-web" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.url.split("/").pop(),
    });
  } catch (error) {
    console.error("Upload error:", error.message, error.cause);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET endpoint - not needed since images are on main-web
export async function GET() {
  return NextResponse.json({ 
    message: "Images are served from main-web. Use main-web URL to access images." 
  });
}
