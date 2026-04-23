import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";
import { maskPhone } from "../utils/mask.js";

const router = express.Router();

router.get("/", (req, res) => {
  const clients = db.clients.map((client) => ({
    ...client,
    phone: req.user.role === "owner" ? client.phone : maskPhone(client.phone)
  }));

  res.json(clients);
});

router.post("/", async (req, res) => {
  const client = {
    id: crypto.randomUUID(),
    ...req.body
  };

  db.clients.push(client);
  await syncCollection("clients");
  res.status(201).json(client);
});

router.patch("/:id", async (req, res) => {
  const client = db.clients.find((item) => item.id === req.params.id);

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can edit clients" });
  }

  Object.assign(client, req.body);
  await syncCollection("clients");
  res.json(client);
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can delete clients" });
  }
  const index = db.clients.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Client not found" });
  db.clients.splice(index, 1);
  await syncCollection("clients");
  res.json({ message: "Client deleted" });
});

export default router;
