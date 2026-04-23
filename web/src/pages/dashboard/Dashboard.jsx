import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './dashboard.css';

export function Dashboard() {
  const navigate = useNavigate();
  const { language, user, users } = useStore();
  const isUrdu = language === 'ur';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    void api.getDashboard()
      .then(setStats)
      .catch(err => console.warn('Dashboard stats:', err))
      .finally(() => setLoading(false));

    void api.getAttendance().then(records => {
      if (!Array.isArray(records)) return;

      // Build performer scores using users list for real names
      const grouped = new Map();
      records.forEach(r => {
        if (!grouped.has(r.userCode)) grouped.set(r.userCode, { present: 0, late: 0, absent: 0 });
        const e = grouped.get(r.userCode);
        if (r.status === 'present') { e.present++; if (r.isLate) e.late++; }
        else if (r.status === 'absent') e.absent++;
      });

      const scored = [...grouped.entries()].map(([code, s]) => {
        const total = s.present + s.absent;
        const score = total > 0 ? Math.round(((s.present - s.late * 0.5) / total) * 100) : 0;
        // Use users store for real name, fallback to record field
        const found = users.find(u => u.userCode === code);
        const name = found?.name || records.find(r => r.userCode === code)?.name || code;
        return { code, name, score: Math.max(0, score) };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      setTopPerformers(scored);

      // Build 7-day attendance chart from real data
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayRecs = records.filter(r => (r.date || r.checkIn || '').slice(0, 10) === dateStr);
        days.push({
          date: d.toLocaleDateString(undefined, { weekday: 'short' }),
          present: dayRecs.filter(r => r.status === 'present').length,
          absent: dayRecs.filter(r => r.status === 'absent').length,
        });
      }
      setChartData(days);
    });
  }, [users]);

  const statCards = [
    { label: 'Total Users',       value: stats?.totalUsers ?? '—',      icon: '👥', color: '#3E7BBD', bg: '#eff6ff' },
    { label: 'Active Employees',  value: stats?.activeEmployees ?? '—', icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Pending Demands',   value: stats?.pendingDemands ?? '—',  icon: '📋', color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Clients',     value: stats?.totalClients ?? '—',    icon: '🤝', color: '#9333ea', bg: '#faf5ff' },
    { label: 'Open Tasks',        value: stats?.openTasks ?? '—',       icon: '🎯', color: '#0284c7', bg: '#f0f9ff' },
    { label: 'Total Bills',       value: stats?.totalBills ?? '—',      icon: '🧾', color: '#0f766e', bg: '#f0fdfa' },
    ...(user?.role === 'owner' ? [
      { label: 'Total Dues', value: stats?.totalDues != null ? `Rs ${Number(stats.totalDues).toLocaleString()}` : '—', icon: '💸', color: '#e11d48', bg: '#fff1f2' },
    ] : []),
    { label: 'Present Today',     value: stats?.presentToday ?? '—',    icon: '📍', color: '#7c3aed', bg: '#faf5ff' },
  ].filter(Boolean);

  const quickActions = [
    { id: 'bills',      icon: '🧾', label: 'Upload Bill',    desc: 'Financial Entry',    color: '#3E7BBD' },
    { id: 'tasks',      icon: '🎯', label: 'Assign Task',    desc: 'Workflow Manager',   color: '#9333ea' },
    { id: 'attendance', icon: '📍', label: 'Attendance',     desc: 'Track Presence',     color: '#16a34a' },
    { id: 'clients',    icon: '🤝', label: 'Add Client',     desc: 'Customer Database',  color: '#d97706' },
  ];

  return (
    <section className="page-shell dashboard-page">

      {/* ── Hero Banner ── */}
      <div className="db-hero">
        <div className="db-hero-body">
          <span className="db-hero-eyebrow">CitiBooks Enterprise</span>
          <h1 className="db-hero-title">
            {isUrdu ? 'کمانڈ سنٹر' : `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${user?.name?.split(' ')[0] ?? 'Boss'} 👋`}
          </h1>
          <p className="db-hero-sub">
            {isUrdu
              ? 'آپ کی انوینٹری، حاضری اور مالی پیمائشیں سنک ہیں۔'
              : "Here's your business at a glance. Everything is synced and up to date."}
          </p>
          <div className="db-hero-actions">
            <button className="db-hero-btn primary" onClick={() => navigate('/monitor')}>
              📊 Live Monitor
            </button>
            {user?.role === 'owner' && (
              <button className="db-hero-btn ghost" onClick={() => navigate('/users')}>
                👥 Manage Team
              </button>
            )}
          </div>
        </div>
        <div className="db-hero-badge">
          <div className="db-hero-ring">
            <span className="db-hero-ring-value">{loading ? '…' : (stats?.activeEmployees ?? 0)}</span>
            <span className="db-hero-ring-label">Active</span>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="db-quick-grid">
        {quickActions.map(act => (
          <button key={act.id} className="db-quick-card" onClick={() => navigate(`/${act.id}`)}>
            <span className="db-quick-icon" style={{ background: act.color + '18', color: act.color }}>
              {act.icon}
            </span>
            <div className="db-quick-copy">
              <strong>{act.label}</strong>
              <span>{act.desc}</span>
            </div>
            <span className="db-quick-arrow">→</span>
          </button>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      <div className="db-stats-grid">
        {statCards.map((card, i) => (
          <article key={card.label} className="db-stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="db-stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="db-stat-body">
              <span className="db-stat-label">{card.label}</span>
              <strong className="db-stat-value" style={{ color: card.color }}>
                {loading ? <span className="db-skeleton" /> : card.value}
              </strong>
            </div>
          </article>
        ))}
      </div>

      {/* ── Chart + Leaderboard ── */}
      <div className="db-bottom-grid">
        {/* Chart */}
        <article className="db-chart-card">
          <div className="db-card-header">
            <div>
              <h3 className="db-card-title">📊 Attendance Trends</h3>
              <p className="db-card-sub">Present vs Absent — Last 7 Days</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-thin)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-thin)', boxShadow: 'var(--shadow-lift)', fontSize: '0.85rem' }}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Bar dataKey="present" name="Present" fill="#3E7BBD" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[5, 5, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Top Performers */}
        <article className="db-chart-card">
          <div className="db-card-header">
            <div>
              <h3 className="db-card-title">🏆 Top Performers</h3>
              <p className="db-card-sub">Ranked by Reliability Index</p>
            </div>
          </div>
          <div className="db-leaderboard">
            {topPerformers.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>No attendance data yet.</p>
            )}
            {topPerformers.map((p, idx) => (
              <div key={p.code} className="db-performer">
                <span className="db-performer-rank" style={{
                  background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#fef9ee',
                  color: idx === 0 ? '#d97706' : idx === 1 ? '#64748b' : '#b45309',
                }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <div className="db-performer-info">
                  <strong>{p.name}</strong>
                  <div className="db-performer-bar-wrap">
                    <div className="db-performer-bar" style={{ width: `${p.score}%` }} />
                  </div>
                </div>
                <span className="db-performer-score" style={{ color: p.score >= 80 ? '#16a34a' : p.score >= 50 ? '#d97706' : '#e11d48' }}>
                  {p.score}%
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
