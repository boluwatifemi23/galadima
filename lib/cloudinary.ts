import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const ALLOWED_EVIDENCE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "mp4", "xlsx", "docx"];
export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per TRD — check your plan's actual cap

export function resourceTypeFor(fileName: string): "image" | "video" | "raw" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  if (ext === "mp4") return "video";
  return "raw"; // pdf, xlsx, docx
}

/** Lets the browser upload directly to Cloudinary without ever seeing the API secret. */
export function createUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!);
  return { timestamp, signature, folder, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME };
}

export function uploadBufferToCloudinary(buffer: Buffer, folder: string, publicId: string, resourceType: "image" | "video" | "raw" = "raw"): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, public_id: publicId, resource_type: resourceType }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}