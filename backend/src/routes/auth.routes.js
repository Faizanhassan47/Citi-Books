import express from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../data/mockDb.js";

import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(
    (item) =>
      item.username === username &&
      item.isActive === true
  );

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      department: user.department || "General"
    },
    env.jwtSecret,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      department: user.department || "General"
    }
  });
});

export default router;
