import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  MapPin,
  Phone,
  Printer,
  ReceiptText,
  Search,
  Store,
  Timer,
  Truck,
  XCircle,
} from 'lucide-react'
import { Avatar, Badge, Button, Card, Drawer, EmptyState, OrderStatusBadge } from '../components/ui'
import { useApp } from '../store'
import type { Fulfilment, Order, OrderStatus } from '../data/mock'
import { cx, formatMinutes, formatPKR } from '../utils'

const statusTabs: Array<{ key: 'all' | OrderStatus; label: string }> = [
  { key: 'all', label: 'All orders' },
  { key: 'new', label: 'New' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const fulfilmentIcons = {
  'JTBazar rider': Truck,
  'Own rider': Bike,
  Pickup: Store,
} as const

function FulfilmentChip({ mode }: { mode: Fulfilment }) {
  const Icon = fulfilmentIcons[mode]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] text-[#5C655A]">
      <Icon size={12} className="text-[#8B9684]" /> {mode}
    </span>
  )
}

function Timeline({ order }: { order: Order }) {
  const steps: Array<{ label: string; note: string; done: boolean; current: boolean }> = [
    { label: 'Order placed', note: `${formatMinutes(order.placedMinutes)} ago · COD`, done: true, current: order.status === 'new' },
    {
      label: 'Accepted by restaurant',
      note: order.status === 'new' ? 'Waiting for your acceptance' : order.status === 'accepted' ? 'Accepted · start prep when the kitchen is ready' : 'Confirmed in Vendor Center',
      done: order.status !== 'new' && order.status !== 'cancelled',
      current: order.status === 'accepted',
    },
    {
      label: 'Kitchen preparing',
      note: order.status === 'preparing' ? `Prep target ${order.prepTarget} minutes` : order.status === 'new' ? 'Not started' : 'Preparation finished',
      done: ['preparing', 'ready', 'completed'].includes(order.status),
      current: false,
    },
    {
      label: 'Ready for handover',
      note: order.status === 'ready' ? 'Rider or customer notified' : order.status === 'completed' ? 'Picked up' : 'Pending',
      done: ['ready', 'completed'].includes(order.status),
      current: order.status === 'ready',
    },
    {
      label: order.status === 'cancelled' ? 'Order cancelled' : 'Order completed',
      note: order.status === 'cancelled' ? 'Reason recorded against the order' : order.status === 'completed' ? 'COD collected and ledger updated' : 'Pending',
      done: ['completed', 'cancelled'].includes(order.status),
      current: false,
    },
  ]

  return (
    <ol className="mt-1">
      {steps.map((step, index) => (
        <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
          {index < steps.length - 1 ? (
            <span className={cx('absolute left-[9px] top-5 h-[calc(100%-0.5rem)] w-px', step.done ? 'bg-sage-300' : 'bg-line')} />
          ) : null}
          <span
            className={cx(
              'relative z-10 mt-0.5 grid h-[19px] w-[19px] flex-none place-items-center rounded-full border',
              step.done
                ? order.status === 'cancelled' && index === steps.length - 1
                  ? 'border-[#E7C4BB] bg-[#FBEDE9] text-danger'
                  : 'border-sage-300 bg-sage-100 text-sage-700'
                : 'border-[#DDD8CB] bg-white text-[#B3B7AC]',
            )}
          >
            {step.done ? (
              order.status === 'cancelled' && index === steps.length - 1 ? <XCircle size={10} /> : <CheckCircle2 size={11} />
            ) : (
              <span className="h-1 w-1 rounded-full bg-current" />
            )}
          </span>
          <div className="min-w-0">
            <p className={cx('text-[10.5px] font-semibold', step.done ? 'text-ink' : 'text-[#8B9187]')}>{step.label}</p>
            <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{step.note}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function OrdersPage() {
  const { orders, setOrderStatus, pushToast } = useApp()
  const [tab, setTab] = useState<'all' | OrderStatus>('all')
  const [search, setSearch] = useState('')
  const [fulfilment, setFulfilment] = useState<'all' | Fulfilment>('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'total'>('newest')
  const [lateOnly, setLateOnly] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)

  const counts = useMemo(() => {
    const base: Record<'all' | OrderStatus, number> = {
      all: orders.length,
      new: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    }
    orders.forEach((order) => {
      base[order.status] += 1
    })
    return base
  }, [orders])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return orders
      .filter((order) => (tab === 'all' ? true : order.status === tab))
      .filter((order) => (fulfilment === 'all' ? true : order.fulfilment === fulfilment))
      .filter((order) =>
        needle
          ? order.id.toLowerCase().includes(needle) ||
            order.customer.toLowerCase().includes(needle) ||
            order.area.toLowerCase().includes(needle) ||
            order.items.some((item) => item.name.toLowerCase().includes(needle))
          : true,
      )
      .filter((order) =>
        lateOnly
          ? ['new', 'accepted', 'preparing', 'ready'].includes(order.status) && order.placedMinutes > order.prepTarget
          : true,
      )
      .sort((a, b) => {
        if (sort === 'total') return b.total - a.total
        if (sort === 'oldest') return b.placedMinutes - a.placedMinutes
        return a.placedMinutes - b.placedMinutes
      })
  }, [orders, tab, search, fulfilment, sort, lateOnly])

  useEffect(() => {
    setConfirmReject(false)
  }, [selected?.id])

  useEffect(() => {
    if (!selected) return
    const fresh = orders.find((order) => order.id === selected.id)
    if (fresh && fresh !== selected) setSelected(fresh)
  }, [orders, selected])

  const advance = (order: Order) => {
    if (order.status === 'new') {
      setOrderStatus(order.id, 'accepted')
      pushToast(`${order.id} accepted`, 'Order accepted. Start preparation when the kitchen is ready.', 'success')
    } else if (order.status === 'accepted') {
      setOrderStatus(order.id, 'preparing')
      pushToast(`${order.id} in the kitchen`, 'Preparation started and the prep timer is running.', 'success')
    } else if (order.status === 'preparing') {
      setOrderStatus(order.id, 'ready')
      pushToast(`${order.id} is ready`, 'Rider and customer have been notified.', 'success')
    } else if (order.status === 'ready') {
      setOrderStatus(order.id, 'completed')
      pushToast(`${order.id} completed`, 'COD collection recorded in the commission ledger.', 'success')
    }
  }

  const reject = (order: Order) => {
    if (!confirmReject) {
      setConfirmReject(true)
      return
    }
    setOrderStatus(order.id, 'cancelled')
    setConfirmReject(false)
    pushToast(`${order.id} cancelled`, 'The customer will be notified and any COD hold released.', 'warning')
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-sage-700">
            <ReceiptText size={12} /> Orders &amp; fulfilment
          </div>
          <h1 className="font-display text-[clamp(1.7rem,2.6vw,2.3rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-forest">
            Every order, one queue.
          </h1>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
            Accept new orders, move tickets through the kitchen and hand over to the rider. All status changes update the customer app instantly.
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => pushToast('Shift report', 'Printing is available in the live Vendor Center.', 'info')}>
            <Printer size={14} /> Print shift report
          </Button>
          <Link to="/kitchen">
            <Button variant="primary">
              Kitchen board <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {statusTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cx(
              'inline-flex flex-none items-center gap-2 rounded-full border px-3.5 py-2 text-[10.5px] font-semibold transition',
              tab === item.key
                ? 'border-forest bg-forest text-cream-50 shadow-[0_6px_16px_rgba(36,59,42,0.16)]'
                : 'border-line bg-white text-[#62695F] hover:border-[#D6D1C3] hover:text-forest',
            )}
          >
            {item.label}
            <span className={cx('rounded-full px-1.5 py-0.5 text-[8.5px] font-bold tabular', tab === item.key ? 'bg-white/15 text-cream-50' : 'bg-cream-100 text-[#8B9187]')}>
              {counts[item.key]}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2.5 border-b border-[#F0EDE4] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-[330px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, area or item…"
              className="h-9 w-full rounded-lg border border-line bg-[#FBFAF5] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLateOnly((value) => !value)}
              className={cx(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-semibold transition',
                lateOnly ? 'border-[#E7C4BB] bg-[#FBEDE9] text-[#A14B38]' : 'border-line bg-white text-[#62695F] hover:text-forest',
              )}
            >
              <Timer size={12} /> Late only
            </button>
            <select
              value={fulfilment}
              onChange={(event) => setFulfilment(event.target.value as 'all' | Fulfilment)}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Filter by fulfilment"
            >
              <option value="all">All fulfilment</option>
              <option value="JTBazar rider">JTBazar rider</option>
              <option value="Own rider">Own rider</option>
              <option value="Pickup">Pickup</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'newest' | 'oldest' | 'total')}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Sort orders"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="total">Highest value</option>
            </select>
            <button
              type="button"
              onClick={() => pushToast('Export started', 'A CSV of the current filtered orders would download here.', 'info')}
              className="inline-grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-[#62695F] transition hover:text-forest"
              aria-label="Export orders"
              title="Export orders"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={20} />}
            title="No orders match these filters"
            description="Try clearing the search or switching back to all orders."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setSearch('')
                  setTab('all')
                  setFulfilment('all')
                  setLateOnly(false)
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                    {['Order', 'Customer', 'Items', 'Fulfilment', 'Total', 'Status', ''].map((heading, index) => (
                      <th key={`${heading}-${index}`} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const late = ['new', 'accepted', 'preparing', 'ready'].includes(order.status) && order.placedMinutes > order.prepTarget
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelected(order)}
                        className="group cursor-pointer border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <p className="text-[11px] font-semibold text-ink">{order.id}</p>
                          <p className={cx('mt-0.5 inline-flex items-center gap-1 text-[9px]', late ? 'font-semibold text-[#A14B38]' : 'text-muted')}>
                            <Clock3 size={9} /> {formatMinutes(order.placedMinutes)} ago {late ? '· late' : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={order.customer} size={28} />
                            <div className="min-w-0">
                              <p className="truncate text-[10.5px] font-medium text-ink">{order.customer}</p>
                              <p className="truncate text-[9px] text-muted">{order.area}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[210px] px-3 py-3.5">
                          <p className="truncate text-[10px] text-[#5C655A]">{order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}</p>
                          <p className="mt-0.5 text-[9px] text-muted">{order.items.reduce((sum, item) => sum + item.qty, 0)} items · {order.payment}</p>
                        </td>
                        <td className="px-3 py-3.5"><FulfilmentChip mode={order.fulfilment} /></td>
                        <td className="px-3 py-3.5">
                          <p className="text-[10.5px] font-semibold text-forest tabular">{formatPKR(order.total)}</p>
                          <p className="mt-0.5 text-[9px] text-muted">{order.payment}</p>
                        </td>
                        <td className="px-3 py-3.5"><OrderStatusBadge status={order.status} /></td>
                        <td className="py-3.5 pl-3 pr-5">
                          <span className="grid h-7 w-7 place-items-center rounded-full text-[#B0B4A9] transition group-hover:bg-white group-hover:text-forest">
                            <ChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#F3F0E8] md:hidden">
              {filtered.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelected(order)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[#FBFAF5]"
                >
                  <Avatar name={order.customer} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-ink">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-[10.5px] text-[#5C655A]">{order.customer} · {order.area}</p>
                    <p className="mt-0.5 truncate text-[9.5px] text-muted">
                      {order.items[0]?.name} · {order.fulfilment} · {formatMinutes(order.placedMinutes)} ago
                    </p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    <span className="text-[10.5px] font-semibold text-forest tabular">{formatPKR(order.total)}</span>
                    <ChevronRight size={14} className="text-[#B0B4A9]" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
          <span>Showing {filtered.length} of {orders.length} orders in this prototype</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sage-600" /> Live status sync</span>
        </div>
      </Card>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.id}` : 'Order'}
        subtitle={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={selected.status} />
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Clock3 size={10} /> {formatMinutes(selected.placedMinutes)} ago</span>
              <span>·</span>
              <FulfilmentChip mode={selected.fulfilment} />
            </div>
          ) : null
        }
        footer={
          selected ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => pushToast('Kitchen slip', `Slip for ${selected.id} sent to the printer.`, 'info')}
              >
                <Printer size={13} /> Print slip
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {['new', 'accepted', 'preparing'].includes(selected.status) ? (
                  <Button size="sm" variant="danger" onClick={() => reject(selected)}>
                    {confirmReject ? 'Confirm reject' : 'Reject'}
                  </Button>
                ) : null}
                {['new', 'accepted', 'preparing', 'ready'].includes(selected.status) ? (
                  <Button size="sm" variant="primary" onClick={() => advance(selected)}>
                    {selected.status === 'new'
                      ? 'Accept order'
                      : selected.status === 'accepted'
                        ? 'Start preparing'
                        : selected.status === 'preparing'
                          ? 'Mark ready'
                          : 'Complete handover'}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-white p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={selected.customer} size={38} />
                  <div>
                    <p className="text-[12px] font-semibold text-ink">{selected.customer}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[9.5px] text-muted"><Phone size={9} /> {selected.phone}</p>
                  </div>
                </div>
                <Badge tone="amber">
                  <Banknote size={10} /> {selected.payment}
                </Badge>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#FBFAF5] px-2.5 py-2 text-[10px] leading-relaxed text-[#5C655A]">
                <MapPin size={12} className="mt-0.5 flex-none text-[#8B9684]" />
                <span>{selected.address}</span>
              </div>
              {selected.note ? (
                <div className="mt-2 rounded-lg border border-[#F0E2C8] bg-[#FCF7EC] px-2.5 py-2 text-[10px] leading-relaxed text-[#8A6420]">
                  <strong className="font-semibold">Customer note:</strong> {selected.note}
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Order items</h3>
                <span className="text-[9px] text-muted">{selected.items.reduce((sum, item) => sum + item.qty, 0)} items</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                {selected.items.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-3 border-b border-[#F3F0E8] px-3.5 py-2.5 last:border-0">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="grid h-5 min-w-5 flex-none place-items-center rounded-md bg-cream-100 text-[9px] font-bold text-forest">
                        {item.qty}×
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium text-ink">{item.name}</p>
                        <p className="mt-0.5 text-[9px] text-muted">{formatPKR(item.price)} each</p>
                      </div>
                    </div>
                    <span className="flex-none text-[10.5px] font-semibold text-forest tabular">{formatPKR(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-3.5 text-[10px]">
              <div className="flex justify-between py-1 text-muted"><span>Subtotal</span><span className="text-ink tabular">{formatPKR(selected.subtotal)}</span></div>
              <div className="flex justify-between py-1 text-muted"><span>Delivery fee</span><span className="text-ink tabular">{selected.deliveryFee ? formatPKR(selected.deliveryFee) : 'Free'}</span></div>
              <div className="mt-1.5 flex justify-between border-t border-line pt-2 text-[11px] font-semibold text-forest"><span>Total · COD</span><span className="tabular">{formatPKR(selected.total)}</span></div>
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-[#FBFAF5] px-2.5 py-2 text-[9px] text-muted">
                <span>Fulfilment</span>
                <span className="font-semibold text-ink">{selected.fulfilment}{selected.rider ? ` · ${selected.rider}` : ''}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Order timeline</h3>
              <Timeline order={selected} />
            </div>

            <div className="rounded-xl bg-forest p-3.5 text-cream-50">
              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-sage-300">Commission preview</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[18px] font-semibold leading-none tabular">{formatPKR(selected.subtotal * 0.1)}</p>
                  <p className="mt-1 text-[9px] text-cream-200/60">10% of food subtotal</p>
                </div>
                <p className="text-right text-[9px] leading-relaxed text-cream-200/60">
                  Net after commission<br />
                  <span className="font-semibold text-cream-50">{formatPKR(selected.subtotal * 0.9)}</span>
                </p>
              </div>
              <p className="mt-3 border-t border-white/10 pt-2 text-[8.5px] leading-relaxed text-cream-200/60">
                {selected.fulfilment === 'JTBazar rider'
                  ? 'JTBazar rider collects COD. Commission and delivery fee are deducted before your net payable is settled.'
                  : selected.fulfilment === 'Own rider'
                    ? 'Your JTBazar-approved driver collects COD. Keep the cash and settle JTBazar commission weekly.'
                    : 'Customer pays at pickup. Keep the cash and settle JTBazar commission weekly.'}
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
