export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmptyRow(message, colspan) {
  return `
    <tr>
      <td colspan="${colspan}">
        <div class="table-empty">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;
}
