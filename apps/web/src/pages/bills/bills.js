import { escapeHtml, renderEmptyRow } from "../../utils/html.js";

function getBillUploads(bills) {
  return bills.flatMap((bill) => {
    const uploads = bill.imageHistory?.length
      ? bill.imageHistory
      : bill.image
        ? [bill.image]
        : [];

    return uploads.map((upload, index) => ({
      ...upload,
      billId: bill.id,
      billTitle: bill.title,
      amount: bill.amount,
      dueAmount: bill.dueAmount,
      uploadKey: `${bill.id}-${upload.publicId || index}`,
      isCurrent: bill.image?.publicId === upload.publicId && bill.image?.imageUrl === upload.imageUrl
    }));
  });
}

function normalizeUploadDate(upload) {
  if (upload?.uploadedAt) {
    const date = new Date(upload.uploadedAt);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  return "";
}

function filterBills(bills, searchTerm, uploadedByFilter = "all", uploadDateFilter = "") {
  const query = searchTerm.toLowerCase();

  return bills.filter((bill) => {
    const uploads = bill.imageHistory?.length
      ? bill.imageHistory
      : bill.image
        ? [bill.image]
        : [];

    const matchesSearch = !searchTerm || [bill.title, String(bill.amount), String(bill.dueAmount), ...uploads.map((upload) => `${upload.uploadedByName || ""} ${upload.uploadedBy || ""}`)]
      .some((value) => value.toLowerCase().includes(query));

    if (!matchesSearch) {
      return false;
    }

    if (uploadedByFilter === "all" && !uploadDateFilter) {
      return true;
    }

    return uploads.some((upload) => {
      const matchesUploader = uploadedByFilter === "all" || upload.uploadedBy === uploadedByFilter;
      const matchesDate = !uploadDateFilter || normalizeUploadDate(upload) === uploadDateFilter;
      return matchesUploader && matchesDate;
    });
  });
}

function filterUploads(uploads, searchTerm, uploadedByFilter = "all", uploadDateFilter = "") {
  const query = searchTerm.toLowerCase();

  return uploads.filter((upload) => {
    const matchesSearch = !searchTerm || [upload.billTitle, upload.uploadedByName, upload.uploadedBy, upload.publicId]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));

    const matchesUploader = uploadedByFilter === "all" || upload.uploadedBy === uploadedByFilter;
    const matchesDate = !uploadDateFilter || normalizeUploadDate(upload) === uploadDateFilter;

    return matchesSearch && matchesUploader && matchesDate;
  });
}

export function renderBillsPage(state) {
  const uploads = getBillUploads(state.data.bills);
  const bills = filterBills(state.data.bills, state.searchTerm, state.ui.billUploadedBy, state.ui.billUploadDate);
  const filteredUploads = filterUploads(uploads, state.searchTerm, state.ui.billUploadedBy, state.ui.billUploadDate);
  const uploaderOptions = [...new Map(uploads
    .filter((upload) => upload.uploadedBy)
    .map((upload) => [upload.uploadedBy, { code: upload.uploadedBy, name: upload.uploadedByName || upload.uploadedBy }]))
    .values()];
  const employees = state.data.users.filter((user) => user.role === "employee");
  const editingBill = state.data.bills.find((bill) => bill.id === state.ui.editingBillId);
  const currentImage = editingBill?.image;

  return `
    <section class="page-shell bills-page">
      <section class="section-grid two">
        <article class="form-card reveal">
          <h3 class="section-title">${editingBill ? "Edit bill" : "Create bill"}</h3>
          <p class="section-copy">Upload bill images to Cloudinary and keep exact upload date, time, and uploader metadata.</p>
          <form id="billForm" class="form-grid" data-editing-id="${editingBill?.id || ""}">
            <div class="field full"><label>Bill title</label><input name="title" value="${escapeHtml(editingBill?.title || "")}" required /></div>
            <div class="field"><label>Amount</label><input name="amount" type="number" value="${editingBill?.amount || ""}" required /></div>
            <div class="field"><label>Due amount</label><input name="dueAmount" type="number" value="${editingBill?.dueAmount || ""}" required /></div>
            <div class="field full">
              <label>Bill image</label>
              <input name="billImage" type="file" accept="image/*" />
              <small class="muted">Select an image to upload to Cloudinary. Leave empty to keep the current image.</small>
            </div>
            <div class="field full">
              <label>Assign bill access</label>
              <select name="accessUsers" multiple size="5">
                ${employees.map((user) => `
                  <option value="${escapeHtml(user.userCode)}" ${editingBill?.accessUsers?.includes(user.userCode) ? "selected" : ""}>${escapeHtml(user.name)} (${escapeHtml(user.userCode)})</option>
                `).join("")}
              </select>
              <small class="muted">Hold Ctrl or Cmd to select multiple employees.</small>
            </div>
            <div class="field full">
              <div class="action-row">
                <button class="button" type="submit">${editingBill ? "Update bill" : "Save bill"}</button>
                ${editingBill ? `<button class="ghost-button" type="button" data-bill-cancel="true">Cancel edit</button>` : ""}
              </div>
            </div>
          </form>
        </article>

        <article class="panel-card reveal">
          <h3 class="section-title">${currentImage ? "Current uploaded image" : "Financial summary"}</h3>
          ${currentImage ? `
            <div class="bill-preview-card">
              <img src="${escapeHtml(currentImage.imageUrl)}" alt="Current bill upload" class="bill-preview-image" />
              <div class="bill-preview-meta">
                <div><strong>Uploaded by</strong><span>${escapeHtml(currentImage.uploadedByName)} (${escapeHtml(currentImage.uploadedBy)})</span></div>
                <div><strong>Date</strong><span>${escapeHtml(currentImage.uploadedDate)}</span></div>
                <div><strong>Time</strong><span>${escapeHtml(currentImage.uploadedTime)}</span></div>
                <div><strong>Cloudinary</strong><span>${escapeHtml(currentImage.publicId)}</span></div>
              </div>
            </div>
          ` : `
            <p class="section-copy">Dues, bill access, and image uploads stay owner-controlled with one shared history list.</p>
            <div class="section-grid two">
              <article class="module-card"><h4>Total bills</h4><strong>${state.data.bills.length}</strong></article>
              <article class="module-card"><h4>Total dues</h4><strong>Rs ${state.data.bills.reduce((sum, bill) => sum + Number(bill.dueAmount || 0), 0).toLocaleString()}</strong></article>
              <article class="module-card"><h4>Image uploads</h4><strong>${uploads.length}</strong></article>
              <article class="module-card"><h4>Filtered uploads</h4><strong>${filteredUploads.length}</strong></article>
            </div>
          `}
        </article>
      </section>

      <article class="panel-card reveal bill-filter-card">
        <div class="bill-filter-grid">
          <div>
            <h3 class="section-title">Filter bill images</h3>
            <p class="section-copy">See all uploaded bill images, then narrow them by uploader or exact upload date.</p>
          </div>
          <div class="field">
            <label>Uploaded by</label>
            <select id="billUploadedByFilter">
              <option value="all">All uploaders</option>
              ${uploaderOptions.map((option) => `
                <option value="${escapeHtml(option.code)}" ${state.ui.billUploadedBy === option.code ? "selected" : ""}>${escapeHtml(option.name)} (${escapeHtml(option.code)})</option>
              `).join("")}
            </select>
          </div>
          <div class="field">
            <label>Upload date</label>
            <input id="billUploadDateFilter" type="date" value="${escapeHtml(state.ui.billUploadDate || "")}" />
          </div>
        </div>
        <div class="tag-row">
          <span class="chip purple">Bills ${state.data.bills.length}</span>
          <span class="chip blue">Shown ${bills.length}</span>
          <span class="chip green">Uploads ${uploads.length}</span>
          <span class="chip pink">Gallery ${filteredUploads.length}</span>
        </div>
      </article>

      <article class="panel-card reveal">
        <div class="bill-gallery-header">
          <div>
            <h3 class="section-title">Bill image gallery</h3>
            <p class="section-copy">Every uploaded image keeps its bill link, Cloudinary id, upload date, time, and uploader.</p>
          </div>
        </div>
        ${filteredUploads.length ? `
          <div class="bill-gallery">
            ${filteredUploads.map((upload) => `
              <article class="bill-gallery-card">
                <img src="${escapeHtml(upload.imageUrl)}" alt="${escapeHtml(upload.billTitle)}" class="bill-gallery-image" />
                <div class="bill-gallery-meta">
                  <strong>${escapeHtml(upload.billTitle)}</strong>
                  <span class="muted">Uploaded by ${escapeHtml(upload.uploadedByName || upload.uploadedBy)} (${escapeHtml(upload.uploadedBy || "-")})</span>
                  <span class="muted">${escapeHtml(upload.uploadedDate || "-")} ${escapeHtml(upload.uploadedTime || "")}</span>
                  <span class="muted">Bill amount Rs ${Number(upload.amount || 0).toLocaleString()} | Due Rs ${Number(upload.dueAmount || 0).toLocaleString()}</span>
                  <span class="muted">Cloudinary ${escapeHtml(upload.publicId || "-")}</span>
                  ${upload.isCurrent ? `<span class="chip green">Current image</span>` : `<span class="chip blue">History</span>`}
                </div>
              </article>
            `).join("")}
          </div>
        ` : `
          <div class="empty-state bill-gallery-empty">
            <h4 class="section-title">No bill images match the current filters</h4>
            <p class="section-copy">Upload a bill image, then filter by uploader or upload date to review the gallery.</p>
          </div>
        `}
      </article>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>Bill</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Image info</th>
              <th>Access</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${bills.length ? bills.map((bill) => `
              <tr>
                <td>
                  <div class="user-primary">
                    <strong>${escapeHtml(bill.title)}</strong>
                    <div class="muted">${escapeHtml(bill.image?.publicId || "No image uploaded yet")}</div>
                  </div>
                </td>
                <td>Rs ${Number(bill.amount || 0).toLocaleString()}</td>
                <td><span class="status-badge ${Number(bill.dueAmount || 0) > 0 ? "pink" : "green"}">Rs ${Number(bill.dueAmount || 0).toLocaleString()}</span></td>
                <td>
                  ${bill.image
                    ? `<div class="bill-table-upload">
                        <img src="${escapeHtml(bill.image.imageUrl)}" alt="${escapeHtml(bill.title)}" class="bill-table-thumb" />
                        <div class="bill-upload-meta">
                          <span>${escapeHtml(bill.image.uploadedDate)} ${escapeHtml(bill.image.uploadedTime)}</span>
                          <span>${escapeHtml(bill.image.uploadedByName)} (${escapeHtml(bill.image.uploadedBy)})</span>
                        </div>
                      </div>`
                    : `<span class="muted">No upload</span>`}
                </td>
                <td>${escapeHtml(bill.accessUsers?.length ? bill.accessUsers.join(", ") : "Owner only")}</td>
                <td><button class="inline-button" data-bill-edit="${bill.id}">Edit</button></td>
              </tr>
            `).join("") : renderEmptyRow("No bills match this search right now.", 6)}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
