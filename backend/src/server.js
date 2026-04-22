import app from "./app.js";
import { env } from "./config/env.js";
import { initPersistence } from "./data/persistence.js";

try {
  await initPersistence();
} catch (error) {
  console.warn("MongoDB connection failed. Continuing with in-memory data.");
  console.warn(error.message);
}

app.listen(env.port, () => {
  console.log(`CitiBooks backend running on http://localhost:${env.port}`);
});
