import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api.js';
import './logs.css';

export function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await api.getLogs();
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    void fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchName = !nameFilter || (log.name || '').toLowerCase().includes(nameFilter.toLowerCase());
      const matchDate = !dateFilter || (log.timestamp || '').slice(0, 10) === dateFilter;
      return matchName && matchDate;
    });
  }, [logs, nameFilter, dateFilter]);

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading logs...</div>;
  }

  return (
    <section className="page-shell logs-page">
      <header className="page-header">
        <div className="header-copy">
          <span className="eyebrow">System Audit</span>
          <h2 className="section-title">Activity Logs</h2>
          <p className="section-copy">Track every action taken by employees. Any updates or creations are logged here for full transparency.</p>
        </div>
      </header>

      <article className="panel-card reveal is-visible logs-toolbar">
        <div className="logs-filters-grid">
          <div className="field">
            <label>Search by User Name</label>
            <input 
              placeholder="e.g. Ali Raza" 
              value={nameFilter} 
              onChange={e => setNameFilter(e.target.value)} 
            />
          </div>
          <div className="field">
            <label>Filter by Date</label>
            <input 
              type="date"
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)} 
            />
          </div>
          {(nameFilter || dateFilter) && (
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <button className="ghost-button" onClick={() => { setNameFilter(''); setDateFilter(''); }}>
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </article>

      <article className="data-table reveal is-visible stagger-1">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>User</th>
              <th>Action Completed</th>
              <th>System Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No logs found matching your filters.
                </td>
              </tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <strong>{new Date(log.timestamp).toLocaleDateString()}</strong><br/>
                  <span className="muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </td>
                <td>
                  <div className="user-pill">
                    <div className="user-avatar">{log.name?.charAt(0).toUpperCase()}</div>
                    <strong>{log.name}</strong>
                  </div>
                </td>
                <td>
                  <span className="status-badge blue">{log.action}</span>
                </td>
                <td style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
