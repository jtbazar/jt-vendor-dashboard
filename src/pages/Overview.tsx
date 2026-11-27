import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Boxes, LoaderCircle, Package, ReceiptText, RefreshCw, Store } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { getVendorDashboardData } from '../services/marketplaceApi'
import { formatPKR } from '../utils'

type DashboardData = {
  products: Array<Record<string, any>>
  inventory: Array<Record<string, any>>
  orders: Array<Record<string, any>>
  cases: Array<Record<string, any>>
}

export function OverviewPage() {
  const { user, seller } = useVendorAuth()
  const [data, setData] = useState<DashboardData>({ products: [], inventory: [], orders: [], cases: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (quiet = false) => {
    if (!user) {
      setData({ products: [], inventory: [], orders: [], cases: [] })
      setLoading(false)
      return
    }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const result = await getVendorDashboardData()
      setData({
        products: result.products,
        inventory: result.inventory,
        orders: result.orders,
        cases: result.cases,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your live vendor dashboard could not be loaded.')
      setData({ products: [], inventory: [], orders: [], cases: [] })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => { void load() }, [load])

  const liveProducts = data.products.filter(product => product.moderation_status === 'approved' && !product.vendor_hidden).length
  const pendingProducts = data.products.filter(product => product.moderation_status === 'pending_review').length
  const lowStock = data.inventory.filter(row => row.low_stock_threshold != null && Number(row.quantity ?? 0) <= Number(row.low_stock_threshold)).length
  const openOrders = data.orders.filter(order => !['delivered', 'cancelled'].includes(String(order.vendor_fulfillment_status ?? '').toLowerCase())).length
  const openCases = data.cases.filter(row => !['resolved', 'closed', 'admin_decided'].includes(String(row.status ?? '').toLowerCase())).length

  const stats = [
    { label: 'Your products', value: data.products.length, note: 'Listings in your seller account', icon: Package, to: '/menu' },
    { label: 'Live products', value: liveProducts, note: 'Approved and visible', icon: Store, to: '/menu' },
    { label: 'Recent open orders', value: openOrders, note: 'From the latest order records loaded', icon: ReceiptText, to: '/orders' },
    { label: 'Low-stock records', value: lowStock, note: 'At or below the stock threshold', icon: Boxes, to: '/inventory' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Store size={12} /> Vendor workspace</>}
        title={seller?.shop_name ? `Welcome, ${seller.shop_name}.` : 'Your vendor overview.'}
        description="Your dashboard is connected to your seller account. Figures below come from live marketplace records; unavailable sales and earnings metrics are not estimated."
        actions={<Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}>{refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh data</Button>}
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 text-red-700" /><div><p className="text-sm font-semibold text-red-800">Live data could not be loaded</p><p className="mt-1 text-xs text-red-700">{error}</p></div></div>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}>Try again</Button>
        </Card>
      ) : null}

      {pendingProducts > 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{pendingProducts} product listing(s) are waiting for JTBazar review.</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return <Link key={stat.label} to={stat.to} className="block"><Card className="h-full p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><div className="flex items-start justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p><p className="mt-2 font-display text-[26px] font-semibold leading-none text-forest tabular">{loading ? '—' : stat.value}</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-cream-100 text-sage-700"><Icon size={16}/></span></div><p className="mt-2 text-[9px] text-muted">{stat.note}</p></Card></Link>
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold text-forest">Latest product listings</h2><p className="mt-1 text-[10px] text-muted">Actual products returned by the vendor products API</p></div><Link to="/menu" className="text-[10px] font-semibold text-sage-700">View all <ArrowRight size={12} className="inline"/></Link></div>
          {loading ? <p className="py-8 text-center text-xs text-muted">Loading products…</p> : data.products.length ? <div className="mt-3 divide-y divide-line">{data.products.slice(0,5).map(product => <div key={String(product.id)} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{String(product.name ?? 'Unnamed product')}</p><p className="mt-0.5 truncate text-[9px] text-muted">{String(product.sku ?? 'No SKU')}</p></div><div className="text-right"><p className="text-xs font-semibold text-forest">{formatPKR(Number(product.price ?? product.vendor_base_price ?? 0))}</p><Badge tone={product.moderation_status === 'approved' ? 'forest' : 'amber'}>{String(product.moderation_status ?? 'unknown').replaceAll('_',' ')}</Badge></div></div>)}</div> : <div className="py-8 text-center"><Package size={22} className="mx-auto text-[#B0B4A9]"/><p className="mt-2 text-xs font-semibold text-ink">No products found</p><p className="mt-1 text-[10px] text-muted">Your account has no product records yet.</p></div>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold text-forest">Operations snapshot</h2><p className="mt-1 text-[10px] text-muted">Live order, inventory and case records</p></div><Link to="/orders" className="text-[10px] font-semibold text-sage-700">Open orders <ArrowRight size={12} className="inline"/></Link></div>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-3"><span className="text-[11px] text-muted">Latest order records</span><strong className="text-sm text-forest tabular">{loading ? '—' : data.orders.length}</strong></div>
            <div className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-3"><span className="text-[11px] text-muted">Open customer cases</span><strong className="text-sm text-forest tabular">{loading ? '—' : openCases}</strong></div>
            <div className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-3"><span className="text-[11px] text-muted">Inventory records</span><strong className="text-sm text-forest tabular">{loading ? '—' : data.inventory.length}</strong></div>
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-muted">Sales totals, ratings, profit margins and settlement balances are hidden until their verified live reporting sources are connected.</p>
        </Card>
      </div>
    </div>
  )
}
