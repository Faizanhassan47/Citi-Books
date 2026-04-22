import { escapeHtml } from "../../utils/html.js";

const pageMeta = {
  dashboard: {
    eyebrow: "Owner Control Panel",
    title: "CitiBooks Command Dashboard",
    placeholder: "Search employees, clients, tasks..."
  },
  users: {
    eyebrow: "User Management",
    title: "Owners, Employees, and Role Control",
    placeholder: "Search users or user codes..."
  },
  attendance: {
    eyebrow: "Attendance Management",
    title: "Daily and Monthly Attendance Reports",
    placeholder: "Search attendance by employee..."
  },
  tasks: {
    eyebrow: "Task Management",
    title: "Assign, Track, and Close Tasks",
    placeholder: "Search tasks or assignees..."
  },
  clients: {
    eyebrow: "Client Management",
    title: "Client Records and Contact Notes",
    placeholder: "Search clients or cities..."
  },
  demands: {
    eyebrow: "Demand Management",
    title: "Categories, Requests, and Approvals",
    placeholder: "Search categories or demands..."
  },
  bills: {
    eyebrow: "Bills Management",
    title: "Bills, Dues, and Access Control",
    placeholder: "Search bills or due amounts..."
  },
  permissions: {
    eyebrow: "Permissions Management",
    title: "Grant and Revoke Employee Access",
    placeholder: "Search employees or permissions..."
  }
};

export function createTopbar(route, user, searchTerm = "") {
  const meta = pageMeta[route] || pageMeta.dashboard;
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "US";

  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${escapeHtml(meta.eyebrow)}</p>
        <h1 class="topbar-title">${escapeHtml(meta.title)}</h1>
      </div>
      <div class="topbar-actions">
        <label class="search">
          <span>Search</span>
          <input id="globalSearchInput" type="text" value="${escapeHtml(searchTerm)}" placeholder="${escapeHtml(meta.placeholder)}" />
        </label>
        <div class="admin-pill">
          <div class="avatar">${escapeHtml(initials)}</div>
          <div>
            <strong>${escapeHtml(user?.name || "User")}</strong>
            <span>${escapeHtml(user?.userCode || "")} | ${escapeHtml(user?.username || "")}</span>
          </div>
        </div>
        <button class="ghost-button topbar-logout" data-app-action="logout">Logout</button>
      </div>
    </header>
  `;
}
