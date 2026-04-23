import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

const router = express.Router();

router.get("/", (req, res) => {
  const allTasks = db.tasks.map(task => {
    const user = db.users.find(u => u.userCode === task.assignee);
    return { ...task, assigneeName: user?.name || task.assignee };
  });

  const items =
    req.user.role === "owner"
      ? allTasks
      : allTasks.filter((task) => task.assignee === req.user.userCode);

  res.json(items);
});

router.post("/", async (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only Super Admin can create tasks" });
  }

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

  if (req.user.role !== "owner" && task.assignee !== req.user.userCode) {
    return res.status(403).json({ message: "You can only update your own tasks" });
  }

  if (req.user.role === "owner") {
    Object.assign(task, req.body);
  } else if (req.body.status) {
    task.status = req.body.status;
  }

  await syncCollection("tasks");
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can delete tasks" });
  }
  const index = db.tasks.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Task not found" });
  db.tasks.splice(index, 1);
  await syncCollection("tasks");
  res.json({ message: "Task deleted" });
});

export default router;
