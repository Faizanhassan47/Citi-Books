import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../services/store.js';

const navItems = [
  { id: 'employee', key: 'myHub', icon: '⚡' },
  { id: 'dashboard', key: 'dashboard', icon: '📊' },
  { id: 'monitor', key: 'monitor', icon: '🛡️' },
  { id: 'users', key: 'users', icon: '👥' },
  { id: 'attendance', key: 'attendance', icon: '📅' },
  { id: 'tasks', key: 'tasks', icon: '🎯' },
  { id: 'clients', key: 'clients', icon: '🤝' },
  { id: 'demands', key: 'demands', icon: '📝' },
  { id: 'bills', key: 'bills', icon: '💳' },
  { id: 'inventory', key: 'inventory', icon: '📦' },
  { id: 'permissions', key: 'permissions', icon: '🔐' },
  { id: 'logs', key: 'logs', icon: '📜', label: 'Activity Logs' },
];

export function Sidebar() {
  const { user, logout, isSidebarOpen, toggleSidebar, language, translations } = useStore();
  const t = translations[language] || translations.en;
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'dashboard';

  const visibleItems = navItems.filter(item => {
    if (user?.role === 'owner') {
      const hiddenForOwners = ['employee'];
      return !hiddenForOwners.includes(item.id);
    }
    // 'employee' (My Hub) is always visible for employees
    if (item.id === 'employee') return true;
    const permissionGated = ['attendance', 'tasks', 'clients', 'demands', 'inventory', 'bills'];
    return permissionGated.includes(item.id) && (user.permissions || []).includes(item.id);
  });

  const handleNavigate = (id) => {
    navigate(`/${id}`);
    if (window.innerWidth <= 1024) toggleSidebar();
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'is-visible' : ''}`} 
        onClick={toggleSidebar}
      ></div>
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-image-container">
            <img src="/assets/citi-logo.png" alt="CitiBooks" className="sidebar-logo" />
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>✕</button>
        </div>
        
        <nav className="nav-links">
          <div className="nav-group-label">Main Console</div>
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${currentPath === item.id ? 'is-active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{t[item.key] || item.label || item.id}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button-premium" onClick={logout}>
            <span className="icon">🚀</span>
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
