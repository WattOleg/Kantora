import { useMemo, useState } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import { addTransaction, addDividend, deleteTransaction, updatePortfolioPrice, updateTransaction, updateDividend, deleteDividend } from './api/sheets';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PortfolioTable } from './components/Portfolio/PortfolioTable';
import { TransactionsTable } from './components/Transactions/TransactionsTable';
import { DividendsTable } from './components/Dividends/DividendsTable';
import { AddTransactionModal } from './components/Transactions/AddTransactionModal';
import { DividendModal } from './components/Dividends/DividendModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ToastProvider, useToast } from './components/common/ToastContext';

function AppShell() {
  const { portfolio, summary, transactions, dividends, loading, error, refresh, refreshPricesNow, priceSyncing, lastPriceSync } = usePortfolio();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [dividendModalOpen, setDividendModalOpen] = useState(false);
  const [editingDividend, setEditingDividend] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');

  const filteredTransactions = useMemo(() => {
    let list = transactions || [];
    if (txTypeFilter !== 'ALL') {
      list = list.filter((t) => t.type === txTypeFilter);
    }
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.ticker || '').toLowerCase().includes(q) ||
          (t.asset_name || '').toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, txSearch, txTypeFilter]);

  const handleAddTransaction = async (payload) => {
    setSaving(true);
    try {
      if (editingTx) {
        await updateTransaction({
          id: editingTx.id,
          date: payload.date,
          type: payload.type,
          asset_name: payload.asset_name,
          ticker: (payload.ticker || '').toUpperCase(),
          quantity: payload.quantity,
          price: payload.price,
          commission: payload.commission ?? 0,
          currency: payload.currency,
          notes: payload.notes
        });
        addToast('Сделка обновлена');
      } else if (payload.type === 'DIVIDEND') {
        await addDividend({
          date: payload.date,
          ticker: (payload.ticker || '').toUpperCase(),
          asset_name: payload.asset_name || '',
          amount: Number(payload.quantity) || 0,
          tax: Number(payload.commission) || 0,
          currency: payload.currency || 'USD'
        });
        addToast('Успешно сохранено');
      } else {
        await addTransaction(payload);
        addToast('Успешно сохранено');
      }
      setModalOpen(false);
      setEditingTx(null);
      await refresh();
    } catch (e) {
      addToast(e.message || 'Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePriceInline = async (row, newPrice) => {
    try {
      await updatePortfolioPrice(row.ticker, newPrice);
      addToast('Цена обновлена');
      await refresh();
    } catch (e) {
      addToast(e.message || 'Ошибка обновления цены', 'error');
    }
  };

  const handleDeleteTransaction = async (tx) => {
    try {
      await deleteTransaction(tx.id);
      addToast('Сделка удалена');
      await refresh();
    } catch (e) {
      addToast(e.message || 'Не удалось удалить сделку', 'error');
    }
  };

  const handleDividendSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingDividend?.id) {
        await updateDividend({
          id: editingDividend.id,
          date: payload.date,
          ticker: (payload.ticker || '').toUpperCase(),
          asset_name: payload.asset_name || '',
          amount: payload.amount,
          tax: payload.tax,
          currency: payload.currency
        });
        addToast('Дивиденд обновлён');
      } else {
        await addDividend(payload);
        addToast('Дивиденд добавлен');
      }
      setDividendModalOpen(false);
      setEditingDividend(null);
      await refresh();
    } catch (e) {
      addToast(e.message || 'Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDividend = async (d) => {
    try {
      await deleteDividend(d.id);
      addToast('Дивиденд удалён');
      await refresh();
    } catch (e) {
      addToast(e.message || 'Не удалось удалить', 'error');
    }
  };

  const handleRefreshPrices = async () => {
    try {
      const result = await refreshPricesNow();
      const updated = Number(result?.updated || 0);
      addToast(`Цены обновлены: ${updated} тикеров`);
    } catch (e) {
      addToast(e.message || 'Не удалось обновить цены', 'error');
    }
  };

  const lastSyncText = lastPriceSync
    ? `Обновлено ${lastPriceSync.updated} | Yahoo ${lastPriceSync.yahoo} | Stooq ${lastPriceSync.stooq}${lastPriceSync.missing ? ` | Без цены ${lastPriceSync.missing}` : ''}`
    : '';

  return (
    <div className="min-h-screen text-slate-100 flex flex-col bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,#1a2332_0%,#0f1419_45%,#0a0e14_100%)]">
      <header className="bg-[#0a0e14]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto safe-px py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg">
              <img src="/logo-Kantora.png" alt="Kantora" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">Kantora</span>
          </div>
          <nav className="flex gap-0.5 p-1 rounded-2xl bg-white/[0.06] w-full sm:w-auto min-w-0">
            <button
              className={`flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#0075EB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              Дашборд
            </button>
            <button
              className={`flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-[#0075EB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('transactions')}
            >
              Сделки
            </button>
            <button
              className={`flex-1 sm:flex-initial px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dividends'
                  ? 'bg-[#0075EB] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('dividends')}
            >
              Дивиденды
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto safe-px py-4 space-y-4 sm:space-y-5">
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {!loading && activeTab === 'dashboard' && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs sm:text-sm text-slate-300">
                {lastSyncText || 'Нажмите "Обновить цены", чтобы подтянуть актуальные котировки'}
              </div>
              <button
                type="button"
                onClick={handleRefreshPrices}
                disabled={priceSyncing}
                className="px-4 py-2 rounded-xl bg-[#0075EB] text-white text-xs sm:text-sm font-semibold hover:bg-[#0066cc] disabled:opacity-60 transition-colors w-full sm:w-auto"
              >
                {priceSyncing ? 'Обновляю цены…' : 'Обновить цены'}
              </button>
            </div>
          )}

          {loading && (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 p-5 animate-pulse"
                >
                  <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                  <div className="h-7 w-28 bg-white/15 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'dashboard' && (
            <Dashboard
              summary={summary}
              portfolio={portfolio}
              transactions={transactions}
              onUpdatePrice={handleUpdatePriceInline}
              PortfolioTableComponent={PortfolioTable}
            />
          )}

          {!loading && activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                    Сделки
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Поиск"
                      className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 flex-1 min-w-[120px] max-w-[200px] sm:max-w-none sm:w-48"
                    />
                    <select
                      value={txTypeFilter}
                      onChange={(e) => setTxTypeFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl pl-3 pr-10 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
                    >
                      <option value="ALL">Все типы</option>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="DIVIDEND">DIVIDEND</option>
                      <option value="DEPOSIT">DEPOSIT</option>
                      <option value="WITHDRAWAL">WITHDRAWAL</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingTx(null); setModalOpen(true); }}
                  className="px-5 py-2.5 rounded-2xl bg-[#0075EB] text-white text-sm font-semibold hover:bg-[#0066cc] transition-colors shadow-lg w-full sm:w-auto"
                >
                  + Новая операция
                </button>
              </div>
              <TransactionsTable
                transactions={filteredTransactions}
                onDelete={(tx) => setDeleteConfirm({ type: 'transaction', item: tx })}
                onEdit={(tx) => { setEditingTx(tx); setModalOpen(true); }}
              />
            </div>
          )}

          {!loading && activeTab === 'dividends' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h2 className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                  Dividends
                </h2>
                <button
                  onClick={() => { setEditingDividend(null); setDividendModalOpen(true); }}
                  className="px-5 py-2.5 rounded-2xl bg-[#0075EB] text-white text-sm font-semibold hover:bg-[#0066cc] transition-colors shadow-lg w-full sm:w-auto"
                >
                  + Добавить дивиденд
                </button>
              </div>
              <DividendsTable
                dividends={dividends}
                onEdit={(d) => { setEditingDividend(d); setDividendModalOpen(true); }}
                onDelete={(d) => setDeleteConfirm({ type: 'dividend', item: d })}
              />
            </div>
          )}
        </div>
      </main>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTx(null); }}
        onSubmit={handleAddTransaction}
        initialData={editingTx}
        loading={saving}
      />
      <DividendModal
        open={dividendModalOpen}
        onClose={() => { setDividendModalOpen(false); setEditingDividend(null); }}
        onSubmit={handleDividendSubmit}
        initialData={editingDividend}
        loading={saving}
      />
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.type === 'dividend' ? 'Удалить дивиденд?' : 'Удалить сделку?'}
        message={deleteConfirm?.type === 'dividend'
          ? 'Запись о дивиденде будет удалена без возможности восстановления.'
          : 'Сделка будет удалена без возможности восстановления. Пересчитаются портфель и сводка.'}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          setDeleting(true);
          try {
            if (deleteConfirm.type === 'transaction') await handleDeleteTransaction(deleteConfirm.item);
            else if (deleteConfirm.type === 'dividend') await handleDeleteDividend(deleteConfirm.item);
            setDeleteConfirm(null);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

