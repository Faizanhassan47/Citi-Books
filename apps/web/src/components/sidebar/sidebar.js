import { escapeHtml } from "../../utils/html.js";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "attendance", label: "Attendance" },
  { id: "tasks", label: "Tasks" },
  { id: "clients", label: "Clients" },
  { id: "demands", label: "Demands" },
  { id: "bills", label: "Bills" },
  { id: "permissions", label: "Permissions" }
];

export function createSidebar(route, counts = {}) {
  return `
    <aside class="sidebar">
      <div class="brand-mark">
        <img src="/assets/citi-logo.png" alt="CitiBooks logo" />
      </div>
      <nav class="nav-links">
        ${navItems.map((item) => `
          <button class="nav-link ${route === item.id ? "is-active" : ""}" data-route="${item.id}">
            <span>${escapeHtml(item.label)}</span>
            <small>${escapeHtml(counts[item.id] ?? "")}</small>
          </button>
        `).join("")}
      </nav>
      <div class="sidebar-glow"></div>
    </aside>
  `;
}
