import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, LoaderCircle, Minus, Package, Plus, RefreshCw, Search } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { listVendorInventory, setProductStock } from '../services/marketplaceApi'

type InventoryRow = {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  low_stock_threshold: number | null
  updated_at: string
  product_name: string
  variant_name: string | null
}

export function InventoryPage() {
  const { user } = useVendorAuth()
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'available'>('all')

  const load = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const data = await listVendorInventory()
      setRows(data as InventoryRow[])
    } catch (cause) {
      setRows([])
      setError(cause instanceof Error ? cause.message : 'Live inventory could not be loaded.')
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter(row => {
      if (query && ![row.product_name, row.variant_name].some(value => String(value ?? '').toLowerCase().includes(query))) return false
      const quantity = Number(row.quantity ?? 0)
      const threshold = Number(row.low_stock_threshold ?? 5)
      if (filter === 'low' && (quantity <= 0 || quantity > threshold)) return false
      if (filter === 'out' && quantity > 0) return false
      if (filter === 'available' && quantity <= 0) return false
      return true
    })
  }, [rows, search, filter])

  const lowCount = rows.filter(row => Number(row.quantity ?? 0) <= Number(row.low_stock_threshold ?? 5)).length
  const outCount = rows.filter(row => Number(row.quantity ?? 0) <= 0).length

  const adjust = async (row: InventoryRow, delta: number) => {
    const next = Math.max(0, Number(row.quantity ?? 0) + delta)
    setBusyId(row.id)
    setError('')
    try {
      await setProductStock(row.product_id, next, 'Vendor Center inventory adjustment', row.variant_id ?? null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Stock could not be updated.')
    } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={<><Boxes size={12}/> Inventory control</>} title="Your stock, from live records." description="Inventory quantities are loaded from your seller inventory records. Stock adjustments use the existing vendor inventory RPC." actions={<Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</Button>}/>
      {error ? <Card className="border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Inventory action failed</p><p className="mt-1 text-xs text-red-700">{error}</p></Card> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading?'—':rows.length}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Stock records</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-amber-700 tabular">{loading?'—':lowCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Low stock</p></Card>
        <Card className="col-span-2 p-4 sm:col-span-1"><p className="font-display text-2xl font-semibold text-red-700 tabular">{loading?'—':outCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Out of stock</p></Card>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-[360px]"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or variants…" className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] outline-none focus:border-sage-600"/></div>
        <select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} className="h-9 rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-[#62695F]"><option value="all">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="available">In stock</option></select>
      </div>
      <Card className="overflow-hidden">
        {loading ? <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin"/>Loading live inventory…</div> : filtered.length ? <div className="divide-y divide-line">{filtered.map(row => { const quantity=Number(row.quantity??0); const threshold=Number(row.low_stock_threshold??5); const low=quantity<=threshold; return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700"><Package size={15}/></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{row.product_name}</p><p className="mt-0.5 truncate text-[9px] text-muted">{row.variant_name || 'Default product stock'}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold text-forest tabular">{quantity} units</p><Badge tone={quantity<=0?'amber':low?'sage':'forest'}>{quantity<=0?'Out of stock':low?'Low stock':'In stock'}</Badge></div><div className="flex items-center gap-1"><Button size="sm" variant="secondary" uniform disabled={busyId===row.id||quantity<=0} onClick={()=>void adjust(row,-1)}><Minus size={12}/></Button><Button size="sm" variant="secondary" uniform disabled={busyId===row.id} onClick={()=>void adjust(row,1)}>{busyId===row.id?<LoaderCircle size={12} className="animate-spin"/>:<Plus size={12}/>}</Button></div></div></div>})}</div> : <div className="p-10 text-center"><AlertTriangle size={22} className="mx-auto text-[#B0B4A9]"/><p className="mt-2 text-xs font-semibold text-ink">{rows.length?'No inventory records match':'No inventory records found'}</p><p className="mt-1 text-[10px] text-muted">No demo stock is shown. Add or track stock through your real product listings.</p></div>}
      </Card>
    </div>
  )
}
