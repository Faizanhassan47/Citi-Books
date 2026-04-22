import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(db.attendance);
});

router.get("/summary", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthlyKey = today.slice(0, 7);
  const todayRecords = db.attendance.filter((item) => item.date === today);
  const monthRecords = db.attendance.filter((item) => item.date.startsWith(monthlyKey));

  res.json({
    today: {
      present: todayRecords.filter((item) => item.status === "present").length,
      absent: todayRecords.filter((item) => item.status === "absent").length
    },
    month: {
      total: monthRecords.length,
      present: monthRecords.filter((item) => item.status === "present").length,
      absent: monthRecords.filter((item) => item.status === "absent").length
    }
  });
});

router.post("/check-in", async (req, res) => {
  const record = {
    id: crypto.randomUUID(),
    userCode: req.user.userCode,
    date: new Date().toISOString().slice(0, 10),
    checkIn: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    checkOut: null,
    status: "present"
  };

  db.attendance.push(record);
  await syncCollection("attendance");
  res.status(201).json(record);
});

router.post("/check-out", async (req, res) => {
  const record = [...db.attendance].reverse().find(
    (item) => item.userCode === req.user.userCode && item.date === new Date().toISOString().slice(0, 10)
  );

  if (!record) {
    return res.status(404).json({ message: "No check-in found for today" });
  }

  record.checkOut = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  await syncCollection("attendance");
  res.json(record);
});

export default router;
