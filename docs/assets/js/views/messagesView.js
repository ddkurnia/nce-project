/* ============================================================================
 * NCE — Messages View (Chat Interface)
 * Business messaging between traders
 * ============================================================================ */

import Config from '../config.js';
import Auth from '../auth.js';
import Toast from '../components/toast.js';
import { escapeHtml } from '../utils/helpers.js';

const MessagesView = {
  _activeChat: null,

  /**
   * Render messages view
   */
  render() {
    if (!Auth.isLoggedIn()) {
      return `
        <div class="messages-view view">
          <div class="empty-state" style="padding:var(--space-4xl) var(--space-xl);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="1.5" style="margin:0 auto var(--space-lg);display:block;opacity:0.4;">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
            <div class="empty-state__title">Sign In Required</div>
            <div class="empty-state__desc">Login to chat with suppliers and buyers</div>
            <button class="btn btn--gold" id="messages-login-btn" style="margin-top:var(--space-lg);">Login / Register</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="messages-view view">
        <!-- Chat List -->
        <div id="chat-list-view">
          <div class="messages-header">
            <div style="font-size:var(--text-lg);font-weight:700;">Messages</div>
            <div style="font-size:var(--text-sm);color:var(--text-muted);">${Config.CHAT_CONTACTS.length} conversation${Config.CHAT_CONTACTS.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="chat-list" id="chat-contacts">
            ${this._renderChatList()}
          </div>
        </div>

        <!-- Chat Detail (hidden by default) -->
        <div id="chat-detail-view" style="display:none;">
        </div>
      </div>
    `;
  },

  /**
   * Render chat list
   */
  _renderChatList() {
    return Config.CHAT_CONTACTS.map(contact => `
      <div class="chat-item" data-chat-id="${contact.id}">
        <div class="chat-item__avatar" style="background:${contact.color}22;color:${contact.color};">
          ${escapeHtml(contact.initials)}
        </div>
        <div class="chat-item__content">
          <div class="chat-item__name">${escapeHtml(contact.name)}</div>
          <div class="chat-item__preview">${escapeHtml(contact.lastMessage)}</div>
        </div>
        <div class="chat-item__meta">
          <span class="chat-item__time">${contact.time}</span>
          ${contact.unread > 0 ? `<span class="chat-item__unread">${contact.unread}</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  /**
   * Initialize
   */
  init() {
    const loginBtn = document.getElementById('messages-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('nce:show-auth'));
      });
      return;
    }

    // Bind chat list clicks
    const chatList = document.getElementById('chat-contacts');
    if (chatList) {
      chatList.addEventListener('click', (e) => {
        const item = e.target.closest('.chat-item');
        if (!item) return;
        const id = parseInt(item.dataset.chatId);
        this._openChat(id);
      });
    }
  },

  /**
   * Open chat with a contact
   */
  _openChat(contactId) {
    const contact = Config.CHAT_CONTACTS.find(c => c.id === contactId);
    if (!contact) return;

    this._activeChat = contact;

    const listView = document.getElementById('chat-list-view');
    const detailView = document.getElementById('chat-detail-view');

    if (listView) listView.style.display = 'none';
    if (detailView) {
      detailView.style.display = '';
      detailView.innerHTML = this._renderChatDetail(contact);
      this._bindChatDetail(contact);
    }
  },

  /**
   * Render chat detail view
   */
  _renderChatDetail(contact) {
    // Simulated messages
    const messages = [
      { from: 'them', text: 'Halo, saya tertarik dengan permintaan RFQ Anda', time: '10:30' },
      { from: 'me', text: 'Terima kasih, ketersediaan stok kami sudah siap', time: '10:32' },
      { from: 'them', text: 'Berapa harga terbaik untuk 5 ton CPO?', time: '10:35' },
      { from: 'me', text: 'Untuk 5 ton kami bisa offer Rp14.000/kg FOB', time: '10:38' },
      { from: 'them', text: contact.lastMessage, time: contact.time },
    ];

    const messagesHtml = messages.map(m => `
      <div class="chat-bubble chat-bubble--${m.from === 'me' ? 'sent' : 'received'}">
        ${escapeHtml(m.text)}
      </div>
    `).join('');

    return `
      <div class="chat-back" id="chat-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </div>
      <div class="chat-header-bar">
        <div class="chat-item__avatar" style="background:${contact.color}22;color:${contact.color};width:40px;height:40px;font-size:14px;">
          ${escapeHtml(contact.initials)}
        </div>
        <div>
          <div style="font-weight:600;font-size:var(--text-base);">${escapeHtml(contact.name)}</div>
          <div style="font-size:11px;color:var(--success);">Online</div>
        </div>
      </div>
      <div class="chat-view">
        <div class="chat-messages" id="chat-messages">
          ${messagesHtml}
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off">
          <button id="chat-send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Bind chat detail events
   */
  _bindChatDetail(contact) {
    // Back button
    const backBtn = document.getElementById('chat-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this._activeChat = null;
        const listView = document.getElementById('chat-list-view');
        const detailView = document.getElementById('chat-detail-view');
        if (listView) listView.style.display = '';
        if (detailView) detailView.style.display = 'none';
      });
    }

    // Send message
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');

    const sendMessage = () => {
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const messages = document.getElementById('chat-messages');
      if (messages) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble chat-bubble--sent';
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
      }

      input.value = '';

      // Simulate reply
      setTimeout(() => {
        if (messages && this._activeChat) {
          const reply = document.createElement('div');
          reply.className = 'chat-bubble chat-bubble--received';
          reply.textContent = 'Terima kasih atas pesannya. Kami akan segera merespons.';
          messages.appendChild(reply);
          messages.scrollTop = messages.scrollHeight;
        }
      }, 1500);
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }

    // Auto-scroll to bottom
    const messages = document.getElementById('chat-messages');
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  },

  /**
   * Cleanup
   */
  destroy() {
    this._activeChat = null;
  }
};

export default MessagesView;
