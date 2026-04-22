import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, loginUser, logoutUser, api } from './services/api.js';

import './styles/reset.css';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/ui.css';
import './styles/motion.css';

import './pages/auth/auth.css';
import './pages/employee/employee.css';
import './pages/dashboard/dashboard.css';
import './pages/users/users.css';
import './pages/attendance/attendance.css';
import './pages/tasks/tasks.css';
import './pages/clients/clients.css';
import './pages/demands/demands.css';
import './pages/bills/bills.css';
import './pages/permissions/permissions.css';

// Legacy Bridges
import { renderEmployeePage } from './pages/employee/employee.js';
import { createSidebar } from './components/sidebar/sidebar.js';
import { createTopbar } from './components/topbar/topbar.js';

// Fully converted React components
import { Auth } from './pages/auth/Auth.jsx';
import { Demands } from './pages/demands/Demands.jsx';
import { Users } from './pages/users/Users.jsx';

function HTMLBridge({ html }) {
  // Temporary component to render old legacy templates
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function Shell({ children, user, handleLogout }) {
  const location = useLocation();
  const route = location.pathname.replace('/', '') || 'dashboard';

  if (user?.role !== 'owner') {
    return <HTMLBridge html={renderEmployeePage(user)} />;
  }

  const navigate = useNavigate();

  // To properly render Topbar title, we need state search but passing empty string is fine for now
  return (
    <div className="shell">
      <div 
        onClick={(e) => {
          const btn = e.target.closest('[data-route]');
          if (btn) {
            navigate(`/${btn.dataset.route}`);
          }
        }} 
        dangerouslySetInnerHTML={{ __html: createSidebar(route, {}) }} 
      />
      <main className="dashboard">
        {/* Simple navigation hook interceptor for the sidebar */}
        <div onClick={(e) => {
          const btn = e.target.closest('[data-app-action="logout"]');
          if (btn) handleLogout();
        }} dangerouslySetInnerHTML={{ __html: createTopbar(route, user, '') }} />
        
        <div className="page-stack">
          {children}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  return <div><h1>Dashboard</h1><p>Welcome to the React Dashboard. Other legacy models are migrating!</p></div>;
}

function App() {
  const [user, setUser] = useState(getStoredUser());

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Auth setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/*" element={
          user ? (
            <Shell user={user} handleLogout={() => { logoutUser(); setUser(null); }}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/demands" element={<Demands />} />
                <Route path="/users" element={<Users currentUser={user} />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Shell>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
