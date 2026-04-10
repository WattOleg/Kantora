export function DividendsTable({ dividends, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="sm:hidden divide-y divide-white/10">
        {dividends.map((d) => (
          <div key={d.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-[#0075EB]">{d.ticker}</div>
              <div className="text-xs text-slate-400">{d.date}</div>
            </div>
            <div className="text-xs text-slate-400 truncate">{d.asset_name || '-'}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-400">Сумма: <span className="text-slate-200">{Number(d.amount || 0).toFixed(2)}</span></div>
              <div className="text-slate-400 text-right">Налог: <span className="text-slate-200">{Number(d.tax || 0).toFixed(2)}</span></div>
              <div className="text-slate-400">Чистыми: <span className="text-slate-200">{Number(d.net_amount || 0).toFixed(2)}</span></div>
              <div className="text-slate-400 text-right">Вал.: <span className="text-slate-200">{d.currency}</span></div>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex items-center justify-end gap-3 pt-1">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(d)} className="text-xs font-medium text-[#0075EB] hover:underline">
                    Изменить
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(d)} className="text-xs font-medium text-red-400 hover:underline">
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!dividends.length && (
          <div className="px-3 py-6 text-center text-slate-500 text-sm">
            Дивидендов пока нет.
          </div>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-slate-400">
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Дата</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Тикер</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Актив</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Сумма</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Налог</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Чистыми</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-medium text-xs uppercase tracking-wider">Вал.</th>
              {(onEdit || onDelete) && (
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-medium text-xs uppercase tracking-wider">Действия</th>
              )}
            </tr>
          </thead>
          <tbody>
            {dividends.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-200">{d.date}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-[#0075EB]">{d.ticker}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-200">{d.asset_name}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 mono text-right">
                  {Number(d.amount || 0).toFixed(2)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 mono text-right">{Number(d.tax || 0).toFixed(2)}</td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 mono text-right">
                  {Number(d.net_amount || 0).toFixed(2)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 mono text-left">{d.currency}</td>
                {(onEdit || onDelete) && (
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                    <span className="inline-flex gap-2 justify-end">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(d)}
                          className="text-sm font-medium text-[#0075EB] hover:underline"
                        >
                          Изменить
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(d)}
                          className="text-sm font-medium text-red-400 hover:underline"
                        >
                          Удалить
                        </button>
                      )}
                    </span>
                  </td>
                )}
              </tr>
            ))}
            {!dividends.length && (
              <tr>
                <td
                  colSpan={onEdit || onDelete ? 8 : 7}
                  className="px-3 sm:px-4 py-6 text-center text-slate-500 text-sm"
                >
                  Дивидендов пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

