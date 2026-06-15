/* ============================================================================
 * NCE — Messages View (Placeholder)
 * ============================================================================ */

const MessagesView = {
  /**
   * Render messages view
   */
  render() {
    return `
      <div class="messages-view view">
        <div class="messages-placeholder">
          <svg class="messages-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
          <div class="messages-placeholder__title">Messages</div>
          <div class="messages-placeholder__desc">
            Direct messaging between buyers and sellers is coming soon. Stay tuned for real-time negotiations!
          </div>
          <div style="margin-top:24px;padding:12px 20px;background:var(--gold-glow);border:1px solid var(--border-gold);border-radius:var(--radius-md);font-size:13px;color:var(--gold);font-weight:500;">
            🚧 Under Development
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize messages view
   */
  init() {
    // No-op for now
  }
};

export default MessagesView;
