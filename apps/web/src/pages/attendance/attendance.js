import { escapeHtml, renderEmptyRow } from "../../utils/html.js";

function buildMonthlyRows(attendance) {
  const grouped = new Map();

  attendance.forEach((record) => {
    if (!grouped.has(record.userCode)) {
      grouped.set(record.userCode, { userCode: record.userCode, present: 0, absent: 0 });
    }

    const row = grouped.get(record.userCode);
    row[record.status] += 1;
  });

  return [...grouped.values()];
}

function filterAttendance(attendance, searchTerm) {
  if (!searchTerm) {
    return attendance;
  }

  return attendance.filter((record) => record.userCode.toLowerCase().includes(searchTerm.toLowerCase()));
}

export function renderAttendancePage(state) {
  const summary = state.data.attendanceSummary;
  const attendance = filterAttendance(state.data.attendance, state.searchTerm);
  const monthlyRows = buildMonthlyRows(state.data.attendance);

  return `
    <section class="page-shell attendance-page">
      <section class="metric-grid">
        <article class="metric-box reveal"><span class="chip green">Present today</span><strong>${summary?.today.present || 0}</strong><p class="muted">Checked in successfully.</p></article>
        <article class="metric-box reveal"><span class="chip pink">Absent today</span><strong>${summary?.today.absent || 0}</strong><p class="muted">No attendance record today.</p></article>
        <article class="metric-box reveal"><span class="chip blue">Month present</span><strong>${summary?.month.present || 0}</strong><p class="muted">Present entries this month.</p></article>
        <article class="metric-box reveal"><span class="chip purple">Month absent</span><strong>${summary?.month.absent || 0}</strong><p class="muted">Absent entries this month.</p></article>
      </section>

      <section class="section-grid two">
        <article class="panel-card reveal">
          <h3 class="section-title">Daily report</h3>
          <p class="section-copy">Live attendance view for today and recent records.</p>
          <div class="attendance-bars">
            <div><span>Present</span><strong>${summary?.today.present || 0}</strong></div>
            <div><span>Absent</span><strong>${summary?.today.absent || 0}</strong></div>
          </div>
        </article>
        <article class="panel-card reveal">
          <h3 class="section-title">Monthly report</h3>
          <p class="section-copy">Owner-side summary grouped by employee code.</p>
          <div class="attendance-bars month">
            ${monthlyRows.map((row) => `
              <div>
                <span>${escapeHtml(row.userCode)}</span>
                <strong>${row.present}P / ${row.absent}A</strong>
              </div>
            `).join("")}
          </div>
        </article>
      </section>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>User code</th>
              <th>Date</th>
              <th>Check in</th>
              <th>Check out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${attendance.length ? attendance.map((record) => `
              <tr>
                <td>${escapeHtml(record.userCode)}</td>
                <td>${escapeHtml(record.date)}</td>
                <td>${escapeHtml(record.checkIn || "-")}</td>
                <td>${escapeHtml(record.checkOut || "-")}</td>
                <td><span class="status-badge ${record.status === "present" ? "green" : "pink"}">${escapeHtml(record.status)}</span></td>
              </tr>
            `).join("") : renderEmptyRow("No attendance records match this search.", 5)}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
