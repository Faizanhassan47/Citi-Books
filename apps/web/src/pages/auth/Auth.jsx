import React, { useState } from 'react';
import { loginUser } from '../../services/api.js';

export function Auth({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const loggedUser = await loginUser(username, password);
      setUser(loggedUser);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <section className="auth-shell">
      <article className="auth-card reveal is-visible">
        <div className="auth-copy">
          <p className="eyebrow">CitiBooks Access</p>
          <h1>Login with your username</h1>
          <p className="section-copy">
            Owners can access the web dashboard. Employees can still login here to view account info, but daily operations remain in the native app.
          </p>
        </div>
        
        {error && <div className="toast is-visible" style={{ position: 'relative', bottom: '0', marginBottom: '1rem', background: '#ff4d4f' }}>{error}</div>}
        
        <form id="loginForm" className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input 
              name="username" 
              placeholder="Enter username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button className="button" type="submit">Login</button>
        </form>
        <div className="auth-help">
          <span className="chip purple">Owner demo: owner / owner123</span>
          <span className="chip blue">Employee demo: employee / employee123</span>
        </div>
      </article>
    </section>
  );
}
