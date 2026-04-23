import React, { useMemo, useState } from 'react';
import { useStore } from '../../services/store.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import './monitor.css';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export function Monitor() {
  const { demands, subcategories, attendance, users } = useStore();
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // --- Monthly absence filter state ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  const [absFilterEmployee, setAbsFilterEmployee] = useState('all');
  const [absFilterMonth, setAbsFilterMonth] = useState(currentMonth);
  const [absFilterYear, setAbsFilterYear] = useState(currentYear);

  const departments = useMemo(() => {
    const deps = new Set(users.map(u => u.department).filter(Boolean));
    return ['All', ...Array.from(deps)];
  }, [users]);

  const employees = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

  // --- Today's absent employees ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAbsent = useMemo(() => {
    const absentToday = attendance.filter(r => {
      const recDate = (r.date || r.checkIn || '').slice(0, 10);
      return recDate === todayStr && r.status === 'absent';
    });
    return absentToday.map(r => {
      const u = users.find(u => u.userCode === r.userCode);
      return { name: u?.name || r.userCode, department: u?.department || '—', userCode: r.userCode };
    });
  }, [attendance, users, todayStr]);

  // Employees never checked in today (no attendance record at all for today)
  const noRecordToday = useMemo(() => {
    const activeEmployees = users.filter(u => u.role === 'employee' && u.isActive);
    const recordedToday = new Set(
      attendance.filter(r => (r.date || r.checkIn || '').slice(0, 10) === todayStr).map(r => r.userCode)
    );
    return activeEmployees
      .filter(u => !recordedToday.has(u.userCode))
      .map(u => ({ name: u.name, department: u.department || '—', userCode: u.userCode }));
  }, [attendance, users, todayStr]);

  const allAbsentToday = useMemo(() => {
    const combined = [...todayAbsent, ...noRecordToday];
    const seen = new Set();
    return combined.filter(e => {
      if (seen.has(e.userCode)) return false;
      seen.add(e.userCode);
      return true;
    });
  }, [todayAbsent, noRecordToday]);

  // --- Monthly absence analytics ---
  const monthlyAbsenceData = useMemo(() => {
    const filtered = attendance.filter(r => {
      const d = new Date(r.date || r.checkIn || '');
      if (isNaN(d)) return false;
      const matchMonth = d.getMonth() === Number(absFilterMonth);
      const matchYear = d.getFullYear() === Number(absFilterYear);
      const matchEmp = absFilterEmployee === 'all' || r.userCode === absFilterEmployee;
      const isAbsent = r.status === 'absent';
      return matchMonth && matchYear && matchEmp && isAbsent;
    });

    const countMap = {};
    filtered.forEach(r => {
      const u = users.find(u => u.userCode === r.userCode);
      const name = u?.name || r.userCode;
      countMap[name] = (countMap[name] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([name, absences]) => ({ name, absences }))
      .sort((a, b) => b.absences - a.absences);
  }, [attendance, users, absFilterEmployee, absFilterMonth, absFilterYear]);

  // --- Top demand products ---
  const productDemandData = useMemo(() => {
    const demandCount = {};
    const filteredDemands = demands.filter(d => {
      if (departmentFilter === 'All') return true;
      const creator = users.find(u => u.userCode === d.createdBy);
      return creator?.department === departmentFilter;
    });
    filteredDemands.forEach(demand => {
      const subCat = subcategories.find(s => s.id === demand.subcategoryId);
      const name = subCat ? subCat.name : 'Unknown Item';
      demandCount[name] = (demandCount[name] || 0) + 1;
    });
    return Object.entries(demandCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [demands, subcategories, users, departmentFilter]);

  // --- All-time absence chart ---
  const absenceData = useMemo(() => {
    const absenceCount = {};
    const filteredUsers = departmentFilter === 'All' ? users : users.filter(u => u.department === departmentFilter);
    const validUserCodes = new Set(filteredUsers.map(u => u.userCode));
    attendance.forEach(record => {
      if (record.status === 'absent' && validUserCodes.has(record.userCode)) {
        const u = users.find(u => u.userCode === record.userCode);
        const name = u ? u.name : record.userCode;
        absenceCount[name] = (absenceCount[name] || 0) + 1;
      }
    });
    return Object.entries(absenceCount)
      .map(([name, absences]) => ({ name, absences }))
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 5);
  }, [attendance, users, departmentFilter]);

  const COLORS = ['#3E7BBD', '#90C845', '#4E3B80', '#e11d48', '#3b82f6'];
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <section className="page-shell monitor-page">
      <header className="page-header" style={{ marginBottom: '0' }}>
        <div className="header-copy">
          <span className="eyebrow">Enterprise Analytics</span>
          <h2 className="section-title">Monitor Dashboard</h2>
          <p className="section-copy">Track high-demand products and employee attendance metrics in real-time.</p>
        </div>
        <div className="header-actions">
          <div className="field">
            <label>Filter by Department</label>
            <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* ── TODAY'S ABSENT EMPLOYEES ── */}
      <article className="chart-card reveal is-visible" style={{ padding: '24px' }}>
        <div className="chart-header">
          <div>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
              🔴 Today's Absent Employees
            </h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              {todayStr} — {allAbsentToday.length === 0 ? 'All employees are present today 🎉' : `${allAbsentToday.length} employee${allAbsentToday.length > 1 ? 's' : ''} absent or not checked in`}
            </p>
          </div>
        </div>

        {allAbsentToday.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {allAbsentToday.map((emp) => (
              <div key={emp.userCode} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'var(--bg-surface)', borderRadius: '10px',
                padding: '10px 16px', border: '1px solid var(--border-thin)',
                minWidth: '180px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--accent-pink)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{emp.department}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)' }}>
            ✅ All active employees are present or have checked in today.
          </div>
        )}
      </article>

      {/* ── MONTHLY ABSENCE ANALYTICS ── */}
      <article className="chart-card reveal is-visible stagger-1">
        <div className="chart-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>📅 Monthly Absence Report</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Filter absences by employee, month, and year</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Employee</label>
              <select value={absFilterEmployee} onChange={e => setAbsFilterEmployee(e.target.value)}>
                <option value="all">All Employees</option>
                {employees.map(e => (
                  <option key={e.userCode} value={e.userCode}>{e.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Month</label>
              <select value={absFilterMonth} onChange={e => setAbsFilterMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Year</label>
              <select value={absFilterYear} onChange={e => setAbsFilterYear(Number(e.target.value))}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {monthlyAbsenceData.length > 0 ? (
          <>
            {/* Summary badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {monthlyAbsenceData.map((item, i) => (
                <div key={item.name} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-surface)', borderRadius: '10px',
                  padding: '8px 14px', border: '1px solid var(--border-thin)'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: COLORS[i % COLORS.length], color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                  }}>
                    {item.absences}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                </div>
              ))}
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAbsenceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} days`, 'Absences']}
                  />
                  <Bar dataKey="absences" name="Absences" radius={[4, 4, 0, 0]}>
                    {monthlyAbsenceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            ✅ No absences recorded for {MONTH_NAMES[absFilterMonth]} {absFilterYear}
            {absFilterEmployee !== 'all' ? ` for ${employees.find(e => e.userCode === absFilterEmployee)?.name}` : ''}.
          </div>
        )}
      </article>

      {/* Chart 1: High Demanding Products */}
      <article className="chart-card reveal is-visible">
        <div className="chart-header">
          <div>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>High Demanding Products</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Top 5 most frequently requested items</p>
          </div>
        </div>
        <div className="chart-wrapper">
          {productDemandData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productDemandData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" name="Demand Count" radius={[4, 4, 0, 0]}>
                  {productDemandData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <p className="muted">No demand data available for this criteria.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
