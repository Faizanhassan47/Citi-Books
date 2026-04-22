import { escapeHtml, renderEmptyRow } from "../../utils/html.js";

function filterDemands(data, searchTerm, categoryId = "all") {
  const source = categoryId === "all"
    ? data.demands
    : data.demands.filter((demand) => demand.categoryId === categoryId);

  if (!searchTerm) {
    return source;
  }

  const query = searchTerm.toLowerCase();
  return source.filter((demand) => {
    const category = data.categories.find((item) => item.id === demand.categoryId)?.name || "";
    const subcategory = data.subcategories.find((item) => item.id === demand.subcategoryId)?.name || "";
    return [demand.title, demand.status, demand.notes || "", category, subcategory, demand.createdBy]
      .some((value) => value.toLowerCase().includes(query));
  });
}

export function renderDemandsPage(state) {
  const data = state.data.demands;
  const demands = filterDemands(data, state.searchTerm, state.ui.demandCategoryId);
  const statusCounts = {
    pending: data.demands.filter((demand) => demand.status === "pending").length,
    approved: data.demands.filter((demand) => demand.status === "approved").length,
    rejected: data.demands.filter((demand) => demand.status === "rejected").length
  };

  return `
    <section class="page-shell demands-page">
      <section class="section-grid three">
        <article class="form-card reveal">
          <h3 class="section-title">Create category</h3>
          <form id="categoryForm" class="form-grid">
            <div class="field full"><label>Category name</label><input name="name" placeholder="Stationery, Office..." required /></div>
            <div class="field full"><button class="button" type="submit">Add category</button></div>
          </form>
        </article>

        <article class="form-card reveal">
          <h3 class="section-title">Create subcategory</h3>
          <form id="subcategoryForm" class="form-grid">
            <div class="field full">
              <label>Category</label>
              <select name="categoryId" required>
                ${data.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field full"><label>Subcategory name</label><input name="name" placeholder="Books, Paper..." required /></div>
            <div class="field full"><button class="button" type="submit">Add subcategory</button></div>
          </form>
        </article>

        <article class="form-card reveal">
          <h3 class="section-title">Create demand</h3>
          <form id="demandForm" class="form-grid">
            <div class="field full"><label>Title</label><input name="title" required /></div>
            <div class="field">
              <label>Category</label>
              <select name="categoryId" required>
                ${data.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Subcategory</label>
              <select name="subcategoryId" required>
                ${data.subcategories.map((subcategory) => `<option value="${escapeHtml(subcategory.id)}">${escapeHtml(subcategory.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field full"><label>Notes</label><textarea name="notes"></textarea></div>
            <div class="field full"><button class="button" type="submit">Create demand</button></div>
          </form>
        </article>
      </section>

      <article class="panel-card reveal demand-toolbar">
        <div class="demand-toolbar-grid">
          <div>
            <h3 class="section-title">Filter demands</h3>
            <p class="section-copy">Filter requests by category and move them between pending, approved, and rejected without leaving the page.</p>
          </div>
          <div class="field">
            <label>Category</label>
            <select id="demandCategoryFilter">
              <option value="all">All categories</option>
              ${data.categories.map((category) => `
                <option value="${escapeHtml(category.id)}" ${state.ui.demandCategoryId === category.id ? "selected" : ""}>${escapeHtml(category.name)}</option>
              `).join("")}
            </select>
          </div>
        </div>
        <div class="tag-row">
          <span class="chip blue">Pending ${statusCounts.pending}</span>
          <span class="chip green">Approved ${statusCounts.approved}</span>
          <span class="chip pink">Rejected ${statusCounts.rejected}</span>
          <span class="chip purple">Showing ${demands.length}</span>
        </div>
      </article>

      <article class="panel-card reveal">
        <h3 class="section-title">Current categories</h3>
        <div class="tag-row">
          ${data.categories.map((category) => `<span class="chip purple">${escapeHtml(category.name)}</span>`).join("")}
          ${data.subcategories.map((subcategory) => `<span class="chip blue">${escapeHtml(subcategory.name)}</span>`).join("")}
        </div>
      </article>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>Demand</th>
              <th>Category</th>
              <th>Raised by</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${demands.length ? demands.map((demand) => {
              const category = data.categories.find((item) => item.id === demand.categoryId)?.name || "-";
              const subcategory = data.subcategories.find((item) => item.id === demand.subcategoryId)?.name || "-";
              const creator = state.data.users.find((user) => user.userCode === demand.createdBy);
              const raisedBy = creator ? `${creator.name} (${creator.username})` : demand.createdBy;

              return `
                <tr>
                  <td>
                    <div class="demand-meta">
                      <strong>${escapeHtml(demand.title)}</strong>
                      <div class="muted">${escapeHtml(subcategory)}${demand.notes ? ` - ${escapeHtml(demand.notes)}` : ""}</div>
                    </div>
                  </td>
                  <td>${escapeHtml(category)}</td>
                  <td>${escapeHtml(raisedBy)}</td>
                  <td><span class="status-badge ${demand.status === "approved" ? "green" : demand.status === "rejected" ? "pink" : "blue"}">${escapeHtml(demand.status)}</span></td>
                  <td>
                    <div class="action-row demand-action-row">
                      <button class="inline-button success" data-demand-status="approved" data-demand-id="${demand.id}" ${demand.status === "approved" ? "disabled" : ""}>Approve</button>
                      <button class="inline-button danger" data-demand-status="rejected" data-demand-id="${demand.id}" ${demand.status === "rejected" ? "disabled" : ""}>Reject</button>
                      <button class="inline-button" data-demand-status="pending" data-demand-id="${demand.id}" ${demand.status === "pending" ? "disabled" : ""}>Pending</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("") : renderEmptyRow("No demands match this search.", 5)}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
