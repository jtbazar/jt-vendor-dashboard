import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bike,
  ChefHat,
  CheckCircle2,
  Clock3,
  Flame,
  Printer,
  Store,
  Timer,
  TriangleAlert,
  Truck,
  UtensilsCrossed,
} from 'lucide-react'
import { Button, Card, Toggle } from '../components/ui'
import { useApp } from '../store'
import { useNow } from '../hooks'
import type { Order } from '../data/mock'
import { cx, formatMinutes, formatPKR } from '../utils'

const fulfilmentIcons = {
  'JTBazar rider': Truck,
  'Own rider': Bike,
  Pickup: Store,
} as const

function ticketTimer(minutes: number, seconds: number) {
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function KitchenTicket({
  order,
  elapsed,
  seconds,
  onAdvance,
  onReject,
  onPrint,
  confirmReject,
}: {
  order: Order
  elapsed: number
  seconds: number
  onAdvance: () => void
  onReject: () => void
  onPrint: () => void
  confirmReject: boolean
}) {
  const Icon = fulfilmentIcons[order.fulfilment]
  const late = elapsed > order.prepTarget
  const ratio = Math.min(100, (elapsed / order.prepTarget) * 100)
  const itemsCount = order.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <article
      className={cx(
        'animate-rise rounded-xl border border-line bg-white p-3.5 shadow-card',
        order.status === 'new'
          ? 'border-t-[3px] border-t-clay'
          : order.status === 'accepted'
            ? 'border-t-[3px] border-t-forest'
            : order.status === 'preparing'
              ? 'border-t-[3px] border-t-[#C08A2A]'
              : 'border-t-[3px] border-t-sage-600',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-[13px] font-semibold tracking-[-0.02em] text-ink">{order.id}</p>
            {late ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEDE9] px-1.5 py-0.5 text-[8px] font-bold text-[#A14B38]">
                <TriangleAlert size={8} /> Late
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[9px] text-muted">{order.customer} · {order.area}</p>
        </div>
        <span
          className={cx(
            'flex-none rounded-lg px-2 py-1 font-display text-[11px] font-semibold tabular',
            late ? 'bg-[#FBEDE9] text-[#A14B38]' : order.status === 'ready' ? 'bg-sage-100 text-sage-700' : 'bg-[#FBF3E1] text-[#8E6218]',
          )}
        >
          {ticketTimer(elapsed, seconds)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1E8] px-2 py-0.5 text-[8.5px] font-medium text-[#5C655A]">
          <Icon size={9} /> {order.fulfilment}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F1E8] px-2 py-0.5 text-[8.5px] font-medium text-[#5C655A]">
          {itemsCount} items · {order.payment}
        </span>
        {order.rider ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[8.5px] font-medium text-sage-700">
            {order.rider}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1.5 border-t border-dashed border-[#E7E3D8] pt-2.5">
        {order.items.map((item) => (
          <div key={item.name} className="flex items-baseline gap-2 text-[10px]">
            <span className="grid h-[18px] min-w-[18px] flex-none place-items-center rounded bg-cream-100 px-1 text-[8.5px] font-bold text-forest">
              {item.qty}×
            </span>
            <span className="min-w-0 flex-1 leading-snug text-[#4F584D]">{item.name}</span>
          </div>
        ))}
      </div>

      {order.note ? (
        <p className="mt-2.5 rounded-md border border-[#F0E2C8] bg-[#FCF7EC] px-2 py-1.5 text-[9px] leading-relaxed text-[#8A6420]">
          <strong className="font-semibold">Note:</strong> {order.note}
        </p>
      ) : null}

      {order.status === 'preparing' ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[8px] text-muted">
            <span>Prep target {order.prepTarget}m</span>
            <span>{Math.round(ratio)}%</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#F0EDE4]">
            <div className={cx('h-full rounded-full', late ? 'bg-danger' : 'bg-[#C08A2A]')} style={{ width: `${ratio}%` }} />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F0EDE4] pt-2.5">
        <div>
          <p className="text-[11px] font-semibold text-forest tabular">{formatPKR(order.total)}</p>
          <p className="text-[8px] text-muted">{order.status === 'ready' ? 'Awaiting handover' : order.status === 'preparing' ? 'In the kitchen' : order.status === 'accepted' ? 'Accepted · ready to start' : 'Needs acceptance'}</p>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            onClick={onPrint}
            aria-label={`Print ticket ${order.id}`}
            title="Print ticket"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-[#8B9187] transition hover:text-forest"
          >
            <Printer size={12} />
          </button>
          {order.status === 'new' || order.status === 'accepted' ? (
            <>
              <Button size="sm" variant="ghost" className="text-[#A14B38] hover:bg-[#F9EAE6]" onClick={onReject}>
                {confirmReject ? 'Confirm' : 'Reject'}
              </Button>
              <Button size="sm" variant="primary" onClick={onAdvance}>
                {order.status === 'new' ? 'Accept' : 'Start prep'}
              </Button>
            </>
          ) : order.status === 'preparing' ? (
            <Button size="sm" variant="primary" onClick={onAdvance}>
              Mark ready
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={onAdvance}>
              Handover
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function Column({
  title,
  subtitle,
  orders,
  tone,
  emptyText,
  renderTicket,
}: {
  title: string
  subtitle: string
  orders: Order[]
  tone: 'clay' | 'forest' | 'amber' | 'sage'
  emptyText: string
  renderTicket: (order: Order) => React.ReactNode
}) {
  const toneClasses = {
    clay: 'bg-clay',
    forest: 'bg-forest',
    amber: 'bg-[#C08A2A]',
    sage: 'bg-sage-600',
  }
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-[#F1EEE5]/70 p-2.5">
      <header className="flex items-center justify-between gap-2 px-1.5 pb-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span className={cx('h-2 w-2 rounded-full', toneClasses[tone])} />
          <div>
            <h2 className="font-display text-[12.5px] font-semibold text-forest">{title}</h2>
            <p className="text-[8.5px] text-muted">{subtitle}</p>
          </div>
        </div>
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-[9px] font-bold text-forest tabular">
          {orders.length}
        </span>
      </header>
      <div className="grid gap-2.5">
        {orders.length ? orders.map((order) => renderTicket(order)) : (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#DDD8CB] bg-white/50 px-4 py-9 text-center">
            <UtensilsCrossed size={17} className="text-[#B0B4A9]" />
            <p className="text-[10px] font-medium text-[#8B9187]">{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export function KitchenPage() {
  const { orders, setOrderStatus, pushToast } = useApp()
  const [autoAccept, setAutoAccept] = useState(false)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)
  const [mountedAt] = useState(() => Date.now())
  const now = useNow(15000)

  const newOrders = orders
    .filter((order) => order.status === 'new')
    .sort((a, b) => b.placedMinutes - a.placedMinutes)
  const accepted = orders
    .filter((order) => order.status === 'accepted')
    .sort((a, b) => b.placedMinutes - a.placedMinutes)
  const preparing = orders
    .filter((order) => order.status === 'preparing')
    .sort((a, b) => b.placedMinutes - a.placedMinutes)
  const ready = orders
    .filter((order) => order.status === 'ready')
    .sort((a, b) => b.placedMinutes - a.placedMinutes)
  const completed = orders.filter((order) => order.status === 'completed')
  const lateCount = [...newOrders, ...accepted, ...preparing, ...ready].filter(
    (order) => order.placedMinutes > order.prepTarget,
  ).length
  const activeCount = newOrders.length + accepted.length + preparing.length + ready.length
  const boardValue = [...newOrders, ...accepted, ...preparing, ...ready].reduce((sum, order) => sum + order.total, 0)

  const elapsedFor = (order: Order) => order.placedMinutes + Math.floor((now - mountedAt) / 60000)
  const secondsFor = () => Math.floor((now - mountedAt) / 1000) % 60

  const advance = (order: Order) => {
    if (order.status === 'new') {
      setOrderStatus(order.id, 'accepted')
      pushToast(`${order.id} accepted`, 'Ticket moved to the accepted column. Start prep when ready.', 'success')
    } else if (order.status === 'accepted') {
      setOrderStatus(order.id, 'preparing')
      pushToast(`${order.id} in the kitchen`, 'Preparation started. The prep timer is now running.', 'success')
    } else if (order.status === 'preparing') {
      setOrderStatus(order.id, 'ready')
      pushToast(`${order.id} ready`, 'Rider or customer has been notified for handover.', 'success')
    } else {
      setOrderStatus(order.id, 'completed')
      pushToast(`${order.id} handed over`, 'Order completed and COD collection recorded.', 'success')
    }
  }

  const reject = (order: Order) => {
    if (confirmRejectId !== order.id) {
      setConfirmRejectId(order.id)
      return
    }
    setOrderStatus(order.id, 'cancelled')
    setConfirmRejectId(null)
    pushToast(`${order.id} rejected`, 'Customer notified and the order was removed from the kitchen queue.', 'warning')
  }

  const renderTicket = (order: Order) => (
    <KitchenTicket
      key={order.id}
      order={order}
      elapsed={elapsedFor(order)}
      seconds={secondsFor()}
      onAdvance={() => advance(order)}
      onReject={() => reject(order)}
      onPrint={() => pushToast('Ticket sent to printer', `${order.id} · ${order.items.length} lines`, 'info')}
      confirmReject={confirmRejectId === order.id}
    />
  )

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-sage-700">
            <ChefHat size={12} /> Kitchen operations
          </div>
          <h1 className="font-display text-[clamp(1.7rem,2.6vw,2.3rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-forest">
            Kitchen board
          </h1>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
            Lunch service · every ticket is timed against its prep target. Move orders forward as the kitchen finishes each item.
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-600 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage-600" />
            </span>
            <span className="text-[10.5px] font-semibold text-ink tabular">
              {new Date(now).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] text-muted">live</span>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3">
            <span className="text-[10px] font-semibold text-[#5C655A]">Auto-accept</span>
            <Toggle
              checked={autoAccept}
              onChange={(value) => {
                setAutoAccept(value)
                pushToast(
                  value ? 'Auto-accept enabled' : 'Auto-accept disabled',
                  value
                    ? 'New orders will be accepted automatically and wait in the accepted column.'
                    : 'New orders will wait for manual acceptance.',
                  value ? 'warning' : 'info',
                )
              }}
              label="Auto-accept new orders"
              size="sm"
            />
          </div>
          <Button variant="secondary" onClick={() => pushToast('Printing all tickets', `${activeCount} active tickets sent to the kitchen printer.`, 'info')}>
            <Printer size={14} /> Print all
          </Button>
        </div>
      </header>

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Active tickets', value: String(activeCount), note: `${newOrders.length} new · ${accepted.length} accepted`, icon: Flame },
          { label: 'Avg prep time', value: '18m 40s', note: '3m faster than last week', icon: Timer },
          { label: 'Late tickets', value: String(lateCount), note: lateCount ? 'Needs attention now' : 'All on time', icon: TriangleAlert },
          { label: 'Completed today', value: String(completed.length), note: `${formatPKR(completed.reduce((sum, order) => sum + order.total, 0))} COD`, icon: CheckCircle2 },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-start gap-3 p-4">
              <span className={cx('grid h-8 w-8 flex-none place-items-center rounded-lg', stat.label === 'Late tickets' && lateCount ? 'bg-[#FBEDE9] text-[#A14B38]' : 'bg-cream-100 text-sage-700')}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[18px] font-semibold leading-none tracking-[-0.04em] text-forest tabular">{stat.value}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[8.5px] text-[#9AA093]">{stat.note}</p>
              </div>
            </div>
          )
        })}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={12} className="text-sage-600" />
          Oldest active ticket: <strong className="font-semibold text-ink">{newOrders[0]?.id ?? accepted[0]?.id ?? preparing[0]?.id ?? ready[0]?.id ?? '—'}</strong>
          {newOrders[0] || accepted[0] || preparing[0] || ready[0] ? ` · ${formatMinutes(elapsedFor(newOrders[0] ?? accepted[0] ?? preparing[0] ?? ready[0]))}` : ''}
        </span>
        <span className="inline-flex items-center gap-1.5">
          Board value <strong className="font-semibold text-forest">{formatPKR(boardValue)}</strong> · COD
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Column
          title="New orders"
          subtitle="Accept or reject"
          orders={newOrders}
          tone="clay"
          emptyText="No new orders waiting"
          renderTicket={renderTicket}
        />
        <Column
          title="Accepted"
          subtitle="Start prep when ready"
          orders={accepted}
          tone="forest"
          emptyText="No accepted orders waiting"
          renderTicket={renderTicket}
        />
        <Column
          title="Preparing"
          subtitle="In the kitchen now"
          orders={preparing}
          tone="amber"
          emptyText="Nothing on the pass"
          renderTicket={renderTicket}
        />
        <Column
          title="Ready for handover"
          subtitle="Rider or customer pickup"
          orders={ready}
          tone="sage"
          emptyText="No orders waiting for handover"
          renderTicket={renderTicket}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-100 text-sage-700">
            <CheckCircle2 size={14} />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold text-ink">{completed.length} orders completed today</p>
            <p className="text-[9px] text-muted">COD collections and commission entries are reconciled automatically.</p>
          </div>
        </div>
        <Link to="/orders" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
          View completed orders <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
