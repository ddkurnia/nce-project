import { showSearch } from '../components/header.js';

let container = null;

export async function mount(el) {
  container = el;
  showSearch(false);
  render();
}

function render() {
  if (!container) return;

  container.innerHTML = `
    <div class="messages-view">
      <div class="view-container">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>Fitur Pesan Segera Hadir</h3>
        <p>Hubungi penjual dan pembeli langsung dari aplikasi. Fitur chat real-time sedang dalam pengembangan.</p>
        <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;">
          <a href="#/market" class="btn btn-secondary">📊 Jelajahi Market</a>
          <a href="#/rfq" class="btn btn-outline">📝 Buat RFQ</a>
        </div>
      </div>
    </div>
  `;
}

export function unmount() {
  container = null;
}
