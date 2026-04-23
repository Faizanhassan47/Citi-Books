import express from "express";
import crypto from "node:crypto";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();
const isOwner = requireRole("owner");

router.get("/", (req, res) => {
  if (req.user.role !== 'owner') {
    // Employees see only their own submissions
    return res.json(db.inventory.filter(i => i.createdBy === req.user.userCode));
  }
  res.json(db.inventory);
});

// Employees with 'inventory' permission (or owner) can add items
router.post("/", async (req, res) => {
  const item = {
    id: crypto.randomUUID(),
    name: req.body.name,
    stock: Number(req.body.stock) || 0,
    unit: req.body.unit || "pcs",
    threshold: Number(req.body.threshold) || 5,
    createdBy: req.user.userCode,
    createdByName: req.user.name,
    lastUpdatedBy: req.user.userCode,
    lastUpdatedByName: req.user.name,
    lastUpdated: new Date().toISOString()
  };
  
  db.inventory.push(item);
  await syncCollection("inventory");
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const item = db.inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  // Employees can only edit their own entries
  if (req.user.role !== 'owner' && item.createdBy !== req.user.userCode) {
    return res.status(403).json({ message: "You can only edit your own entries" });
  }

  if (req.body.name !== undefined) item.name = req.body.name;
  if (req.body.stock !== undefined) item.stock = Number(req.body.stock);
  if (req.body.threshold !== undefined) item.threshold = Number(req.body.threshold);
  if (req.body.unit !== undefined) item.unit = req.body.unit;
  item.lastUpdatedBy = req.user.userCode;
  item.lastUpdatedByName = req.user.name;
  item.lastUpdated = new Date().toISOString();

  await syncCollection("inventory");
  res.json(item);
});

router.delete("/:id", isOwner, async (req, res) => {
  const idx = db.inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Item not found" });

  db.inventory.splice(idx, 1);
  await syncCollection("inventory");
  res.json({ message: "Deleted" });
});

export default router;
