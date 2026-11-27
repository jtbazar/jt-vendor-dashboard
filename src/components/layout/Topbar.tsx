import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
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
import { Avatar, IconButton } from '../ui'
import { useVendorAuth } from '../../context/VendorAuthContext'
import type { Notification } from '../../data/mock'

const notificationIcons: Record<Notification['kind'], LucideIcon> = {
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
  const ownerName = String(seller?.owner_full_name || user?.user_metadata?.full_name || user?.email || 'Vendor')
  const ownerRole = String(seller?.business_type || 'Seller').replaceAll('_', ' ')
  const ownerEmail = String(seller?.contact_email || user?.email || '')
  const storeIsOpen = seller?.shop_is_open === true
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    pushToast,
  } = useApp()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notificationRef = useOutsideClose(() => setNotificationsOpen(false))
  const profileRef = useOutsideClose(() => setProfileOpen(false))

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
                    onClick={markAllNotificationsRead}
                    disabled={!unreadCount}
                    className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-sage-700 transition hover:text-forest disabled:opacity-40"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.map((item) => {
                    const Icon = notificationIcons[item.kind]
                    return (
                      <div
                        key={item.id}
                        className={cx(
                          'flex gap-3 border-b border-[#F1EEE6] px-4 py-3 last:border-0',
                          item.unread ? 'bg-[#FBFAF4]' : 'bg-white',
                        )}
                      >
                        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-sage-100 text-sage-700">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold leading-snug text-ink">{item.title}</p>
                            {item.unread ? <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-clay" /> : null}
                          </div>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{item.detail}</p>
                          <p className="mt-1 text-[9px] font-medium text-[#A0A59A]">{item.time}</p>
                        </div>
                      </div>
                    )
                  })}
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
              <Avatar name={ownerName} size={32} />
              <span className="hidden text-left lg:block">
                <span className="block text-[10.5px] font-semibold leading-tight text-ink">{ownerName}</span>
                <span className="block text-[9px] leading-tight text-muted">{ownerRole}</span>
              </span>
              <ChevronDown size={13} className={cx('hidden text-[#8B9187] transition sm:block', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen ? (
              <div className="animate-rise absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-lift">
                <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
                  <p className="text-[11px] font-semibold text-ink">{ownerName}</p>
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
