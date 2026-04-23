import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";

const router = express.Router();

function requireOwner(req, res) {
  if (req.user.role !== "owner") {
    res.status(403).json({ message: "Owner access required" });
    return false;
  }

  return true;
}

router.get("/", (req, res) => {
  res.json({
    categories: db.categories,
    subcategories: db.subcategories,
    demands: db.demands
  });
});

router.post("/", async (req, res) => {
  const demand = {
    id: crypto.randomUUID(),
    ...req.body,
    createdBy: req.user.userCode,
    status: req.body.status || "pending"
  };

  db.demands.push(demand);
  await syncCollection("demands");
  res.status(201).json(demand);
});

router.post("/categories", async (req, res) => {
  if (!requireOwner(req, res)) {
    return;
  }

  const category = {
    id: crypto.randomUUID(),
    name: req.body.name
  };

  db.categories.push(category);
  await syncCollection("categories");
  res.status(201).json(category);
});

router.post("/subcategories", async (req, res) => {
  if (!requireOwner(req, res)) {
    return;
  }

  const subcategory = {
    id: crypto.randomUUID(),
    categoryId: req.body.categoryId,
    name: req.body.name
  };

  db.subcategories.push(subcategory);
  await syncCollection("subcategories");
  res.status(201).json(subcategory);
});

router.patch("/:id/status", async (req, res) => {
  if (!requireOwner(req, res)) {
    return;
  }

  const demand = db.demands.find((item) => item.id === req.params.id);

  if (!demand) {
    return res.status(404).json({ message: "Demand not found" });
  }

  demand.status = req.body.status;
  await syncCollection("demands");
  res.json(demand);
});

router.delete("/:id", async (req, res) => {
  if (!requireOwner(req, res)) return;
  const index = db.demands.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Demand not found" });
  db.demands.splice(index, 1);
  await syncCollection("demands");
  res.json({ message: "Demand deleted" });
});

export default router;
