import crypto from "node:crypto";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

// Helper to determine human readable action from route string
function getActionDescription(req) {
  const method = req.method;
  const url = req.baseUrl + req.url; 
  // Examples: 
  // POST /api/tasks -> url: /api/tasks
  // PATCH /api/demands/123/status -> url: /api/demands/123/status

  let entity = "record";
  if (url.includes("/api/tasks")) entity = "task";
  else if (url.includes("/api/bills")) entity = "bill";
  else if (url.includes("/api/demands")) entity = "demand";
  else if (url.includes("/api/clients")) entity = "client";
  else if (url.includes("/api/inventory")) entity = "inventory item";
  else if (url.includes("/api/attendance")) entity = "attendance";
  else if (url.includes("/api/users")) entity = "user profile";

  if (method === "POST") return `Created a new ${entity}`;
  if (method === "PATCH") return `Updated a ${entity}`;
  if (method === "DELETE") return `Deleted a ${entity}`;

  return `Performed ${method} on ${entity}`;
}

export const activityLogger = async (req, res, next) => {
  // We only hook into the finish event to log successful mutations
  res.on('finish', async () => {
    // Only log state-changing requests that succeed
    if (["POST", "PATCH", "DELETE"].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      if (req.url.includes("/auth/login")) return; // Don't log logins here
      
      const user = req.user; // Set by authMiddleware
      if (!user) return;

      const actionText = getActionDescription(req);
      
      const logEntry = {
        id: crypto.randomUUID(),
        userCode: user.userCode,
        name: user.name || user.username,
        action: actionText,
        details: `${req.method} request to ${req.baseUrl + req.url}`,
        timestamp: new Date().toISOString()
      };

      db.logs.push(logEntry);
      
      // Async sync, we don't await because response is already finished
      syncCollection("logs").catch(console.error);
    }
  });

  next();
};
