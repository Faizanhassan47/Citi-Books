import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';

export function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    try {
      await api.createUser(payload);
      e.target.reset();
      loadUsers();
    } catch (err) {
      alert(err.message || 'Error creating user');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await api.resetUserPassword(formData.get('userId'), formData.get('password'));
      e.target.reset();
      alert("Password reset successfully");
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'promote') await api.promoteUser(id);
      if (action === 'demote') await api.demoteUser(id);
      if (action === 'activate') await api.updateUserStatus(id, true);
      if (action === 'deactivate') await api.updateUserStatus(id, false);
      if (action === 'delete') {
        if (window.confirm("Permanently delete user?")) {
          await api.deleteUser(id);
        }
      }
      loadUsers();
    } catch (e) {
      alert("Action failed: " + e.message);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return [user.name, user.userCode, user.username, user.role, user.department]
      .filter(Boolean)
      .some(val => val.toLowerCase().includes(q));
  });

  const owners = users.filter(u => u.role === 'owner').length;
  const employees = users.filter(u => u.role === 'employee').length;
  const superAdmins = users.filter(u => u.isSuperAdmin).length;

  if (loading) return <div>Loading users...</div>;

  return (
    <section className="page-shell users-page">
      <section className="metric-grid">
        <article className="metric-box reveal is-visible"><span className="chip purple">Owners</span><strong>{owners}/3</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip blue">Employees</span><strong>{employees}/20</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip green">Super Admins</span><strong>{superAdmins}</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip pink">Inactive</span><strong>{users.filter(u => !u.isActive).length}</strong></article>
      </section>

      <section className="section-grid two">
        {isSuperAdmin ? (
          <article className="form-card reveal is-visible">
            <h3 className="section-title">Create user</h3>
            <form className="form-grid" onSubmit={handleCreateUser}>
              <div className="field"><label>Name</label><input name="name" required /></div>
              <div className="field"><label>Username</label><input name="username" required /></div>
              <div className="field"><label>Department</label><input name="department" /></div>
              <div className="field">
                <label>Role</label>
                <select name="role">
                  <option value="employee">Employee</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="field full"><button className="button" type="submit">Create user</button></div>
            </form>
          </article>
        ) : (
          <article className="panel-card reveal super-admin-panel is-visible">
            <h3 className="section-title">Create user</h3>
            <p className="section-copy">Only super admin can add users.</p>
          </article>
        )}

        {isSuperAdmin ? (
          <article className="form-card reveal is-visible">
            <h3 className="section-title">Reset password</h3>
            <form className="form-grid" onSubmit={handleResetPassword}>
              <div className="field">
                <label>User</label>
                <select name="userId" required>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
                </select>
              </div>
              <div className="field">
                <label>New password</label>
                <input name="password" type="password" minLength="6" required />
              </div>
              <div className="field full"><button className="button" type="submit">Reset</button></div>
            </form>
          </article>
        ) : (
          <article className="panel-card reveal is-visible">
            <h3 className="section-title">Owner controls</h3>
            <p className="section-copy">Promote or demote roles.</p>
          </article>
        )}
      </section>

      <article className="panel-card reveal is-visible demand-toolbar" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
         <div className="demand-toolbar-grid">
            <div className="field">
              <label>Search Users</label>
              <input placeholder="Search name, username, department..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>
      </article>

      <article className="data-table reveal is-visible">
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? <tr><td colSpan="6">No users found.</td></tr> :
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-primary">
                      <strong>{user.name}</strong>
                      <div className="muted">{user.userCode}</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-login">
                      <strong>@{user.username}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="user-role-stack">
                      <span className={`status-badge ${user.role === 'owner' ? 'purple' : 'blue'}`}>{user.role}</span>
                      {user.isSuperAdmin && <span className="chip green" style={{marginLeft: '0.5rem'}}>Super Admin</span>}
                    </div>
                  </td>
                  <td><span className={`status-badge ${user.isActive ? 'green' : 'pink'}`}>{user.isActive ? 'active' : 'inactive'}</span></td>
                  <td>{user.department || 'General'}</td>
                  <td>
                    <div className="action-row user-action-stack">
                      {user.role === 'employee' ? 
                        <button className="inline-button" onClick={() => handleAction('promote', user.id)}>Promote</button> :
                        <button className="inline-button" onClick={() => handleAction('demote', user.id)}>Demote</button>
                      }
                      {user.isActive ? 
                        <button className="inline-button danger" onClick={() => handleAction('deactivate', user.id)}>Deactivate</button> :
                        <button className="inline-button success" onClick={() => handleAction('activate', user.id)}>Activate</button>
                      }
                      {isSuperAdmin && <button className="inline-button danger" disabled={user.id === currentUser.id} onClick={() => handleAction('delete', user.id)}>Delete</button>}
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
