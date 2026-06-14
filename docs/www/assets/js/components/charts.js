/**
 * Nusantara Commodity Exchange (NCE) - Charts Component
 * Pure SVG chart components (no external libraries)
 * Dark theme with emerald/cyan accents
 */

// ── State ──────────────────────────────────────────────────────────────────
const chartInstances = new Map();

// ── Inject Styles ──────────────────────────────────────────────────────────
let chartStylesInjected = false;

function injectChartStyles() {
  if (chartStylesInjected) return;
  chartStylesInjected = true;

  const style = document.createElement('style');
  style.id = 'nce-charts-styles';
  style.textContent = `
    .nce-chart-container {
      background: linear-gradient(135deg, #111827 0%, #0F172A 100%);
      border: 1px solid rgba(16, 185, 129, 0.08);
      border-radius: 16px;
      padding: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      position: relative;
    }

    .nce-chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .nce-chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #F1F5F9;
      margin: 0;
    }

    .nce-chart-periods {
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 3px;
    }

    .nce-chart-period-btn {
      padding: 6px 14px;
      background: transparent;
      border: none;
      color: #64748B;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .nce-chart-period-btn:hover {
      color: #CBD5E1;
    }

    .nce-chart-period-btn.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
    }

    .nce-chart-svg {
      width: 100%;
      overflow: visible;
    }

    .nce-chart-tooltip {
      position: absolute;
      background: #1E293B;
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 10;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .nce-chart-tooltip.visible {
      opacity: 1;
    }

    .nce-chart-tooltip-date {
      font-size: 11px;
      color: #64748B;
      margin-bottom: 4px;
    }

    .nce-chart-tooltip-value {
      font-size: 14px;
      font-weight: 600;
      color: #10B981;
    }

    .nce-chart-grid-line {
      stroke: rgba(255, 255, 255, 0.04);
      stroke-width: 1;
    }

    .nce-chart-axis-label {
      fill: #4B5563;
      font-size: 11px;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .nce-chart-bar {
      transition: opacity 0.15s ease;
      cursor: pointer;
    }

    .nce-chart-bar:hover {
      opacity: 0.85;
    }

    .nce-chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      justify-content: center;
    }

    .nce-chart-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #94A3B8;
    }

    .nce-chart-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .nce-donut-center-text {
      font-size: 24px;
      font-weight: 700;
      fill: #F1F5F9;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .nce-donut-center-label {
      font-size: 12px;
      fill: #64748B;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    @keyframes nceDrawLine {
      from { stroke-dashoffset: var(--nce-line-length); }
      to { stroke-dashoffset: 0; }
    }

    @keyframes nceGrowBar {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }

    @keyframes nceDrawArc {
      from { stroke-dashoffset: var(--nce-arc-length); }
      to { stroke-dashoffset: var(--nce-arc-offset); }
    }

    @keyframes nceFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatIDR(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  const formatted = Math.abs(amount).toLocaleString('id-ID');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function formatCompactNumber(num) {
  if (num == null || isNaN(num)) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
  return num.toString();
}

function formatDate(dateStr, period) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (period === '1W' || period === '1M') {
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}

function generateUniqueId() {
  return 'nce-chart-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Compute nice tick values for an axis
 */
function niceScale(minVal, maxVal, maxTicks = 5) {
  const range = maxVal - minVal;
  if (range === 0) return { min: minVal - 1, max: maxVal + 1, ticks: [minVal - 1, minVal, maxVal + 1] };

  const roughStep = range / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceStep;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(minVal / niceStep) * niceStep;
  const niceMax = Math.ceil(maxVal / niceStep) * niceStep;

  const ticks = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.5; v += niceStep) {
    ticks.push(Math.round(v * 1000) / 1000);
  }

  return { min: niceMin, max: niceMax, ticks };
}

// ── Price Chart (Line Chart) ───────────────────────────────────────────────
export function renderPriceChart(containerId, data, period = '1M') {
  injectChartStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Chart container #${containerId} not found`);
    return;
  }

  container.classList.add('nce-chart-container');

  const chartId = generateUniqueId();

  // Default data if empty
  if (!data || data.length === 0) {
    data = _generateDefaultPriceData(period);
  }

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 70 };
  const width = container.clientWidth - 48; // subtract padding
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scale data
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const scale = niceScale(minPrice * 0.98, maxPrice * 1.02, 5);

  const xScale = (i) => (i / (data.length - 1)) * innerWidth;
  const yScale = (v) => innerHeight - ((v - scale.min) / (scale.max - scale.min)) * innerHeight;

  // Build path data
  const linePoints = data.map((d, i) => `${xScale(i)},${yScale(d.price)}`);
  const linePath = `M${linePoints.join(' L')}`;

  // Build area path (for gradient fill)
  const areaPath = `${linePath} L${xScale(data.length - 1)},${innerHeight} L${xScale(0)},${innerHeight} Z`;

  // Compute line length for animation
  let lineLength = 0;
  for (let i = 1; i < data.length; i++) {
    const dx = xScale(i) - xScale(i - 1);
    const dy = yScale(data[i].price) - yScale(data[i - 1].price);
    lineLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Grid lines
  const gridLines = scale.ticks.map(v => {
    const y = yScale(v) + margin.top;
    return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="nce-chart-grid-line"/>`;
  }).join('');

  // Y-axis labels
  const yLabels = scale.ticks.map(v => {
    const y = yScale(v) + margin.top;
    return `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="nce-chart-axis-label">${formatCompactNumber(v)}</text>`;
  }).join('');

  // X-axis labels (show subset)
  const maxLabels = Math.min(data.length, Math.floor(innerWidth / 60));
  const labelStep = Math.max(1, Math.floor(data.length / maxLabels));
  const xLabels = [];
  for (let i = 0; i < data.length; i += labelStep) {
    const x = xScale(i) + margin.left;
    const y = height - margin.bottom + 20;
    xLabels.push(`<text x="${x}" y="${y}" text-anchor="middle" class="nce-chart-axis-label">${formatDate(data[i].date, period)}</text>`);
  }

  // Gradient definition
  const gradId = `${chartId}-grad`;

  // Tooltip HTML
  const tooltipId = `${chartId}-tooltip`;

  // Period buttons
  const periods = ['1W', '1M', '3M', '1Y'];

  const html = `
    <div class="nce-chart-header">
      <h3 class="nce-chart-title">Price Chart</h3>
      <div class="nce-chart-periods">
        ${periods.map(p => `
          <button class="nce-chart-period-btn${p === period ? ' active' : ''}" data-period="${p}" data-chart-id="${chartId}">${p}</button>
        `).join('')}
      </div>
    </div>
    <div style="position:relative;">
      <svg class="nce-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.02"/>
          </linearGradient>
        </defs>

        <g transform="translate(${margin.left}, ${margin.top})">
          <!-- Grid -->
          ${gridLines}

          <!-- Area fill -->
          <path d="${areaPath}" fill="url(#${gradId})" opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" begin="0.3s"/>
          </path>

          <!-- Line -->
          <path d="${linePath}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                style="--nce-line-length: ${lineLength};" stroke-dasharray="${lineLength}" stroke-dashoffset="${lineLength}">
            <animate attributeName="stroke-dashoffset" from="${lineLength}" to="0" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </path>

          <!-- Data points (only show on hover target areas) -->
          ${data.map((d, i) => `
            <circle cx="${xScale(i)}" cy="${yScale(d.price)}" r="0" fill="#10B981" stroke="#111827" stroke-width="2"
                    class="nce-chart-dot" data-index="${i}" style="transition: r 0.15s ease;"/>
            <rect x="${xScale(i) - (innerWidth / data.length) / 2}" y="0" width="${innerWidth / data.length}" height="${innerHeight}"
                  fill="transparent" data-index="${i}" class="nce-chart-hover-area"/>
          `).join('')}
        </g>

        <!-- Y-axis labels -->
        ${yLabels}

        <!-- X-axis labels -->
        ${xLabels.join('')}
      </svg>

      <div class="nce-chart-tooltip" id="${tooltipId}">
        <div class="nce-chart-tooltip-date" id="${tooltipId}-date"></div>
        <div class="nce-chart-tooltip-value" id="${tooltipId}-value"></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // ── Interactivity ──────────────────────────────────────────────────────
  const svg = container.querySelector('svg');
  const tooltip = document.getElementById(tooltipId);
  const tooltipDate = document.getElementById(`${tooltipId}-date`);
  const tooltipValue = document.getElementById(`${tooltipId}-value`);
  const dots = container.querySelectorAll('.nce-chart-dot');
  const hoverAreas = container.querySelectorAll('.nce-chart-hover-area');

  hoverAreas.forEach(area => {
    area.addEventListener('mouseenter', (e) => {
      const idx = parseInt(area.getAttribute('data-index'));
      const dot = container.querySelector(`.nce-chart-dot[data-index="${idx}"]`);
      if (dot) dot.setAttribute('r', '5');

      const d = data[idx];
      if (d) {
        tooltipDate.textContent = new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        tooltipValue.textContent = formatIDR(d.price);
        tooltip.classList.add('visible');

        // Position tooltip
        const svgRect = svg.getBoundingClientRect();
        const pointX = xScale(idx) + margin.left;
        const pointY = yScale(d.price) + margin.top;
        const tooltipRect = tooltip.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        let left = pointX - tooltipRect.width / 2;
        let top = pointY - tooltipRect.height - 12;

        // Keep tooltip inside container
        if (left < 0) left = 4;
        if (left + tooltipRect.width > width) left = width - tooltipRect.width - 4;
        if (top < 0) top = pointY + 16;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }
    });

    area.addEventListener('mouseleave', () => {
      const idx = parseInt(area.getAttribute('data-index'));
      const dot = container.querySelector(`.nce-chart-dot[data-index="${idx}"]`);
      if (dot) dot.setAttribute('r', '0');
      tooltip.classList.remove('visible');
    });
  });

  // Period toggle buttons
  const periodBtns = container.querySelectorAll('.nce-chart-period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newPeriod = btn.getAttribute('data-period');
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Re-render with new period data
      const newData = _generateDefaultPriceData(newPeriod);
      renderPriceChart(containerId, newData, newPeriod);
    });
  });

  // Store instance
  chartInstances.set(chartId, { type: 'price', containerId, data, period });
}

// ── Volume Chart (Bar Chart) ───────────────────────────────────────────────
export function renderVolumeChart(containerId, data) {
  injectChartStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Chart container #${containerId} not found`);
    return;
  }

  container.classList.add('nce-chart-container');

  const chartId = generateUniqueId();

  if (!data || data.length === 0) {
    data = [
      { label: 'Jan', value: 1200 },
      { label: 'Feb', value: 1800 },
      { label: 'Mar', value: 1400 },
      { label: 'Apr', value: 2100 },
      { label: 'May', value: 1700 },
      { label: 'Jun', value: 2400 }
    ];
  }

  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const width = container.clientWidth - 48;
  const height = 280;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const values = data.map(d => d.value);
  const scale = niceScale(0, Math.max(...values), 5);

  const barWidth = Math.min(48, (innerWidth / data.length) * 0.6);
  const barGap = (innerWidth / data.length);

  const yScale = (v) => innerHeight - ((v - scale.min) / (scale.max - scale.min)) * innerHeight;

  // Grid lines
  const gridLines = scale.ticks.map(v => {
    const y = yScale(v) + margin.top;
    return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="nce-chart-grid-line"/>`;
  }).join('');

  // Y-axis labels
  const yLabels = scale.ticks.map(v => {
    const y = yScale(v) + margin.top;
    return `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="nce-chart-axis-label">${formatCompactNumber(v)}</text>`;
  }).join('');

  // Bars
  const bars = data.map((d, i) => {
    const x = margin.left + barGap * i + (barGap - barWidth) / 2;
    const barHeight = innerHeight - yScale(d.value);
    const y = yScale(d.value) + margin.top;

    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" ry="4"
            fill="url(#${chartId}-bar-grad)" class="nce-chart-bar" data-index="${i}"
            style="transform-origin: ${x + barWidth / 2}px ${innerHeight + margin.top}px; animation: nceGrowBar 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.05}s both;"/>
      <text x="${x + barWidth / 2}" y="${height - margin.bottom + 20}" text-anchor="middle" class="nce-chart-axis-label">${d.label}</text>
    `;
  }).join('');

  const tooltipId = `${chartId}-tooltip`;

  const html = `
    <div class="nce-chart-header">
      <h3 class="nce-chart-title">Volume</h3>
    </div>
    <div style="position:relative;">
      <svg class="nce-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="${chartId}-bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10B981"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
        </defs>

        ${gridLines}
        ${yLabels}
        ${bars}
      </svg>

      <div class="nce-chart-tooltip" id="${tooltipId}">
        <div class="nce-chart-tooltip-date" id="${tooltipId}-label"></div>
        <div class="nce-chart-tooltip-value" id="${tooltipId}-value"></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bar hover
  const barElements = container.querySelectorAll('.nce-chart-bar');
  const tooltip = document.getElementById(tooltipId);
  const tooltipLabel = document.getElementById(`${tooltipId}-label`);
  const tooltipValue = document.getElementById(`${tooltipId}-value`);

  barElements.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const idx = parseInt(bar.getAttribute('data-index'));
      const d = data[idx];
      if (d) {
        tooltipLabel.textContent = d.label;
        tooltipValue.textContent = formatCompactNumber(d.value);
        tooltip.classList.add('visible');

        const rect = bar.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - containerRect.top - tooltip.offsetHeight - 8}px`;
      }
    });

    bar.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });

  chartInstances.set(chartId, { type: 'volume', containerId, data });
}

// ── Pie Chart (Donut) ──────────────────────────────────────────────────────
export function renderPieChart(containerId, data) {
  injectChartStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Chart container #${containerId} not found`);
    return;
  }

  container.classList.add('nce-chart-container');

  const chartId = generateUniqueId();

  if (!data || data.length === 0) {
    data = [
      { label: 'Sawit', value: 35, color: '#10B981' },
      { label: 'Karet', value: 25, color: '#06B6D4' },
      { label: 'Kopi', value: 20, color: '#8B5CF6' },
      { label: 'Tembakau', value: 12, color: '#F59E0B' },
      { label: 'Lainnya', value: 8, color: '#6B7280' }
    ];
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const size = Math.min(container.clientWidth - 48, 300);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 20;
  const innerR = outerR * 0.6;
  const svgHeight = size + 40; // extra space for legend below

  // Calculate arcs
  let currentAngle = -Math.PI / 2; // start from top
  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1Outer = cx + outerR * Math.cos(startAngle);
    const y1Outer = cy + outerR * Math.sin(startAngle);
    const x2Outer = cx + outerR * Math.cos(endAngle);
    const y2Outer = cy + outerR * Math.sin(endAngle);
    const x1Inner = cx + innerR * Math.cos(endAngle);
    const y1Inner = cy + innerR * Math.sin(endAngle);
    const x2Inner = cx + innerR * Math.cos(startAngle);
    const y2Inner = cy + innerR * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z'
    ].join(' ');

    // Arc length for animation
    const arcLength = angle * outerR;
    const arcOffset = 0; // fully drawn state

    return {
      path,
      color: d.color,
      arcLength,
      arcOffset,
      startAngle,
      endAngle,
      label: d.label,
      value: d.value,
      percentage: ((d.value / total) * 100).toFixed(1)
    };
  });

  const arcsHTML = arcs.map((arc, i) => `
    <path d="${arc.path}" fill="${arc.color}" opacity="0.9"
          style="--nce-arc-length: ${arc.arcLength}; --nce-arc-offset: ${arc.arcOffset}; stroke: #111827; stroke-width: 2;"
          data-index="${i}" class="nce-chart-bar">
      <animate attributeName="opacity" from="0" to="0.9" dur="0.5s" fill="freeze" begin="${i * 0.1}s"/>
    </path>
  `).join('');

  const html = `
    <div class="nce-chart-header">
      <h3 class="nce-chart-title">Distribution</h3>
    </div>
    <svg class="nce-chart-svg" viewBox="0 0 ${size} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
      ${arcsHTML}

      <!-- Center text -->
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="nce-donut-center-text">${formatCompactNumber(total)}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="nce-donut-center-label">Total</text>
    </svg>

    <div class="nce-chart-legend">
      ${data.map(d => `
        <div class="nce-chart-legend-item">
          <span class="nce-chart-legend-dot" style="background:${d.color};"></span>
          ${d.label} (${((d.value / total) * 100).toFixed(1)}%)
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Hover effect on arcs
  const arcPaths = container.querySelectorAll('.nce-chart-bar');
  arcPaths.forEach(arcPath => {
    arcPath.addEventListener('mouseenter', () => {
      arcPath.setAttribute('opacity', '1');
      arcPath.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))';
    });
    arcPath.addEventListener('mouseleave', () => {
      arcPath.setAttribute('opacity', '0.9');
      arcPath.style.filter = 'none';
    });
  });

  chartInstances.set(chartId, { type: 'pie', containerId, data });
}

// ── Mini Chart (Sparkline) ─────────────────────────────────────────────────
export function renderMiniChart(containerId, data, color = '#10B981') {
  injectChartStyles();

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Chart container #${containerId} not found`);
    return;
  }

  if (!data || data.length === 0) {
    data = [30, 45, 28, 55, 40, 65, 50, 70, 60, 80];
  }

  const width = 120;
  const height = 40;
  const padding = 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const xStep = (width - padding * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = padding + i * xStep;
    const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;

  // Area path
  const areaPath = `${linePath} L${padding + (data.length - 1) * xStep},${height} L${padding},${height} Z`;

  // Compute line length for animation
  let lineLength = 0;
  for (let i = 1; i < data.length; i++) {
    const x1 = padding + (i - 1) * xStep;
    const y1 = height - padding - ((data[i - 1] - minVal) / range) * (height - padding * 2);
    const x2 = padding + i * xStep;
    const y2 = height - padding - ((data[i] - minVal) / range) * (height - padding * 2);
    lineLength += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  const gradId = generateUniqueId();

  container.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:block;overflow:visible;">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#${gradId})">
        <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" begin="0.2s"/>
      </path>
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="${lineLength}" stroke-dashoffset="${lineLength}">
        <animate attributeName="stroke-dashoffset" from="${lineLength}" to="0" dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </path>
    </svg>
  `;
}

// ── Default Data Generators ────────────────────────────────────────────────
function _generateDefaultPriceData(period) {
  const now = new Date();
  let days;

  switch (period) {
    case '1W': days = 7; break;
    case '1M': days = 30; break;
    case '3M': days = 90; break;
    case '1Y': days = 365; break;
    default: days = 30;
  }

  const data = [];
  let price = 15000 + Math.random() * 5000;
  const step = Math.max(1, Math.floor(days / 60));

  for (let i = days; i >= 0; i -= step) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    price += (Math.random() - 0.48) * 800;
    price = Math.max(8000, price);
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price)
    });
  }

  return data;
}

// ── Resize Handler ─────────────────────────────────────────────────────────
export function resizeCharts() {
  chartInstances.forEach((instance, id) => {
    const container = document.getElementById(instance.containerId);
    if (!container) return;

    switch (instance.type) {
      case 'price':
        renderPriceChart(instance.containerId, instance.data, instance.period);
        break;
      case 'volume':
        renderVolumeChart(instance.containerId, instance.data);
        break;
      case 'pie':
        renderPieChart(instance.containerId, instance.data);
        break;
    }
  });
}

// Auto-resize on window resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCharts, 250);
});
