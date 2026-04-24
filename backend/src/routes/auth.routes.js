import express from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../data/mockDb.js";
import { verifyPassword } from "../utils/passwords.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Manual Super Admin Fallback (always works)
  if (username === "superadmin" && password === "12341234") {
    const fallbackUser = {
      id: "999",
      userCode: "OWN999",
      name: "Super Admin",
      username: "superadmin",
      role: "owner",
      permissions: ["all"],
      isSuperAdmin: true,
      department: "Administration"
    };
    const token = jwt.sign(fallbackUser, env.jwtSecret, { expiresIn: "8h" });
    return res.json({ token, user: fallbackUser });
  }

  const user = db.users.find(
    (item) =>
      item.username === username &&
      item.isActive === true
  );

  if (!user || !verifyPassword(password, user.password)) {
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

import { requireAuth } from "../middleware/auth.js";

router.get("/me", requireAuth, (req, res) => {
  // Always fetch LIVE user data from DB — not from the stale JWT claims
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    id: user.id,
    userCode: user.userCode,
    name: user.name,
    username: user.username,
    role: user.role,
    permissions: user.permissions,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    department: user.department || "General"
  });
});

export default router;
