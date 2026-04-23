import { env } from "../config/env.js";

function buildBasicAuthHeader() {
  const token = Buffer.from(`${env.cloudinaryApiKey}:${env.cloudinaryApiSecret}`).toString("base64");
  return `Basic ${token}`;
}

function buildImageMetadata({ imageUrl, publicId, uploadedBy, uploadedByName, billId, assetId = null, format = null, bytes = null, storage = "inline" }) {
  const uploadedAt = new Date().toISOString();

  return {
    imageUrl,
    publicId,
    uploadedAt,
    uploadedDate: uploadedAt.slice(0, 10),
    uploadedTime: uploadedAt.slice(11, 19),
    uploadedBy,
    uploadedByName,
    billId,
    assetId,
    format,
    bytes,
    storage
  };
}

function buildInlineImageUpload({ imageData, billId, uploadedBy, uploadedByName }) {
  const timestamp = Math.floor(Date.now() / 1000);

  return buildImageMetadata({
    imageUrl: imageData,
    publicId: `${billId}-${timestamp}`,
    uploadedBy,
    uploadedByName,
    billId,
    bytes: imageData.length,
    storage: "inline"
  });
}

export async function uploadBillImage({ imageData, billId, uploadedBy, uploadedByName }) {
  if (!imageData) {
    return null;
  }

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return buildInlineImageUpload({ imageData, billId, uploadedBy, uploadedByName });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${billId}-${timestamp}`;
  const folder = "citibooks/bills";

  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
      method: "POST",
      headers: {
        Authorization: buildBasicAuthHeader()
      },
      body: formData
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn("Cloudinary upload failed, falling back to inline bill image storage:", result?.error?.message || response.statusText);
      return buildInlineImageUpload({ imageData, billId, uploadedBy, uploadedByName });
    }

    return buildImageMetadata({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      uploadedBy,
      uploadedByName,
      billId,
      assetId: result.asset_id,
      format: result.format,
      bytes: result.bytes,
      storage: "cloudinary"
    });
  } catch (error) {
    console.warn("Cloudinary upload request failed, falling back to inline bill image storage:", error);
    return buildInlineImageUpload({ imageData, billId, uploadedBy, uploadedByName });
  }
}
