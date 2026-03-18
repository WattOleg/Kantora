export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  onConfirm,
  loading = false,
  danger = true
}) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm?.();
    /* Закрытие модалки выполняет родитель (setDeleteConfirm(null)) после успешного удаления */
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0e14] border border-white/10 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl border border-white/20 text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60 ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#0075EB] hover:bg-[#0066cc] text-white'
            }`}
          >
            {loading ? 'Удаляю…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
