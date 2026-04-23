import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../data/mockDb.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const claims = jwt.verify(token, env.jwtSecret);
    const liveUser = db.users.find((user) => user.id === claims.id);

    if (!liveUser || liveUser.isActive !== true) {
      return res.status(401).json({ message: "User session is no longer active" });
    }

    req.user = {
      ...claims,
      id: liveUser.id,
      userCode: liveUser.userCode,
      name: liveUser.name,
      username: liveUser.username,
      role: liveUser.role,
      permissions: liveUser.permissions || [],
      isSuperAdmin: Boolean(liveUser.isSuperAdmin),
      department: liveUser.department || "General"
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role === "owner" || req.user.isSuperAdmin) {
      return next();
    }

    const grantedPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasPermission = permissions.some((permission) => grantedPermissions.includes(permission));

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    next();
  };
}
