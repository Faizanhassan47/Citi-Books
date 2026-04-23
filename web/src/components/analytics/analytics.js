export function createAnalyticsSection() {
  queueMicrotask(bindAnalyticsEvents);

  return `
    <section class="analytics-grid">
      <article class="analytics-panel">
        <div class="panel-heading">
          <h3>Sessions By Device</h3>
          <span>Employee activity view</span>
        </div>
        <div class="device-card">
          <div class="device-ring"></div>
          <div class="device-stats" id="deviceStats"></div>
        </div>
      </article>

      <article class="analytics-panel">
        <div class="panel-heading">
          <h3>Analytics</h3>
          <span>Task completion flow</span>
        </div>
        <div class="completion-card">
          <div class="progress-ring" id="progressRing">
            <div class="progress-ring-inner">
              <strong id="progressValue">80%</strong>
              <span>Transactions</span>
            </div>
          </div>
          <div class="legend">
            <div><span class="dot blue"></span>Active</div>
            <div><span class="dot pink"></span>Completed</div>
          </div>
        </div>
      </article>

      <article class="analytics-panel analytics-panel-cta">
        <h3>System Status</h3>
        <p>Single backend. Dual platform. Role-based control.</p>
        <button type="button">View Reports</button>
      </article>
    </section>
  `;
}

function bindAnalyticsEvents() {
  window.addEventListener("citibooks:dashboard-data", (event) => {
    const { attendance, analytics } = event.detail;
    const deviceStats = document.getElementById("deviceStats");
    const progressValue = document.getElementById("progressValue");
    const progressRing = document.getElementById("progressRing");

    deviceStats.innerHTML = `
      <div><strong>Desktop</strong><span>${attendance.desktop}%</span></div>
      <div><strong>Mobile</strong><span>${attendance.mobile}%</span></div>
      <div><strong>Tablet</strong><span>${attendance.tablet}%</span></div>
    `;

    progressValue.textContent = `${analytics.active}%`;
    progressRing.style.background = `conic-gradient(var(--brand-sky) 0 ${analytics.active}%, var(--brand-pink) ${analytics.active}% 100%)`;
  });
}
