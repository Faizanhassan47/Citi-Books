import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './attendance.css';

function buildMonthlyRows(attendance) {
  const grouped = new Map();
  attendance.forEach((record) => {
    if (!grouped.has(record.userCode)) {
      grouped.set(record.userCode, {
        userCode: record.userCode,
        userName: record.userName || record.name || record.userCode,
        present: 0,
        absent: 0,
        late: 0
      });
    }
    const row = grouped.get(record.userCode);
    if (!row.userName && (record.userName || record.name)) {
      row.userName = record.userName || record.name;
    }
    if (record.status === 'present') {
      row.present += 1;
      if (record.isLate) row.late += 1;
    }
    else if (record.status === 'absent') row.absent += 1;
  });
  
  return [...grouped.values()].map(row => {
    const total = row.present + row.absent;
    const score = total > 0 ? Math.round(((row.present - (row.late * 0.5)) / total) * 100) : 0;
    return { ...row, score: Math.max(0, score) };
  });
}

const SHIFT_START_TIME = "10:00";

export function Attendance() {
  const { user, language, translations, users, fetchUsers } = useStore();
  const t = translations[language] || translations.en;
  const isUrdu = language === 'ur';

  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.getAttendance(), api.getAttendanceSummary()];

      if (user?.role === 'owner') {
        requests.push(fetchUsers());
      }

      const [records, summaryData] = await Promise.all(requests);
      setAttendance(records);
      setSummary(summaryData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, user?.role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = attendance.map(rec => ({
    ...rec,
    userName: rec.userName || users.find(u => u.userCode === rec.userCode)?.name || 'Unknown'
  })).filter((r) =>
    !searchTerm || 
    (r.userCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyRows = buildMonthlyRows(attendance);

  // Calendar Logic
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (loading) return <div style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>{isUrdu ? 'حاضری لوڈ ہو رہی ہے...' : 'Loading attendance...'}</div>;

  return (
    <section className="page-shell attendance-page" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-copy">
          <span className="eyebrow">{isUrdu ? 'حاضری کے ریکارڈ' : 'Attendance Records'}</span>
          <h2 className="section-title">{t.attendance}</h2>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-box reveal is-visible">
          <span className="chip green">{isUrdu ? 'آج موجود' : 'Present today'}</span>
          <strong>{summary?.today?.present || 0}</strong>
          <p className="muted">{isUrdu ? 'کامیابی سے حاضری لگ گئی۔' : 'Checked in successfully.'}</p>
        </article>
        <article className="metric-box reveal is-visible">
          <span className="chip pink">{isUrdu ? 'آج غیر حاضر' : 'Absent today'}</span>
          <strong>{summary?.today?.absent || 0}</strong>
          <p className="muted">{isUrdu ? 'آج حاضری نہیں لگی۔' : 'No attendance record today.'}</p>
        </article>
        <article className="metric-box reveal is-visible">
           <span className="chip orange" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}>{t.lateArrivals}</span>
           <strong>{filtered.filter(r => r.date === new Date().toISOString().slice(0, 10) && r.isLate).length}</strong>
           <p className="muted">{isUrdu ? `${SHIFT_START_TIME} کے بعد تشرہف لائے۔` : `Arrived after ${SHIFT_START_TIME}.`}</p>
        </article>
      </section>

      {/* CALENDAR VIEW */}
      <article className="panel-card reveal is-visible" style={{ marginBottom: '32px' }}>
        <h3 className="section-title">{isUrdu ? 'ماہانہ کیلنڈر' : 'Monthly Attendance Heatmap'}</h3>
        <p className="section-copy">{isUrdu ? 'دکان کی حاضری کا جائزہ' : 'Overview of shop presence for the month.'}</p>
        
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginTop: '24px' }}>
           {calendarDays.map(day => {
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = attendance.filter(a => a.date === dateStr && a.status === 'present').length;
              let color = '#f1f5f9';
              if (count > 2) color = '#dcfce7'; // Good
              else if (count > 0) color = '#fef3c7'; // Some
              
              return (
                <div key={day} style={{ background: color, height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, opacity: day > today.getDate() ? 0.3 : 1 }}>
                  {day}
                </div>
              );
           })}
        </div>
        <div className="calendar-legend" style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.75rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, background: '#dcfce7', borderRadius: 3 }}></div> {isUrdu ? 'مکمل حاضری' : 'Full Team'}</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, background: '#fef3c7', borderRadius: 3 }}></div> {isUrdu ? 'کم حاضری' : 'Partial Team'}</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, background: '#f1f5f9', borderRadius: 3 }}></div> {isUrdu ? 'غیر حاضر' : 'No Data'}</div>
        </div>
      </article>

      <section className="section-grid two">
        <article className="panel-card reveal is-visible">
          <h3 className="section-title">{isUrdu ? 'آج کی حاضری' : 'Daily report'}</h3>
          <p className="section-copy">{isUrdu ? 'آج کی حاضری کا فوری جائزہ' : 'Live attendance view for today.'}</p>
          <div className="attendance-bars">
             <div><span>{isUrdu ? 'موجود' : 'Present'}</span><strong>{summary?.today?.present || 0}</strong></div>
             <div><span>{isUrdu ? 'دیر سے' : 'Late'}</span><strong>{filtered.filter(r => r.date === new Date().toISOString().slice(0, 10) && r.isLate).length}</strong></div>
             <div><span>{isUrdu ? 'غیر حاضر' : 'Absent'}</span><strong>{summary?.today?.absent || 0}</strong></div>
          </div>
        </article>
        <article className="panel-card reveal is-visible">
          <h3 className="section-title">{isUrdu ? 'کارکردگی سکور' : 'Reliability Index'}</h3>
          <p className="section-copy">{t.reliability}</p>
          <div className="attendance-bars month">
            {monthlyRows.length === 0 ? (
              <p className="muted">No performance data yet.</p>
            ) : monthlyRows.map((row) => (
              <div key={row.userCode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{row.userName || row.userCode}</span>
                  <span className={`chip ${row.score > 90 ? 'green' : row.score > 70 ? 'blue' : 'pink'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {row.score}% {isUrdu ? 'قابل بھروسہ' : 'Reliable'}
                  </span>
                </div>
                <strong>{row.present}P / {row.late}L / {row.absent}A</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="panel-card reveal is-visible" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label>{isUrdu ? 'ملازم کا نام تلاش کریں' : 'Search by Employee Name'}</label>
          <input
            placeholder="e.g. Ahammed Ali"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </article>

      <article className="data-table reveal is-visible">
        <table>
          <thead>
            <tr>
              <th>{isUrdu ? 'نام' : 'Employee Name'}</th>
              <th>{isUrdu ? 'تاریخ' : 'Date'}</th>
              <th>{isUrdu ? 'آمد' : 'Check in'}</th>
              <th>{isUrdu ? 'رخصت' : 'Check out'}</th>
              <th>{isUrdu ? 'سٹیٹس' : 'Status'}</th>
              {user?.role === 'owner' && <th>{isUrdu ? 'مقام' : 'Location'}</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={user?.role === 'owner' ? "6" : "5"}>{isUrdu ? 'کوئی ریکارڈ نہیں ملا۔' : 'No attendance records match.'}</td></tr>
              : filtered.map((record) => (
                <tr key={record.id}>
                  <td style={{ fontWeight: 600 }}>{record.userName}</td>
                  <td>{record.date}</td>
                  <td>{record.checkIn || '-'}</td>
                  <td>{record.checkOut || '-'}</td>
                  <td>
                    <span className={`status-badge ${record.status === 'present' ? 'green' : 'pink'}`}>
                      {record.status === 'present' ? (isUrdu ? 'موجود' : 'present') : (isUrdu ? 'غیر حاضر' : 'absent')}
                    </span>
                    {record.isLate && <span className="chip pink" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.65rem' }}>{isUrdu ? 'تاخیر' : 'LATE'}</span>}
                  </td>
                  {user?.role === 'owner' && <td>{record.location || '-'}</td>}
                </tr>
              ))
            }
          </tbody>
        </table>
      </article>
    </section>
  );
}
