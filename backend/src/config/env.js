import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "citibooks-dev-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/citibooks",
  databaseName: process.env.DATABASE_NAME || "citibooks",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryUrl: process.env.CLOUDINARY_URL || ""
};
