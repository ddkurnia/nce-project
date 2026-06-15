export function renderSkeleton(type, count = 1) {
  const skeletons = {
    card: () => `<div class="skeleton skeleton-card"></div>`,
    stat: () => `<div class="skeleton" style="height:100px;border-radius:var(--radius-md);"></div>`,
    row: () => `<div class="skeleton skeleton-row"></div>`,
    'table-row': () => `<div class="skeleton skeleton-row" style="height:48px;"></div>`,
    text: () => `<div class="skeleton skeleton-text"></div>`,
    title: () => `<div class="skeleton skeleton-title"></div>`,
    pulse: () => `<div class="skeleton" style="height:32px;border-radius:0;"></div>`,
    rfq: () => `<div class="skeleton" style="height:160px;border-radius:var(--radius-md);margin-bottom:12px;"></div>`,
  };

  const render = skeletons[type] || skeletons.card;
  return Array.from({ length: count }, () => render()).join('');
}

export function renderStatGridSkeleton() {
  return `
    <div class="stat-grid">
      ${renderSkeleton('stat', 4)}
    </div>
  `;
}

export function renderMarketTableSkeleton() {
  return `
    <div style="margin-top:16px;">
      ${renderSkeleton('table-row', 5)}
    </div>
  `;
}

export function renderRFQListSkeleton() {
  return renderSkeleton('rfq', 4);
}

export function renderLoadingOverlay() {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:16px;">
      <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
      <div class="skeleton skeleton-text" style="width:60%;"></div>
    </div>
  `;
}
