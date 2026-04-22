import { escapeHtml } from "../../utils/html.js";

export function renderEmployeePage(user) {
  return `
    <section class="auth-shell">
      <article class="employee-card reveal">
        <p class="eyebrow">Employee Login</p>
        <h1>Welcome, ${escapeHtml(user.name)}</h1>
        <p class="section-copy">
          Your account is active and authenticated with username <strong>${escapeHtml(user.username)}</strong>.
          This web panel is limited for employees. Use the native employee app for attendance, tasks, clients, and demands.
        </p>
        <div class="employee-grid">
          <article class="panel-card">
            <h3 class="section-title">User code</h3>
            <p>${escapeHtml(user.userCode)}</p>
          </article>
          <article class="panel-card">
            <h3 class="section-title">Department</h3>
            <p>${escapeHtml(user.department || "General")}</p>
          </article>
          <article class="panel-card">
            <h3 class="section-title">Role</h3>
            <p>${escapeHtml(user.role)}</p>
          </article>
          <article class="panel-card">
            <h3 class="section-title">Permissions</h3>
            <p>${escapeHtml((user.permissions || []).join(", "))}</p>
          </article>
        </div>
        <div class="action-row">
          <button class="button" data-app-action="logout">Logout</button>
        </div>
      </article>
    </section>
  `;
}
