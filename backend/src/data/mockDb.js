export const db = {
  users: [
    {
      id: "1",
      userCode: "OWN001",
      name: "Faizan Hassan",
      username: "owner",
      password: "owner123",
      role: "owner",
      isSuperAdmin: true,
      isActive: true,
      createdBy: "system",
      createdAt: "2026-04-16T09:00:00.000Z",
      permissions: ["all"],
      department: "Administration"
    },
    {
      id: "2",
      userCode: "EMP001",
      name: "Ayesha Khan",
      username: "employee",
      password: "employee123",
      role: "employee",
      isSuperAdmin: false,
      isActive: true,
      createdBy: "OWN001",
      createdAt: "2026-04-16T09:30:00.000Z",
      permissions: ["attendance", "tasks", "clients", "demands"],
      department: "Sales"
    },
    {
      id: "3",
      userCode: "EMP002",
      name: "Ali Raza",
      username: "ali.raza",
      password: "employee123",
      role: "employee",
      isSuperAdmin: false,
      isActive: true,
      createdBy: "OWN001",
      createdAt: "2026-04-16T10:10:00.000Z",
      permissions: ["attendance", "tasks"],
      department: "Field"
    },
    {
      id: "4",
      userCode: "EMP003",
      name: "Sara Noor",
      username: "sara.noor",
      password: "employee123",
      role: "employee",
      isSuperAdmin: false,
      isActive: false,
      createdBy: "OWN001",
      createdAt: "2026-04-16T10:25:00.000Z",
      permissions: ["attendance", "clients", "demands"],
      department: "Support"
    }
  ],
  attendance: [
    {
      id: "att-1",
      userCode: "EMP001",
      date: "2026-04-16",
      checkIn: "09:05",
      checkOut: null,
      status: "present"
    },
    {
      id: "att-2",
      userCode: "EMP002",
      date: "2026-04-16",
      checkIn: "09:18",
      checkOut: "18:01",
      status: "present"
    },
    {
      id: "att-3",
      userCode: "EMP003",
      date: "2026-04-16",
      checkIn: null,
      checkOut: null,
      status: "absent"
    },
    {
      id: "att-4",
      userCode: "EMP001",
      date: "2026-04-15",
      checkIn: "09:00",
      checkOut: "18:04",
      status: "present"
    }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Follow up with wholesale client",
      assignee: "EMP001",
      priority: "high",
      dueDate: "2026-04-17",
      status: "in-progress"
    },
    {
      id: "task-2",
      title: "Verify bill images",
      assignee: "EMP001",
      priority: "medium",
      dueDate: "2026-04-18",
      status: "pending"
    },
    {
      id: "task-3",
      title: "Collect overdue payment follow-up",
      assignee: "EMP002",
      priority: "high",
      dueDate: "2026-04-19",
      status: "done"
    }
  ],
  clients: [
    {
      id: "client-1",
      name: "Citi Mart",
      phone: "03123456789",
      city: "Karachi",
      notes: "Prefers end-of-week follow up."
    },
    {
      id: "client-2",
      name: "Prime Traders",
      phone: "03001234567",
      city: "Lahore",
      notes: "Interested in new category launch."
    }
  ],
  categories: [
    { "id": "cat-1", "name": "Stationery" },
    { "id": "cat-2", "name": "Office Supplies" }
  ],
  subcategories: [
    { "id": "sub-1", "categoryId": "cat-1", "name": "Books" },
    { "id": "sub-2", "categoryId": "cat-2", "name": "Paper" }
  ],
  demands: [
    {
      id: "dem-1",
      title: "Notebook restock",
      categoryId: "cat-1",
      subcategoryId: "sub-1",
      createdBy: "EMP001",
      notes: "Restock for school campaign",
      status: "pending"
    },
    {
      id: "dem-2",
      title: "A4 paper urgent stock",
      categoryId: "cat-2",
      subcategoryId: "sub-2",
      createdBy: "EMP002",
      notes: "Current inventory below threshold",
      status: "approved"
    }
  ],
  bills: [
    {
      id: "bill-1",
      title: "Supplier invoice April",
      amount: 24000,
      dueAmount: 9000,
      imageUrl: "",
      image: null,
      imageHistory: [],
      accessUsers: ["EMP001"],
      createdBy: "OWN001"
    },
    {
      id: "bill-2",
      title: "Transport bill week 3",
      amount: 12000,
      dueAmount: 3000,
      imageUrl: "",
      image: null,
      imageHistory: [],
      accessUsers: ["EMP002"],
      createdBy: "OWN001"
    }
  ],
  inventory: [],
  logs: []
};
