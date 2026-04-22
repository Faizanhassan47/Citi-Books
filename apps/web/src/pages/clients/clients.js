import { escapeHtml, renderEmptyRow } from "../../utils/html.js";

function filterClients(clients, searchTerm) {
  if (!searchTerm) {
    return clients;
  }

  const query = searchTerm.toLowerCase();
  return clients.filter((client) =>
    [client.name, client.phone, client.city, client.notes]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  );
}

export function renderClientsPage(state) {
  const clients = filterClients(state.data.clients, state.searchTerm);
  const editingClient = state.data.clients.find((client) => client.id === state.ui.editingClientId);

  return `
    <section class="page-shell clients-page">
      <section class="section-grid two">
        <article class="form-card reveal">
          <h3 class="section-title">${editingClient ? "Edit client" : "Add new client"}</h3>
          <p class="section-copy">Owners can maintain full client records, contact numbers, and notes.</p>
          <form id="clientForm" class="form-grid" data-editing-id="${editingClient?.id || ""}">
            <div class="field"><label>Client name</label><input name="name" value="${escapeHtml(editingClient?.name || "")}" required /></div>
            <div class="field"><label>City</label><input name="city" value="${escapeHtml(editingClient?.city || "")}" required /></div>
            <div class="field"><label>Phone</label><input name="phone" value="${escapeHtml(editingClient?.phone || "")}" required /></div>
            <div class="field full"><label>Notes</label><textarea name="notes">${escapeHtml(editingClient?.notes || "")}</textarea></div>
            <div class="field full">
              <div class="action-row">
                <button class="button" type="submit">${editingClient ? "Update client" : "Save client"}</button>
                ${editingClient ? `<button class="ghost-button" type="button" data-client-cancel="true">Cancel edit</button>` : ""}
              </div>
            </div>
          </form>
        </article>

        <article class="panel-card reveal">
          <h3 class="section-title">Client visibility</h3>
          <p class="section-copy">Owners can view full client contact numbers and maintain notes. Employees only see masked contact numbers from the same backend.</p>
          <div class="tag-row">
            <span class="chip blue">Full phone for owners</span>
            <span class="chip pink">Masked phone for employees</span>
            <span class="chip green">Notes allowed</span>
          </div>
        </article>
      </section>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Phone</th>
              <th>City</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${clients.length ? clients.map((client) => `
              <tr>
                <td><strong>${escapeHtml(client.name)}</strong></td>
                <td>${escapeHtml(client.phone)}</td>
                <td>${escapeHtml(client.city)}</td>
                <td>${escapeHtml(client.notes || "-")}</td>
                <td><button class="inline-button" data-client-edit="${client.id}">Edit</button></td>
              </tr>
            `).join("") : renderEmptyRow("No clients match this search yet.", 5)}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
