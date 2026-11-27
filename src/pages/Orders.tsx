import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, LoaderCircle, MapPin, Package, Printer, RefreshCw, Search, ShoppingBag, Truck } from 'lucide-react'
import { Badge, Button, Card, Modal, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { listVendorOrders, markOrderReady, type VendorOrderItem } from '../services/marketplaceApi'
import { formatPKR } from '../utils'

type OrderGroup = {
  orderId: string
  orderNumber: string
  createdAt: string
  status: string
  confirmationStatus: string | null
  pickupStatus: string | null
  items: VendorOrderItem[]
  total: number
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'not_delivered', label: 'Not delivered' },
] as const

function groupOrders(rows: VendorOrderItem[]): OrderGroup[] {
  const groups = new Map<string, OrderGroup>()
  for (const row of rows) {
    const orderId = String(row.order_id ?? '')
    if (!orderId) continue
    const existing = groups.get(orderId)
    if (existing) {
      existing.items.push(row)
      existing.total += Number(row.line_total ?? 0)
      continue
    }
    groups.set(orderId, {
      orderId,
      orderNumber: String(row.order_number ?? orderId.slice(0, 8)),
      createdAt: String(row.order_created_at ?? row.created_at ?? ''),
      status: String(row.vendor_fulfillment_status ?? 'unknown').replaceAll('_', ' '),
      confirmationStatus: row.order_confirmation_status == null ? null : String(row.order_confirmation_status),
      pickupStatus: row.pickup_status == null ? null : String(row.pickup_status),
      items: [row],
      total: Number(row.line_total ?? 0),
    })
  }
  return [...groups.values()]
}

function sharedOrUnavailable(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || 'Not shared in the vendor order view'
}

function formatDate(value: string) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString()
}

function statusTone(status: string): 'forest' | 'amber' | 'danger' | 'neutral' {
  if (status === 'delivered' || status === 'collected by jtbazar') return 'forest'
  if (status === 'cancelled') return 'danger'
  if (status === 'pending' || status === 'awaiting vendor') return 'amber'
  return 'neutral'
}

function pickupNote(order: OrderGroup): string {
  if (order.status === 'cancelled') return 'Cancelled by admin'
  switch (order.pickupStatus) {
    case 'ready_for_pickup': return 'Ready for pickup · JTBazar collection pending'
    case 'picked_up': return 'Collected by JTBazar · Waiting for customer confirmation'
    case 'cancelled': return 'Pickup cancelled'
    default: return order.confirmationStatus === 'confirmed' ? 'Order confirmed · Awaiting vendor dispatch' : 'Awaiting order confirmation'
  }
}

export function OrdersPage() {
  const { user } = useVendorAuth()
  const [orders, setOrders] = useState<VendorOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)
  const [details, setDetails] = useState<OrderGroup | null>(null)

  const load = useCallback(async (quiet = false) => {
    if (!user) { setOrders([]); setLoading(false); return }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const rows = await listVendorOrders({ page, pageSize, search: debouncedSearch, status })
      setOrders(rows)
    } catch (cause) {
      setOrders([])
      setError(cause instanceof Error ? cause.message : 'Live orders could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, page, pageSize, debouncedSearch, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => { void load() }, [load])

  const groups = useMemo(() => groupOrders(orders), [orders])

  const canMarkReady = (order: OrderGroup) => {
    if (order.confirmationStatus !== 'confirmed' || order.pickupStatus !== 'awaiting_vendor') return false
    const activeItems = order.items.filter(item => String(item.vendor_fulfillment_status ?? '') !== 'cancelled')
    if (!activeItems.length) return false
    return activeItems.every(item => ['pending', 'accepted', 'processing'].includes(String(item.vendor_fulfillment_status ?? 'pending')))
  }

  const totalOrders = Number(orders[0]?.total_orders ?? groups.length)
  const pageCount = Math.max(1, Math.ceil(totalOrders / pageSize))
  const currentPage = Math.min(page, pageCount - 1)

  const resetPage = () => setPage(0)

  const markReady = async (order: OrderGroup) => {
    if (!order.orderId) return
    setBusyOrderId(order.orderId)
    setError('')
    try {
      await markOrderReady(order.orderId)
      await load(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Order could not be marked ready for pickup.')
    } finally {
      setBusyOrderId(null)
    }
  }

  const pickupCount = groups.filter(order => order.pickupStatus === 'awaiting_vendor' && canMarkReady(order)).length
  const readyCount = groups.filter(order => order.pickupStatus === 'ready_for_pickup').length

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><ShoppingBag size={12} /> Marketplace orders</>}
        title="Orders from your customers."
        description="Orders are loaded from the existing vendor order-items API. This view shows only records your seller account is authorized to access."
        actions={<Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}>
          {refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </Button>}
      />
      {error ? <Card className="border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Orders could not be loaded</p><p className="mt-1 text-xs text-red-700">{error}</p><Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}>Try again</Button></Card> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading ? '—' : totalOrders}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Orders in view</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-amber-700 tabular">{loading ? '—' : pickupCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Waiting for dispatch</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-sage-700 tabular">{loading ? '—' : readyCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Ready for pickup</p></Card>
      </div>
      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-muted">Search</span>
            <span className="relative block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order number or product…" className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] outline-none focus:border-sage-600" />
            </span>
          </label>
          <label className="sm:w-48">
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-muted">Delivery status</span>
            <select value={status} onChange={e => { setStatus(e.target.value); resetPage() }} className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[11px] font-semibold text-[#62695F]" aria-label="Filter orders by delivery status">
              {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </Card>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin" />Loading live orders…</div>
        ) : groups.length ? (
          <div className="divide-y divide-line">
            {groups.map(order => (
              <article key={order.orderId} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700"><Package size={15} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-ink">{order.orderNumber}</p>
                        <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-ink">{order.items[0]?.product_name_snapshot ?? 'Order items'}{order.items.length > 1 ? ` +${order.items.length - 1} more item(s)` : ''}</p>
                      <p className="mt-1 text-[9px] text-muted">Qty {order.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)} · {order.items.length} item line(s)</p>
                      <p className="mt-1 flex items-center gap-1 text-[9px] text-muted"><Clock3 size={10} />{formatDate(order.createdAt)}</p>
                      <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-sage-700"><Truck size={10} />{pickupNote(order)}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:items-end">
                    <p className="text-sm font-semibold text-forest">{formatPKR(order.total)}</p>
                    <p className="flex items-center gap-1 text-[9px] text-muted"><MapPin size={10} />{sharedOrUnavailable(order.items[0]?.delivery_location_name)}</p>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button size="sm" variant="secondary" onClick={() => setDetails(order)}>View Details</Button>
                      {canMarkReady(order) ? (
                        <Button size="sm" variant="primary" disabled={busyOrderId === order.orderId} onClick={() => void markReady(order)}>
                          {busyOrderId === order.orderId ? <LoaderCircle size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Ready for pickup
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <ShoppingBag size={24} className="mx-auto text-muted" />
            <p className="mt-2 text-xs font-semibold text-ink">{orders.length || search !== '' || status !== 'all' ? 'No orders match these filters' : 'No orders found'}</p>
            <p className="mt-1 text-[9px] text-muted">Only live seller orders are shown. Adjust the search or status filter to see more.</p>
          </div>
        )}
      </Card>
      {!loading && totalOrders > 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
          <p className="text-[10px] text-muted">{totalOrders} order(s) found · Page {currentPage + 1} of {pageCount}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] text-muted">Orders per page
              <select aria-label="Orders per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); resetPage() }} className="ml-2 h-8 rounded-lg border border-line bg-white px-2 text-[10px]">
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
            </label>
            <Button size="sm" variant="secondary" disabled={currentPage <= 0} onClick={() => setPage(current => Math.max(0, current - 1))}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={currentPage >= pageCount - 1} onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))}>Next</Button>
          </div>
        </Card>
      ) : null}
      <p className="text-[9px] leading-relaxed text-muted">Showing live orders from the existing vendor order API. “Ready for pickup” uses the existing vendor_mark_order_ready workflow; JTBazar collection and customer confirmation are read from the existing pickup-status API.</p>

      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title="Order details"
        description={details ? `${details.orderNumber} · ${formatDate(details.createdAt)}` : undefined}
        size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => window.print()}><Printer size={14} /> Print product slip</Button>
          <Button variant="primary" onClick={() => setDetails(null)}>Close</Button>
        </>}
      >
        {details ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(details.status)}>{details.status}</Badge><Badge tone="neutral">{pickupNote(details)}</Badge></div>
                <p className="text-sm font-semibold text-forest">{formatPKR(details.total)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted">
                <span>Order ID: <strong className="font-mono text-ink">{details.orderId}</strong></span>
                <span>Placed: <strong className="text-ink">{formatDate(details.createdAt)}</strong></span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10px] font-semibold text-ink">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-sage-700" />Confirmation: {details.confirmationStatus ?? 'not available'}</span>
                <span className="flex items-center gap-1"><Truck size={12} className="text-sage-700" />Pickup: {details.pickupStatus ? details.pickupStatus.replaceAll('_', ' ') : 'not available'}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-cream-50 p-3"><p className="text-[8px] font-semibold uppercase tracking-wider text-muted">Customer</p><p className="mt-1 text-[10px] text-ink">{sharedOrUnavailable(details.items[0]?.customer_name)}</p><p className="mt-0.5 text-[9px] text-muted">Phone: {sharedOrUnavailable(details.items[0]?.customer_phone)}</p></div>
              <div className="rounded-xl bg-cream-50 p-3"><p className="text-[8px] font-semibold uppercase tracking-wider text-muted">Delivery and payment</p><p className="mt-1 text-[10px] text-ink">{sharedOrUnavailable(details.items[0]?.delivery_location_name)}</p><p className="mt-0.5 text-[9px] text-muted">Payment: {sharedOrUnavailable(details.items[0]?.payment_method)}</p></div>
            </div>
            <div className="print-slip">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-forest">Products in this order</h3>
              <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                {details.items.map((item, index) => {
                  const variant = item.variant_snapshot
                  const variantLabel = typeof variant === 'string' ? variant : variant && typeof variant === 'object' ? Object.values(variant).filter(Boolean).join(' / ') : ''
                  return (
                    <div key={String(item.id ?? index)} className="flex flex-wrap items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-ink">{String(item.product_name_snapshot ?? 'Product')}</p>
                        <p className="mt-0.5 text-[9px] text-muted">SKU: {String(item.sku_snapshot ?? '—')}{variantLabel ? ` · ${variantLabel}` : ''}</p>
                        <p className="mt-0.5 text-[9px] text-muted">Quantity: {Number(item.quantity ?? 0)} × {formatPKR(Number(item.unit_price ?? 0))}</p>
                      </div>
                      <p className="text-[11px] font-semibold text-forest">{formatPKR(Number(item.line_total ?? 0))}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-2 text-[11px] font-semibold"><span>Your items total</span><span className="text-forest">{formatPKR(details.total)}</span></div>
            </div>
            <p className="rounded-lg bg-[#FBFAF5] p-3 text-[9px] leading-relaxed text-muted">Customer contact, payment and delivery address fields are not included in the existing vendor order API. They are shown as unavailable instead of guessed. Order dates, items, quantities, prices and status come from live records.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
