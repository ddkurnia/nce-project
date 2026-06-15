/* ============================================================================
 * NCE — Market Board Component
 * ============================================================================ */

import { escapeHtml } from '../utils/helpers.js';
import Formatter from '../utils/formatter.js';

const MarketBoard = {
  /**
   * Render market board table
   */
  render(data = []) {
    if (!data.length) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <div class="empty-state__title">No Market Data</div>
          <div class="empty-state__desc">Market data is loading...</div>
        </div>
      `;
    }

    const rows = data.map(item => {
      const total = item.supply + item.demand;
      const supplyPct = total > 0 ? (item.supply / total * 100) : 50;
      const demandPct = total > 0 ? (item.demand / total * 100) : 50;
      const changeClass = Formatter.changeClass(item.change);
      const arrow = Formatter.changeArrow(item.change);
      const price = item.currentPrice || item.price;

      return `
        <tr>
          <td>
            <div style="font-weight:600;font-size:13px;">${escapeHtml(item.name)}</div>
          </td>
          <td>
            <span style="font-family:var(--font-mono);font-weight:600;font-size:13px;">
              ${Formatter.currency(price, true)}
            </span>
            <div class="card__change ${changeClass}" style="font-size:11px;">
              ${arrow} ${Formatter.percentChange(item.change)}
            </div>
          </td>
          <td>
            <div class="supply-demand-bar">
              <div class="supply-demand-bar__supply" style="width:${supplyPct}%"></div>
              <div class="supply-demand-bar__demand" style="width:${demandPct}%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px;">
              <span style="color:var(--success);">${Formatter.number(item.supply)}t</span>
              <span style="color:var(--danger);">${Formatter.number(item.demand)}t</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono);font-size:13px;color:var(--success);text-align:center;">
            ${item.buyOrders}
          </td>
          <td style="font-family:var(--font-mono);font-size:13px;color:var(--danger);text-align:center;">
            ${item.sellOrders}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="overflow-x:auto;margin:0 -16px;padding:0 16px;">
        <table class="board-table">
          <thead>
            <tr>
              <th>Commodity</th>
              <th>Last Price</th>
              <th>Supply / Demand</th>
              <th style="text-align:center;">Buy</th>
              <th style="text-align:center;">Sell</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
};

export default MarketBoard;
