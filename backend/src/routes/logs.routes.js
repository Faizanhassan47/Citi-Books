import express from "express";
import { db } from "../data/mockDb.js";

const router = express.Router();

router.get("/", (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can view logs" });
  }

  // return logs, sorted backward by timestamp
  const sortedLogs = [...db.logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sortedLogs);
});

export default router;
