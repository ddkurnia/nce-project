/* ============================================================================
 * NCE — Modal System
 * ============================================================================ */

const Modal = {
  _active: null,

  /**
   * Open a modal with content
   */
  open(content, options = {}) {
    this.close(); // Close any existing

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__handle"></div>
        ${content}
      </div>
    `;

    document.body.appendChild(overlay);
    this._active = overlay;

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Close on escape
    this._onEsc = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._onEsc);

    // Close button
    const closeBtn = overlay.querySelector('.modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Callback
    if (options.onOpen) options.onOpen(overlay);

    return overlay;
  },

  /**
   * Close active modal
   */
  close() {
    if (!this._active) return;

    this._active.classList.remove('active');

    setTimeout(() => {
      if (this._active && this._active.parentNode) {
        this._active.parentNode.removeChild(this._active);
      }
      this._active = null;
    }, 300);

    if (this._onEsc) {
      document.removeEventListener('keydown', this._onEsc);
      this._onEsc = null;
    }
  },

  /**
   * Show login/register modal
   */
  showAuth(mode = 'login') {
    const isLogin = mode === 'login';

    const content = `
      <div class="auth-modal">
        <div class="auth-tabs">
          <button class="auth-tab ${isLogin ? 'active' : ''}" data-tab="login">Login</button>
          <button class="auth-tab ${!isLogin ? 'active' : ''}" data-tab="register">Register</button>
        </div>

        <div id="auth-form-login" style="display:${isLogin ? 'block' : 'none'}">
          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" name="email" placeholder="your@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" name="password" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn--gold btn--full" style="margin-top:8px;">Login</button>
          </form>
        </div>

        <div id="auth-form-register" style="display:${!isLogin ? 'block' : 'none'}">
          <form id="register-form">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" name="name" placeholder="Your name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" name="email" placeholder="your@email.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" name="password" placeholder="••••••••" required autocomplete="new-password" minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select class="form-input form-select" name="role">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            <button type="submit" class="btn btn--gold btn--full" style="margin-top:8px;">Create Account</button>
          </form>
        </div>

        <div id="auth-error" style="display:none;margin-top:12px;padding:8px 12px;background:var(--danger-bg);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);color:var(--danger);font-size:13px;"></div>
      </div>
    `;

    const overlay = this.open(content);

    // Tab switching
    overlay.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        overlay.querySelector('#auth-form-login').style.display = target === 'login' ? 'block' : 'none';
        overlay.querySelector('#auth-form-register').style.display = target === 'register' ? 'block' : 'none';
        overlay.querySelector('#auth-error').style.display = 'none';
      });
    });

    return overlay;
  }
};

export default Modal;
