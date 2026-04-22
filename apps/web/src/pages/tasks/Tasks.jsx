import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';

export function Tasks() {
  const { tasks, users, fetchTasks, fetchUsers, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    try {
      await api.createTask(payload);
      e.target.reset();
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateTaskStatus(id, status);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const employees = users.filter((user) => user.role === "employee" && user.isActive);

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return [task.title, task.assignee, task.priority, task.status]
      .some((value) => value.toLowerCase().includes(q));
  });

  if (loading && tasks.length === 0) return <div>Loading tasks...</div>;

  return (
    <section className="page-shell tasks-page">
      <section className="section-grid two">
        <article className="form-card reveal is-visible">
          <h3 className="section-title">Create and assign task</h3>
          <p className="section-copy">Owners can assign tasks, choose priority, and set due dates.</p>
          <form className="form-grid" onSubmit={handleCreateTask}>
            <div className="field full"><label>Task title</label><input name="title" placeholder="Describe the task" required /></div>
            <div className="field">
              <label>Assign to</label>
              <select name="assignee" required>
                <option value="">Select Employee</option>
                {employees.map((user) => <option key={user.userCode} value={user.userCode}>{user.name} ({user.userCode})</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select name="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="field"><label>Due date</label><input name="dueDate" type="date" required /></div>
            <div className="field"><label>Initial status</label><select name="status"><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
            <div className="field full"><button className="button" type="submit">Save task</button></div>
          </form>
        </article>

        <article className="panel-card reveal is-visible">
          <h3 className="section-title">Task status rules</h3>
          <p className="section-copy">Employees view assigned tasks in mobile. Owners control assignment and monitor completion from web.</p>
          <div className="tag-row">
            <span className="chip pink">Pending</span>
            <span className="chip blue">In progress</span>
            <span className="chip green">Done</span>
          </div>
          <div className="field" style={{marginTop: '2rem'}}>
            <label>Search Tasks</label>
            <input placeholder="Filter by title, assignee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </article>
      </section>

      <article className="data-table reveal is-visible">
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
            {filteredTasks.length === 0 ? <tr><td colSpan="6">No tasks found.</td></tr> : 
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.title}</strong></td>
                  <td>{task.assignee}</td>
                  <td><span className={`status-badge ${task.priority === "high" ? "pink" : task.priority === "medium" ? "blue" : "green"}`}>{task.priority}</span></td>
                  <td>{task.dueDate}</td>
                  <td><span className={`status-badge ${task.status === "done" ? "green" : task.status === "in-progress" ? "blue" : "pink"}`}>{task.status}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="inline-button" onClick={() => handleUpdateStatus(task.id, 'pending')}>Pending</button>
                      <button className="inline-button" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>In Progress</button>
                      <button className="inline-button success" onClick={() => handleUpdateStatus(task.id, 'done')}>Done</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </article>
    </section>
  );
}
