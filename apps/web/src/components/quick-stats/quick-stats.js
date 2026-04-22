const ringColors = ["#35b58c", "#1b9fff", "#ff6b3d"];

export function createQuickStatsSection() {
  queueMicrotask(bindQuickStatsEvents);

  return `<section class="overview-row" id="quickStats"></section>`;
}

function renderQuickStat(stat, index) {
  return `
    <article class="stat-card">
      <div>
        <strong class="stat-value">${stat.value}</strong>
        <p>Today</p>
      </div>
      <div class="mini-ring" style="--ring-color:${ringColors[index]};" data-label="${stat.label}"></div>
      <div>
        <strong class="stat-value">${stat.expected}</strong>
        <p>Expected</p>
      </div>
    </article>
  `;
}

function bindQuickStatsEvents() {
  window.addEventListener("citibooks:dashboard-data", (event) => {
    const container = document.getElementById("quickStats");
    container.innerHTML = event.detail.quickStats.map(renderQuickStat).join("");
  });
}
