import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Boxes,
  CalendarDays,
  ChefHat,
  ChevronDown,
  Clock3,
  ReceiptText,
  Star,
  Timer,
  TrendingUp,
  TriangleAlert,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { AreaChart, Donut, Sparkline } from '../components/charts'
import { Badge, Button, Card, CardHeader, FoodImage, LiveBadge, OrderStatusBadge, Progress, Stars } from '../components/ui'
import { useApp } from '../store'
import {
  categoryMix,
  deals,
  ingredients,
  monthRevenue,
  store,
  topItems,
  weekRevenue,
} from '../data/mock'
import { cx, formatMinutes, formatPKR } from '../utils'

function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  spark,
  accent = false,
  children,
}: {
  label: string
  value: string
  icon: LucideIcon
  delta?: string
  deltaLabel: string
  spark: number[]
  accent?: boolean
  children?: React.ReactNode
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted">{label}</p>
          <p className="mt-2.5 truncate font-display text-[26px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">
            {value}
          </p>
        </div>
        <span
          className={cx(
            'grid h-9 w-9 flex-none place-items-center rounded-xl',
            accent ? 'bg-forest text-cream-50' : 'bg-cream-100 text-sage-700',
          )}
        >
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {delta ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[9.5px] font-semibold text-sage-700">
              <TrendingUp size={10} /> {delta}
            </span>
          ) : null}
          {children}
          <p className="mt-1.5 text-[9.5px] leading-tight text-muted">{deltaLabel}</p>
        </div>
        <Sparkline values={spark} className="h-9 w-[92px] flex-none" />
      </div>
    </Card>
  )
}

export function OverviewPage() {
  const { orders, setOrderStatus, pushToast, storeOnline, setStoreOnline } = useApp()
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue')

  const chartData = range === '7d' ? weekRevenue : monthRevenue
  const chartTotal = chartData.reduce(
    (sum, item) => sum + (metric === 'revenue' ? item.value : item.orders),
    0,
  )
  const newOrders = orders.filter((order) => order.status === 'new')
  const accepted = orders.filter((order) => order.status === 'accepted')
  const preparing = orders.filter((order) => order.status === 'preparing')
  const ready = orders.filter((order) => order.status === 'ready')
  const liveOrders = [...newOrders, ...accepted, ...preparing, ...ready].sort(
    (a, b) => a.placedMinutes - b.placedMinutes,
  )
  const oldest = [...newOrders, ...accepted, ...preparing, ...ready].sort(
    (a, b) => b.placedMinutes - a.placedMinutes,
  )[0]
  const lowStock = ingredients
    .filter((item) => item.onHand < item.par)
    .sort((a, b) => a.onHand / a.par - b.onHand / b.par)
    .slice(0, 4)
  const activeDeals = deals.filter((deal) => deal.status === 'active')

  const advanceOrder = (id: string, status: 'new' | 'accepted' | 'preparing' | 'ready') => {
    if (status === 'new') {
      setOrderStatus(id, 'accepted')
      pushToast(`${id} accepted`, 'Order accepted. Start preparation when the kitchen is ready.', 'success')
    } else if (status === 'accepted') {
      setOrderStatus(id, 'preparing')
      pushToast(`${id} in the kitchen`, 'Preparation started and the prep timer is running.', 'success')
    } else if (status === 'preparing') {
      setOrderStatus(id, 'ready')
      pushToast(`${id} is ready`, 'Marked ready for rider or customer pickup.', 'success')
    } else {
      setOrderStatus(id, 'completed')
      pushToast(`${id} completed`, 'COD collection and commission ledger updated.', 'success')
    }
  }

  return (
    <div className="space-y-4">
      {!storeOnline ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#EBD6C9] bg-[#FBF0E8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <TriangleAlert size={17} className="mt-0.5 flex-none text-clay-700" />
            <div>
              <p className="text-[12px] font-semibold text-clay-700">Your store is paused</p>
              <p className="text-[10.5px] text-[#8E6A58]">Customers cannot place new orders. Existing orders can still be completed.</p>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setStoreOnline(true)}>
            Go live again
          </Button>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-sage-700">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Sunday, 22 November 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#BFC6B7]" />
            <span>Lunch service</span>
            <LiveBadge label={storeOnline ? 'Store live' : 'Paused'} />
          </div>
          <h1 className="font-display text-[clamp(1.75rem,2.7vw,2.4rem)] font-semibold leading-[1.06] tracking-[-0.05em] text-forest">
            Assalam-o-Alaikum, {store.owner.split(' ')[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">
            {storeOnline ? (
              <>
                Your kitchen is live and <strong className="font-semibold text-ink">{newOrders.length} new orders</strong> are waiting to be accepted. Lunch rush starts in about 40 minutes.
              </>
            ) : (
              <>Your store is paused. Go live when your kitchen is ready to accept new orders.</>
            )}
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11px] font-semibold text-[#5D655B] shadow-[0_1px_2px_rgba(31,42,34,0.04)] transition hover:border-[#D6D1C3]"
            onClick={() => pushToast('Date range', 'This is a prototype — the range selector is visual only.', 'info')}
          >
            <CalendarDays size={14} /> 17 – 23 Nov <ChevronDown size={12} className="text-[#9AA093]" />
          </button>
          <Link to="/orders">
            <Button variant="primary">
              Open live orders <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue today"
          value={formatPKR(84250)}
          icon={Wallet}
          delta="12.4%"
          deltaLabel="vs last Sunday"
          spark={[42, 48, 45, 61, 58, 72, 84]}
          accent
        />
        <KpiCard
          label="Orders today"
          value="68"
          icon={ReceiptText}
          delta="+8 orders"
          deltaLabel={`${newOrders.length} waiting for acceptance`}
          spark={[41, 46, 44, 52, 67, 78, 68]}
        />
        <KpiCard
          label="Avg prep time"
          value="18m 40s"
          icon={Timer}
          delta="3m faster"
          deltaLabel="than last week"
          spark={[24, 23, 22, 21, 20, 19, 18]}
        />
        <KpiCard
          label="Store rating"
          value={store.rating.toFixed(1)}
          icon={Star}
          delta="+0.2"
          deltaLabel={`${store.reviewCount.toLocaleString()} customer reviews`}
          spark={[4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8]}
        >
          <Stars rating={store.rating} size={11} className="mt-0.5" />
        </KpiCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(300px,0.78fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#F0EDE4] px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted">Performance</p>
              <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
                <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-forest">Revenue overview</h2>
                <span className="mb-0.5 text-[10px] text-muted">{range === '7d' ? 'Last 7 days' : 'Last 30 days'}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <strong className="font-display text-[27px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">
                  {metric === 'revenue' ? formatPKR(chartTotal) : `${chartTotal.toLocaleString()} orders`}
                </strong>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[9.5px] font-semibold text-sage-700">
                  <TrendingUp size={10} /> 18.2%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg bg-cream-100 p-0.5">
                {(['revenue', 'orders'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMetric(option)}
                    className={cx(
                      'rounded-[7px] px-2.5 py-1.5 text-[10px] font-semibold capitalize transition',
                      metric === option ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-line bg-white p-0.5">
                {(['7d', '30d'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={cx(
                      'rounded-[7px] px-2.5 py-1.5 text-[10px] font-semibold uppercase transition',
                      range === option ? 'bg-forest text-cream-50' : 'text-muted hover:text-ink',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-3 pb-2 pt-3 sm:px-4">
            <AreaChart
              data={chartData}
              formatValue={
                metric === 'revenue' ? (value) => formatPKR(value) : (value) => `${value} orders`
              }
              height={260}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-5 py-3 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-600" />
              Best day: <strong className="font-semibold text-ink">Saturday · {formatPKR(112600)}</strong>
            </span>
            <span>COD orders only · commission shown in earnings</span>
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-forest p-5 text-cream-50 shadow-card">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sage-400/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-sage-300">Next settlement</p>
                <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-[8.5px] font-semibold text-cream-200/80">
                  Weekly
                </span>
              </div>
              <p className="mt-2 font-display text-[29px] font-semibold leading-none tracking-[-0.05em] tabular">
                {formatPKR(272195)}
              </p>
              <p className="mt-1.5 text-[9.5px] text-cream-200/60">Settlement due · JTBazar pays you Monday, 24 Nov</p>

              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.055] p-3">
                <div className="flex items-center justify-between text-[9px] text-cream-200/70">
                  <span>Week 17 – 23 Nov</span>
                  <span>5 of 7 days</span>
                </div>
                <Progress value={71} className="mt-2 bg-white/10" barClassName="bg-sage-400" />
                <div className="mt-2.5 flex items-center justify-between text-[9px] text-cream-200/60">
                  <span>Commission this week</span>
                  <span className="font-semibold text-cream-50">{formatPKR(54055)}</span>
                </div>
              </div>

              <Link
                to="/earnings"
                className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-cream-50 text-[10.5px] font-semibold text-forest transition hover:bg-white"
              >
                View earnings <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Service snapshot</p>
                <p className="mt-0.5 text-[9.5px] text-muted">Live across all fulfilment modes</p>
              </div>
              <ChefHat size={16} className="text-sage-600" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'New', value: newOrders.length, tone: 'bg-clay-100 text-clay-700' },
                { label: 'Accepted', value: accepted.length, tone: 'bg-[#E7EDE1] text-forest' },
                { label: 'Preparing', value: preparing.length, tone: 'bg-[#FBF3E1] text-[#8E6218]' },
                { label: 'Ready', value: ready.length, tone: 'bg-sage-100 text-sage-700' },
              ].map((item) => (
                <div key={item.label} className={cx('rounded-xl px-3 py-2.5', item.tone)}>
                  <p className="font-display text-[18px] font-semibold leading-none tabular">{item.value}</p>
                  <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.08em] opacity-75">{item.label}</p>
                </div>
              ))}
            </div>
            <Link
              to="/kitchen"
              className="mt-3 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[10px] font-semibold text-forest transition hover:bg-cream-50"
            >
              Open kitchen board <ArrowRight size={12} />
            </Link>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Live orders"
            subtitle="Newest first · accept orders before the prep clock runs out"
            action={
              <Link to="/orders" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
                View all <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-y border-[#F0EDE4] bg-[#FBFAF5]">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Action'].map((heading) => (
                    <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveOrders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <p className="text-[11px] font-semibold text-ink">{order.id}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[9px] text-muted">
                        <Clock3 size={9} /> {formatMinutes(order.placedMinutes)} ago
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[11px] font-medium text-ink">{order.customer}</p>
                      <p className="mt-0.5 text-[9px] text-muted">{order.area}</p>
                    </td>
                    <td className="max-w-[190px] px-3 py-3">
                      <p className="truncate text-[10px] text-[#5C655A]">{order.items[0]?.name}</p>
                      <p className="mt-0.5 text-[9px] text-muted">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)} items · {order.fulfilment}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-semibold text-forest tabular">{formatPKR(order.total)}</td>
                    <td className="px-3 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-3 pl-3 pr-5">
                      {order.status === 'ready' ? (
                        <Button size="sm" variant="secondary" onClick={() => advanceOrder(order.id, 'ready')}>
                          Complete
                        </Button>
                      ) : order.status === 'preparing' ? (
                        <Button size="sm" variant="soft" onClick={() => advanceOrder(order.id, 'preparing')}>
                          Mark ready
                        </Button>
                      ) : order.status === 'accepted' ? (
                        <Button size="sm" variant="soft" onClick={() => advanceOrder(order.id, 'accepted')}>
                          Start prep
                        </Button>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => advanceOrder(order.id, 'new')}>
                          Accept
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Kitchen queue"
            subtitle={`${newOrders.length + accepted.length + preparing.length + ready.length} active tickets · oldest first`}
            action={
              <Link to="/kitchen" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
                Board <ArrowRight size={12} />
              </Link>
            }
          />
          {oldest ? (
            <div className="mx-4 rounded-xl border border-[#F0E2C8] bg-[#FCF7EC] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-[13px] font-semibold text-ink">{oldest.id}</p>
                    <Badge tone={oldest.status === 'ready' ? 'sage' : oldest.status === 'new' ? 'clay' : oldest.status === 'accepted' ? 'forest' : 'amber'}>
                      {oldest.status === 'ready' ? 'Ready' : oldest.status === 'new' ? 'Needs acceptance' : oldest.status === 'accepted' ? 'Accepted' : 'Cooking'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[9.5px] text-muted">{oldest.customer} · {oldest.fulfilment}</p>
                </div>
                <span className="rounded-lg bg-white px-2 py-1 font-display text-[12px] font-semibold text-[#8E6218] tabular">
                  {formatMinutes(oldest.placedMinutes)}
                </span>
              </div>
              <div className="mt-2.5 grid gap-1">
                {oldest.items.slice(0, 3).map((item) => (
                  <div key={item.name} className="flex items-baseline justify-between gap-2 text-[10px]">
                    <span className="min-w-0 truncate text-[#5C655A]">{item.qty}× {item.name}</span>
                    <span className="flex-none text-[9px] text-muted tabular">{formatPKR(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              {oldest.note ? (
                <p className="mt-2 rounded-md bg-[#F7EDD7] px-2 py-1.5 text-[9px] leading-relaxed text-[#8A6420]">
                  “{oldest.note}”
                </p>
              ) : null}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[8.5px] text-muted">
                  <span>Prep target {oldest.prepTarget}m</span>
                  <span>{Math.round((oldest.placedMinutes / oldest.prepTarget) * 100)}%</span>
                </div>
                <Progress
                  value={(oldest.placedMinutes / oldest.prepTarget) * 100}
                  className="mt-1 bg-[#EFE5CE]"
                  barClassName={oldest.placedMinutes > oldest.prepTarget ? 'bg-danger' : 'bg-[#C08A2A]'}
                />
              </div>
              <Button
                size="sm"
                variant={oldest.status === 'new' ? 'primary' : 'secondary'}
                className="mt-3 w-full"
                onClick={() =>
                  advanceOrder(
                    oldest.id,
                    oldest.status === 'new' ? 'new' : oldest.status === 'preparing' ? 'preparing' : 'ready',
                  )
                }
              >
                {oldest.status === 'new' ? 'Accept order' : oldest.status === 'preparing' ? 'Mark ready' : 'Complete handover'}
              </Button>
            </div>
          ) : null}
          <div className="mt-3 divide-y divide-[#F3F0E8] px-4 pb-2">
            {[
              { label: 'Avg prep time', value: '18m 40s', icon: Timer },
              { label: 'Late tickets', value: '1', icon: TriangleAlert },
              { label: 'Riders en route', value: '2', icon: Truck },
            ].map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-center justify-between gap-2 py-2.5">
                  <span className="inline-flex items-center gap-2 text-[10px] text-muted">
                    <Icon size={12} className="text-[#8B9684]" /> {row.label}
                  </span>
                  <span className="text-[10.5px] font-semibold text-ink tabular">{row.value}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Top sellers today"
            subtitle="By units sold · margin after ingredient cost"
            action={
              <Link to="/menu" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
                Menu <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="divide-y divide-[#F3F0E8]">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 px-5 py-3">
                <span className="w-4 flex-none text-center font-display text-[10px] font-semibold text-[#B0B4A9]">
                  {index + 1}
                </span>
                <FoodImage src={item.image} alt={item.name} className="h-11 w-11 flex-none rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{item.sold} sold · {item.margin}% margin</p>
                </div>
                <div className="w-24 flex-none">
                  <div className="flex justify-end">
                    <span className="text-[10.5px] font-semibold text-forest tabular">{formatPKR(item.revenue)}</span>
                  </div>
                  <Progress value={item.margin} className="mt-1.5 h-1 bg-[#F0EDE4]" barClassName="bg-sage-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Low stock alerts"
            subtitle="Below par level · restock before dinner service"
            action={
              <Link to="/inventory" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
                Inventory <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="divide-y divide-[#F3F0E8]">
            {lowStock.map((item) => {
              const ratio = item.par ? item.onHand / item.par : 0
              const out = item.onHand === 0
              return (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-ink">{item.name}</p>
                    <Badge tone={out ? 'danger' : 'amber'}>{out ? 'Out of stock' : 'Low'}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
                    <span>{item.onHand} {item.unit} on hand</span>
                    <span>par {item.par} {item.unit}</span>
                  </div>
                  <Progress
                    value={ratio * 100}
                    className="mt-1.5 h-1 bg-[#F0EDE4]"
                    barClassName={out ? 'bg-danger' : ratio < 0.45 ? 'bg-clay' : 'bg-[#C08A2A]'}
                  />
                </div>
              )
            })}
          </div>
          <div className="border-t border-[#F0EDE4] px-4 py-3">
            <Link
              to="/inventory"
              className="flex items-center justify-between rounded-lg bg-[#FBFAF5] px-3 py-2 text-[10px] font-semibold text-forest transition hover:bg-cream-100"
            >
              <span className="inline-flex items-center gap-1.5"><Boxes size={12} /> Open stock list</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Donut
            segments={categoryMix}
            centerValue="68"
            centerLabel="orders today"
            size={132}
            strokeWidth={15}
            className="mx-auto sm:mx-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">Sales mix</p>
                <h2 className="mt-1 font-display text-[15px] font-semibold tracking-[-0.02em] text-forest">What Karachi is ordering</h2>
              </div>
              <BadgePercent size={16} className="flex-none text-sage-600" />
            </div>
            <div className="mt-3 grid gap-2">
              {categoryMix.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2 text-[10px]">
                  <span className="h-2 w-2 flex-none rounded-sm" style={{ backgroundColor: segment.color }} />
                  <span className="min-w-0 flex-1 truncate text-[#5C655A]">{segment.label}</span>
                  <span className="font-semibold text-ink tabular">{segment.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Promotion pulse"
            subtitle={`${activeDeals.length} campaigns live · ${activeDeals.reduce((sum, deal) => sum + deal.uses, 0)} redemptions`}
            action={
              <Link to="/promotions" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 hover:text-forest">
                Manage <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="grid gap-2 px-5 pb-4">
            {activeDeals.map((deal) => (
              <div key={deal.id} className="flex items-center gap-3 rounded-xl border border-[#F0EDE4] bg-[#FBFAF5] p-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-clay-100 text-clay-700">
                  <BadgePercent size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-semibold text-ink">{deal.title}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{deal.value} · {deal.uses}/{deal.limit} uses</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-forest tabular">{formatPKR(deal.revenue)}</p>
                  <p className="text-[8.5px] text-muted">revenue</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F0EDE4] px-5 py-3">
            <div className="flex items-center justify-between text-[9.5px] text-muted">
              <span>Promo revenue this week</span>
              <span className="font-semibold text-ink">{formatPKR(204800)}</span>
            </div>
            <Progress value={64} className="mt-2 h-1 bg-[#F0EDE4]" barClassName="bg-clay" />
          </div>
        </Card>
      </div>
    </div>
  )
}
