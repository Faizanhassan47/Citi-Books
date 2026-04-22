function filterTasks(tasks, searchTerm) {
  if (!searchTerm) {
    return tasks;
  }

  const query = searchTerm.toLowerCase();
  return tasks.filter((task) =>
    [task.title, task.assignee, task.priority, task.status]
      .some((value) => value.toLowerCase().includes(query))
  );
}

export function renderTasksPage(state) {
  const employees = state.data.users.filter((user) => user.role === "employee" && user.isActive);
  const tasks = filterTasks(state.data.tasks, state.searchTerm);

  return `
    <section class="page-shell tasks-page">
      <section class="section-grid two">
        <article class="form-card reveal">
          <h3 class="section-title">Create and assign task</h3>
          <p class="section-copy">Owners can assign tasks, choose priority, and set due dates.</p>
          <form id="taskForm" class="form-grid">
            <div class="field full"><label>Task title</label><input name="title" placeholder="Describe the task" required /></div>
            <div class="field">
              <label>Assign to</label>
              <select name="assignee" required>
                ${employees.map((user) => `<option value="${user.userCode}">${user.name} (${user.userCode})</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Priority</label>
              <select name="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="field"><label>Due date</label><input name="dueDate" type="date" required /></div>
            <div class="field"><label>Initial status</label><select name="status"><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
            <div class="field full"><button class="button" type="submit">Save task</button></div>
          </form>
        </article>

        <article class="panel-card reveal">
          <h3 class="section-title">Task status rules</h3>
          <p class="section-copy">Employees view assigned tasks in mobile. Owners control assignment and monitor completion from web.</p>
          <div class="tag-row">
            <span class="chip pink">Pending</span>
            <span class="chip blue">In progress</span>
            <span class="chip green">Done</span>
          </div>
        </article>
      </section>

      <article class="data-table reveal">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map((task) => `
              <tr>
                <td><strong>${task.title}</strong></td>
                <td>${task.assignee}</td>
                <td><span class="status-badge ${task.priority === "high" ? "pink" : task.priority === "medium" ? "blue" : "green"}">${task.priority}</span></td>
                <td>${task.dueDate}</td>
                <td><span class="status-badge ${task.status === "done" ? "green" : task.status === "in-progress" ? "blue" : "pink"}">${task.status}</span></td>
                <td>
                  <div class="action-row">
                    <button class="inline-button" data-task-status="pending" data-task-id="${task.id}">Pending</button>
                    <button class="inline-button" data-task-status="in-progress" data-task-id="${task.id}">In Progress</button>
                    <button class="inline-button success" data-task-status="done" data-task-id="${task.id}">Done</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </article>
    </section>
  `;
}
