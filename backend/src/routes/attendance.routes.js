import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

const router = express.Router();
const SHIFT_START_HOUR = 10;
const SHIFT_START_MINUTE = 0;

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayPresentUserCodes() {
  return new Set(
    db.attendance
      .filter((item) => item.date === getTodayDateKey() && item.status === "present")
      .map((item) => item.userCode)
  );
}

function getActiveEmployeeCount() {
  return db.users.filter((user) => user.role === "employee" && user.isActive).length;
}

function isLateArrival(date) {
  return (
    date.getHours() > SHIFT_START_HOUR ||
    (date.getHours() === SHIFT_START_HOUR && date.getMinutes() > SHIFT_START_MINUTE)
  );
}

router.get("/", (req, res) => {
  const records = db.attendance.map((record) => {
    const user = db.users.find((item) => item.userCode === record.userCode);
    return { ...record, userName: user?.name || "Unknown" };
  });

  res.json(records);
});

router.get("/summary", (req, res) => {
  const today = getTodayDateKey();
  const monthlyKey = today.slice(0, 7);
  const todayRecords = db.attendance.filter((item) => item.date === today);
  const monthRecords = db.attendance.filter((item) => item.date.startsWith(monthlyKey));
  const presentToday = getTodayPresentUserCodes().size;
  const absentToday = Math.max(getActiveEmployeeCount() - presentToday, 0);

  res.json({
    today: {
      present: presentToday,
      absent: absentToday
    },
    month: {
      total: monthRecords.length,
      present: monthRecords.filter((item) => item.status === "present").length,
      absent: monthRecords.filter((item) => item.status === "absent").length
    }
  });
});

router.post("/check-in", async (req, res) => {
  const today = getTodayDateKey();
  const now = new Date();
  const existingRecord = [...db.attendance].reverse().find(
    (item) => item.userCode === req.user.userCode && item.date === today
  );

  if (existingRecord?.checkIn && !existingRecord?.checkOut) {
    return res.status(400).json({ message: "You are already checked in for today" });
  }

  const nextRecord = existingRecord || {
    id: crypto.randomUUID(),
    userCode: req.user.userCode,
    date: today
  };

  nextRecord.checkIn = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  nextRecord.checkOut = null;
  nextRecord.status = "present";
  nextRecord.location = typeof req.body.location === "string" && req.body.location.trim() !== ""
    ? req.body.location.trim()
    : null;
  nextRecord.isLate = isLateArrival(now);

  if (!existingRecord) {
    db.attendance.push(nextRecord);
  }

  await syncCollection("attendance");
  res.status(existingRecord ? 200 : 201).json(nextRecord);
});

router.post("/check-out", async (req, res) => {
  const record = [...db.attendance].reverse().find(
    (item) => item.userCode === req.user.userCode && item.date === getTodayDateKey()
  );

  if (!record || !record.checkIn) {
    return res.status(404).json({ message: "No check-in found for today" });
  }

  if (record.checkOut) {
    return res.status(400).json({ message: "You are already checked out for today" });
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
