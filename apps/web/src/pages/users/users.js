import { escapeHtml, renderEmptyRow } from "../../utils/html.js";

function filterUsers(users, searchTerm) {
  if (!searchTerm) {
    return users;
  }

  const query = searchTerm.toLowerCase();
  return users.filter((user) =>
    [user.name, user.userCode, user.username, user.role, user.department]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  );
}

export function renderUsersPage(state) {
  const users = filterUsers(state.data.users, state.searchTerm);
  const isSuperAdmin = Boolean(state.currentUser?.isSuperAdmin);
  const owners = state.data.users.filter((user) => user.role === "owner").length;
  const employees = state.data.users.filter((user) => user.role === "employee").length;
  const superAdmins = state.data.users.filter((user) => user.isSuperAdmin).length;

  return `
    <section class="page-shell users-page">
      <section class="metric-grid">
        <article class="metric-box reveal"><span class="chip purple">Owners</span><strong>${owners}/3</strong><p class="muted">Owner limit from system rules.</p></article>
        <article class="metric-box reveal"><span class="chip blue">Employees</span><strong>${employees}/20</strong><p class="muted">Employee limit enforced in backend.</p></article>
        <article class="metric-box reveal"><span class="chip green">Super Admins</span><strong>${superAdmins}</strong><p class="muted">Password reset and delete authority.</p></article>
        <article class="metric-box reveal"><span class="chip pink">Inactive</span><strong>${state.data.users.filter((user) => !user.isActive).length}</strong><p class="muted">Deactivated but retained records.</p></article>
      </section>

      <section class="section-grid two">
        ${isSuperAdmin ? `
          <article class="form-card reveal">
            <h3 class="section-title">Create user</h3>
            <p class="section-copy">Super admin can add employees and owners. Users login with their username and the default starter password.</p>
            <form id="createUserForm" class="form-grid">
              <div class="field"><label>Name</label><input name="name" placeholder="Enter full name" required /></div>
              <div class="field"><label>Username</label><input name="username" placeholder="Unique username" required /></div>
              <div class="field"><label>Department</label><input name="department" placeholder="Sales, Field, Support..." /></div>
              <div class="field">
                <label>Role</label>
                <select name="role">
                  <option value="employee">Employee</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div class="field full"><button class="button" type="submit">Create user</button></div>
            </form>
            <p class="form-footnote">New accounts start with password <strong>changeme123</strong> until the super admin resets it.</p>
          </article>
        ` : `
          <article class="panel-card reveal super-admin-panel">
            <h3 class="section-title">Create user</h3>
            <p class="section-copy">Only the super admin can add new users. Owners can still manage role, activation, and permissions for existing records.</p>
            <div class="tag-row">
              <span class="chip purple">Super admin only</span>
              <span class="chip blue">Username login</span>
            </div>
          </article>
        `}

        ${isSuperAdmin ? `
          <article class="form-card reveal">
            <h3 class="section-title">Reset password</h3>
            <p class="section-copy">Choose any user and set a fresh password. Users will login with their username and this new password.</p>
            <form id="resetPasswordForm" class="form-grid">
              <div class="field">
                <label>User</label>
                <select name="userId" required>
                  ${state.data.users.map((user) => `
                    <option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.username)})</option>
                  `).join("")}
                </select>
              </div>
              <div class="field">
                <label>New password</label>
                <input name="password" type="password" minlength="6" placeholder="Minimum 6 characters" required />
              </div>
              <div class="field full"><button class="button" type="submit">Reset password</button></div>
            </form>
          </article>
        ` : `
          <article class="panel-card reveal">
            <h3 class="section-title">Owner controls</h3>
            <p class="section-copy">Promote employees, demote owners, and deactivate users while keeping at least one owner and one super admin in the system.</p>
            <div class="tag-row">
              <span class="chip purple">Max 3 owners</span>
              <span class="chip blue">Max 20 employees</span>
              <span class="chip green">Unique usernames</span>
              <span class="chip pink">Safe delete rules</span>
            </div>
          </article>
        `}
      </section>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Department</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.length ? users.map((user) => `
              <tr>
                <td>
                  <div class="user-primary">
                    <strong>${escapeHtml(user.name)}</strong>
                    <div class="muted">${escapeHtml(user.userCode)}</div>
                  </div>
                </td>
                <td>
                  <div class="user-login">
                    <strong>@${escapeHtml(user.username)}</strong>
                    <span class="muted">${user.isActive ? "Can login" : "Inactive login"}</span>
                  </div>
                </td>
                <td>
                  <div class="user-role-stack">
                    <span class="status-badge ${user.role === "owner" ? "purple" : "blue"}">${escapeHtml(user.role)}</span>
                    ${user.isSuperAdmin ? `<span class="chip green">Super Admin</span>` : ""}
                  </div>
                </td>
                <td><span class="status-badge ${user.isActive ? "green" : "pink"}">${user.isActive ? "active" : "inactive"}</span></td>
                <td>${escapeHtml(user.department || "General")}</td>
                <td>${escapeHtml(user.permissions.join(", "))}</td>
                <td>
                  <div class="action-row user-action-stack">
                    ${user.role === "employee" ? `<button class="inline-button" data-user-action="promote" data-user-id="${user.id}">Promote</button>` : `<button class="inline-button" data-user-action="demote" data-user-id="${user.id}">Demote</button>`}
                    ${user.isActive
                      ? `<button class="inline-button danger" data-user-action="deactivate" data-user-id="${user.id}">Deactivate</button>`
                      : `<button class="inline-button success" data-user-action="activate" data-user-id="${user.id}">Activate</button>`}
                    ${isSuperAdmin ? `<button class="inline-button danger" data-user-action="delete" data-user-id="${user.id}" ${user.id === state.currentUser.id ? "disabled" : ""}>Delete</button>` : ""}
                  </div>
                </td>
              </tr>
            `).join("") : renderEmptyRow("No users match this search yet.", 7)}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
