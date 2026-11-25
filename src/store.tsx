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
import {
  coupons as seedCoupons,
  deals as seedDeals,
  menu as seedMenu,
  notifications as seedNotifications,
  orders as seedOrders,
  reviews as seedReviews,
  type Coupon,
  type Deal,
  type MenuItem,
  type Notification,
  type Order,
  type OrderStatus,
  type Review,
} from './data/mock'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type NewMenuItem = Omit<MenuItem, 'id' | 'soldToday' | 'rating' | 'tags'> & { tags?: string[] }

interface AppContextValue {
  storeOnline: boolean
  setStoreOnline: (value: boolean) => void
  orders: Order[]
  setOrderStatus: (id: string, status: OrderStatus) => void
  menu: MenuItem[]
  toggleMenuAvailability: (id: string) => void
  addMenuItem: (item: NewMenuItem) => void
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void
  deals: Deal[]
  toggleDeal: (id: string) => void
  addDeal: (deal: Omit<Deal, 'id' | 'uses' | 'revenue' | 'orders'>) => void
  coupons: Coupon[]
  toggleCoupon: (id: string) => void
  addCoupon: (coupon: Omit<Coupon, 'id' | 'uses'>) => void
  reviews: Review[]
  replyToReview: (id: string, reply: string) => void
  notifications: Notification[]
  unreadCount: number
  markAllNotificationsRead: () => void
  toasts: Toast[]
  pushToast: (title: string, description?: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [storeOnline, setStoreOnline] = useState(true)
  const [orders, setOrders] = useState<Order[]>(seedOrders)
  const [menu, setMenu] = useState<MenuItem[]>(seedMenu)
  const [deals, setDeals] = useState<Deal[]>(seedDeals)
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons)
  const [reviews, setReviews] = useState<Review[]>(seedReviews)
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications)
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
      const id = makeId('toast')
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

  const setOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)))
    },
    [],
  )

  const toggleMenuAvailability = useCallback((id: string) => {
    setMenu((current) =>
      current.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
    )
  }, [])

  const addMenuItem = useCallback((item: NewMenuItem) => {
    setMenu((current) => [
      {
        ...item,
        tags: item.tags ?? [],
        id: makeId('menu'),
        soldToday: 0,
        rating: 0,
      },
      ...current,
    ])
  }, [])

  const updateMenuItem = useCallback((id: string, patch: Partial<MenuItem>) => {
    setMenu((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const toggleDeal = useCallback((id: string) => {
    setDeals((current) =>
      current.map((deal) =>
        deal.id === id
          ? { ...deal, status: deal.status === 'active' ? 'scheduled' : 'active' }
          : deal,
      ),
    )
  }, [])

  const addDeal = useCallback((deal: Omit<Deal, 'id' | 'uses' | 'revenue' | 'orders'>) => {
    setDeals((current) => [
      { ...deal, id: makeId('deal'), uses: 0, revenue: 0, orders: 0 },
      ...current,
    ])
  }, [])

  const toggleCoupon = useCallback((id: string) => {
    setCoupons((current) =>
      current.map((coupon) => (coupon.id === id ? { ...coupon, active: !coupon.active } : coupon)),
    )
  }, [])

  const addCoupon = useCallback((coupon: Omit<Coupon, 'id' | 'uses'>) => {
    setCoupons((current) => [{ ...coupon, id: makeId('coupon'), uses: 0 }, ...current])
  }, [])

  const replyToReview = useCallback((id: string, reply: string) => {
    setReviews((current) =>
      current.map((review) => (review.id === id ? { ...review, replied: true, reply } : review)),
    )
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      storeOnline,
      setStoreOnline,
      orders,
      setOrderStatus,
      menu,
      toggleMenuAvailability,
      addMenuItem,
      updateMenuItem,
      deals,
      toggleDeal,
      addDeal,
      coupons,
      toggleCoupon,
      addCoupon,
      reviews,
      replyToReview,
      notifications,
      unreadCount,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      storeOnline,
      orders,
      setOrderStatus,
      menu,
      toggleMenuAvailability,
      addMenuItem,
      updateMenuItem,
      deals,
      toggleDeal,
      addDeal,
      coupons,
      toggleCoupon,
      addCoupon,
      reviews,
      replyToReview,
      notifications,
      unreadCount,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
