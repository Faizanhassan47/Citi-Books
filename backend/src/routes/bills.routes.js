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

router.get("/", (req, res) => {
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
      accessUsers: req.body.accessUsers || [],
      createdBy: req.user.userCode,
      image: null,
      imageHistory: []
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
    Object.assign(bill, updates);
    withBillImageMetadata(bill, imageUpload);
    await syncCollection("bills");
    res.json(bill);
  } catch (error) {
    next(error);
  }
});

export default router;
