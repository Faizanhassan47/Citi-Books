import crypto from "node:crypto";
import express from "express";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";
import { uploadBillImage } from "../utils/cloudinary.js";

const router = express.Router();

function withBillImageMetadata(bill, imageUpload) {
  if (!imageUpload) {
    return bill;
  }

  bill.imageUrl = imageUpload.imageUrl;
  bill.image = imageUpload;
  bill.imageHistory = [...(bill.imageHistory || []), imageUpload];
  return bill;
}

function canEditBill(req, bill) {
  return req.user.role === "owner" || bill.createdBy === req.user.userCode;
}

router.get("/", (req, res) => {
  if (req.user.role !== "owner") {
    const myBills = db.bills.filter(
      (bill) => bill.createdBy === req.user.userCode ||
        (Array.isArray(bill.accessUsers) && bill.accessUsers.includes(req.user.userCode))
    );
    return res.json(myBills);
  }

  res.json(db.bills);
});

router.post("/", async (req, res, next) => {
  try {
    const billId = crypto.randomUUID();
    const imageUpload = req.body.imageData
      ? await uploadBillImage({
          imageData: req.body.imageData,
          billId,
          uploadedBy: req.user.userCode,
          uploadedByName: req.user.name
        })
      : null;

    const bill = {
      id: billId,
      ...req.body,
      accessUsers: req.user.role === "owner" ? (req.body.accessUsers || []) : [],
      createdBy: req.user.userCode,
      image: null,
      imageHistory: [],
      status: req.body.status || "pending",
      paymentMethod: req.body.paymentMethod || null
    };

    delete bill.imageData;
    withBillImageMetadata(bill, imageUpload);
    db.bills.push(bill);
    await syncCollection("bills");
    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const bill = db.bills.find((item) => item.id === req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (!canEditBill(req, bill)) {
      return res.status(403).json({ message: "You can only edit your own bills" });
    }

    if (bill.status === "paid" && req.user.role !== "owner") {
      return res.status(400).json({ message: "Paid bills cannot be edited" });
    }

    const updates = { ...req.body };
    let imageUpload = null;

    if (updates.imageData) {
      imageUpload = await uploadBillImage({
        imageData: updates.imageData,
        billId: bill.id,
        uploadedBy: req.user.userCode,
        uploadedByName: req.user.name
      });
    }

    delete updates.imageData;

    if (req.user.role !== "owner") {
      delete updates.accessUsers;
      delete updates.status;
      delete updates.paymentMethod;
    }

    Object.assign(bill, updates);
    withBillImageMetadata(bill, imageUpload);
    await syncCollection("bills");
    res.json(bill);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can update bill status" });
  }

  const bill = db.bills.find((item) => item.id === req.params.id);

  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  bill.status = req.body.status || bill.status || "pending";
  bill.paymentMethod = req.body.paymentMethod || bill.paymentMethod || null;
  await syncCollection("bills");
  res.json(bill);
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only owners can delete bills" });
  }
  const index = db.bills.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Bill not found" });
  db.bills.splice(index, 1);
  await syncCollection("bills");
  res.json({ message: "Bill deleted" });
});

export default router;
