import dotenv from "dotenv";

dotenv.config();

function readEnv(name, fallback = "") {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

export const env = {
  port: Number(readEnv("PORT", "4000")),
  jwtSecret: readEnv("JWT_SECRET", "citibooks-dev-secret"),
  clientOrigin: readEnv("CLIENT_ORIGIN", "*"),
  mongodbUri: readEnv("MONGODB_URI", "mongodb://localhost:27017/citibooks"),
  databaseName: readEnv("DATABASE_NAME", "citibooks"),
  cloudinaryCloudName: readEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: readEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: readEnv("CLOUDINARY_API_SECRET"),
  cloudinaryUrl: readEnv("CLOUDINARY_URL")
};
