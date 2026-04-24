import React, { useState } from 'react';
import { loginUser } from '../../services/api.js';
import { useStore } from '../../services/store.js';
import './auth.css';

export function Auth() {
  const setUser = useStore((state) => state.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextUsername = username.trim();

    try {
      setSubmitting(true);
      const loggedUser = await loginUser(nextUsername, password);
      setUser(loggedUser);
    } catch {
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      {/* Visual Brand Panel for Split Screen */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <img src="/assets/citi-logo.png" alt="CitiBooks Logo" />
          <h2>Empowering Your Workforce.</h2>
          <p>
            Welcome to the CitiBooks Command Dashboard. Manage attendance, process demands, and organize team tasks in one unified platform.
          </p>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="auth-form-container">
        <article className="auth-card reveal is-visible">
          <div className="auth-copy">
            <p className="eyebrow">Enterprise Access</p>
            <h1>Welcome Back</h1>
            <p className="section-copy" style={{ fontSize: '1rem', marginTop: '4px' }}>
              Authentication is required for web dashboard access. Employees should use the mobile app for daily operations.
            </p>
          </div>

          <form id="loginForm" className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                name="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="button" type="submit" disabled={submitting} style={{ marginTop: '8px' }}>
              {submitting ? 'Authenticating...' : 'Secure Login →'}
            </button>
          </form>
          

        </article>
      </div>
    </section>
  );
}
