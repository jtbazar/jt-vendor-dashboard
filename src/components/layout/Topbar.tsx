import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  LoaderCircle,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Settings,
  Star,
  Wallet,
  Boxes,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../../store'
import { cx } from '../../utils'
import { IconButton } from '../ui'
import { useVendorAuth } from '../../context/VendorAuthContext'
import { listVendorNotifications, markVendorNotificationsRead, type VendorNotification } from '../../services/marketplaceApi'

const notificationIcons: Record<string, LucideIcon> = {
  order: ReceiptText,
  stock: Boxes,
  review: Star,
  money: Wallet,
}

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return ref
}

function notificationTime(value: string | null) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`
  return date.toLocaleDateString()
}

export function Topbar({
  pageTitle,
  onMenu,
  onOpenSearch,
}: {
  pageTitle: string
  onMenu: () => void
  onOpenSearch: () => void
}) {
  const navigate = useNavigate()
  const { seller, user, signOut } = useVendorAuth()
  const shopName = String(seller?.shop_name || 'Your store')
  const shopInitials = shopName.slice(0, 2).toUpperCase()
  const shopRole = String(seller?.business_type || 'Seller')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const ownerEmail = String(seller?.contact_email || user?.email || '')
  const storeIsOpen = seller?.shop_is_open !== false
  const { pushToast } = useApp()
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [markingRead, setMarkingRead] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const closeNotifications = useCallback(() => setNotificationsOpen(false), [])
  const closeProfile = useCallback(() => setProfileOpen(false), [])
  const notificationRef = useOutsideClose(closeNotifications)
  const profileRef = useOutsideClose(closeProfile)

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      return
    }
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      setNotifications(await listVendorNotifications(user.id))
    } catch (cause) {
      setNotifications([])
      setNotificationsError(cause instanceof Error ? cause.message : 'Vendor notifications could not be loaded.')
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications])

  const markAllRead = async () => {
    if (!user?.id || !unreadCount || markingRead) return
    setMarkingRead(true)
    setNotificationsError('')
    try {
      await markVendorNotificationsRead(user.id)
      await loadNotifications()
    } catch (cause) {
      setNotificationsError(cause instanceof Error ? cause.message : 'Notifications could not be marked as read.')
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream-100/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <IconButton label="Open navigation" onClick={onMenu} className="lg:hidden">
          <Menu size={19} />
        </IconButton>

        <div className="hidden min-w-0 items-center gap-1.5 text-[11px] md:flex">
          <span className="font-medium text-muted">Vendor Center</span>
          <ChevronRight size={12} className="text-[#B4B7AD]" />
          <span className="truncate font-semibold text-forest">{pageTitle}</span>
        </div>
        <p className="truncate font-display text-[13px] font-semibold text-forest md:hidden">{pageTitle}</p>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 w-[230px] items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 text-[11px] text-[#8B9187] transition hover:border-[#D6D1C3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 sm:flex xl:w-[270px]"
          >
            <Search size={14} className="flex-none" />
            <span className="min-w-0 flex-1 truncate text-left">Search orders, products, pages…</span>
            <kbd className="rounded border border-line bg-cream-100 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-[#8B9187]">
              ⌘K
            </kbd>
          </button>
          <IconButton label="Search" onClick={onOpenSearch} className="sm:hidden">
            <Search size={18} />
          </IconButton>

          <div className="mx-1 hidden items-center gap-2 rounded-full border border-line bg-white/70 py-1.5 pl-3 pr-3 xl:flex">
            <span className={cx('h-1.5 w-1.5 rounded-full', storeIsOpen ? 'bg-sage-600' : 'bg-clay')} />
            <span className="text-[10px] font-semibold text-[#5C655A]">{storeIsOpen ? 'Store live' : 'Store closed'}</span>
          </div>

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              onClick={() => {
                setNotificationsOpen((value) => !value)
                setProfileOpen(false)
              }}
              className={cx(
                'relative grid h-9 w-9 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2',
                notificationsOpen
                  ? 'border-[#CFD6C8] bg-sage-100 text-forest'
                  : 'border-line bg-white/70 text-[#5E675C] hover:bg-white hover:text-forest',
              )}
            >
              <Bell size={16} />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-cream-100 bg-clay px-0.5 text-[8px] font-bold leading-none text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="animate-rise absolute right-0 top-11 z-50 w-[min(370px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
                <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <div>
                    <p className="font-display text-[13px] font-semibold text-forest">Notifications</p>
                    <p className="text-[9.5px] text-muted">{unreadCount ? `${unreadCount} unread updates` : 'You are all caught up'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    disabled={!unreadCount || markingRead}
                    className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-sage-700 transition hover:text-forest disabled:opacity-40"
                  >
                    {markingRead ? <LoaderCircle size={12} className="animate-spin" /> : <CheckCheck size={12} />} Mark all read
                  </button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notificationsError ? (
                    <div className="px-4 py-4 text-center">
                      <p className="text-[10px] text-red-700">{notificationsError}</p>
                      <button
                        type="button"
                        onClick={() => void loadNotifications()}
                        className="mt-2 text-[10px] font-semibold text-sage-700 underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notificationsLoading ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-[10px] text-muted">
                      <LoaderCircle size={14} className="animate-spin" /> Loading live notifications…
                    </div>
                  ) : notifications.length ? (
                    notifications.map((item) => {
                      const Icon = notificationIcons[String(item.kind ?? '')] ?? Bell
                      return (
                        <div
                          key={item.id}
                          className={cx(
                            'flex gap-3 border-b border-[#F1EEE6] px-4 py-3 last:border-0',
                            !item.read_at ? 'bg-[#FBFAF4]' : 'bg-white',
                          )}
                        >
                          <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-sage-100 text-sage-700">
                            <Icon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] font-semibold leading-snug text-ink">{item.title || 'Vendor update'}</p>
                              {!item.read_at ? <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-clay" /> : null}
                            </div>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{item.body || 'No details were provided.'}</p>
                            <p className="mt-1 text-[9px] font-medium text-[#A0A59A]">{notificationTime(item.created_at)}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <Bell size={20} className="mx-auto text-muted" />
                      <p className="mt-2 text-[10px] font-semibold text-ink">No vendor notifications yet</p>
                      <p className="mt-1 text-[9px] text-muted">Updates sent to your seller account will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-2 rounded-full border border-transparent p-0.5 transition hover:border-line hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 sm:pr-1.5"
              aria-label="Open account menu"
              aria-expanded={profileOpen}
            >
              <span className="grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-full bg-forest text-[10px] font-semibold text-cream-50">
                {seller?.shop_image_url ? (
                  <img src={String(seller.shop_image_url)} alt="" className="h-full w-full object-cover" />
                ) : (
                  shopInitials
                )}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block max-w-[150px] truncate text-[10.5px] font-semibold leading-tight text-ink">{shopName}</span>
                <span className="block text-[9px] leading-tight text-muted">{shopRole}</span>
              </span>
              <ChevronDown size={13} className={cx('hidden text-[#8B9187] transition sm:block', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen ? (
              <div className="animate-rise absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-lift">
                <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
                  <p className="text-[11px] font-semibold text-ink">{shopName}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{shopRole}</p>
                  <p className="truncate text-[9.5px] text-muted">{ownerEmail}</p>
                </div>
                <div className="grid gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-[#5C655A] transition hover:bg-cream-100 hover:text-forest"
                  >
                    <Settings size={14} /> Shop settings
                  </button>
                  <a
                    href="https://www.jt-bazar.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-[#5C655A] transition hover:bg-cream-100 hover:text-forest"
                  >
                    <ExternalLink size={14} /> View storefront
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/support')
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-[#5C655A] transition hover:bg-cream-100 hover:text-forest"
                  >
                    <LifeBuoy size={14} /> Help & support
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      void signOut().catch((cause) => pushToast('Sign out failed', cause instanceof Error ? cause.message : 'Please try again.', 'error'))
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-[#A14B38] transition hover:bg-[#F9EAE6]"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
