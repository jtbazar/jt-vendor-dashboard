import { useMemo, useState } from 'react'
import {
  EyeOff,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Field,
  FoodImage,
  Modal,
  PageHeader,
  Toggle,
  inputClass,
} from '../components/ui'
import { useApp } from '../store'
import type { MenuItem } from '../data/mock'
import { cx, formatPKR, imageUrl } from '../utils'

const defaultImage = imageUrl('photo-1555939594-58d7cb561ad1')

interface OptionRow {
  label: string
  price: string
}

const emptyForm = {
  name: '',
  category: 'Signature Grills',
  description: '',
  price: '',
  cost: '',
  stock: '',
  prepTime: '',
  image: '',
  available: true,
  variants: [] as OptionRow[],
  addOns: [] as OptionRow[],
  modifiers: '',
}

type FormState = typeof emptyForm
type OptionKey = 'variants' | 'addOns'

function marginOf(item: MenuItem) {
  return item.price ? Math.round(((item.price - item.cost) / item.price) * 100) : 0
}

export function MenuPage() {
  const { menu, toggleMenuAvailability, addMenuItem, updateMenuItem, pushToast } = useApp()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'hidden'>('all')
  const [sort, setSort] = useState<'popular' | 'price' | 'margin' | 'name'>('popular')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map((item) => item.category)))], [menu])
  const live = menu.filter((item) => item.available).length
  const hidden = menu.length - live
  const avgMargin = menu.length
    ? Math.round(menu.reduce((sum, item) => sum + marginOf(item), 0) / menu.length)
    : 0
  const soldToday = menu.reduce((sum, item) => sum + item.soldToday, 0)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return menu
      .filter((item) => (category === 'All' ? true : item.category === category))
      .filter((item) =>
        statusFilter === 'all' ? true : statusFilter === 'live' ? item.available : !item.available,
      )
      .filter((item) =>
        needle
          ? item.name.toLowerCase().includes(needle) ||
            item.description.toLowerCase().includes(needle) ||
            item.category.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => {
        if (sort === 'price') return b.price - a.price
        if (sort === 'margin') return marginOf(b) - marginOf(a)
        if (sort === 'name') return a.name.localeCompare(b.name)
        return b.soldToday - a.soldToday
      })
  }, [menu, category, statusFilter, search, sort])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: String(item.price),
      cost: String(item.cost),
      stock: String(item.stock),
      prepTime: item.prepTime ? String(item.prepTime) : '',
      image: item.image,
      available: item.available,
      variants: (item.variants ?? []).map((variant) => ({ label: variant.label, price: String(variant.price) })),
      addOns: (item.addOns ?? []).map((addOn) => ({ label: addOn.label, price: String(addOn.price) })),
      modifiers: (item.modifiers ?? []).join(', '),
    })
    setModalOpen(true)
  }

  const addOption = (key: OptionKey) => {
    setForm((current) => ({ ...current, [key]: [...current[key], { label: '', price: '' }] }))
  }

  const patchOption = (key: OptionKey, index: number, patch: Partial<OptionRow>) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  }

  const removeOption = (key: OptionKey, index: number) => {
    setForm((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) }))
  }

  const saveItem = () => {
    const price = Number(form.price)
    const cost = Number(form.cost)
    const stock = Number(form.stock)
    if (!form.name.trim()) {
      pushToast('Item name is required', 'Add a clear menu name before saving.', 'error')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      pushToast('Enter a valid selling price', 'Selling price must be greater than zero.', 'error')
      return
    }
    const prepTime = Number(form.prepTime)
    const optionId = (kind: string, index: number) => `${editingId ?? 'new'}-${kind}-${index}`
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price,
      cost: Number.isFinite(cost) ? cost : 0,
      stock: Number.isFinite(stock) ? stock : 0,
      prepTime: Number.isFinite(prepTime) && prepTime > 0 ? prepTime : undefined,
      image: form.image.trim() || defaultImage,
      available: form.available,
      variants: form.variants
        .filter((variant) => variant.label.trim())
        .map((variant, index) => ({
          id: optionId('variant', index),
          label: variant.label.trim(),
          price: Math.max(0, Number(variant.price) || 0),
        })),
      addOns: form.addOns
        .filter((addOn) => addOn.label.trim())
        .map((addOn, index) => ({
          id: optionId('addon', index),
          label: addOn.label.trim(),
          price: Math.max(0, Number(addOn.price) || 0),
        })),
      modifiers: form.modifiers.split(',').map((modifier) => modifier.trim()).filter(Boolean),
    }
    if (editingId) {
      updateMenuItem(editingId, payload)
      pushToast('Menu item updated', `${payload.name} is now saved to your menu.`, 'success')
    } else {
      addMenuItem({ ...payload, tags: [] })
      pushToast('Menu item added', `${payload.name} is now visible in the menu list.`, 'success')
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><UtensilsCrossed size={12} /> Menu &amp; availability</>}
        title="Your menu, your margins."
        description="Keep prices, stock and availability current. Hidden items stay in your library but disappear from the storefront and Android app."
        actions={
          <>
            <Button variant="secondary" onClick={() => pushToast('Bulk import', 'CSV import will be available in the live Vendor Center.', 'info')}>
              <Upload size={14} /> Import
            </Button>
            <Button variant="primary" onClick={openNew}>
              <Plus size={14} /> Add menu item
            </Button>
          </>
        }
      />

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Live items', value: String(live), note: 'Visible on storefront', icon: Sparkles },
          { label: 'Hidden items', value: String(hidden), note: 'Not orderable today', icon: EyeOff },
          { label: 'Avg margin', value: `${avgMargin}%`, note: 'After ingredient cost', icon: Star },
          { label: 'Sold today', value: String(soldToday), note: 'Across all menu items', icon: UtensilsCrossed },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-start gap-3 p-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700">
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

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cx(
                'flex-none rounded-full border px-3.5 py-2 text-[10.5px] font-semibold transition',
                category === item
                  ? 'border-forest bg-forest text-cream-50'
                  : 'border-line bg-white text-[#62695F] hover:border-[#D6D1C3] hover:text-forest',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-[340px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items…"
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'live' | 'hidden')}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Filter menu availability"
            >
              <option value="all">All items</option>
              <option value="live">Live only</option>
              <option value="hidden">Hidden only</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'popular' | 'price' | 'margin' | 'name')}
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
              aria-label="Sort menu"
            >
              <option value="popular">Best selling</option>
              <option value="price">Highest price</option>
              <option value="margin">Best margin</option>
              <option value="name">Name A–Z</option>
            </select>
            <div className="hidden rounded-lg border border-line bg-white p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={cx('grid h-8 w-8 place-items-center rounded-md transition', view === 'grid' ? 'bg-cream-100 text-forest' : 'text-[#9AA093] hover:text-forest')}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-label="List view"
                className={cx('grid h-8 w-8 place-items-center rounded-md transition', view === 'list' ? 'bg-cream-100 text-forest' : 'text-[#9AA093] hover:text-forest')}
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <UtensilsCrossed size={22} className="mx-auto text-[#B0B4A9]" />
          <h3 className="mt-2 font-display text-sm font-semibold text-ink">No menu items match</h3>
          <p className="mt-1 text-[11px] text-muted">Try another category or clear the search.</p>
          <Button size="sm" className="mt-3" onClick={() => { setSearch(''); setCategory('All'); setStatusFilter('all') }}>
            Clear filters
          </Button>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((item) => {
            const margin = marginOf(item)
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative">
                  <FoodImage
                    src={item.image}
                    alt={item.name}
                    className="h-40 w-full"
                    imgClassName={cx('transition duration-500 group-hover:scale-[1.03]', !item.available && 'grayscale')}
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          tone={tag === 'Bestseller' ? 'forest' : tag === 'Low stock' ? 'amber' : 'sage'}
                          className="border-white/20 shadow-sm backdrop-blur"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-full bg-white/90 p-1 shadow-sm backdrop-blur">
                      <Toggle
                        checked={item.available}
                        onChange={() => {
                          toggleMenuAvailability(item.id)
                          pushToast(
                            item.available ? 'Item hidden' : 'Item is live',
                            `${item.name} ${item.available ? 'is now hidden from customers.' : 'is now available to order.'}`,
                            item.available ? 'warning' : 'success',
                          )
                        }}
                        label={`${item.available ? 'Hide' : 'Show'} ${item.name}`}
                        size="sm"
                      />
                    </div>
                  </div>
                  {!item.available ? (
                    <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#1F2A22]/75 px-2 py-1 text-[8px] font-semibold text-white backdrop-blur">
                      <EyeOff size={9} /> Hidden from storefront
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-sage-700">{item.category}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#8A6A2E]">
                      <Star size={9} className="fill-[#C58B3C] text-[#C58B3C]" /> {item.rating || 'New'}
                    </span>
                  </div>
                  <button type="button" onClick={() => openEdit(item)} className="mt-1 block text-left">
                    <h3 className="font-display text-[14px] font-semibold leading-snug tracking-[-0.02em] text-ink transition group-hover:text-forest">
                      {item.name}
                    </h3>
                  </button>
                  <p className="mt-1 line-clamp-2 min-h-[30px] text-[9.5px] leading-relaxed text-muted">{item.description}</p>
                  <div className="mt-2.5 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-forest tabular">{formatPKR(item.price)}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">Cost {formatPKR(item.cost)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.prepTime ? (
                          <span className="rounded-full bg-[#F4F1E8] px-1.5 py-0.5 text-[7.5px] font-medium text-[#737A6F]">{item.prepTime} min prep</span>
                        ) : null}
                        {item.variants?.length ? (
                          <span className="rounded-full bg-[#F4F1E8] px-1.5 py-0.5 text-[7.5px] font-medium text-[#737A6F]">{item.variants.length} sizes</span>
                        ) : null}
                        {item.addOns?.length ? (
                          <span className="rounded-full bg-[#F4F1E8] px-1.5 py-0.5 text-[7.5px] font-medium text-[#737A6F]">{item.addOns.length} add-ons</span>
                        ) : null}
                      </div>
                    </div>
                    <span className={cx('rounded-full px-2 py-1 text-[8.5px] font-bold', margin >= 55 ? 'bg-sage-100 text-sage-700' : 'bg-[#FBF3E1] text-[#8E6218]')}>
                      {margin}% margin
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#F0EDE4] pt-2.5">
                    <span className="text-[8.5px] text-muted">{item.soldToday} sold today · {item.stock} in stock</span>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-semibold text-sage-700 transition hover:bg-sage-100"
                    >
                      <Pencil size={10} /> Edit
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                  {['Item', 'Category', 'Price', 'Margin', 'Stock', 'Sold today', 'Live', ''].map((heading) => (
                    <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <FoodImage src={item.image} alt={item.name} className="h-10 w-10 flex-none rounded-lg" />
                        <div className="min-w-0">
                          <p className="truncate text-[10.5px] font-semibold text-ink">{item.name}</p>
                          <p className="text-[9px] text-muted">
                            {item.variants?.length || item.addOns?.length
                              ? `${item.variants?.length ?? 0} sizes · ${item.addOns?.length ?? 0} add-ons`
                              : item.rating
                                ? `${item.rating} rating`
                                : 'New item'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A]">{item.category}</td>
                    <td className="px-3 py-3 text-[10.5px] font-semibold text-forest tabular">{formatPKR(item.price)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[9px] font-semibold text-sage-700">{marginOf(item)}%</span>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{item.stock}</td>
                    <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{item.soldToday}</td>
                    <td className="px-3 py-3">
                      <Toggle
                        checked={item.available}
                        onChange={() => {
                          toggleMenuAvailability(item.id)
                          pushToast(item.available ? 'Item hidden' : 'Item is live', item.name, item.available ? 'warning' : 'success')
                        }}
                        label={`${item.available ? 'Hide' : 'Show'} ${item.name}`}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 pl-3 pr-5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold text-sage-700 transition hover:bg-sage-100"
                      >
                        <Pencil size={10} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit menu item' : 'Add menu item'}
        description="Restaurant items support portion sizes, paid add-ons and modifiers. Changes apply to the storefront and Android app in the live product."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveItem}>{editingId ? 'Save changes' : 'Add to menu'}</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <Field label="Item name">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={inputClass}
              placeholder="e.g. Chicken Malai Boti Platter"
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className={inputClass}
              >
                {categories.filter((item) => item !== 'All').map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Availability">
              <div className="flex h-[42px] items-center justify-between rounded-xl border border-[#DDD8CB] bg-white px-3.5">
                <span className="text-[11px] text-[#5C655A]">{form.available ? 'Live on storefront' : 'Hidden from customers'}</span>
                <Toggle checked={form.available} onChange={(value) => setForm({ ...form, available: value })} label="Item availability" size="sm" />
              </div>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={2}
              className={cx(inputClass, 'resize-none')}
              placeholder="Short description shown under the item name"
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Selling price (PKR)">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className={inputClass}
                placeholder="1190"
              />
            </Field>
            <Field label="Ingredient cost (PKR)">
              <input
                type="number"
                min="0"
                value={form.cost}
                onChange={(event) => setForm({ ...form, cost: event.target.value })}
                className={inputClass}
                placeholder="480"
              />
            </Field>
            <Field label="Stock quantity">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                className={inputClass}
                placeholder="26"
              />
            </Field>
            <Field label="Prep time (minutes)">
              <input
                type="number"
                min="0"
                value={form.prepTime}
                onChange={(event) => setForm({ ...form, prepTime: event.target.value })}
                className={inputClass}
                placeholder="25"
              />
            </Field>
          </div>

          {([
            { key: 'variants' as const, title: 'Portion sizes / variants', hint: 'Optional. Base price stays as the default; each size can have its own price.', addLabel: 'Add size' },
            { key: 'addOns' as const, title: 'Add-ons', hint: 'Optional extras customers can add at checkout.', addLabel: 'Add add-on' },
          ]).map((section) => (
            <div key={section.key} className="rounded-xl border border-line bg-[#FBFAF5] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10.5px] font-semibold text-ink">{section.title}</p>
                  <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted">{section.hint}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => addOption(section.key)}>
                  <Plus size={11} /> {section.addLabel}
                </Button>
              </div>
              {form[section.key].length ? (
                <div className="mt-2.5 grid gap-2">
                  {form[section.key].map((row, index) => (
                    <div key={`${section.key}-${index}`} className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(event) => patchOption(section.key, index, { label: event.target.value })}
                        className={cx(inputClass, 'h-9 min-w-0 flex-1 py-1.5 text-[11px]')}
                        placeholder={section.key === 'variants' ? 'e.g. Full platter' : 'e.g. Extra raita'}
                        aria-label={`${section.title} label ${index + 1}`}
                      />
                      <input
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(event) => patchOption(section.key, index, { price: event.target.value })}
                        className={cx(inputClass, 'h-9 w-24 flex-none py-1.5 text-[11px]')}
                        placeholder="PKR"
                        aria-label={`${section.title} price ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(section.key, index)}
                        aria-label={`Remove ${section.title} row ${index + 1}`}
                        className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line bg-white text-[#9AA093] transition hover:border-[#E7C4BB] hover:text-[#A14B38]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[8.5px] text-[#9AA093]">None added yet.</p>
              )}
            </div>
          ))}

          <Field label="Modifiers / choices" hint="Comma-separated. Example: Spice level, Sauce, Naan type.">
            <input
              value={form.modifiers}
              onChange={(event) => setForm({ ...form, modifiers: event.target.value })}
              className={inputClass}
              placeholder="Spice level, Sauce"
            />
          </Field>

          <Field label="Image URL" hint="Leave blank to use a default food image. In production this will be an upload with moderation.">
            <input
              value={form.image}
              onChange={(event) => setForm({ ...form, image: event.target.value })}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>
          {form.price && form.cost ? (
            <div className="flex items-center justify-between rounded-xl bg-[#FBFAF5] px-3.5 py-2.5 text-[10px]">
              <span className="text-muted">Estimated margin</span>
              <span className="font-semibold text-forest">
                {Math.max(0, Math.round(((Number(form.price) - Number(form.cost)) / Math.max(1, Number(form.price))) * 100))}%
              </span>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
