// Average cost method for a list of BUY transactions
export function calcAvgPrice(transactions) {
  const buys = transactions.filter((t) => t.type === 'BUY');
  if (!buys.length) return 0;
  const { totalCost, totalQty } = buys.reduce(
    (acc, t) => {
      const qty = Number(t.quantity) || 0;
      const price = Number(t.price) || 0;
      return {
        totalCost: acc.totalCost += qty * price,
        totalQty: acc.totalQty += qty
      };
    },
    { totalCost: 0, totalQty: 0 }
  );
  if (!totalQty) return 0;
  return totalCost / totalQty;
}

export function calcUnrealizedPnL(avgPrice, currentPrice, quantity) {
  return (Number(currentPrice) - Number(avgPrice)) * Number(quantity || 0);
}

export function calcRealizedPnL(sellPrice, avgPrice, qty, commission) {
  return (Number(sellPrice) - Number(avgPrice)) * Number(qty || 0) - Number(commission || 0);
}

export function calcTotalReturn(currentValue, invested, commissions, dividends) {
  const investedNum = Number(invested) || 0;
  if (!investedNum) return 0;
  const current = Number(currentValue) || 0;
  const comm = Number(commissions) || 0;
  const div = Number(dividends) || 0;
  return ((current - investedNum - comm + div) / investedNum) * 100;
}

/**
 * Нормализует дату к YYYY-MM-DD для сравнения.
 * Поддерживает: ISO (2026-03-16T...), YYYY-MM-DD, DD.MM.YYYY, Date.
 */
function parseDateToYYYYMMDD(val) {
  if (val == null || val === '') return '';
  const s = String(val).trim();
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const dmY = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dmY) {
    const [, d, m, y] = dmY;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const date = new Date(s);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return '';
}

/**
 * Реализованный P&L по тикерам из списка сделок (BUY/SELL).
 * Период dateFrom/dateTo (YYYY-MM-DD) задаёт, по каким ПРОДАЖАМ считать реализацию;
 * средняя цена покупки считается по всем покупкам (без фильтра по дате).
 */
export function realizedPnLByTicker(transactions, dateFrom = '', dateTo = '') {
  const inRange = (dateStr) => {
    const d = parseDateToYYYYMMDD(dateStr);
    if (!d) return true;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const tx = (transactions || []).filter((t) => t.type === 'BUY' || t.type === 'SELL');

  const byTicker = {};
  tx.forEach((t) => {
    const ticker = (t.ticker || '').toUpperCase();
    if (!ticker) return;
    if (!byTicker[ticker]) {
      byTicker[ticker] = { ticker, asset_name: t.asset_name || '', buys: [], sells: [] };
    }
    const qty = Number(t.quantity) || 0;
    const price = Number(t.price) || 0;
    const commission = Number(t.commission) || 0;
    const date = t.date;
    if (t.type === 'BUY') {
      byTicker[ticker].buys.push({ qty, price, commission, date });
    } else {
      byTicker[ticker].sells.push({ qty, price, commission, date });
    }
  });

  return Object.keys(byTicker).map((ticker) => {
    const pos = byTicker[ticker];
    let totalQty = 0;
    let totalCost = 0;
    pos.buys.forEach((b) => {
      totalQty += b.qty;
      totalCost += b.qty * b.price + b.commission;
    });
    const avgPrice = totalQty ? totalCost / totalQty : 0;
    let realized = 0;
    pos.sells.forEach((s) => {
      if (s.qty <= 0) return;
      const inPeriod = !dateFrom && !dateTo ? true : inRange(s.date);
      if (inPeriod) {
        realized += (s.price - avgPrice) * s.qty - s.commission;
      }
    });
    const totalBuyCost = pos.buys.reduce((sum, b) => sum + b.qty * b.price, 0);
    const pnlPercent = totalBuyCost ? (realized / totalBuyCost) * 100 : 0;
    return {
      ticker: pos.ticker,
      asset_name: pos.asset_name,
      realized_pnl: realized,
      total_buy_cost: totalBuyCost,
      pnl_percent: pnlPercent
    };
  });
}

