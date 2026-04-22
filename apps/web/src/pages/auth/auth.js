export function renderAuthPage(state) {
  return `
    <section class="auth-shell">
      <article class="auth-card reveal">
        <div class="auth-copy">
          <p class="eyebrow">CitiBooks Access</p>
          <h1>Login with your username</h1>
          <p class="section-copy">
            Owners can access the web dashboard. Employees can still login here to view account info, but daily operations remain in the native app.
          </p>
        </div>
        <form id="loginForm" class="auth-form">
          <div class="field">
            <label>Username</label>
            <input name="username" placeholder="Enter username" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input name="password" type="password" placeholder="Enter password" required />
          </div>
          <button class="button" type="submit">Login</button>
        </form>
        <div class="auth-help">
          <span class="chip purple">Owner demo: owner / owner123</span>
          <span class="chip blue">Employee demo: employee / employee123</span>
        </div>
      </article>
    </section>
  `;
}
