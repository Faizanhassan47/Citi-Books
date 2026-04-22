import crypto from "node:crypto";
import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../data/mockDb.js";
import { syncCollection } from "../data/persistence.js";
import { nextUserCode } from "../utils/idGenerator.js";

const router = express.Router();

function countByRole(role, excludeId) {
  return db.users.filter((user) => user.role === role && user.id !== excludeId).length;
}

function countSuperAdmins(excludeId) {
  return db.users.filter((user) => user.isSuperAdmin === true && user.id !== excludeId).length;
}

function requireSuperAdmin(req, res) {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: "Super admin access required" });
    return false;
  }

  return true;
}

function defaultPermissions(role) {
  return role === "owner"
    ? ["all"]
    : ["attendance", "tasks", "clients", "demands"];
}

function ensureOwnerCapacity(excludeId) {
  if (countByRole("owner", excludeId) >= 3) {
    return "Owner limit reached";
  }

  return null;
}

function ensureEmployeeCapacity(excludeId) {
  if (countByRole("employee", excludeId) >= 20) {
    return "Employee limit reached";
  }

  return null;
}

router.get("/", (req, res) => {
  res.json(db.users);
});

router.post("/", async (req, res) => {
  if (!requireSuperAdmin(req, res)) {
    return;
  }

  const { name, username, role = "employee", department = "General" } = req.body;

  if (role === "owner" && ensureOwnerCapacity()) {
    return res.status(400).json({ message: ensureOwnerCapacity() });
  }

  if (role === "employee" && ensureEmployeeCapacity()) {
    return res.status(400).json({ message: ensureEmployeeCapacity() });
  }

  if (db.users.some((user) => user.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const user = {
    id: crypto.randomUUID(),
    userCode: nextUserCode(role, db.users),
    name,
    username,
    password: bcrypt.hashSync("changeme123", 10),
    role,
    isSuperAdmin: false,
    isActive: true,
    createdBy: req.user.userCode,
    createdAt: new Date().toISOString(),
    permissions: defaultPermissions(role),
    department
  };

  db.users.push(user);
  await syncCollection("users");
  res.status(201).json(user);
});

router.patch("/:id", async (req, res) => {
  const user = db.users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const nextRole = req.body.role || user.role;

  if (nextRole === "owner" && user.role !== "owner") {
    const ownerError = ensureOwnerCapacity(user.id);

    if (ownerError) {
      return res.status(400).json({ message: ownerError });
    }

    user.userCode = nextUserCode("owner", db.users.filter((item) => item.id !== user.id));
    user.permissions = ["all"];
    user.isSuperAdmin = false;
  }

  if (nextRole === "employee" && user.role === "owner") {
    const ownerCount = countByRole("owner");

    if (ownerCount <= 1) {
      return res.status(400).json({ message: "At least one owner must remain" });
    }
  }

  if (nextRole === "employee" && user.role !== "employee") {
    const employeeError = ensureEmployeeCapacity(user.id);

    if (employeeError) {
      return res.status(400).json({ message: employeeError });
    }

    user.userCode = nextUserCode("employee", db.users.filter((item) => item.id !== user.id));
    user.permissions = req.body.permissions || defaultPermissions("employee");
    user.isSuperAdmin = false;
  }

  if (req.body.username && db.users.some((item) => item.username === req.body.username && item.id !== user.id)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
  }

  Object.assign(user, req.body, { role: nextRole });
  await syncCollection("users");
  res.json(user);
});

router.patch("/:id/status", async (req, res) => {
  const user = db.users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "owner" && req.body.isActive === false && countByRole("owner") <= 1) {
    return res.status(400).json({ message: "At least one active owner must remain" });
  }

  if (user.isSuperAdmin && req.body.isActive === false && countSuperAdmins(user.id) < 1) {
    return res.status(400).json({ message: "At least one super admin must remain" });
  }

  user.isActive = Boolean(req.body.isActive);
  await syncCollection("users");
  res.json(user);
});

router.post("/:id/promote", async (req, res) => {
  const user = db.users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "owner") {
    return res.status(400).json({ message: "User is already an owner" });
  }

  const ownerError = ensureOwnerCapacity(user.id);

  if (ownerError) {
    return res.status(400).json({ message: ownerError });
  }

  user.role = "owner";
  user.userCode = nextUserCode("owner", db.users.filter((item) => item.id !== user.id));
  user.permissions = ["all"];
  user.isSuperAdmin = false;
  await syncCollection("users");
  res.json(user);
});

router.post("/:id/demote", async (req, res) => {
  const user = db.users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role !== "owner") {
    return res.status(400).json({ message: "Only owners can be demoted" });
  }

  const ownerCount = countByRole("owner");

  if (ownerCount <= 1) {
    return res.status(400).json({ message: "At least one owner must remain" });
  }

  user.role = "employee";
  user.userCode = nextUserCode("employee", db.users.filter((item) => item.id !== user.id));
  user.permissions = defaultPermissions("employee");
  user.isSuperAdmin = false;
  await syncCollection("users");
  res.json(user);
});

router.post("/:id/reset-password", async (req, res) => {
  if (!requireSuperAdmin(req, res)) {
    return;
  }

  const user = db.users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const nextPassword = (req.body.password || "").trim();

  if (!nextPassword || nextPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  user.password = bcrypt.hashSync(nextPassword, 10);
  await syncCollection("users");
  res.json({ message: "Password reset successfully", userId: user.id });
});

router.delete("/:id", async (req, res) => {
  if (!requireSuperAdmin(req, res)) {
    return;
  }

  const index = db.users.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = db.users[index];

  if (user.id === req.user.id) {
    return res.status(400).json({ message: "Super admin cannot delete their own account" });
  }

  if (user.role === "owner" && countByRole("owner", user.id) < 1) {
    return res.status(400).json({ message: "At least one owner must remain" });
  }

  if (user.isSuperAdmin && countSuperAdmins(user.id) < 1) {
    return res.status(400).json({ message: "At least one super admin must remain" });
  }

  db.users.splice(index, 1);
  await syncCollection("users");
  res.json({ message: "User deleted successfully", userId: user.id });
});

export default router;
