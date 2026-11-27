import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, Eye, EyeOff, LoaderCircle, Package, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  listVendorCategories,
  listVendorInventory,
  listVendorProductPrimaryImages,
  listVendorProducts,
  setProductVisibility,
  type VendorProduct,
} from '../services/marketplaceApi'
import { formatPKR } from '../utils'

type InventoryRow = { product_id: string; quantity: number; low_stock_threshold?: number | null }
type CategoryRow = { id: string; name: string }

export function MenuPage() {
  const { user, seller } = useVendorAuth()
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'live' | 'hidden'>('all')

  const load = useCallback(async (quiet = false) => {
    if (!user) {
      setProducts([])
      setInventory([])
      setCategories([])
      setImages({})
      setLoading(false)
      return
    }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [productRows, inventoryRows, categoryRows] = await Promise.all([
        listVendorProducts(),
        listVendorInventory(),
        listVendorCategories(),
      ])
      setProducts(productRows)
      setInventory(inventoryRows as InventoryRow[])
      setCategories(categoryRows)
      setImages(await listVendorProductPrimaryImages(productRows.map((product) => String(product.id))))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your live product data could not be loaded.')
      setProducts([])
      setInventory([])
      setCategories([])
      setImages({})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const categoryNames = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const stockByProduct = useMemo(() => {
    const totals = new Map<string, number>()
    for (const row of inventory) totals.set(row.product_id, (totals.get(row.product_id) ?? 0) + Number(row.quantity ?? 0))
    return totals
  }, [inventory])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const hidden = Boolean(product.vendor_hidden)
      if (visibility === 'live' && hidden) return false
      if (visibility === 'hidden' && !hidden) return false
      if (!query) return true
      return [product.name, product.sku, product.slug, categoryNames.get(String(product.category_id ?? ''))]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    }).sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
  }, [products, search, visibility, categoryNames])

  const liveCount = products.filter((product) => !product.vendor_hidden && product.moderation_status === 'approved').length
  const hiddenCount = products.filter((product) => Boolean(product.vendor_hidden)).length
  const pendingCount = products.filter((product) => product.moderation_status === 'pending_review').length
  const businessName = String(seller?.business_type ?? '').toLowerCase() === 'restaurant' ||
    String(seller?.business_type ?? '').toLowerCase() === 'cafe' ||
    String(seller?.business_type ?? '').toLowerCase() === 'bakery'
    ? 'menu'
    : 'products'

  const toggleVisibility = async (product: VendorProduct) => {
    const id = String(product.id)
    setActionId(id)
    setError('')
    try {
      await setProductVisibility(id, !Boolean(product.vendor_hidden))
      await load(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Product visibility could not be updated.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Package size={12} /> Product catalogue</>}
        title={businessName === 'menu' ? 'Your menu, kept up to date.' : 'Your products, your business.'}
        description="This list is loaded from your approved JTBazar seller account. Changes here update your real marketplace listings; unavailable sales and margin metrics are not estimated."
        actions={
          <>
            <Button variant="secondary" onClick={() => void load(true)} disabled={refreshing || loading}>
              {refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
            </Button>
            <Link to="/marketplace" className="inline-flex h-9 items-center gap-2 rounded-lg bg-forest px-3 text-[11px] font-semibold text-white hover:bg-forest/90">
              Manage listings <ExternalLink size={13} />
            </Link>
          </>
        }
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Live data could not be loaded</p>
          <p className="mt-1 text-xs text-red-700">{error}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}>Try again</Button>
        </Card>
      ) : null}

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-3 sm:divide-y-0">
        {[
          { label: 'Total listings', value: String(products.length), note: 'From your seller account' },
          { label: 'Live listings', value: String(liveCount), note: 'Approved and visible' },
          { label: 'Hidden listings', value: String(hiddenCount), note: 'Hidden by your account' },
        ].map((stat) => (
          <div key={stat.label} className="p-4">
            <p className="font-display text-[22px] font-semibold leading-none tracking-[-0.04em] text-forest tabular">{loading ? '—' : stat.value}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
            <p className="mt-0.5 text-[8.5px] text-[#9AA093]">{stat.note}</p>
          </div>
        ))}
      </Card>

      {pendingCount > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {pendingCount} {pendingCount === 1 ? 'listing is' : 'listings are'} waiting for JTBazar review. Pending listings are not counted as live.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-[360px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your products…" className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200" />
        </div>
        <select value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)} className="h-9 rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-[#62695F] outline-none">
          <option value="all">All listings</option>
          <option value="live">Visible listings</option>
          <option value="hidden">Hidden listings</option>
        </select>
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" /> Loading your live products…</Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-10 text-center">
          <Package size={24} className="mx-auto text-[#B0B4A9]" />
          <h3 className="mt-2 font-display text-sm font-semibold text-ink">{products.length ? 'No products match this filter' : 'No products found in your seller account'}</h3>
          <p className="mt-1 text-[11px] text-muted">{products.length ? 'Try another search or visibility filter.' : 'Products you create or submit for review will appear here. No restaurant demo menu is shown.'}</p>
          {products.length > 0 ? <Button size="sm" className="mt-3" onClick={() => { setSearch(''); setVisibility('all') }}>Clear filters</Button> : null}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const id = String(product.id)
            const stock = stockByProduct.get(id) ?? 0
            const hidden = Boolean(product.vendor_hidden)
            const approved = product.moderation_status === 'approved'
            const category = categoryNames.get(String(product.category_id ?? '')) ?? 'Uncategorized'
            const price = Number(product.price ?? product.vendor_base_price ?? 0)
            return (
              <article key={id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className="relative grid h-40 place-items-center bg-cream-50">
                  {images[id] ? <img src={images[id]} alt={String(product.name ?? 'Product')} className="h-full w-full object-cover" /> : <Package size={28} className="text-[#B0B4A9]" />}
                  <div className="absolute left-2.5 top-2.5 flex gap-1.5">
                    <Badge tone={approved ? 'forest' : product.moderation_status === 'rejected' ? 'amber' : 'sage'}>{String(product.moderation_status ?? 'unsubmitted').replaceAll('_', ' ')}</Badge>
                    {hidden ? <Badge tone="amber">Hidden</Badge> : null}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-sage-700">{category}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-[36px] font-display text-[14px] font-semibold leading-snug text-ink">{String(product.name ?? 'Unnamed product')}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[30px] text-[9.5px] leading-relaxed text-muted">{String(product.short_description ?? product.description ?? '')}</p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-forest tabular">{formatPKR(price)}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">SKU: {String(product.sku ?? '—')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-ink tabular">{stock}</p>
                      <p className="text-[8px] text-muted">Units in stock</p>
                    </div>
                  </div>
                  {product.supplier_cost != null ? <p className="mt-1 text-[8.5px] text-muted">Supplier cost: {formatPKR(Number(product.supplier_cost))}</p> : null}
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-[9px] text-muted">{approved ? (hidden ? 'Not visible to customers' : 'Visible on storefront') : 'Review status controls visibility'}</span>
                    <Button size="sm" variant="secondary" disabled={!approved || actionId === id} onClick={() => void toggleVisibility(product)}>
                      {actionId === id ? <LoaderCircle size={12} className="animate-spin" /> : hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      {hidden ? 'Show' : 'Hide'}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
