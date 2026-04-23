const palette = {
  blue: "linear-gradient(135deg, rgba(62, 123, 189, 0.18), rgba(93, 182, 255, 0.1))",
  green: "linear-gradient(135deg, rgba(144, 200, 69, 0.2), rgba(111, 209, 154, 0.12))",
  purple: "linear-gradient(135deg, rgba(78, 59, 128, 0.2), rgba(122, 104, 147, 0.12))",
  softPurple: "linear-gradient(135deg, rgba(245, 191, 220, 0.28), rgba(122, 104, 147, 0.1))"
};

export function createMetricsSection() {
  queueMicrotask(bindMetricsEvents);

  return `<section class="metrics-grid" id="metricsGrid"></section>`;
}

function renderMetricCard(metric) {
  return `
    <article class="metric-card">
      <div class="metric-head">
        <p>${metric.label}</p>
        <div class="metric-dot" style="background:${palette[metric.accent]};"></div>
      </div>
      <p class="metric-value">${metric.value}</p>
      <p><span class="metric-trend">${metric.trend}</span> this week</p>
    </article>
  `;
}

function bindMetricsEvents() {
  window.addEventListener("citibooks:dashboard-data", (event) => {
    const container = document.getElementById("metricsGrid");
    container.innerHTML = event.detail.metrics.map(renderMetricCard).join("");
  });

  window.addEventListener("citibooks:dashboard-error", (event) => {
    const container = document.getElementById("metricsGrid");
    container.innerHTML = `
      <article class="metric-card metric-card-error">
        <p class="metric-value">Backend connection failed</p>
        <p>${event.detail.message}</p>
      </article>
    `;
  });
}
