import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authorize";
import { createUploadSignature, ALLOWED_EVIDENCE_EXTENSIONS, MAX_EVIDENCE_SIZE_BYTES, resourceTypeFor } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { fileName, fileSize } = await req.json();
  if (!fileName || !fileSize) {
    return NextResponse.json({ success: false, error: "fileName and fileSize are required" }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EVIDENCE_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ success: false, error: "That file type isn't supported. Use PDF, JPG, PNG, MP4, XLSX, or DOCX." }, { status: 400 });
  }
  if (fileSize > MAX_EVIDENCE_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: "File is too large. Maximum size is 100MB." }, { status: 400 });
  }

  const folder = `evidence/${user!._id}`;
  const signatureData = createUploadSignature(folder);
  return NextResponse.json({ success: true, ...signatureData, resourceType: resourceTypeFor(fileName) });
}