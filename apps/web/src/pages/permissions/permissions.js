import { escapeHtml } from "../../utils/html.js";

const modules = ["attendance", "tasks", "clients", "demands"];

function filterEmployees(users, searchTerm) {
  const employees = users.filter((user) => user.role === "employee");

  if (!searchTerm) {
    return employees;
  }

  const query = searchTerm.toLowerCase();
  return employees.filter((user) =>
    [user.name, user.userCode, user.department || "", user.permissions.join(" ")]
      .some((value) => value.toLowerCase().includes(query))
  );
}

export function renderPermissionsPage(state) {
  const employees = filterEmployees(state.data.users, state.searchTerm);

  return `
    <section class="page-shell permissions-page">
      <article class="panel-card reveal">
        <h3 class="section-title">Permission control</h3>
        <p class="section-copy">Grant or revoke module access for employees. Owners always keep full access.</p>
      </article>

      <section class="section-grid two">
        ${employees.map((user) => `
          <article class="form-card reveal">
            <div class="permission-head">
              <div>
                <h3 class="section-title">${escapeHtml(user.name)}</h3>
                <p class="section-copy">${escapeHtml(user.userCode)} - ${escapeHtml(user.department || "General")}</p>
              </div>
              <span class="status-badge ${user.isActive ? "green" : "pink"}">${user.isActive ? "active" : "inactive"}</span>
            </div>
            <form class="permission-form" data-user-id="${user.id}">
              <div class="permission-grid">
                ${modules.map((permission) => `
                  <label class="permission-item">
                    <input type="checkbox" name="permissions" value="${permission}" ${user.permissions.includes(permission) ? "checked" : ""} />
                    <span>${escapeHtml(permission)}</span>
                  </label>
                `).join("")}
              </div>
              <div class="action-row">
                <button class="button" type="submit">Save permissions</button>
              </div>
            </form>
          </article>
        `).join("")}
      </section>
    </section>
  `;
}
