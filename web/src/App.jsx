import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { registerApiClient } from './services/api.js';
import { useStore } from './services/store.js';

import './styles/reset.css';
import './styles/tokens.css';
import './App.css';
import './styles/layout.css';
import './styles/ui.css';
import './styles/motion.css';
import './components/sidebar/sidebar.css';
import './components/topbar/topbar.css';

import { Sidebar } from './components/sidebar/Sidebar.jsx';
import { Topbar } from './components/topbar/Topbar.jsx';

const lazyNamed = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })));

const Auth = lazyNamed(() => import('./pages/auth/Auth.jsx'), 'Auth');
const Dashboard = lazyNamed(() => import('./pages/dashboard/Dashboard.jsx'), 'Dashboard');
const Users = lazyNamed(() => import('./pages/users/Users.jsx'), 'Users');
const Attendance = lazyNamed(() => import('./pages/attendance/Attendance.jsx'), 'Attendance');
const Tasks = lazyNamed(() => import('./pages/tasks/Tasks.jsx'), 'Tasks');
const Clients = lazyNamed(() => import('./pages/clients/Clients.jsx'), 'Clients');
const Demands = lazyNamed(() => import('./pages/demands/Demands.jsx'), 'Demands');
const Bills = lazyNamed(() => import('./pages/bills/Bills.jsx'), 'Bills');
const Inventory = lazyNamed(() => import('./pages/inventory/Inventory.jsx'), 'Inventory');
const Permissions = lazyNamed(() => import('./pages/permissions/Permissions.jsx'), 'Permissions');
const Employee = lazyNamed(() => import('./pages/employee/Employee.jsx'), 'Employee');
const Monitor = lazyNamed(() => import('./pages/monitor/Monitor.jsx'), 'Monitor');
const Logs = lazyNamed(() => import('./pages/logs/Logs.jsx'), 'Logs');

function RouteFallback() {
  return (
    <div className="page-shell" style={{ padding: '24px' }}>
      <div>Loading...</div>
    </div>
  );
}

function Shell({ children }) {
  const { fetchData, syncUser } = useStore();

  useEffect(() => {
    void syncUser().then(() => fetchData());
  }, [fetchData, syncUser]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="dashboard">
        <Topbar />
        <div className="page-stack">
          {children}
        </div>
      </main>
    </div>
  );
}

function ProtectedRoutes() {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isOwner = user.role === 'owner';
  const defaultPath = isOwner ? '/dashboard' : '/employee';
  const permissions = new Set(user.permissions || []);
  const canAccessEmployeeModule = (permission) => isOwner || permissions.has(permission);

  return (
    <Shell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/employee" element={<Employee />} />
          <Route path="/dashboard" element={isOwner ? <Dashboard /> : <Navigate to={defaultPath} replace />} />
          <Route path="/monitor" element={isOwner ? <Monitor /> : <Navigate to={defaultPath} replace />} />
          <Route path="/users" element={isOwner ? <Users /> : <Navigate to={defaultPath} replace />} />
          <Route path="/permissions" element={isOwner ? <Permissions /> : <Navigate to={defaultPath} replace />} />
          <Route path="/attendance" element={canAccessEmployeeModule('attendance') ? <Attendance /> : <Navigate to={defaultPath} replace />} />
          <Route path="/tasks" element={canAccessEmployeeModule('tasks') ? <Tasks /> : <Navigate to={defaultPath} replace />} />
          <Route path="/clients" element={canAccessEmployeeModule('clients') ? <Clients /> : <Navigate to={defaultPath} replace />} />
          <Route path="/demands" element={canAccessEmployeeModule('demands') ? <Demands /> : <Navigate to={defaultPath} replace />} />
          <Route path="/bills" element={canAccessEmployeeModule('bills') ? <Bills /> : <Navigate to={defaultPath} replace />} />
          <Route path="/inventory" element={canAccessEmployeeModule('inventory') ? <Inventory /> : <Navigate to={defaultPath} replace />} />
          <Route path="/logs" element={isOwner ? <Logs /> : <Navigate to={defaultPath} replace />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}

function App() {
  const { user, logout } = useStore();
  const defaultPath = user?.role === 'owner' ? '/dashboard' : '/employee';

  useEffect(() => {
    registerApiClient({ toast, onUnauthorized: logout });

    return () => {
      registerApiClient();
    };
  }, [logout]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '0.9rem',
            padding: '12px 20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: { iconTheme: { primary: '#90C845', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Auth /> : <Navigate to={defaultPath} replace />}
          />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
