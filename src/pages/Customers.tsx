import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Bike,
  Download,
  MapPin,
  Phone,
  ReceiptText,
  Search,
  ShieldCheck,
  Star,
  Store,
  Truck,
  Users,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  OrderStatusBadge,
  PageHeader,
  Progress,
} from '../components/ui'
import { useApp } from '../store'
import { customers, type Customer, type Fulfilment } from '../data/mock'
import { cx, formatPKR } from '../utils'

const fulfilmentIcons = {
  'JTBazar rider': Truck,
  'Own rider': Bike,
  Pickup: Store,
} as const

export function CustomersPage() {
  const { orders } = useApp()
  const [search, setSearch] = useState('')
  const [fulfilment, setFulfilment] = useState<'all' | Fulfilment>('all')
  const [selected, setSelected] = useState<Customer | null>(null)

  const totalSpend = customers.reduce((sum, customer) => sum + customer.spent, 0)
  const repeatCustomers = customers.filter((customer) => customer.orders >= 5).length
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0)
  const avgOrders = Math.round(totalOrders / Math.max(1, customers.length))

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return customers
      .filter((customer) => (fulfilment === 'all' ? true : customer.fulfilment === fulfilment))
      .filter((customer) =>
        needle
          ? customer.name.toLowerCase().includes(needle) ||
            customer.phone.toLowerCase().includes(needle) ||
            customer.area.toLowerCase().includes(needle) ||
            customer.favourite.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => b.spent - a.spent)
  }, [search, fulfilment])

  const selectedOrder = selected ? orders.find((order) => order.id === selected.lastOrder) : undefined
  const SelectedFulfilmentIcon = selected ? fulfilmentIcons[selected.fulfilment] : Store

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Users size={12} /> Customers &amp; reviews</>}
        title="Know the people behind the orders."
        description="Customer summaries and lifetime-value reporting will appear when the seller-scoped customer API is connected. No sample customer profiles or spending totals are shown."
        actions={
          <>
            <Button variant="secondary" disabled>
              <Download size={14} /> Export
            </Button>
            <Link to="/reviews">
              <Button variant="primary">
                <Star size={14} /> Open reviews
              </Button>
            </Link>
          </>
        }
      />

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Customers', value: String(customers.length), note: 'Order-related directory', icon: Users },
          { label: 'Repeat customers', value: String(repeatCustomers), note: '5 or more orders', icon: ReceiptText },
          { label: 'Lifetime spend', value: formatPKR(totalSpend), note: 'Across this directory', icon: Star },
          { label: 'Avg orders', value: String(avgOrders), note: 'Per customer', icon: ArrowUpRight },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-start gap-3 p-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700">
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

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-[360px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, area or favourite item…"
            className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
          />
        </div>
        <select
          value={fulfilment}
          onChange={(event) => setFulfilment(event.target.value as 'all' | Fulfilment)}
          className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-[#62695F] outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200 lg:w-auto"
          aria-label="Filter by fulfilment preference"
        >
          <option value="all">All fulfilment modes</option>
          <option value="JTBazar rider">JTBazar rider</option>
          <option value="Own rider">Own rider</option>
          <option value="Pickup">Pickup</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={20} />}
            title="No customers match these filters"
            description="Try clearing the search or switching back to all fulfilment modes."
            action={<Button size="sm" onClick={() => { setSearch(''); setFulfilment('all') }}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                    {['Customer', 'Area', 'Orders', 'Lifetime spend', 'Last order', 'Preferred fulfilment', ''].map((heading) => (
                      <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => {
                    const Icon = fulfilmentIcons[customer.fulfilment]
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelected(customer)}
                        className="group cursor-pointer border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={customer.name} size={32} />
                            <div className="min-w-0">
                              <p className="truncate text-[10.5px] font-semibold text-ink">{customer.name}</p>
                              <p className="truncate text-[9px] text-muted">{customer.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-[10px] text-[#5C655A]">{customer.area}</td>
                        <td className="px-3 py-3.5">
                          <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-semibold', customer.orders >= 5 ? 'bg-sage-100 text-sage-700' : 'bg-[#F0EEE7] text-[#737A6F]')}>
                            {customer.orders}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-[10.5px] font-semibold text-forest tabular">{formatPKR(customer.spent)}</td>
                        <td className="px-3 py-3.5">
                          <p className="font-mono text-[9px] font-semibold text-[#737A6F]">{customer.lastOrder}</p>
                          <p className="mt-0.5 text-[8.5px] text-muted">{customer.lastOrderDate}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#5C655A]"><Icon size={12} className="text-[#8B9684]" /> {customer.fulfilment}</span>
                        </td>
                        <td className="py-3.5 pl-3 pr-5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-sage-700 opacity-0 transition group-hover:opacity-100">
                            View <ArrowUpRight size={10} />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
              <span>Showing {filtered.length} of {customers.length} customers</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={11} className="text-sage-600" /> Order-related details only</span>
            </div>
          </Card>

          <div className="grid gap-3 md:hidden">
            {filtered.map((customer) => {
              const Icon = fulfilmentIcons[customer.fulfilment]
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelected(customer)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition active:bg-[#FBFAF5]"
                >
                  <Avatar name={customer.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold text-ink">{customer.name}</p>
                      <span className="text-[10px] font-semibold text-forest tabular">{formatPKR(customer.spent)}</span>
                    </div>
                    <p className="mt-0.5 text-[9.5px] text-muted">{customer.area} · {customer.orders} orders</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted"><Icon size={10} /> {customer.fulfilment}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-[9.5px] leading-relaxed text-muted">
        <strong className="font-semibold text-ink">Privacy:</strong> only order-related details are shown. Phone numbers and addresses are used for fulfilment and support, never for public display. Customer reviews are managed on the Reviews page.
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Customer'}
        subtitle={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1"><MapPin size={10} /> {selected.area}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Phone size={10} /> {selected.phone}</span>
            </div>
          ) : null
        }
        footer={
          selected ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href={`tel:${selected.phone.replace(/\s/g, '')}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-ink transition hover:bg-cream-50"
              >
                <Phone size={11} /> Call customer
              </a>
              <Link to="/reviews">
                <Button size="sm" variant="primary">
                  <Star size={11} /> View reviews
                </Button>
              </Link>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5">
              <Avatar name={selected.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">{selected.name}</p>
                <p className="mt-0.5 text-[9px] text-muted">{selected.area}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={selected.orders >= 5 ? 'sage' : 'neutral'}>
                    {selected.orders >= 5 ? 'Repeat customer' : 'Newer customer'}
                  </Badge>
                  <Badge tone="outline"><SelectedFulfilmentIcon size={9} /> {selected.fulfilment}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total orders', value: String(selected.orders) },
                { label: 'Lifetime spend', value: formatPKR(selected.spent) },
                { label: 'Avg order value', value: formatPKR(selected.spent / Math.max(1, selected.orders)) },
                { label: 'Last order', value: selected.lastOrder },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-[#FBFAF5] px-3 py-2.5">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">{stat.label}</p>
                  <p className="mt-1 text-[11px] font-semibold text-forest tabular">{stat.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Favourite item</p>
              <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-sage-100 text-sage-700">
                  <Star size={12} />
                </span>
                <p className="text-[10.5px] font-medium text-ink">{selected.favourite}</p>
              </div>
            </div>

            {selectedOrder ? (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Latest order</p>
                <div className="mt-2 rounded-xl border border-line bg-white p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] font-semibold text-forest">{selectedOrder.id}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">{selected.lastOrderDate} · {selectedOrder.items.reduce((sum, item) => sum + item.qty, 0)} items</p>
                    </div>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#F0EDE4] pt-2 text-[10px]">
                    <span className="text-muted">COD total</span>
                    <span className="font-semibold text-forest tabular">{formatPKR(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {selected.note ? (
              <div className="rounded-xl border border-[#F0E2C8] bg-[#FCF7EC] px-3.5 py-3 text-[9.5px] leading-relaxed text-[#8A6420]">
                <strong className="font-semibold">Kitchen note:</strong> {selected.note}
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between text-[9px] text-muted">
                <span>Loyalty progress</span>
                <span>{Math.min(100, Math.round((selected.orders / 20) * 100))}% to regular</span>
              </div>
              <Progress value={Math.min(100, (selected.orders / 20) * 100)} className="mt-1.5 h-1.5 bg-[#F0EDE4]" barClassName="bg-sage-600" />
            </div>

            <div className="rounded-xl bg-forest p-3.5 text-cream-50">
              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-sage-300">Support shortcut</p>
              <p className="mt-1.5 text-[9px] leading-relaxed text-cream-200/70">
                For an order-specific issue, open a support ticket with the order reference. Do not share customer phone numbers or addresses publicly.
              </p>
              <Link to="/support" className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-cream-50 hover:text-white">
                Open support <ArrowUpRight size={10} />
              </Link>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
