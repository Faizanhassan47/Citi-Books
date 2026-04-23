import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './users.css';

function getDisplayDepartment(user) {
  return user.department || 'General';
}

export function Users() {
  const currentUser = useStore((state) => state.user);
  const syncUser = useStore((state) => state.syncUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const res = await api.getUsers();
      setUsers(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const firstName = String(formData.get('firstName') || '').trim();
    const lastName = String(formData.get('lastName') || '').trim();
    const username = String(formData.get('username') || '').trim();
    const department = String(formData.get('department') || '').trim() || 'General';
    const role = String(formData.get('role') || 'employee');

    const payload = {
      name: [firstName, lastName].filter(Boolean).join(' '),
      username,
      department,
      role
    };

    try {
      await api.createUser(payload);
      e.target.reset();
      toast.success('User created with temporary password changeme123');
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.resetUserPassword(formData.get('userId'), formData.get('password'));
      e.target.reset();
      toast.success('Password reset successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUser) {
      return;
    }

    const formData = new FormData(e.target);
    const name = String(formData.get('name') || '').trim();
    const username = String(formData.get('username') || '').trim();
    const department = String(formData.get('department') || '').trim() || 'General';

    if (!name || !username) {
      toast.error('Name and username are required');
      return;
    }

    try {
      await api.updateUser(editingUser.id, { name, username, department });
      toast.success('User details updated successfully');
      const editedUserId = editingUser.id;
      setEditingUser(null);
      await loadUsers();

      if (editedUserId === currentUser?.id) {
        await syncUser();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAction = async (action, id) => {
    if (action === 'delete' && !window.confirm('Permanently delete user?')) {
      return;
    }

    try {
      if (action === 'promote') await api.promoteUser(id);
      if (action === 'demote') await api.demoteUser(id);
      if (action === 'activate') await api.updateUserStatus(id, true);
      if (action === 'deactivate') await api.updateUserStatus(id, false);
      if (action === 'delete') await api.deleteUser(id);

      toast.success('User updated successfully');
      await loadUsers();

      if (id === currentUser?.id) {
        await syncUser();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();

    return [user.name, user.userCode, user.username, user.role, user.department]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });

  const owners = users.filter((user) => user.role === 'owner').length;
  const employees = users.filter((user) => user.role === 'employee').length;
  const superAdmins = users.filter((user) => user.isSuperAdmin).length;

  const renderUserActions = (user) => (
    <div className="action-row user-action-stack">
      <button className="inline-button user-edit-button" type="button" onClick={() => setEditingUser(user)}>
        Edit details
      </button>
      {user.role === 'employee' ? (
        <button className="inline-button user-role-button" type="button" onClick={() => handleAction('promote', user.id)}>
          Promote
        </button>
      ) : (
        <button className="inline-button user-role-button" type="button" onClick={() => handleAction('demote', user.id)}>
          Demote
        </button>
      )}
      {user.isActive ? (
        <button className="inline-button danger" type="button" onClick={() => handleAction('deactivate', user.id)}>
          Deactivate
        </button>
      ) : (
        <button className="inline-button success" type="button" onClick={() => handleAction('activate', user.id)}>
          Activate
        </button>
      )}
      {isSuperAdmin && (
        <button
          className="inline-button danger"
          type="button"
          disabled={user.id === currentUser.id}
          onClick={() => handleAction('delete', user.id)}
        >
          Delete
        </button>
      )}
    </div>
  );

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <section className="page-shell users-page">
      <section className="metric-grid">
        <article className="metric-box reveal is-visible"><span className="chip purple">Owners</span><strong>{owners}/3</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip blue">Employees</span><strong>{employees}/20</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip green">Super Admins</span><strong>{superAdmins}</strong></article>
        <article className="metric-box reveal is-visible"><span className="chip pink">Inactive</span><strong>{users.filter((user) => !user.isActive).length}</strong></article>
      </section>

      <section className="section-grid two">
        {isSuperAdmin ? (
          <article className="form-card reveal is-visible">
            <h3 className="section-title">Create user</h3>
            <form className="form-grid" onSubmit={handleCreateUser}>
              <div className="field"><label>First Name</label><input name="firstName" required /></div>
              <div className="field"><label>Last Name</label><input name="lastName" required /></div>
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
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.username})</option>)}
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
            <p className="section-copy">Owners can edit names, login IDs, status, and role changes for every user.</p>
          </article>
        )}
      </section>

      <article className="panel-card reveal is-visible users-toolbar">
        <div className="users-toolbar-grid">
          <div className="field">
            <label>Search Users</label>
            <input
              placeholder="Search name, username, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="users-toolbar-count">
            <span>{filteredUsers.length} users shown</span>
          </div>
        </div>
      </article>

      <article className="data-table reveal is-visible users-table">
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Login ID</th>
              <th>Role</th>
              <th>Status</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="6">No users found.</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-summary">
                      <strong>{user.name}</strong>
                      <span className="user-code">{user.userCode}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-login">
                      <strong>@{user.username}</strong>
                      <span>Portal sign-in ID</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-role-stack">
                      <span className={`status-badge ${user.role === 'owner' ? 'purple' : 'blue'}`}>{user.role}</span>
                      {user.isSuperAdmin && <span className="chip green">Super Admin</span>}
                    </div>
                  </td>
                  <td><span className={`status-badge ${user.isActive ? 'green' : 'pink'}`}>{user.isActive ? 'active' : 'inactive'}</span></td>
                  <td>{getDisplayDepartment(user)}</td>
                  <td>{renderUserActions(user)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>

      <section className="users-card-grid">
        {filteredUsers.length === 0 ? (
          <article className="panel-card users-empty">
            <p>No users found.</p>
          </article>
        ) : (
          filteredUsers.map((user) => (
            <article className="panel-card user-card reveal is-visible" key={user.id}>
              <div className="user-card-header">
                <div className="user-card-headings">
                  <strong>{user.name}</strong>
                  <span>{user.userCode}</span>
                </div>
                <div className="user-role-stack">
                  <span className={`status-badge ${user.role === 'owner' ? 'purple' : 'blue'}`}>{user.role}</span>
                  {user.isSuperAdmin && <span className="chip green">Super Admin</span>}
                </div>
              </div>

              <div className="user-card-detail-grid">
                <div className="user-card-detail">
                  <label>Login ID</label>
                  <span>@{user.username}</span>
                </div>
                <div className="user-card-detail">
                  <label>Status</label>
                  <div className="user-card-status">
                    <span className={`status-badge ${user.isActive ? 'green' : 'pink'}`}>{user.isActive ? 'active' : 'inactive'}</span>
                  </div>
                </div>
                <div className="user-card-detail">
                  <label>Department</label>
                  <span>{getDisplayDepartment(user)}</span>
                </div>
                <div className="user-card-detail">
                  <label>Access</label>
                  <span>{user.role === 'owner' ? 'Owner controls' : 'Employee workspace'}</span>
                </div>
              </div>

              <div className="user-card-actions">
                {renderUserActions(user)}
              </div>
            </article>
          ))
        )}
      </section>

      {editingUser && (
        <>
          <div className="side-drawer-overlay is-open" onClick={() => setEditingUser(null)} />
          <aside className="side-drawer is-open">
            <div className="drawer-header">
              <h3 className="section-title" style={{ margin: 0 }}>Edit User</h3>
              <button className="drawer-close" type="button" onClick={() => setEditingUser(null)}>x</button>
            </div>

            <form className="field" key={editingUser.id} onSubmit={handleUpdateUser} style={{ gap: '18px' }}>
              <p className="user-drawer-note">
                {editingUser.userCode} stays system-generated. Update the person's display name or portal login ID here.
              </p>

              <div className="field">
                <label>Full name</label>
                <input name="name" defaultValue={editingUser.name} required />
              </div>

              <div className="field">
                <label>Login ID</label>
                <input name="username" defaultValue={editingUser.username} required />
              </div>

              <div className="field">
                <label>Department</label>
                <input name="department" defaultValue={getDisplayDepartment(editingUser)} />
              </div>

              <button className="button" type="submit" style={{ width: '100%' }}>
                Save changes
              </button>
            </form>
          </aside>
        </>
      )}
    </section>
  );
}
