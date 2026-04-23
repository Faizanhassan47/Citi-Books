import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';

const MODULES = [
  { id: 'attendance',  label: 'Attendance',  icon: '📅', desc: 'Check in/out, view own record' },
  { id: 'tasks',       label: 'Tasks',       icon: '🎯', desc: 'View & update assigned tasks' },
  { id: 'clients',     label: 'Clients',     icon: '🤝', desc: 'Browse & add clients' },
  { id: 'demands',     label: 'Demands',     icon: '📝', desc: 'Submit stock demands' },
  { id: 'inventory',   label: 'Inventory',   icon: '📦', desc: 'Add items only (cannot view list)' },
  { id: 'bills',       label: 'Bills',       icon: '💳', desc: 'Upload bills only (cannot view financials)' },
];

export function Permissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSave = async (e, userId) => {
    e.preventDefault();
    const form = e.target;
    const checkboxes = [...form.querySelectorAll('input[type="checkbox"]')];
    const permissions = checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);

    try {
      await api.updateUser(userId, { permissions });
      toast.success('Permissions saved');
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const employees = users.filter((user) => {
    if (user.role !== 'employee') {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const q = searchTerm.toLowerCase();
    const permissionsStr = Array.isArray(user.permissions) ? user.permissions.join(' ') : '';
    return [user.name, user.userCode, user.department || '', permissionsStr]
      .filter((val) => typeof val === 'string')
      .some((value) => value.toLowerCase().includes(q));
  });

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <section className="page-shell permissions-page">
      <header className="page-header">
        <div className="header-copy">
          <span className="eyebrow">Access Control</span>
          <h2 className="section-title">Granular Permissions</h2>
          <p className="section-copy">Manage employee access levels for each organizational module. Changes take effect on the next reload.</p>
        </div>
        <div className="header-actions">
          <div className="field" style={{ minWidth: '320px' }}>
            <input
              placeholder="Search by name, code or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </header>

      <section className="section-grid two" style={{ marginTop: '1.5rem' }}>
        {employees.length === 0 ? (
          <p className="muted">No employees found.</p>
        ) : employees.map((user) => (
          <article key={user.id} className="form-card reveal is-visible">
            <div className="permission-head">
              <div>
                <h3 className="section-title">{user.name}</h3>
                <p className="section-copy">{user.userCode} - {user.department || 'General'}</p>
              </div>
              <span className={`status-badge ${user.isActive ? 'green' : 'pink'}`}>
                {user.isActive ? 'active' : 'inactive'}
              </span>
            </div>
            <form className="permission-form" onSubmit={(e) => handleSave(e, user.id)}>
              <div className="permission-grid">
                {MODULES.map((mod) => (
                  <label key={mod.id} className="permission-item">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={mod.id}
                      defaultChecked={user.permissions.includes(mod.id)}
                    />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700 }}>{mod.icon} {mod.label}</span>
                      <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 400 }}>{mod.desc}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="action-row" style={{ marginTop: '1rem' }}>
                <button className="button" type="submit">Save permissions</button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </section>
  );
}
