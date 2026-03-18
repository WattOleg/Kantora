import { useState, useEffect } from 'react';
import { DEFAULT_CURRENCY } from '../../config';

const CURRENCIES = ['USD', 'EUR', 'KZT', 'RUB'];

const getDefaultForm = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    ticker: '',
    asset_name: '',
    amount: '',
    tax: '0',
    currency: DEFAULT_CURRENCY
  };
};

export function DividendModal({ open, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState(getDefaultForm);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        date: (initialData.date || '').toString().slice(0, 10) || new Date().toISOString().slice(0, 10),
        ticker: initialData.ticker || '',
        asset_name: initialData.asset_name || '',
        amount: String(initialData.amount ?? ''),
        tax: String(initialData.tax ?? '0'),
        currency: initialData.currency || DEFAULT_CURRENCY
      });
    } else {
      setForm(getDefaultForm());
    }
  }, [open, initialData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      ...(initialData?.id && { id: initialData.id }),
      date: form.date,
      ticker: (form.ticker || '').toUpperCase(),
      asset_name: form.asset_name || '',
      amount: Number(form.amount) || 0,
      tax: Number(form.tax) || 0,
      currency: form.currency
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0e14] border border-white/10 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? 'Редактировать дивиденд' : 'Добавить дивиденд'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            Esc
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Дата</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Валюта</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Тикер</label>
              <input
                type="text"
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Актив</label>
              <input
                type="text"
                value={form.asset_name}
                onChange={(e) => handleChange('asset_name', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Сумма (брутто)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Налог</label>
              <input
                type="number"
                step="0.01"
                value={form.tax}
                onChange={(e) => handleChange('tax', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-white/20 text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-[#0075EB] text-white text-sm font-semibold hover:bg-[#0066cc] disabled:opacity-60 transition-colors shadow-lg"
            >
              {loading ? 'Сохраняю…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
