import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';

export function Demands() {
  const [data, setData] = useState({ categories: [], subcategories: [], demands: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDemands();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateDemandStatus(id, status);
      loadData();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    await api.createCategory({ name });
    e.target.reset();
    loadData();
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const categoryId = e.target.categoryId.value;
    await api.createSubcategory({ name, categoryId });
    e.target.reset();
    loadData();
  };

  const handleCreateDemand = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    await api.createDemand(payload);
    e.target.reset();
    loadData();
  };

  const filteredDemands = data.demands.filter(d => {
    if (categoryIdFilter !== 'all' && d.categoryId !== categoryIdFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const cat = data.categories.find(c => c.id === d.categoryId)?.name || '';
      const sub = data.subcategories.find(s => s.id === d.subcategoryId)?.name || '';
      return [d.title, d.status, d.notes, cat, sub, d.createdBy].some(v => v?.toLowerCase().includes(q));
    }
    return true;
  });

  const pendingCount = data.demands.filter(d => d.status === 'pending').length;
  const approvedCount = data.demands.filter(d => d.status === 'approved').length;
  const rejectedCount = data.demands.filter(d => d.status === 'rejected').length;

  if (loading) return <div>Loading demands...</div>;

  return (
    <section className="page-shell demands-page">
      <section className="section-grid three">
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
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field full"><label>Subcategory name</label><input name="name" placeholder="Books, Paper..." required /></div>
            <div className="field full"><button className="button" type="submit">Add subcategory</button></div>
          </form>
        </article>

        <article className="form-card reveal is-visible">
          <h3 className="section-title">Create demand</h3>
          <form className="form-grid" onSubmit={handleCreateDemand}>
            <div className="field full"><label>Title</label><input name="title" required /></div>
            <div className="field">
              <label>Category</label>
              <select name="categoryId" required>
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Subcategory</label>
              <select name="subcategoryId" required>
                {data.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <select value={categoryIdFilter} onChange={e => setCategoryIdFilter(e.target.value)}>
              <option value="all">All categories</option>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input placeholder="Search demands..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDemands.length === 0 ? <tr><td colSpan="5">No demands match your filters.</td></tr> : 
              filteredDemands.map(demand => {
                const category = data.categories.find(c => c.id === demand.categoryId)?.name || '-';
                const subcategory = data.subcategories.find(s => s.id === demand.subcategoryId)?.name || '-';
                return (
                  <tr key={demand.id}>
                    <td>
                      <div className="demand-meta">
                        <strong>{demand.title}</strong>
                        <div className="muted">{subcategory} {demand.notes && `- ${demand.notes}`}</div>
                      </div>
                    </td>
                    <td>{category}</td>
                    <td>{demand.createdBy}</td>
                    <td><span className={`status-badge ${demand.status === 'approved' ? 'green' : demand.status === 'rejected' ? 'pink' : 'blue'}`}>{demand.status}</span></td>
                    <td>
                      <div className="action-row demand-action-row">
                        <button className="inline-button success" disabled={demand.status === 'approved'} onClick={() => handleUpdateStatus(demand.id, 'approved')}>Approve</button>
                        <button className="inline-button danger" disabled={demand.status === 'rejected'} onClick={() => handleUpdateStatus(demand.id, 'rejected')}>Reject</button>
                        <button className="inline-button" disabled={demand.status === 'pending'} onClick={() => handleUpdateStatus(demand.id, 'pending')}>Pending</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </article>
    </section>
  );
}
