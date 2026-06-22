import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import cloudinary, { ALLOWED_EVIDENCE_EXTENSIONS, MAX_EVIDENCE_SIZE_BYTES } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { fileName, fileType, fileSize } = await req.json();
  if (!fileName || !fileType || !fileSize) {
    return NextResponse.json({ success: false, error: "fileName, fileType, and fileSize are required" }, { status: 400 });
  }

  // Extract extension from fileType (e.g., "image/jpeg" -> "jpeg" or "application/pdf" -> "pdf")
  const extension = fileType.split("/").pop()?.toLowerCase() || "";
  
  if (!ALLOWED_EVIDENCE_EXTENSIONS.includes(extension)) {
    return NextResponse.json({ success: false, error: "That file type isn't supported. Use PDF, JPG, PNG, MP4, XLSX, or DOCX." }, { status: 400 });
  }
  
  if (fileSize > MAX_EVIDENCE_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: "File is too large. Maximum size is 100MB." }, { status: 400 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.[^.]+$/, ""); // strip extension; Cloudinary adds its own
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `evidence/${user!._id}/${timestamp}-${safeName}`;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET!;

  // Parameters that will be signed — these must match exactly what the browser sends.
  const paramsToSign = {
    timestamp,
    public_id: publicId,
    upload_preset: uploadPreset,
  };

  // Sign the upload parameters using Cloudinary's API
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return NextResponse.json({
    success: true,
    signature,
    timestamp,
    publicId,
    uploadPreset,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    fileName: safeName,
  });
}