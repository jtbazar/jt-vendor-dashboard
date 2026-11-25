import { useMemo, useState } from 'react'
import {
  Boxes,
  ClipboardCheck,
  Download,
  Minus,
  PackageX,
  Plus,
  Search,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  Progress,
  inputClass,
} from '../components/ui'
import { ingredients, type Ingredient } from '../data/mock'
import { useApp } from '../store'
import { cx, formatPKR } from '../utils'

function stepFor(unit: string) {
  if (unit === 'pcs') return 10
  if (unit === 'bottles') return 6
  return 1
}

export function InventoryPage() {
  const { pushToast } = useApp()
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(ingredients.map((item) => [item.id, item.onHand])),
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [lowOnly, setLowOnly] = useState(false)
  const [sort, setSort] = useState<'status' | 'name' | 'value'>('status')
  const [restockItem, setRestockItem] = useState<Ingredient | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(ingredients.map((item) => item.category)))],
    [],
  )

  const stockOf = (item: Ingredient) => stock[item.id] ?? item.onHand
  const statusOf = (item: Ingredient) => {
    const onHand = stockOf(item)
    if (onHand <= 0) return 'out'
    if (onHand < item.par) return 'low'
    return 'healthy'
  }

  const lowCount = ingredients.filter((item) => statusOf(item) === 'low').length
  const outCount = ingredients.filter((item) => statusOf(item) === 'out').length
  const inventoryValue = ingredients.reduce((sum, item) => sum + stockOf(item) * item.costPerUnit, 0)
  const needsAttention = lowCount + outCount

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return ingredients
      .filter((item) => (category === 'All' ? true : item.category === category))
      .filter((item) => (lowOnly ? statusOf(item) !== 'healthy' : true))
      .filter((item) =>
        needle
          ? item.name.toLowerCase().includes(needle) || item.category.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'value') return stockOf(b) * b.costPerUnit - stockOf(a) * a.costPerUnit
        const order = { out: 0, low: 1, healthy: 2 }
        return order[statusOf(a)] - order[statusOf(b)]
      })
    // statusOf closes over stock, so include it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, lowOnly, sort, stock])

  const adjust = (item: Ingredient, direction: 1 | -1) => {
    const step = stepFor(item.unit)
    setStock((current) => {
      const currentValue = current[item.id] ?? item.onHand
      return { ...current, [item.id]: Math.max(0, currentValue + direction * step) }
    })
    pushToast(
      direction === 1 ? 'Stock increased' : 'Stock reduced',
      `${item.name}: ${direction === 1 ? '+' : '−'}${step} ${item.unit}. This is local to the prototype.`,
      'info',
    )
  }

  const saveRestock = () => {
    if (!restockItem) return
    const qty = Number(restockQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      pushToast('Enter a valid quantity', 'Received stock must be greater than zero.', 'error')
      return
    }
    setStock((current) => ({
      ...current,
      [restockItem.id]: (current[restockItem.id] ?? restockItem.onHand) + qty,
    }))
    pushToast('Stock received', `${qty} ${restockItem.unit} of ${restockItem.name} added to inventory.`, 'success')
    setRestockItem(null)
    setRestockQty('')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Boxes size={12} /> Stock &amp; supplies</>}
        title="Know what the kitchen has left."
        description="Track ingredient stock against par levels, catch low-stock items before service and keep menu availability honest."
        actions={
          <>
            <Button variant="secondary" onClick={() => pushToast('Export inventory', 'A stock CSV would download here in the live product.', 'info')}>
              <Download size={14} /> Export
            </Button>
            <Button variant="primary" onClick={() => pushToast('Stock count started', 'A guided count sheet would open here.', 'info')}>
              <ClipboardCheck size={14} /> Start stock count
            </Button>
          </>
        }
      />

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Low stock', value: String(lowCount), note: 'Below par level', icon: TriangleAlert, tone: lowCount ? 'clay' : 'sage' },
          { label: 'Out of stock', value: String(outCount), note: 'Cannot prep right now', icon: PackageX, tone: outCount ? 'danger' : 'sage' },
          { label: 'Inventory value', value: formatPKR(inventoryValue), note: 'At ingredient cost', icon: Wallet, tone: 'sage' },
          { label: 'Wastage this week', value: '1.8%', note: 'Target below 2.5%', icon: Boxes, tone: 'sage' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-start gap-3 p-4">
              <span className={cx('grid h-8 w-8 flex-none place-items-center rounded-lg', stat.tone === 'clay' ? 'bg-[#FBF3E1] text-[#8E6218]' : stat.tone === 'danger' ? 'bg-[#FBEDE9] text-[#A14B38]' : 'bg-cream-100 text-sage-700')}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[17px] font-semibold leading-none tracking-[-0.04em] text-forest tabular">{stat.value}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[8.5px] text-[#9AA093]">{stat.note}</p>
              </div>
            </div>
          )
        })}
      </Card>

      {needsAttention > 0 ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-[#F0E2C8] bg-[#FCF7EC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <TriangleAlert size={15} className="mt-0.5 flex-none text-[#B07B20]" />
            <div>
              <p className="text-[10.5px] font-semibold text-[#8A6420]">{needsAttention} ingredient{needsAttention > 1 ? 's' : ''} need attention before dinner service</p>
              <p className="mt-0.5 text-[9.5px] text-[#9A7B44]">Chicken breast, burger buns, mozzarella and cooking oil are below par level. Chicken mince is out of stock.</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setLowOnly((value) => !value)}>
            {lowOnly ? 'Show all items' : 'Show low stock'}
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2.5 border-b border-[#F0EDE4] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-[320px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ingredients…"
              className="h-9 w-full rounded-lg border border-line bg-[#FBFAF5] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Filter ingredient category"
            >
              {categories.map((item) => <option key={item} value={item}>{item === 'All' ? 'All categories' : item}</option>)}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'status' | 'name' | 'value')}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Sort inventory"
            >
              <option value="status">Attention first</option>
              <option value="name">Name A–Z</option>
              <option value="value">Highest value</option>
            </select>
            <button
              type="button"
              onClick={() => setLowOnly((value) => !value)}
              className={cx(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-semibold transition',
                lowOnly ? 'border-[#E7C4BB] bg-[#FBEDE9] text-[#A14B38]' : 'border-line bg-white text-[#62695F] hover:text-forest',
              )}
            >
              <TriangleAlert size={12} /> Low only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                {['Ingredient', 'Category', 'On hand', 'Par level', 'Days cover', 'Stock level', 'Value', 'Status', 'Adjust'].map((heading) => (
                  <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const onHand = stockOf(item)
                const status = statusOf(item)
                const ratio = item.par ? onHand / item.par : 0
                return (
                  <tr key={item.id} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <p className="text-[10.5px] font-semibold text-ink">{item.name}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">{formatPKR(item.costPerUnit)} / {item.unit}</p>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A]">{item.category}</td>
                    <td className="px-3 py-3 text-[10.5px] font-semibold text-ink tabular">{onHand} <span className="text-[8.5px] font-normal text-muted">{item.unit}</span></td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{item.par} {item.unit}</td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{item.daysCover ? `${item.daysCover}d` : '—'}</td>
                    <td className="w-[130px] px-3 py-3">
                      <Progress
                        value={Math.min(100, ratio * 100)}
                        className="h-1.5 bg-[#F0EDE4]"
                        barClassName={status === 'out' ? 'bg-danger' : status === 'low' ? (ratio < 0.3 ? 'bg-danger' : 'bg-clay') : 'bg-sage-600'}
                      />
                      <p className="mt-1 text-[8px] text-muted">{Math.round(ratio * 100)}% of par</p>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{formatPKR(onHand * item.costPerUnit)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={status === 'out' ? 'danger' : status === 'low' ? 'amber' : 'sage'}>
                        {status === 'out' ? 'Out of stock' : status === 'low' ? 'Low' : 'Healthy'}
                      </Badge>
                    </td>
                    <td className="py-3 pl-3 pr-5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjust(item, -1)}
                          aria-label={`Reduce ${item.name}`}
                          className="grid h-7 w-7 place-items-center rounded-md border border-line bg-white text-[#6F776D] transition hover:border-[#D6D1C3] hover:text-forest"
                        >
                          <Minus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => adjust(item, 1)}
                          aria-label={`Increase ${item.name}`}
                          className="grid h-7 w-7 place-items-center rounded-md border border-line bg-white text-[#6F776D] transition hover:border-[#D6D1C3] hover:text-forest"
                        >
                          <Plus size={11} />
                        </button>
                        {status !== 'healthy' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRestockItem(item)
                              setRestockQty(String(Math.max(stepFor(item.unit), item.par - onHand)))
                            }}
                            className="ml-1 rounded-md bg-forest px-2 py-1.5 text-[8.5px] font-semibold text-cream-50 transition hover:bg-forest-600"
                          >
                            Restock
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
          <span>Showing {filtered.length} of {ingredients.length} ingredients · values are illustrative</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sage-600" /> Stock syncs to menu availability</span>
        </div>
      </Card>

      <Modal
        open={Boolean(restockItem)}
        onClose={() => setRestockItem(null)}
        title={restockItem ? `Restock ${restockItem.name}` : 'Restock'}
        description="Record stock received from your supplier. This updates the on-hand count immediately."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRestockItem(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveRestock}>Add stock</Button>
          </>
        }
      >
        {restockItem ? (
          <div className="grid gap-3.5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FBFAF5] p-3 text-[10px]">
              <div>
                <p className="text-muted">Current stock</p>
                <p className="mt-0.5 font-semibold text-ink">{stockOf(restockItem)} {restockItem.unit}</p>
              </div>
              <div>
                <p className="text-muted">Par level</p>
                <p className="mt-0.5 font-semibold text-ink">{restockItem.par} {restockItem.unit}</p>
              </div>
            </div>
            <Field label={`Quantity received (${restockItem.unit})`}>
              <input
                type="number"
                min="0"
                value={restockQty}
                onChange={(event) => setRestockQty(event.target.value)}
                className={inputClass}
                autoFocus
              />
            </Field>
            <div className="rounded-xl border border-[#E3EAD9] bg-[#F3F7EE] px-3.5 py-2.5 text-[9.5px] leading-relaxed text-[#4F584D]">
              After receiving, stock will be <strong className="font-semibold">{stockOf(restockItem) + (Number(restockQty) || 0)} {restockItem.unit}</strong>.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
