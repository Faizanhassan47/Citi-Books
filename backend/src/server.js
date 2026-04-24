import app from "./app.js";
import { env } from "./config/env.js";
import { initPersistence } from "./data/persistence.js";

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || Number(env.port) || 3000;

try {
  await initPersistence();
  console.log("Persistence initialized successfully.");
} catch (error) {
  console.warn("MongoDB connection failed. Continuing with in-memory data.");
  console.warn(error?.message || error);
}

app.listen(PORT, HOST, () => {
  console.log(`CitiBooks backend running on http://${HOST}:${PORT}`);
});