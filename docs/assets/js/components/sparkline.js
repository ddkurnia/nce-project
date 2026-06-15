/**
 * Sparkline — Phase 4 Terminal-style mini chart
 * Enhanced with glow effect and smoother gradients
 */

let gradientId = 0;

export function renderSparklineSVG(data, width = 60, height = 24) {
  if (!data || data.length < 2) return '';

  const id = `spark-grad-${++gradientId}`;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUpTrend = data[data.length - 1] >= data[0];
  const lineColor = isUpTrend ? 'var(--success)' : 'var(--danger)';
  const fillTop = isUpTrend ? 'rgba(0,230,118,0.10)' : 'rgba(255,82,82,0.10)';
  const fillBot = isUpTrend ? 'rgba(0,230,118,0)' : 'rgba(255,82,82,0)';

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${width},${height}`, `0,${height}`].join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${fillTop}"/>
          <stop offset="100%" stop-color="${fillBot}"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#${id})"/>
      <polyline
        points="${points.join(' ')}"
        fill="none"
        stroke="${lineColor}"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      ${renderLastPoint(data, width, height, min, range, lineColor, isUpTrend)}
    </svg>
  `;
}

function renderLastPoint(data, width, height, min, range, color, isUpTrend) {
  const lastVal = data[data.length - 1];
  const x = width;
  const y = height - ((lastVal - min) / range) * (height - 4) - 2;
  return `<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="0.9"/>
          <circle cx="${x}" cy="${y}" r="4" fill="${isUpTrend ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)'}"/>`;
}

/**
 * Render a sparkline with volume bars below
 */
export function renderSparklineWithVolume(data, volumes, width = 120, height = 48) {
  if (!data || data.length < 2) return '';

  const chartH = height * 0.7;
  const volH = height * 0.3;
  const id = `spark-vol-${++gradientId}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const maxVol = Math.max(...(volumes || [1]), 1);

  const isUpTrend = data[data.length - 1] >= data[0];
  const lineColor = isUpTrend ? 'var(--success)' : 'var(--danger)';

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = chartH - ((val - min) / range) * (chartH - 4) - 2;
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${width},${chartH}`, `0,${chartH}`].join(' ');

  const volBars = (volumes || []).map((vol, i) => {
    const x = (i / (volumes.length)) * width;
    const barW = width / volumes.length - 1;
    const barH = (vol / maxVol) * volH;
    const isBuy = i === 0 || data[i] >= data[i - 1];
    return `<rect x="${x}" y="${height - barH}" width="${Math.max(barW, 1)}" height="${barH}" 
                  fill="${isBuy ? 'var(--chart-volume-up)' : 'var(--chart-volume-down)'}" rx="1"/>`;
  }).join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${isUpTrend ? 'rgba(0,230,118,0.10)' : 'rgba(255,82,82,0.10)'}"/>
          <stop offset="100%" stop-color="${isUpTrend ? 'rgba(0,230,118,0)' : 'rgba(255,82,82,0)'}"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#${id})"/>
      <polyline points="${points.join(' ')}" fill="none" stroke="${lineColor}"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${volBars}
    </svg>
  `;
}
