import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import billsRoutes from "./bills.routes.js";
import clientsRoutes from "./clients.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import demandsRoutes from "./demands.routes.js";
import tasksRoutes from "./tasks.routes.js";
import usersRoutes from "./users.routes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "citibooks-backend" });
});

router.use("/auth", authRoutes);
router.use("/dashboard", requireAuth, requireRole("owner"), dashboardRoutes);
router.use("/users", requireAuth, requireRole("owner"), usersRoutes);
router.use("/attendance", requireAuth, attendanceRoutes);
router.use("/tasks", requireAuth, tasksRoutes);
router.use("/clients", requireAuth, clientsRoutes);
router.use("/demands", requireAuth, demandsRoutes);
router.use("/bills", requireAuth, requireRole("owner"), billsRoutes);

export default router;
