import express from "express";
import { requireAuth, requirePermission, requireRole } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import billsRoutes from "./bills.routes.js";
import clientsRoutes from "./clients.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import demandsRoutes from "./demands.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import tasksRoutes from "./tasks.routes.js";
import usersRoutes from "./users.routes.js";
import logsRoutes from "./logs.routes.js";
import { activityLogger } from "../middleware/activityLogger.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "citibooks-backend" });
});

router.use("/auth", authRoutes);

router.use(activityLogger);

router.use("/dashboard", requireAuth, requireRole("owner"), dashboardRoutes);
router.use("/users", requireAuth, requireRole("owner"), usersRoutes);
router.use("/attendance", requireAuth, requirePermission("attendance"), attendanceRoutes);
router.use("/tasks", requireAuth, requirePermission("tasks"), tasksRoutes);
router.use("/clients", requireAuth, requirePermission("clients"), clientsRoutes);
router.use("/demands", requireAuth, requirePermission("demands"), demandsRoutes);
router.use("/bills", requireAuth, requirePermission("bills"), billsRoutes);
router.use("/inventory", requireAuth, requirePermission("inventory"), inventoryRoutes);
router.use("/logs", requireAuth, requireRole("owner"), logsRoutes);

export default router;
