import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface AppContextValue {
  toasts: Toast[]
  pushToast: (title: string, description?: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function makeId() {
  return `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastTone = 'success') => {
      const id = makeId()
      setToasts((current) => [...current.slice(-2), { id, title, description, tone }])
      const timer = window.setTimeout(() => dismissToast(id), 4200)
      timers.current.set(id, timer)
    },
    [dismissToast],
  )

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
