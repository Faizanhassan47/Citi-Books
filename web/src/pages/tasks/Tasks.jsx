import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './tasks.css';

export function Tasks() {
  const { user, tasks, users, fetchTasks, fetchUsers, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    void fetchTasks();
    if (user?.role === 'owner') {
      void fetchUsers();
    }
  }, [fetchTasks, fetchUsers, user?.role]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (user?.role !== 'owner') return; // Double guard
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

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(id);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const employees = users.filter((user) => user.role === "employee" && user.isActive);

  const filteredTasks = tasks.filter((task) => {
    // Role-based visibility: Employees only see their own or "All" tasks
    if (user?.role === 'employee') {
      const isMyTask = task.assignee === user.userCode || task.assignee === 'All';
      if (!isMyTask) return false;
    }

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return [task.title, task.assignee, task.priority, task.status]
      .filter((val) => typeof val === 'string')
      .some((value) => value.toLowerCase().includes(q));
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const reviewTasks = filteredTasks.filter(t => t.status === 'review');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  if (loading && tasks.length === 0) return <div>Loading tasks...</div>;

  const handleDrop = (status) => {
    if (draggedTaskId) {
      handleUpdateStatus(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow dropping
  };

  return (
    <section className="page-shell tasks-page">
      <header className="page-header">
        <div className="header-copy">
          <span className="eyebrow">Task Management</span>
          <h2 className="section-title">Team Tasks</h2>
          <p className="section-copy">Assign responsibilities, set priorities, and track progress across your workforce.</p>
        </div>
        <div className="header-actions">
          {user?.role === 'owner' && (
            <button className="button" onClick={() => setIsDrawerOpen(true)}>+ Create Task</button>
          )}
          <div className="field" style={{ minWidth: '280px' }}>
            <input 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <section className="kanban-board reveal is-visible stagger-1">
        
        {/* Pending Column */}
        <div 
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('pending')}
        >
          <div className="kanban-column-header">
            <h4>Pending</h4>
            <span className="task-count">{pendingTasks.length}</span>
          </div>
          {pendingTasks.map(task => (
            <article 
              key={task.id} 
              className="kanban-card"
              draggable
              onDragStart={() => setDraggedTaskId(task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              style={{ opacity: draggedTaskId === task.id ? 0.4 : 1, cursor: 'grab' }}
            >
              <div className="task-card-header">
                <h5 className="task-card-title">{task.title}</h5>
                <span className={`status-badge ${task.priority === "high" ? "pink" : task.priority === "medium" ? "blue" : "green"}`}>
                   {task.priority}
                </span>
              </div>
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>Start →</button>
                {user?.role === 'owner' && <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>}
              </div>
              <div className="task-card-footer">
                <div className="task-assignee">
                  <div className="task-avatar">{task.assignee?.charAt(0).toUpperCase() || '?'}</div>
                  <span>{task.assigneeName || task.assignee}</span>
                </div>
                <span className="task-date">{task.dueDate}</span>
              </div>
            </article>
          ))}
        </div>

        {/* In Progress Column */}
        <div 
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('in-progress')}
        >
          <div className="kanban-column-header">
            <h4>In Progress</h4>
            <span className="task-count">{inProgressTasks.length}</span>
          </div>
          {inProgressTasks.map(task => (
            <article 
              key={task.id} 
              className="kanban-card"
              draggable
              onDragStart={() => setDraggedTaskId(task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              style={{ opacity: draggedTaskId === task.id ? 0.4 : 1, cursor: 'grab' }}
            >
              <div className="task-card-header">
                <h5 className="task-card-title">{task.title}</h5>
                <span className={`status-badge ${task.priority === "high" ? "pink" : task.priority === "medium" ? "blue" : "green"}`}>
                   {task.priority}
                </span>
              </div>
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'review')}>Submit for Review ✓</button>
                {user?.role === 'owner' && <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>}
              </div>
              <div className="task-card-footer">
                <div className="task-assignee">
                  <div className="task-avatar">{task.assignee?.charAt(0).toUpperCase() || '?'}</div>
                  <span>{task.assignee}</span>
                </div>
                <span className="task-date">{task.dueDate}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Review Column (OWNER ONLY) */}
        <div 
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('review')}
        >
          <div className="kanban-column-header">
            <h4>Under Review</h4>
            <span className="task-count">{reviewTasks.length}</span>
          </div>
          {reviewTasks.map(task => (
            <article 
              key={task.id} 
              className="kanban-card"
              draggable
              onDragStart={() => setDraggedTaskId(task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              style={{ opacity: draggedTaskId === task.id ? 0.4 : 1, cursor: 'grab', background: '#e0f2fe' }}
            >
              <div className="task-card-header">
                <h5 className="task-card-title">{task.title}</h5>
                <span className={`status-badge blue`}>review</span>
              </div>
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'done')}>Verify & Complete ✓</button>
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>← Send Back</button>
                {user?.role === 'owner' && <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>}
              </div>
              <div className="task-card-footer">
                <div className="task-assignee">
                  <div className="task-avatar">{task.assignee?.charAt(0).toUpperCase() || '?'}</div>
                  <span>{task.assignee}</span>
                </div>
                <span className="task-date">{task.dueDate}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Done Column */}
        <div 
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('done')}
        >
          <div className="kanban-column-header">
            <h4>Done</h4>
            <span className="task-count">{doneTasks.length}</span>
          </div>
          {doneTasks.map(task => (
            <article 
              key={task.id} 
              className="kanban-card"
              draggable
              onDragStart={() => setDraggedTaskId(task.id)}
              onDragEnd={() => setDraggedTaskId(null)}
              style={{ opacity: draggedTaskId === task.id ? 0.4 : 0.7, cursor: 'grab' }}
            >
              <div className="task-card-header">
                <h5 className="task-card-title" style={{ textDecoration: 'line-through' }}>{task.title}</h5>
                <span className={`status-badge green`}>completed</span>
              </div>
              
              {user?.role === 'owner' && (
                <div className="task-actions" style={{ marginBottom: '12px' }}>
                  <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>
                </div>
              )}

              <div className="task-card-footer">
                <div className="task-assignee">
                  <div className="task-avatar" style={{ background: 'var(--citi-green)' }}>✓</div>
                  <span>{task.assignee}</span>
                </div>
                <span className="task-date">{task.dueDate}</span>
              </div>
            </article>
          ))}
        </div>

      </section>

      {/* Side Drawer Create Form - OWNER ONLY */}
      {user?.role === 'owner' && (
        <>
          <div className={`side-drawer-overlay ${isDrawerOpen ? 'is-open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
          <aside className={`side-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
            <div className="drawer-header">
              <h3 className="section-title" style={{ margin: 0 }}>Create New Task</h3>
              <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>×</button>
            </div>
            
            <form className="field" style={{ gap: '24px' }} onSubmit={(e) => {
              handleCreateTask(e);
              setIsDrawerOpen(false); 
            }}>
              <div className="field">
                <label>Task title</label>
                <input name="title" placeholder="Describe the task..." required />
              </div>
              
              <div className="field">
                <label>Assignee</label>
                <select name="assignee" required>
                  <option value="">Select Employee</option>
                  {employees.map((user) => <option key={user.userCode} value={user.userCode}>{user.name}</option>)}
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
              
              <div className="field">
                <label>Due date</label>
                <input name="dueDate" type="date" required />
              </div>
              
              <div className="field">
                <label>Initial status</label>
                <select name="status">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div className="action-row" style={{ marginTop: '16px' }}>
                <button className="button" type="submit" style={{ width: '100%' }}>Deploy Task</button>
              </div>
            </form>
          </aside>
        </>
      )}

    </section>
  );
}
