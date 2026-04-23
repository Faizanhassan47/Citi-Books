import express from "express";
import { db } from "../data/mockDb.js";

const router = express.Router();

router.get("/", (req, res) => {
  const totalUsers = db.users.length;
  const activeEmployees = db.users.filter(u => u.role === 'employee' && u.isActive).length;
  const presentToday = new Set(
    db.attendance
      .filter((item) => item.date === new Date().toISOString().slice(0, 10) && item.status === "present")
      .map((item) => item.userCode)
  ).size;
  const openTasks = db.tasks.filter((task) => task.status !== "done").length;
  const totalClients = db.clients.length;
  const pendingDemands = db.demands.filter(d => d.status === 'pending').length;
  const totalBills = db.bills.length;
  const totalDues = db.bills.reduce((sum, bill) => sum + (bill.dueAmount || 0), 0);

  res.json({
    totalUsers,
    activeEmployees,
    presentToday,
    openTasks,
    totalClients,
    pendingDemands,
    totalBills,
    totalDues
  });
});

export default router;
