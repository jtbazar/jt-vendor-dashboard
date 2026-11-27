import { useCallback, useEffect, useState } from 'react'
import { Clock3, LoaderCircle, MapPin, Package, RefreshCw, Search, ShoppingBag } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { listVendorOrders, type VendorOrderItem } from '../services/marketplaceApi'
import { formatPKR } from '../utils'

export function OrdersPage() {
  const { user } = useVendorAuth()
  const [orders, setOrders] = useState<VendorOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const load = useCallback(async (quiet = false) => {
    if (!user) { setOrders([]); setLoading(false); return }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const rows = await listVendorOrders({ page: 0, pageSize: 15, search, status })
      setOrders(rows)
    } catch (cause) {
      setOrders([])
      setError(cause instanceof Error ? cause.message : 'Live orders could not be loaded.')
    } finally { setLoading(false); setRefreshing(false) }
  }, [user, search, status])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={<><ShoppingBag size={12}/> Marketplace orders</>} title="Orders from your customers." description="Orders are loaded from the existing vendor order-items API. This view shows only records your seller account is authorized to access." actions={<Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}>{refreshing?<LoaderCircle size={14} className="animate-spin"/>:<RefreshCw size={14}/>} Refresh</Button>}/>
      {error ? <Card className="border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Orders could not be loaded</p><p className="mt-1 text-xs text-red-700">{error}</p><Button size="sm" variant="secondary" className="mt-3" onClick={()=>void load()}>Try again</Button></Card> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order number, customer or product…" className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] outline-none focus:border-sage-600"/></div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-[#62695F]"><option value="all">All statuses</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="ready">Ready</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>
      </div>
      <Card className="overflow-hidden">
        {loading ? <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin"/>Loading live orders…</div> : orders.length ? <div className="divide-y divide-line">{orders.map(order => { const state=String(order.vendor_fulfillment_status ?? 'unknown').replaceAll('_',' '); return <article key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700"><Package size={15}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-ink">{order.order_number}</p><Badge tone={state==='delivered'?'forest':state==='cancelled'?'amber':'sage'}>{state}</Badge></div><p className="mt-1 truncate text-[11px] text-ink">{order.product_name_snapshot}</p><p className="mt-1 text-[9px] text-muted">{order.customer_name} · Qty {order.quantity} · {order.payment_method}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-muted"><Clock3 size={10}/>{new Date(order.order_created_at).toLocaleString()}</p></div></div><div className="sm:text-right"><p className="text-sm font-semibold text-forest">{formatPKR(Number(order.line_total ?? 0))}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-muted sm:justify-end"><MapPin size={10}/>{order.delivery_location_name || 'Delivery details on order'}</p></div></article>})}</div> : <div className="p-10 text-center"><ShoppingBag size={24} className="mx-auto text-[#B0B4A9]"/><p className="mt-2 text-xs font-semibold text-ink">No matching orders</p><p className="mt-1 text-[10px] text-muted">No sample customer orders are displayed. New orders for your shop will appear here when available.</p></div>}
      </Card>
      <p className="text-[9px] text-muted">Showing up to 15 latest order items. Order status updates and fulfillment actions remain in the existing authorized order workflow.</p>
    </div>
  )
}
