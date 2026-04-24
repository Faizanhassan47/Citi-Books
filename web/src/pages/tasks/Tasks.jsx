import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import { shareOnWhatsApp } from '../../utils/share.js';
import './tasks.css';

export function Tasks() {
  const { user, tasks, users, fetchTasks, fetchUsers, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    void fetchTasks();
    if (user?.role === 'owner') {
      void fetchUsers();
    }
  }, [fetchTasks, fetchUsers, user?.role]);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (user?.role !== 'owner') return;
    
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      e.target.reset();
      setEditingTask(null);
      setIsDrawerOpen(false);
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

  const openEdit = (task) => {
    setEditingTask(task);
    setIsDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingTask(null);
    setIsDrawerOpen(true);
  };

  const employees = users.filter((user) => user.role === "employee" && user.isActive);

  const filteredTasks = tasks.filter((task) => {
    if (user?.role === 'employee') {
      const isMyTask = task.assignee === user.userCode || task.assignee === 'All';
      if (!isMyTask) return false;
    }

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return [task.title, task.description, task.assignee, task.priority, task.status]
      .filter((val) => typeof val === 'string')
      .some((value) => value.toLowerCase().includes(q));
  });

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
    e.preventDefault();
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
            <button className="button" onClick={openCreate}>+ Create Task</button>
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
              {task.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </p>
              )}
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>Start →</button>
                {user?.role === 'owner' && (
                  <>
                    <button className="task-action-btn" onClick={() => openEdit(task)}>Edit</button>
                    <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </>
                )}
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
              {task.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </p>
              )}
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'review')}>Submit for Review ✓</button>
                {user?.role === 'owner' && (
                  <>
                    <button className="task-action-btn" onClick={() => openEdit(task)}>Edit</button>
                    <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </>
                )}
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
              {task.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </p>
              )}
              <div className="task-actions">
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'done')}>Verify & Complete ✓</button>
                <button className="task-action-btn" onClick={() => handleUpdateStatus(task.id, 'in-progress')}>← Send Back</button>
                {user?.role === 'owner' && (
                  <>
                    <button className="task-action-btn" onClick={() => openEdit(task)}>Edit</button>
                    <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </>
                )}
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
              
              {task.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </p>
              )}

              {user?.role === 'owner' && (
                <div className="task-actions" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <button className="task-action-btn" onClick={() => openEdit(task)}>Edit</button>
                  <button className="task-action-btn" style={{color: 'var(--accent-pink, red)'}} onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  <a 
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`CitiBooks Task Update:\n\nTitle: ${task.title}\nStatus: ${task.status?.toUpperCase()}\nPriority: ${task.priority?.toUpperCase()}\nDue: ${task.dueDate}\n\nDescription: ${task.description || 'N/A'}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-button"
                    style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', textDecoration: 'none' }}
                  >
                    Share
                  </a>
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

      {/* Side Drawer Form - OWNER ONLY */}
      {user?.role === 'owner' && (
        <>
          <div className={`side-drawer-overlay ${isDrawerOpen ? 'is-open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
          <aside className={`side-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
            <div className="drawer-header">
              <h3 className="section-title" style={{ margin: 0 }}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>×</button>
            </div>
            
            <form className="field" style={{ gap: '24px' }} onSubmit={handleSaveTask}>
              <div className="field">
                <label>Task title</label>
                <input name="title" defaultValue={editingTask?.title || ''} placeholder="Describe the task..." required />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea 
                  name="description" 
                  defaultValue={editingTask?.description || ''} 
                  placeholder="Add more details about this task..."
                  style={{ 
                    minHeight: '120px', 
                    borderRadius: '16px', 
                    padding: '16px',
                    borderColor: 'var(--border-thin)',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div className="field">
                <label>Assignee</label>
                <select name="assignee" defaultValue={editingTask?.assignee || ''} required>
                  <option value="">Select Employee</option>
                  {employees.map((user) => <option key={user.userCode} value={user.userCode}>{user.name}</option>)}
                </select>
              </div>
              
              <div className="field">
                <label>Priority</label>
                <select name="priority" defaultValue={editingTask?.priority || 'medium'}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="field">
                <label>Due date</label>
                <input name="dueDate" type="date" defaultValue={editingTask?.dueDate || ''} required />
              </div>
              
              <div className="field">
                <label>Status</label>
                <select name="status" defaultValue={editingTask?.status || 'pending'}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div className="action-row" style={{ marginTop: '16px' }}>
                <button className="button" type="submit" style={{ width: '100%' }}>
                  {editingTask ? 'Save Changes' : 'Deploy Task'}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

    </section>
  );
}
