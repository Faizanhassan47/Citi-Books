import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../services/store.js';

const pageMeta = {
  dashboard: { eyebrow: 'Owner Control Panel', title: 'CitiBooks Command Dashboard' },
  users: { eyebrow: 'User Management', title: 'Owners, Employees, and Role Control' },
  attendance: { eyebrow: 'Attendance Management', title: 'Daily and Monthly Attendance Reports' },
  tasks: { eyebrow: 'Task Management', title: 'Assign, Track, and Close Tasks' },
  clients: { eyebrow: 'Client Management', title: 'Client Records and Contact Notes' },
  demands: { eyebrow: 'Demand Management', title: 'Categories, Requests, and Approvals' },
  bills: { eyebrow: 'Bills Management', title: 'Bills, Dues, and Access Control' },
  permissions: { eyebrow: 'Permissions Management', title: 'Grant and Revoke Employee Access' },
};

export function Topbar() {
  const location = useLocation();
  const route = location.pathname.replace('/', '') || 'dashboard';
  const meta = pageMeta[route] || { eyebrow: 'Member Hub', title: 'Welcome to CitiBooks' };

  const { user, logout, toggleSidebar, language, setLanguage, translations } = useStore();
  const t = translations[language] || translations.en;
  const initials = user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) || 'US';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-trigger" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="topbar-meta">
          <p className="eyebrow">{meta.eyebrow}</p>
          <h2 className="topbar-title">{meta.title}</h2>
        </div>
      </div>
      <div className="topbar-actions">
        <button 
          className="lang-toggle" 
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
        >
          {language === 'en' ? 'اردو' : 'EN'}
        </button>
        <div className="admin-pill">
          <div className="avatar">{initials}</div>
          <div className="admin-details">
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="topbar-logout" onClick={logout}>{t.logout}</button>
      </div>
    </header>
  );
}
