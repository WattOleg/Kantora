import { useState, useEffect } from 'react';
import { DEFAULT_CURRENCY } from '../../config';

const TYPES = ['ПОКУПКА', 'ПРОДАЖА', 'ДИВИДЕНД', 'ДЕПОЗИТ', 'СНЯТИЕ'];

const TYPE_MAP_RU_TO_EN = {
  ПОКУПКА: 'BUY',
  ПРОДАЖА: 'SELL',
  ДИВИДЕНД: 'DIVIDEND',
  ДЕПОЗИТ: 'DEPOSIT',
  СНЯТИЕ: 'WITHDRAWAL'
};

const TYPE_MAP_EN_TO_RU = {
  BUY: 'ПОКУПКА',
  SELL: 'ПРОДАЖА',
  DIVIDEND: 'ДИВИДЕНД',
  DEPOSIT: 'ДЕПОЗИТ',
  WITHDRAWAL: 'СНЯТИЕ'
};

const CURRENCIES = ['USD', 'EUR', 'KZT', 'RUB'];
const PRICE_STEP = '0.0000000001';

function normalizeDecimalInput(value, maxFractionDigits = 10) {
  const next = String(value ?? '').replace(',', '.');
  if (next === '' || next === '-' || next === '.') return next;
  if (!/^-?\d*\.?\d*$/.test(next)) return '';
  const [intPart = '', fracPart = ''] = next.split('.');
  if (fracPart.length <= maxFractionDigits) return next;
  return `${intPart}.${fracPart.slice(0, maxFractionDigits)}`;
}

const getDefaultForm = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    type: 'ПОКУПКА',
    asset_name: '',
    ticker: '',
    quantity: '',
    price: '',
    commission: 0,
    currency: DEFAULT_CURRENCY,
    notes: ''
  };
};

export function AddTransactionModal({ open, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState(getDefaultForm);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      const date = (initialData.date || '').toString().slice(0, 10);
      setForm({
        date: date || new Date().toISOString().slice(0, 10),
        type: TYPE_MAP_EN_TO_RU[String(initialData.type || '').toUpperCase()] || 'ПОКУПКА',
        asset_name: initialData.asset_name || '',
        ticker: initialData.ticker || '',
        quantity: initialData.quantity ?? '',
        price: initialData.price ?? '',
        commission: initialData.commission ?? 0,
        currency: initialData.currency || DEFAULT_CURRENCY,
        notes: initialData.notes || ''
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
    const apiType = TYPE_MAP_RU_TO_EN[form.type] || form.type;
    onSubmit?.({
      ...form,
      type: apiType,
      ticker: (form.ticker || '').toUpperCase()
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0e14] border border-white/10 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? 'Редактировать сделку' : 'Новая операция'}
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
                className="w-full max-w-[240px] mx-auto sm:max-w-none sm:mx-0 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 text-center sm:text-left focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Тип операции</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Актив</label>
              <input
                type="text"
                value={form.asset_name}
                onChange={(e) => handleChange('asset_name', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Тикер</label>
              <input
                type="text"
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Количество</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Цена за единицу</label>
              <input
                type="number"
                value={form.price}
                step={PRICE_STEP}
                onChange={(e) => handleChange('price', normalizeDecimalInput(e.target.value))}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Комиссия</label>
              <input
                type="number"
                value={form.commission}
                onChange={(e) => handleChange('commission', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Валюта</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full min-w-0 bg-white/5 border border-white/10 rounded-2xl pl-3 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Заметки</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0075EB]/50 resize-none"
            />
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

