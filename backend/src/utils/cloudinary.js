import crypto from "node:crypto";
import { env } from "../config/env.js";

function buildSignature(params) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${env.cloudinaryApiSecret}`)
    .digest("hex");
}

export async function uploadBillImage({ imageData, billId, uploadedBy, uploadedByName }) {
  if (!imageData) {
    return null;
  }

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error("Cloudinary environment variables are missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${billId}-${timestamp}`;
  const folder = "citibooks/bills";
  const signature = buildSignature({
    folder,
    public_id: publicId,
    timestamp
  });

  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Cloudinary upload failed");
  }

  const uploadedAt = new Date().toISOString();

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
    uploadedAt,
    uploadedDate: uploadedAt.slice(0, 10),
    uploadedTime: uploadedAt.slice(11, 19),
    uploadedBy,
    uploadedByName,
    billId,
    assetId: result.asset_id,
    format: result.format,
    bytes: result.bytes
  };
}
