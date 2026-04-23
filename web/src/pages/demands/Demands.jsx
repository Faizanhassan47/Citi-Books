import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import { shareOnWhatsApp } from '../../utils/share.js';

export function Demands() {
  const { user, users, fetchUsers } = useStore();
  const [data, setData] = useState({ categories: [], subcategories: [], demands: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);

    try {
      const res = await api.getDemands();
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    if (user?.role === 'owner' && fetchUsers) {
      void fetchUsers();
    }
  }, [user?.role, fetchUsers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this demand?")) return;
    try {
      await api.deleteDemand(id);
      toast.success("Demand deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete demand");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateDemandStatus(id, status);
      toast.success('Demand status updated');
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;

    try {
      await api.createCategory({ name });
      e.target.reset();
      toast.success('Category added');
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const categoryId = e.target.categoryId.value;

    try {
      await api.createSubcategory({ name, categoryId });
      e.target.reset();
      toast.success('Subcategory added');
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateDemand = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      await api.createDemand(payload);
      e.target.reset();
      toast.success('Demand created');
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredDemands = data.demands.filter((demand) => {
    if (categoryIdFilter !== 'all' && demand.categoryId !== categoryIdFilter) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const category = data.categories.find((item) => item.id === demand.categoryId)?.name || '';
      const subcategory = data.subcategories.find((item) => item.id === demand.subcategoryId)?.name || '';

      return [demand.title, demand.status, demand.notes, category, subcategory, demand.createdBy]
        .some((value) => value?.toLowerCase().includes(q));
    }

    return true;
  });

  const pendingCount = data.demands.filter((demand) => demand.status === 'pending').length;
  const approvedCount = data.demands.filter((demand) => demand.status === 'approved').length;
  const rejectedCount = data.demands.filter((demand) => demand.status === 'rejected').length;

  if (loading) {
    return <div>Loading demands...</div>;
  }

  return (
    <section className="page-shell demands-page">
      <section className={`section-grid ${user?.role === 'owner' ? 'three' : 'one'}`}>
        {user?.role === 'owner' && (
          <>
            <article className="form-card reveal is-visible">
              <h3 className="section-title">Create category</h3>
              <form className="form-grid" onSubmit={handleCreateCategory}>
                <div className="field full"><label>Category name</label><input name="name" placeholder="Stationery, Office..." required /></div>
                <div className="field full"><button className="button" type="submit">Add category</button></div>
              </form>
            </article>

            <article className="form-card reveal is-visible">
              <h3 className="section-title">Create subcategory</h3>
              <form className="form-grid" onSubmit={handleCreateSubcategory}>
                <div className="field full">
                  <label>Category</label>
                  <select name="categoryId" required>
                    {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <div className="field full"><label>Subcategory name</label><input name="name" placeholder="Books, Paper..." required /></div>
                <div className="field full"><button className="button" type="submit">Add subcategory</button></div>
              </form>
            </article>
          </>
        )}

        <article className="form-card reveal is-visible">
          <h3 className="section-title">Create demand</h3>
          <form className="form-grid" onSubmit={handleCreateDemand}>
            <div className="field full"><label>Title</label><input name="title" required /></div>
            <div className="field">
              <label>Category</label>
              <select name="categoryId" required>
                {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Subcategory</label>
              <select name="subcategoryId" required>
                {data.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
              </select>
            </div>
            <div className="field full"><label>Notes</label><textarea name="notes"></textarea></div>
            <div className="field full"><button className="button" type="submit">Create demand</button></div>
          </form>
        </article>
      </section>

      <article className="panel-card reveal is-visible demand-toolbar">
        <div className="demand-toolbar-grid">
          <div>
            <h3 className="section-title">Filter demands</h3>
            <p className="section-copy">Filter requests by category and move them between pending, approved, and rejected.</p>
          </div>
          <div className="field">
            <label>Category Filter</label>
            <select value={categoryIdFilter} onChange={(e) => setCategoryIdFilter(e.target.value)}>
              <option value="all">All categories</option>
              {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input placeholder="Search demands..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="tag-row">
          <span className="chip blue">Pending {pendingCount}</span>
          <span className="chip green">Approved {approvedCount}</span>
          <span className="chip pink">Rejected {rejectedCount}</span>
          <span className="chip purple">Showing {filteredDemands.length}</span>
        </div>
      </article>

      <article className="data-table reveal is-visible">
        <table>
          <thead>
            <tr>
              <th>Demand</th>
              <th>Category</th>
              <th>Raised by</th>
              <th>Status</th>
              {user?.role === 'owner' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDemands.length === 0 ? <tr><td colSpan={user?.role === 'owner' ? "5" : "4"}>No demands match your filters.</td></tr> :
              filteredDemands.map((demand) => {
                const category = data.categories.find((item) => item.id === demand.categoryId)?.name || '-';
                const subcategory = data.subcategories.find((item) => item.id === demand.subcategoryId)?.name || '-';
                const demandUser = users?.find(u => u.userCode === demand.createdBy);
                const displayName = demand.createdByName || demandUser?.name || demand.createdBy;

                return (
                  <tr key={demand.id}>
                    <td>
                      <div className="demand-meta">
                        <strong>{demand.title}</strong>
                        <div className="muted">{subcategory} {demand.notes && `- ${demand.notes}`}</div>
                      </div>
                    </td>
                    <td>{category}</td>
                    <td>{displayName}</td>
                    <td><span className={`status-badge ${demand.status === 'approved' ? 'green' : demand.status === 'rejected' ? 'pink' : 'blue'}`}>{demand.status}</span></td>
                    {user?.role === 'owner' && (
                      <td>
                        <div className="action-row demand-action-row">
                          <button className="inline-button success" disabled={demand.status === 'approved'} onClick={() => handleUpdateStatus(demand.id, 'approved')}>Approve</button>
                          <button className="inline-button danger" disabled={demand.status === 'rejected'} onClick={() => handleUpdateStatus(demand.id, 'rejected')}>Reject</button>
                          <button className="inline-button danger" onClick={() => handleDelete(demand.id)}>🗑 Delete</button>
                          <button className="inline-button" onClick={() => shareOnWhatsApp('', `Salam, checking on Demand: ${demand.title}. Category: ${category}. Notes: ${demand.notes || 'None'}. Please process.`)}>🚀 Share</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </article>
    </section>
  );
}
