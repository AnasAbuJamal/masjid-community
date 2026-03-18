import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

function isValidBase64(str: string): boolean {
  if (str.startsWith("data:")) {
    const base64 = str.split(",")[1];
    if (!base64) return false;
    try {
      return Buffer.from(base64, "base64").length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : "image/jpeg";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, type = "blog" } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    let imageUrl: string;
    let fileName: string;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      imageUrl = image;
      fileName = image.split("/").pop() || "image.jpg";
    } 
    else if (isValidBase64(image)) {
      await ensureUploadDir();
      
      const base64Data = image.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const mimeType = getMimeType(image);
      const ext = mimeType.split("/")[1] || "jpg";
      fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      
      const filePath = join(UPLOAD_DIR, fileName);
      await writeFile(filePath, buffer);
      
      imageUrl = `/uploads/${fileName}`;
    } 
    else {
      return NextResponse.json({ error: "Invalid image format. Use URL or base64 data URL" }, { status: 400 });
    }

    return NextResponse.json({ 
      url: imageUrl,
      fileName,
      message: "Image uploaded successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Image upload endpoint",
    usage: "POST with { image: 'base64 or url', type: 'blog|student|worker' }",
    note: "For production, consider using S3 or Cloudinary"
  });
}
