import express from "express";
import { db } from "../data/mockDb.js";

const router = express.Router();

router.get("/", (req, res) => {
  const totalEmployees = db.users.filter((user) => user.role === "employee").length;
  const presentToday = db.attendance.filter(
    (item) => item.date === "2026-04-16" && item.status === "present"
  ).length;
  const totalTasks = db.tasks.length;
  const pendingTasks = db.tasks.filter((task) => task.status !== "done").length;
  const totalClients = db.clients.length;
  const totalDemands = db.demands.length;
  const totalDues = db.bills.reduce((sum, bill) => sum + bill.dueAmount, 0);

  res.json({
    metrics: [
      { label: "Employees", value: totalEmployees, accent: "blue", trend: "+12%" },
      { label: "Present Today", value: presentToday, accent: "green", trend: "+5%" },
      { label: "Tasks", value: totalTasks, accent: "purple", trend: "+8%" },
      { label: "Pending", value: pendingTasks, accent: "softPurple", trend: "-2%" },
      { label: "Clients", value: totalClients, accent: "blue", trend: "+7%" },
      { label: "Demands", value: totalDemands, accent: "green", trend: "+11%" },
      { label: "Dues", value: `Rs ${totalDues.toLocaleString()}`, accent: "purple", trend: "+4%" }
    ],
    attendance: {
      desktop: 28,
      mobile: 54,
      tablet: 18
    },
    analytics: {
      active: 80,
      completed: 20
    },
    quickStats: [
      { label: "Users", value: 6461, expected: 8905 },
      { label: "Goals", value: 210, expected: 150 },
      { label: "Traffic", value: 509, expected: 320 }
    ]
  });
});

export default router;
