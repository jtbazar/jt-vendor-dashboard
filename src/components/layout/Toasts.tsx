import { X } from 'lucide-react'
import { useApp } from '../../store'
import { ToastIcon } from '../ui'

export function Toasts() {
  const { toasts, dismissToast } = useApp()

  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-rise flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-lift"
        >
          <span className="mt-0.5 flex-none">
            <ToastIcon tone={toast.tone} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold leading-snug text-ink">{toast.title}</p>
            {toast.description ? <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{toast.description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="grid h-5 w-5 flex-none place-items-center rounded text-[#A0A59A] transition hover:bg-[#F0EDE4] hover:text-ink"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
