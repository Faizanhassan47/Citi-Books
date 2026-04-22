import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

const router = express.Router();

router.get("/", (req, res) => {
  const items =
    req.user.role === "owner"
      ? db.tasks
      : db.tasks.filter((task) => task.assignee === req.user.userCode);

  res.json(items);
});

router.post("/", async (req, res) => {
  const task = {
    id: crypto.randomUUID(),
    ...req.body,
    status: req.body.status || "pending"
  };

  db.tasks.push(task);
  await syncCollection("tasks");
  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const task = db.tasks.find((item) => item.id === req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  Object.assign(task, req.body);
  await syncCollection("tasks");
  res.json(task);
});

export default router;
