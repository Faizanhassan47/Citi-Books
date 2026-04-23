import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './inventory.css';

export function Inventory() {
  const { user, language } = useStore();
  const isUrdu = language === 'ur';
  const isEmployee = user?.role === 'employee';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Filters (owner only)
  const [filterDate, setFilterDate] = useState('');
  const [filterUpdatedBy, setFilterUpdatedBy] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      stock: Number(fd.get('stock')),
      threshold: Number(fd.get('threshold') || 5),
      unit: fd.get('unit'),
    };
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
        toast.success('Item updated');
      } else {
        await api.createInventoryItem(payload);
        toast.success('Item added');
      }
      setIsDrawerOpen(false);
      setEditingItem(null);
      e.target.reset();
      await loadData();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.deleteInventoryItem(id);
      toast.success('Deleted');
      await loadData();
    } catch { toast.error('Failed to delete'); }
  };

  // Build unique updater list for filter dropdown
  const updaterOptions = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      const code = item.lastUpdatedBy || item.createdBy;
      const name = item.lastUpdatedByName || item.createdByName || code;
      if (code) map.set(code, name);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [items]);

  // Filtered items (owner view)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !filterSearch || item.name.toLowerCase().includes(filterSearch.toLowerCase());
      const matchDate = !filterDate || (item.lastUpdated || '').slice(0, 10) === filterDate;
      const matchUpdater = filterUpdatedBy === 'all' ||
        item.lastUpdatedBy === filterUpdatedBy ||
        item.createdBy === filterUpdatedBy;
      return matchSearch && matchDate && matchUpdater;
    });
  }, [items, filterSearch, filterDate, filterUpdatedBy]);

  if (loading) return <div className="page-shell" style={{ padding: 40 }}>Loading inventory...</div>;

  return (
    <section className="page-shell inventory-page" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>

      {/* ── Header ── */}
      <header className="page-header">
        <div className="header-copy">
          <span className="eyebrow">{isUrdu ? 'دکان کا اسٹاک' : 'Shop Inventory'}</span>
          <h2 className="section-title">{isUrdu ? 'اسٹاک مینجمنٹ' : 'Inventory Tracking'}</h2>
          <p className="section-copy">
            {isEmployee
              ? 'View and edit your own stock entries. You cannot view or delete other records.'
              : 'Monitor stock levels, filter by date or staff member, and manage reorder thresholds.'}
          </p>
        </div>
        <div className="header-actions">
          <button className="button" onClick={() => { setEditingItem(null); setIsDrawerOpen(true); }}>
            + {isEmployee ? 'Add Entry' : 'New Item'}
          </button>
        </div>
      </header>

      {/* ── OWNER: Filters ── */}
      {!isEmployee && (
        <div className="filters-row reveal is-visible">
          <div className="field">
            <label>Search Item</label>
            <input placeholder="Item name..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
          </div>
          <div className="field">
            <label>Updated By</label>
            <select value={filterUpdatedBy} onChange={e => setFilterUpdatedBy(e.target.value)}>
              <option value="all">All Staff</option>
              {updaterOptions.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Last Updated Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          {(filterDate || filterUpdatedBy !== 'all' || filterSearch) && (
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <button className="ghost-button" onClick={() => { setFilterDate(''); setFilterUpdatedBy('all'); setFilterSearch(''); }}>
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── OWNER: Stats ── */}
      {!isEmployee && (
        <div className="section-grid four reveal is-visible">
          <article className="stat-card">
            <span className="eyebrow">Total Items</span>
            <strong style={{ fontSize: '2rem', fontWeight: 900 }}>{items.length}</strong>
          </article>
          <article className="stat-card">
            <span className="eyebrow" style={{ color: 'var(--citi-green)' }}>Healthy Stock</span>
            <strong style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--citi-green)' }}>
              {items.filter(i => i.stock > i.threshold).length}
            </strong>
          </article>
          <article className="stat-card">
            <span className="eyebrow" style={{ color: 'var(--accent-pink, #e11d48)' }}>Low Stock</span>
            <strong style={{ fontSize: '2rem', fontWeight: 900, color: '#e11d48' }}>
              {items.filter(i => i.stock <= i.threshold).length}
            </strong>
          </article>
          <article className="stat-card">
            <span className="eyebrow">Showing</span>
            <strong style={{ fontSize: '2rem', fontWeight: 900 }}>{filteredItems.length}</strong>
          </article>
        </div>
      )}

      {/* ── TABLE (both owner and employee) ── */}
      <div className="data-table reveal is-visible stagger-1">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Stock</th>
              <th>Unit</th>
              {!isEmployee && <th>Threshold</th>}
              <th>Added By</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={isEmployee ? 7 : 8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  {isEmployee ? 'No entries yet. Add your first inventory item.' : 'No items match the current filters.'}
                </td>
              </tr>
            ) : filteredItems.map(item => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td><strong style={{ fontSize: '1.1rem' }}>{item.stock}</strong></td>
                <td><span className="status-badge blue">{item.unit}</span></td>
                {!isEmployee && <td style={{ color: item.stock <= item.threshold ? '#e11d48' : 'var(--text-sec)' }}>{item.threshold}</td>}
                <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  {item.createdByName || item.createdBy || '—'}
                </td>
                <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '—'}
                  {item.lastUpdatedByName && item.lastUpdatedByName !== item.createdByName
                    ? <div style={{ fontSize: '0.72rem' }}>by {item.lastUpdatedByName}</div>
                    : null}
                </td>
                <td>
                  {item.stock <= (item.threshold || 5)
                    ? <span className="status-badge pink">⚠ Low</span>
                    : <span className="status-badge green">✓ OK</span>}
                </td>
                <td>
                  <div className="action-row">
                    <button
                      className="inline-button success"
                      onClick={() => { setEditingItem(item); setIsDrawerOpen(true); }}
                    >
                      ✏ Edit
                    </button>
                    {/* Only owner can delete */}
                    {!isEmployee && (
                      <button className="inline-button danger" onClick={() => handleDelete(item.id)}>
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Drawer: Add / Edit (all roles) ── */}
      <div className={`side-drawer-overlay ${isDrawerOpen ? 'is-open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
      <aside className={`side-drawer ${isDrawerOpen ? 'is-open' : ''}`}>
        <div className="drawer-header">
          <h3 className="section-title" style={{ margin: 0 }}>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>×</button>
        </div>
        <form className="field" onSubmit={handleSubmit} style={{ gap: '18px' }}>
          <div className="field">
            <label>Item Name</label>
            <input name="name" required placeholder="e.g. A4 Paper" defaultValue={editingItem?.name || ''} />
          </div>
          <div className="field">
            <label>Current Stock</label>
            <input name="stock" type="number" required placeholder="0" defaultValue={editingItem?.stock ?? ''} />
          </div>
          <div className="field">
            <label>Unit</label>
            <select name="unit" defaultValue={editingItem?.unit || 'pcs'}>
              <option value="pcs">Pieces (Pcs)</option>
              <option value="boxes">Boxes</option>
              <option value="reams">Reams</option>
              <option value="kg">KG</option>
              <option value="ltrs">Litres</option>
            </select>
          </div>
          {!isEmployee && (
            <div className="field">
              <label>Low-Stock Threshold</label>
              <input name="threshold" type="number" placeholder="5" defaultValue={editingItem?.threshold ?? 5} />
            </div>
          )}
          {isEmployee && <input type="hidden" name="threshold" value="5" />}
          <button className="button" type="submit" style={{ width: '100%', marginTop: '8px' }}>
            {editingItem ? '✓ Save Changes' : '+ Add Item'}
          </button>
        </form>
      </aside>
    </section>
  );
}
