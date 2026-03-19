import { useState } from 'react';
import { DEFAULT_CURRENCY } from '../../config';

const PRICE_STEP = '0.0000000001';

function normalizeDecimalInput(value, maxFractionDigits = 10) {
  const next = String(value ?? '').replace(',', '.');
  if (next === '' || next === '-' || next === '.') return next;
  if (!/^-?\d*\.?\d*$/.test(next)) return '';
  const [intPart = '', fracPart = ''] = next.split('.');
  if (fracPart.length <= maxFractionDigits) return next;
  return `${intPart}.${fracPart.slice(0, maxFractionDigits)}`;
}

export function PortfolioTable({ portfolio, onUpdatePrice, highlightTicker }) {
  const [editing, setEditing] = useState({});
  const safePortfolio = Array.isArray(portfolio) ? portfolio : [];
  const highlight = (highlightTicker || '').toLowerCase();

  const handlePriceChange = (ticker, value) => {
    setEditing((prev) => ({ ...prev, [ticker]: normalizeDecimalInput(value) }));
  };

  const handlePriceBlur = (row) => {
    const value = editing[row.ticker];
    if (value == null || value === '') return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    onUpdatePrice?.(row, num);
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-slate-400">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Тикер</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Актив</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Кол-во</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Ср. цена</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Текущая</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Рын. ст.</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Инвест.</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">P&amp;L</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">P&amp;L %</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Вал.</th>
            </tr>
          </thead>
          <tbody>
            {safePortfolio.map((row) => {
              const pnl = Number(row.unrealized_pnl || 0);
              const pnlPct = Number(row.pnl_percent || 0);
              const positive = pnl >= 0;
              const isHighlight = highlight && (row.ticker || '').toLowerCase().includes(highlight);

              return (
                <tr
                  key={row.ticker}
                  className={`border-b border-white/5 hover:bg-white/5 ${isHighlight ? 'bg-[#0075EB]/15 ring-1 ring-inset ring-[#0075EB]/40' : ''}`}
                >
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#0075EB]">{row.ticker}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-200">{row.asset_name}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">{Number(row.quantity || 0)}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                    {Number(row.avg_buy_price || 0).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 mono text-right">
                    <input
                      type="number"
                      step={PRICE_STEP}
                      className="bg-white/5 border border-white/10 rounded-2xl px-2 py-1.5 w-20 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
                      value={editing[row.ticker] !== undefined ? editing[row.ticker] : (Number(row.current_price || 0) || '')}
                      onChange={(e) => handlePriceChange(row.ticker, e.target.value)}
                      onBlur={() => handlePriceBlur(row)}
                    />
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                    {Number(row.market_value || 0).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                    {Number(row.total_invested || 0).toFixed(2)}
                  </td>
                  <td
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium tabular-nums ${
                      positive ? 'text-accent' : 'text-red-400'
                    }`}
                  >
                    {pnl.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium tabular-nums ${
                      positive ? 'text-accent' : 'text-red-400'
                    }`}
                  >
                    {pnlPct.toFixed(2)}%
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-left">
                    {row.currency || DEFAULT_CURRENCY}
                  </td>
                </tr>
              );
            })}
            {!safePortfolio.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 sm:px-4 py-6 text-center text-slate-500 text-sm"
                >
                  Позиции отсутствуют.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

