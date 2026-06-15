export function renderSparklineSVG(data, width = 60, height = 24) {
  if (!data || data.length < 2) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUpTrend = data[data.length - 1] >= data[0];
  const color = isUpTrend ? 'var(--success)' : 'var(--danger)';

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <polyline
        points="${points}"
        fill="none"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
}
