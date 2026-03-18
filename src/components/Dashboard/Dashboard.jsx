import { useMemo, useState } from 'react';
import { realizedPnLByTicker } from '../../utils/calculations';

const BAR_COLORS = ['#0075EB', '#10B981', '#F59E0B', '#8B5CF6', '#0891b2', '#EF4444', '#EC4899', '#64748b'];

function SummaryCard({ label, value, sub, positive, negative, currency }) {
  const color =
    positive != null
      ? positive
        ? 'text-accent'
        : 'text-red-400'
      : negative != null
        ? negative
          ? 'text-red-400'
          : 'text-accent'
        : 'text-white';
  const displayValue = currency ? `$${value}` : value;
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-2 min-w-0">
      <div className="text-xs font-medium text-slate-400 tracking-tight min-h-[1rem] leading-tight">{label}</div>
      <div className={`font-semibold text-xl sm:text-2xl tabular-nums leading-none min-h-[2rem] flex items-end ${color}`}>{displayValue}</div>
      {sub && <div className="text-xs text-slate-500 min-h-[1rem] leading-tight">{sub}</div>}
    </div>
  );
}

export function Dashboard({ summary, portfolio, transactions, onUpdatePrice, PortfolioTableComponent }) {
  const safePortfolio = Array.isArray(portfolio) ? portfolio : [];
  const [tickerSearch, setTickerSearch] = useState('');
  const [pnlDateFrom, setPnlDateFrom] = useState('');
  const [pnlDateTo, setPnlDateTo] = useState('');
  const [pnlTickerFilter, setPnlTickerFilter] = useState('');
  const tickerQuery = (tickerSearch || '').trim().toLowerCase();

  const realizedBreakdown = useMemo(() => {
    const list = realizedPnLByTicker(transactions || [], pnlDateFrom || undefined, pnlDateTo || undefined);
    let result = list;
    if (pnlDateFrom || pnlDateTo) {
      result = result.filter((r) => Number(r.realized_pnl) !== 0);
    }
    if (pnlTickerFilter.trim()) {
      const q = pnlTickerFilter.trim().toLowerCase();
      result = result.filter((r) => (r.ticker || '').toLowerCase().includes(q) || (r.asset_name || '').toLowerCase().includes(q));
    }
    return result;
  }, [transactions, pnlDateFrom, pnlDateTo, pnlTickerFilter]);

  if (!summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/[0.03] p-4 sm:p-5 animate-pulse"
          >
            <div className="h-3 w-20 sm:w-24 bg-white/10 rounded mb-3" />
            <div className="h-6 sm:h-7 w-24 sm:w-28 bg-white/15 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const totalReturnPercent = Number(summary.total_return_percent || 0);

  const unrealizedPositive = Number(summary.total_unrealized_pnl || 0) >= 0;

  const totalMarketValue = safePortfolio.reduce((s, p) => s + Number(p.market_value || 0), 0);
  const barData = safePortfolio
    .filter((p) => Number(p.market_value) > 0)
    .map((p, index) => {
      const v = Number(p.market_value);
      const pct = totalMarketValue > 0 ? (v / totalMarketValue) * 100 : 0;
      return {
        name: p.ticker,
        value: v,
        pct,
        color: BAR_COLORS[index % BAR_COLORS.length]
      };
    });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <SummaryCard
          label="Всего инвестировано (BUY)"
          value={Number(summary.total_invested || 0).toFixed(2)}
          currency
        />
        <SummaryCard
          label="Реализ. P&L"
          value={Number(summary.total_realized_pnl || 0).toFixed(2)}
          positive={Number(summary.total_realized_pnl || 0) >= 0}
          currency
        />
        <SummaryCard
          label="Нереализ. P&L"
          value={Number(summary.total_unrealized_pnl || 0).toFixed(2)}
          sub={`${unrealizedPositive ? '+' : ''}${(
            (Number(summary.total_unrealized_pnl || 0) /
              (Number(summary.total_invested || 1) || 1)) *
            100
          ).toFixed(2)}%`}
          positive={unrealizedPositive}
          currency
        />
        <SummaryCard
          label="Сумма комиссий"
          value={Number(summary.total_commissions || 0).toFixed(2)}
          negative
          currency
        />
        <SummaryCard
          label="Всего дивидендов"
          value={Number(summary.total_dividends || 0).toFixed(2)}
          currency
        />
        <SummaryCard
          label="Доходность портфеля %"
          value={`${totalReturnPercent.toFixed(2)}%`}
          positive={totalReturnPercent >= 0}
        />
      </div>

      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Структура портфеля (% по открытым позициям)
          </h2>
          <input
            type="text"
            value={tickerSearch}
            onChange={(e) => setTickerSearch(e.target.value)}
            placeholder="Поиск по тикеру"
            className="bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 w-full sm:w-44"
          />
        </div>
        {barData.length ? (
          <div className="space-y-4">
            <div className="h-3 sm:h-4 w-full rounded-full overflow-hidden flex bg-white/5">
              {barData.map((seg) => {
                const isHighlight = tickerQuery && (seg.name || '').toLowerCase().includes(tickerQuery);
                return (
                  <div
                    key={seg.name}
                    title={`${seg.name} ${seg.pct.toFixed(1)}%`}
                    className={`h-full min-w-[4px] transition-all duration-200 ${isHighlight ? 'ring-2 ring-white ring-inset opacity-100' : 'hover:opacity-90'}`}
                    style={{
                      width: `${Math.max(seg.pct, 0.5)}%`,
                      backgroundColor: seg.color
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {barData.map((seg) => {
                const isHighlight = tickerQuery && (seg.name || '').toLowerCase().includes(tickerQuery);
                return (
                  <div
                    key={seg.name}
                    className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 -m-1 ${isHighlight ? 'bg-[#0075EB]/20 ring-1 ring-[#0075EB]/50' : ''}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className={isHighlight ? 'text-white font-medium' : 'text-slate-400'}>{seg.name}</span>
                    <span className={isHighlight ? 'text-slate-200 font-medium tabular-nums' : 'text-slate-300 font-medium tabular-nums'}>{seg.pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 flex items-center justify-center text-slate-500 text-sm font-medium">
            Позиции отсутствуют. Добавьте сделки.
          </div>
        )}
      </div>

      {PortfolioTableComponent && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Открытые позиции
          </h2>
          <PortfolioTableComponent
            portfolio={safePortfolio}
            onUpdatePrice={onUpdatePrice}
            highlightTicker={tickerQuery || undefined}
          />
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Детальный анализ реализованного P&L
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="date"
            value={pnlDateFrom}
            onChange={(e) => setPnlDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 min-w-0"
            placeholder="С"
          />
          <input
            type="date"
            value={pnlDateTo}
            onChange={(e) => setPnlDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 min-w-0"
            placeholder="По"
          />
          <input
            type="text"
            value={pnlTickerFilter}
            onChange={(e) => setPnlTickerFilter(e.target.value)}
            placeholder="Тикер / актив"
            className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 flex-1 min-w-[120px] max-w-[180px] sm:w-44"
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 text-slate-400 bg-white/5">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Тикер</th>
                <th className="px-3 py-2.5 text-left font-medium">Актив</th>
                <th className="px-3 py-2.5 text-right font-medium">Реализ. P&L</th>
                <th className="px-3 py-2.5 text-right font-medium">Доходность %</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {realizedBreakdown
                .sort((a, b) => Number(b.realized_pnl) - Number(a.realized_pnl))
                .map((r) => {
                  const pnl = Number(r.realized_pnl || 0);
                  const pct = Number(r.pnl_percent || 0);
                  const positive = pnl >= 0;
                  return (
                    <tr key={r.ticker} className="border-b border-white/5">
                      <td className="px-3 py-2.5 font-semibold text-[#0075EB]">{r.ticker}</td>
                      <td className="px-3 py-2.5">{r.asset_name}</td>
                      <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${positive ? 'text-accent' : 'text-red-400'}`}>
                        ${pnl.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium tabular-nums ${positive ? 'text-accent' : 'text-red-400'}`}>
                        {pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              {!realizedBreakdown.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-500 text-sm">
                    Нет закрытых сделок за выбранный период.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

