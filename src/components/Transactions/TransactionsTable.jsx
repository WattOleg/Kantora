export function TransactionsTable({ transactions, onDelete, onEdit }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
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
                  {Number(t.price || 0).toFixed(2)}
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

