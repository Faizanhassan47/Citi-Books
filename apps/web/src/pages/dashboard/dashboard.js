function findMetric(metrics, label) {
  return metrics.find((item) => item.label === label)?.value ?? 0;
}

export function renderDashboardPage(state) {
  if (state.loading || !state.data.dashboard) {
    return `<section class="page-shell"><article class="empty-state reveal"><h2>Loading dashboard...</h2></article></section>`;
  }

  const { dashboard, users, tasks, demands, bills } = state.data;
  const pendingDemands = demands.demands.filter((item) => item.status === "pending").length;
  const pendingTasks = tasks.filter((item) => item.status !== "done").length;
  const activeEmployees = users.filter((item) => item.role === "employee" && item.isActive).length;
  const totalDues = bills.reduce((sum, bill) => sum + Number(bill.dueAmount || 0), 0);

  return `
    <section class="page-shell dashboard-page">
      <article class="dashboard-hero reveal float-card">
        <div class="dashboard-hero-copy">
          <p class="eyebrow">CitiBooks dual-platform system</p>
          <h2>Everything the doc described, now connected into one owner workspace.</h2>
          <p class="section-copy">
            Manage employees, attendance, tasks, clients, demands, bills, and permissions from the same web control center that shares its backend with the native employee app.
          </p>
          <div class="action-row">
            <button class="button pulse-accent" data-route="users">Create employee</button>
            <button class="ghost-button" data-route="demands">Review demands</button>
          </div>
        </div>
        <div class="dashboard-hero-orbit">
          <div class="orbit-ring orbit-ring-1"></div>
          <div class="orbit-ring orbit-ring-2"></div>
          <div class="orbit-center">
            <strong>${activeEmployees}</strong>
            <span>Active employees</span>
          </div>
        </div>
      </article>

      <section class="metric-grid">
        ${dashboard.metrics.map((metric, index) => `
          <article class="metric-box reveal" style="transition-delay:${index * 40}ms;">
            <span class="chip ${metric.accent === "softPurple" ? "pink" : metric.accent}">${metric.label}</span>
            <strong>${metric.value}</strong>
            <p class="muted">${metric.trend} this week</p>
          </article>
        `).join("")}
      </section>

      <section class="section-grid two">
        <article class="panel-card reveal">
          <div class="page-head">
            <div>
              <h3 class="section-title">System Flow Summary</h3>
              <p class="section-copy">Quick view of the owner-to-employee workflow from the architecture doc.</p>
            </div>
            <span class="chip purple">Shared backend</span>
          </div>
          <div class="timeline-list">
            <div><strong>Login and role check</strong><span>Owners go to web. Employees go to mobile.</span></div>
            <div><strong>User control</strong><span>Create employees, promote to owner, deactivate safely, enforce limits.</span></div>
            <div><strong>Operational tracking</strong><span>Attendance, tasks, clients, and demand approvals stay in sync.</span></div>
            <div><strong>Financial follow-up</strong><span>Bills and dues stay visible with access control.</span></div>
          </div>
        </article>

        <article class="panel-card reveal">
          <div class="page-head">
            <div>
              <h3 class="section-title">Operations Snapshot</h3>
              <p class="section-copy">The busiest parts of the system right now.</p>
            </div>
            <span class="chip blue">Live summary</span>
          </div>
          <div class="section-grid two compact">
            <article class="module-card">
              <h4>Pending Tasks</h4>
              <strong>${pendingTasks}</strong>
              <p class="muted">Need assignment or completion follow-up.</p>
            </article>
            <article class="module-card">
              <h4>Pending Demands</h4>
              <strong>${pendingDemands}</strong>
              <p class="muted">Waiting for approve or reject decision.</p>
            </article>
            <article class="module-card">
              <h4>Total Dues</h4>
              <strong>Rs ${totalDues.toLocaleString()}</strong>
              <p class="muted">Outstanding across active bills.</p>
            </article>
            <article class="module-card">
              <h4>Present Today</h4>
              <strong>${findMetric(dashboard.metrics, "Present Today")}</strong>
              <p class="muted">Attendance synced from employee records.</p>
            </article>
          </div>
        </article>
      </section>

      <section class="section-grid three">
        ${dashboard.quickStats.map((stat, index) => `
          <article class="panel-card reveal overview-card">
            <span class="chip ${["green", "blue", "pink"][index]}">${stat.label}</span>
            <strong>${stat.value}</strong>
            <p class="muted">Expected: ${stat.expected}</p>
          </article>
        `).join("")}
      </section>
    </section>
  `;
}
