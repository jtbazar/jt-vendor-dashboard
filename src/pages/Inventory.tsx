import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Boxes, LoaderCircle, Minus, Package, Plus, RefreshCw, Search } from 'lucide-react'
import { Badge, Button, Card, Modal, PageHeader } from '../components/ui'
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

type StockGroup = {
  productId: string
  productName: string
  rows: InventoryRow[]
}

type EditorMode = 'set' | 'add'

type StockEditor = {
  group: StockGroup
  mode: EditorMode
}

function groupByProduct(rows: InventoryRow[]): StockGroup[] {
  const groups = new Map<string, StockGroup>()
  for (const row of rows) {
    const key = String(row.product_id ?? '')
    const existing = groups.get(key)
    if (existing) {
      existing.rows.push(row)
      continue
    }
    groups.set(key, { productId: key, productName: String(row.product_name ?? 'Product'), rows: [row] })
  }
  return [...groups.values()]
}

export function InventoryPage() {
  const { user } = useVendorAuth()
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [savingGroup, setSavingGroup] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'available'>('all')
  const [editor, setEditor] = useState<StockEditor | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await listVendorInventory()
      setRows(data as InventoryRow[])
    } catch (cause) {
      setRows([])
      setError(cause instanceof Error ? cause.message : 'Live inventory could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter(row => {
      if (query && ![row.product_name, row.variant_name].some(value => String(value ?? '').toLowerCase().includes(query))) return false
      const quantity = Number(row.quantity ?? 0)
      const threshold = row.low_stock_threshold == null ? null : Number(row.low_stock_threshold)
      if (filter === 'low' && (threshold == null || quantity <= 0 || quantity > threshold)) return false
      if (filter === 'out' && quantity > 0) return false
      if (filter === 'available' && quantity <= 0) return false
      return true
    })
  }, [rows, search, filter])

  const groups = useMemo(() => groupByProduct(filtered), [filtered])
  const lowCount = rows.filter(row => row.low_stock_threshold != null && Number(row.quantity ?? 0) <= Number(row.low_stock_threshold)).length
  const outCount = rows.filter(row => Number(row.quantity ?? 0) <= 0).length

  const openEditor = (group: StockGroup, mode: EditorMode) => {
    const next: Record<string, string> = {}
    for (const row of group.rows) next[row.id] = mode === 'add' ? '0' : String(Number(row.quantity ?? 0))
    setQuantities(next)
    setNote('')
    setError('')
    setEditor({ group, mode })
  }

  const adjust = async (row: InventoryRow, delta: number) => {
    const next = Math.max(0, Number(row.quantity ?? 0) + delta)
    setBusyId(row.id)
    setError('')
    try {
      await setProductStock(row.product_id, next, 'Vendor Center quick stock adjustment', row.variant_id ?? null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Stock could not be updated.')
    } finally {
      setBusyId(null)
    }
  }

  const saveGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editor) return
    if (note.trim().length < 2) {
      setError('Add a reason for this stock adjustment.')
      return
    }
    const changes = editor.group.rows.map(row => ({
      row,
      value: Number(quantities[row.id]),
    }))
    if (changes.some(({ value }) => !Number.isInteger(value) || value < 0)) {
      setError('Every quantity must be a whole number of zero or more.')
      return
    }
    setSavingGroup(true)
    setError('')
    try {
      for (const { row, value } of changes) {
        const finalQuantity = editor.mode === 'add' ? Number(row.quantity ?? 0) + value : value
        await setProductStock(row.product_id, finalQuantity, note.trim(), row.variant_id ?? null)
      }
      setEditor(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : 'Inventory could not be updated. Some variants may already have been saved; refresh before retrying.')
    } finally {
      setSavingGroup(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Boxes size={12} /> Inventory control</>}
        title="Your stock, from live records."
        description="Inventory quantities are loaded from your seller inventory records. Adjust one variant or update every variant of a product together using the existing vendor inventory RPC."
        actions={<>
          <Button variant="secondary" onClick={() => void load()} disabled={loading || savingGroup}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="primary" onClick={() => setPickerOpen(true)} disabled={!groups.length || savingGroup}><Plus size={14} /> Add stock</Button>
        </>}
      />
      {error ? <Card className="border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Inventory action failed</p><p className="mt-1 text-xs text-red-700">{error}</p></Card> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading ? '—' : rows.length}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Stock records</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-amber-700 tabular">{loading ? '—' : lowCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Low stock</p></Card>
        <Card className="col-span-2 p-4 sm:col-span-1"><p className="font-display text-2xl font-semibold text-red-700 tabular">{loading ? '—' : outCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Out of stock</p></Card>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-[360px]"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or variants…" className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] outline-none focus:border-sage-600" /></div>
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="h-9 rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-[#62695F]" aria-label="Filter inventory by stock"><option value="all">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="available">In stock</option></select>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin" />Loading live inventory…</div>
        ) : groups.length ? (
          <div className="divide-y divide-line">
            {groups.map(group => {
              const total = group.rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0)
              const worst = group.rows.some(row => Number(row.quantity ?? 0) <= 0)
                ? { tone: 'amber' as const, label: 'Out of stock' }
                : group.rows.some(row => row.low_stock_threshold != null && Number(row.quantity ?? 0) <= Number(row.low_stock_threshold))
                  ? { tone: 'sage' as const, label: 'Low stock' }
                  : { tone: 'forest' as const, label: 'In stock' }
              return (
                <article key={group.productId} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700"><Package size={15} /></span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{group.productName}</p>
                        <p className="mt-0.5 text-[9px] text-muted">{group.rows.length} variant record(s) · {total} units total</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={worst.tone}>{worst.label}</Badge>
                      <Button size="sm" variant="secondary" onClick={() => openEditor(group, 'set')}><Boxes size={12} /> Edit stock</Button>
                      <Button size="sm" variant="primary" onClick={() => openEditor(group, 'add')}><Plus size={12} /> Add stock</Button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.rows.map(row => {
                      const quantity = Number(row.quantity ?? 0)
                      return (
                        <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-cream-50/70 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold text-ink">{row.variant_name || 'Default product stock'}</p>
                            <p className="mt-0.5 text-[9px] text-muted">Current quantity: <strong className="text-forest">{quantity}</strong></p>
                          </div>
                          <div className="flex flex-none items-center gap-1">
                            <Button size="sm" variant="secondary" className="h-7 w-7 px-0" disabled={busyId === row.id || quantity <= 0} onClick={() => void adjust(row, -1)} aria-label={`Decrease ${row.variant_name || 'default'} stock`}><Minus size={12} /></Button>
                            <Button size="sm" variant="secondary" className="h-7 w-7 px-0" disabled={busyId === row.id} onClick={() => void adjust(row, 1)} aria-label={`Increase ${row.variant_name || 'default'} stock`}>{busyId === row.id ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <AlertTriangle size={22} className="mx-auto text-[#B0B4A9]" />
            <p className="mt-2 text-xs font-semibold text-ink">{rows.length ? 'No inventory records match' : 'No inventory records found'}</p>
            <p className="mt-1 text-[10px] text-muted">No demo stock is shown. Add or track stock through your real product listings.</p>
          </div>
        )}
      </Card>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add stock"
        description="Choose one of your own products, then add units to all of its variants."
        size="sm"
      >
        <div className="space-y-2">
          {groups.map(group => (
            <button
              key={group.productId}
              type="button"
              onClick={() => { setPickerOpen(false); openEditor(group, 'add') }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-sage-600 hover:bg-cream-50"
            >
              <span className="min-w-0"><span className="block truncate text-xs font-semibold text-ink">{group.productName}</span><span className="mt-0.5 block text-[9px] text-muted">{group.rows.length} variant record(s)</span></span>
              <Plus size={14} className="flex-none text-sage-700" />
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={Boolean(editor)}
        onClose={() => { if (!savingGroup) setEditor(null) }}
        title={editor?.mode === 'add' ? 'Add stock' : 'Edit product stock'}
        description={editor?.mode === 'add'
          ? 'Add units to every variant of this product. Each variant keeps its own stock record.'
          : 'Update all variants together. Each variant keeps its own stock record.'}
        size="lg"
        footer={<>
          <Button variant="outline" disabled={savingGroup} onClick={() => setEditor(null)}>Cancel</Button>
          <Button variant="primary" disabled={savingGroup} onClick={() => {
            const form = document.getElementById('vendor-stock-form') as HTMLFormElement | null
            form?.requestSubmit()
          }}>{savingGroup ? <><LoaderCircle size={14} className="animate-spin" /> Saving…</> : editor?.mode === 'add' ? 'Add stock to all variants' : 'Save all quantities'}</Button>
        </>}
      >
        {editor ? (
          <form id="vendor-stock-form" className="space-y-4" onSubmit={saveGroup}>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[8px] font-semibold uppercase tracking-wider text-sage-700">Product</p>
              <p className="mt-1 font-display text-sm font-semibold text-forest">{editor.group.productName}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {editor.group.rows.map(row => (
                <label key={row.id} className="block rounded-xl border border-line bg-white p-3">
                  <span className="block text-[11px] font-semibold text-ink">{row.variant_name || 'Default product'}</span>
                  <span className="mt-1 block text-[9px] text-muted">Current quantity: <strong className="text-forest">{Number(row.quantity ?? 0)}</strong></span>
                  <span className="mt-2 block text-[9px] font-semibold uppercase tracking-wider text-muted">{editor.mode === 'add' ? 'Quantity to add' : 'New quantity'}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={quantities[row.id] ?? ''}
                    onChange={e => setQuantities(current => ({ ...current, [row.id]: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink outline-none focus:border-sage-600"
                  />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted">Adjustment reason <span className="text-clay">*</span></span>
              <input required minLength={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Stock count / supplier restock" className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-sage-600" />
            </label>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
