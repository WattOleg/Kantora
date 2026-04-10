export function TransactionsTable({ transactions, onDelete, onEdit }) {
  const formatPrice = (value) => {
    const num = Number(value || 0);
    return num.toFixed(10).replace(/\.?0+$/, '');
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="sm:hidden divide-y divide-white/10">
        {transactions.map((t) => (
          <div key={t.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-[#0075EB]">{t.ticker}</div>
              <span className="inline-flex items-center rounded-lg px-2 py-0.5 bg-white/10 text-xs font-medium text-slate-300">
                {t.type}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate">{t.asset_name || '-'}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-400">Дата: <span className="text-slate-200">{t.date}</span></div>
              <div className="text-slate-400 text-right">Вал.: <span className="text-slate-200">{t.currency}</span></div>
              <div className="text-slate-400">Кол-во: <span className="text-slate-200">{t.quantity}</span></div>
              <div className="text-slate-400 text-right">Цена: <span className="text-slate-200">{formatPrice(t.price)}</span></div>
              <div className="text-slate-400">Сумма: <span className="text-slate-200">{Number(t.total || 0).toFixed(2)}</span></div>
              <div className="text-slate-400 text-right">Комиссия: <span className="text-slate-200">{Number(t.commission || 0).toFixed(2)}</span></div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center justify-end gap-3 pt-1">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(t)} className="text-xs font-medium text-[#0075EB] hover:underline">
                    Изменить
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(t)} className="text-xs font-medium text-red-400 hover:underline">
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!transactions.length && (
          <div className="px-3 py-6 text-center text-slate-500 text-sm">
            Сделок пока нет.
          </div>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-slate-400">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Дата</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Тип</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Актив</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Тикер</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Кол-во</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Цена</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Сумма</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Комиссия</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Вал.</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Заметки</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-300 text-sm">{t.date}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <span className="inline-flex items-center rounded-lg px-2 py-0.5 bg-white/10 text-xs font-medium text-slate-300">
                    {t.type}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-200">{t.asset_name}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#0075EB]">{t.ticker}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">{t.quantity}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                  {formatPrice(t.price)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                  {Number(t.total || 0).toFixed(2)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right tabular-nums">
                  {Number(t.commission || 0).toFixed(2)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-left">{t.currency}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 text-sm">{t.notes}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                  <span className="inline-flex gap-2 justify-end">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="text-sm font-medium text-[#0075EB] hover:underline"
                    >
                      Изменить
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(t)}
                      className="text-sm font-medium text-red-400 hover:underline"
                    >
                      Удалить
                    </button>
                  )}
                  </span>
                </td>
              </tr>
            ))}
            {!transactions.length && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 sm:px-4 py-6 text-center text-slate-500 text-sm"
                >
                  Сделок пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

