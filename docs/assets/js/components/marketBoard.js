/* ============================================================================
 * NCE — Market Board Component
 * Bloomberg Terminal-style commodity trading board
 * ============================================================================ */

import { escapeHtml } from '../utils/helpers.js';
import Formatter from '../utils/formatter.js';
import Sparkline from './sparkline.js';

const MarketBoard = {
  /**
   * Render full market board table
   */
  render(data = []) {
    if (!data.length) {
      return `
        <div class="empty-state">
          <div class="empty-state__title">No Market Data</div>
          <div class="empty-state__desc">Market data is loading...</div>
        </div>
      `;
    }

    const rows = data.map(item => this._renderRow(item)).join('');

    return `
      <div style="overflow-x:auto;margin:0 -16px;padding:0 16px;">
        <table class="board-table">
          <thead>
            <tr>
              <th>Commodity</th>
              <th>Sparkline</th>
              <th>Last</th>
              <th>Chg%</th>
              <th>S/D</th>
              <th class="board-table__center">Buy</th>
              <th class="board-table__center">Sell</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Render compact market board (fewer columns)
   */
  renderCompact(data = []) {
    if (!data.length) return '<div class="empty-state"><div class="empty-state__desc">Loading...</div></div>';

    const rows = data.map(item => this._renderCompactRow(item)).join('');

    return `
      <table class="board-table">
        <thead>
          <tr>
            <th>Commodity</th>
            <th class="board-table__right">Price</th>
            <th class="board-table__right">Chg%</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  },

  /**
   * Render single row with full data
   */
  _renderRow(item) {
    const total = item.supply + item.demand;
    const supplyPct = total > 0 ? (item.supply / total * 100) : 50;
    const demandPct = total > 0 ? (item.demand / total * 100) : 50;
    const changeClass = Formatter.changeClass(item.change);
    const arrow = Formatter.changeArrow(item.change);
    const price = item.currentPrice || item.price;
    const sparkData = item.sparkline || [];
    const code = item.code || item.id.toUpperCase();

    return `
      <tr data-commodity="${escapeHtml(item.id)}">
        <td>
          <div class="board-table__commodity-name">${escapeHtml(item.name)}</div>
          <div class="board-table__commodity-id">${escapeHtml(code)}</div>
        </td>
        <td>${Sparkline.render(sparkData, { width: 60, height: 24 })}</td>
        <td>
          <span class="board-table__price">${Formatter.currency(price, true)}</span>
        </td>
        <td>
          <span class="board-table__change ${changeClass}">
            ${arrow} ${Formatter.percentChange(item.change)}
          </span>
        </td>
        <td>
          <div class="supply-demand-bar">
            <div class="supply-demand-bar__supply" style="width:${supplyPct}%"></div>
            <div class="supply-demand-bar__demand" style="width:${demandPct}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;margin-top:1px;">
            <span style="color:var(--success);">${Formatter.number(item.supply)}t</span>
            <span style="color:var(--danger);">${Formatter.number(item.demand)}t</span>
          </div>
        </td>
        <td class="board-table__orders" style="color:var(--success);">${item.buyOrders || 0}</td>
        <td class="board-table__orders" style="color:var(--danger);">${item.sellOrders || 0}</td>
      </tr>
    `;
  },

  /**
   * Render compact row
   */
  _renderCompactRow(item) {
    const changeClass = Formatter.changeClass(item.change);
    const arrow = Formatter.changeArrow(item.change);
    const price = item.currentPrice || item.price;

    return `
      <tr>
        <td>
          <div style="font-weight:600;font-size:13px;">${escapeHtml(item.name)}</div>
        </td>
        <td class="board-table__right">
          <span style="font-family:var(--font-mono);font-weight:600;font-size:13px;">
            ${Formatter.currency(price, true)}
          </span>
        </td>
        <td class="board-table__right">
          <span class="${changeClass}" style="font-family:var(--font-mono);font-weight:600;font-size:12px;">
            ${arrow}${Formatter.percentChange(item.change)}
          </span>
        </td>
      </tr>
    `;
  }
};

export default MarketBoard;
