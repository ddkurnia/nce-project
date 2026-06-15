/* ============================================================================
 * NCE — Toast Notification System
 * ============================================================================ */

const Toast = {
  _container: null,
  _timeout: 4000,

  /**
   * Initialize toast container
   */
  init() {
    if (this._container) return;
    this._container = document.createElement('div');
    this._container.className = 'toast-container';
    this._container.setAttribute('role', 'alert');
    this._container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this._container);
  },

  /**
   * Show a toast notification
   */
  show(message, type = 'info', duration) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    this._container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 300ms ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration || this._timeout);
  },

  /**
   * Shorthand methods
   */
  success(msg, duration) { this.show(msg, 'success', duration); },
  error(msg, duration) { this.show(msg, 'error', duration); },
  info(msg, duration) { this.show(msg, 'info', duration); },
  warning(msg, duration) { this.show(msg, 'warning', duration); }
};

export default Toast;
