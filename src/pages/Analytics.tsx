import { useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  ReceiptText,
  Star,
  Timer,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { AreaChart, BarChart, Donut } from '../components/charts'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  FoodImage,
  PageHeader,
  Progress,
  Stars,
} from '../components/ui'
import {
  categoryMix,
  fulfilmentMix,
  monthRevenue,
  peakHours,
  store,
  topItems,
  weekRevenue,
} from '../data/mock'
import { cx, formatPKR } from '../utils'

export function AnalyticsPage() {
  const [range, setRange] = useState<'week' | 'month'>('week')
  const data = range === 'week' ? weekRevenue : monthRevenue
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const orders = data.reduce((sum, item) => sum + item.orders, 0)
  const topRevenue = topItems.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><BarChart3 size={12} /> Insights &amp; performance</>}
        title="Understand what sells."
        description="See revenue trends, peak ordering windows, category mix and the menu items doing the heavy lifting."
        actions={
          <>
            <div className="flex rounded-xl border border-line bg-white p-0.5">
              {(['week', 'month'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cx(
                    'rounded-[9px] px-3 py-1.5 text-[10px] font-semibold capitalize transition',
                    range === option ? 'bg-forest text-cream-50' : 'text-muted hover:text-forest',
                  )}
                >
                  {option === 'week' ? 'This week' : 'This month'}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={() => undefined}>
              <Download size={14} /> Export report
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Revenue', value: formatPKR(total), delta: '+18.2%', note: range === 'week' ? '17 – 23 Nov' : '1 – 22 Nov', icon: Wallet },
          { label: 'Orders', value: orders.toLocaleString(), delta: '+12.0%', note: `${Math.round(orders / (range === 'week' ? 7 : 22))} per day avg`, icon: ReceiptText },
          { label: 'Avg order value', value: formatPKR(total / Math.max(1, orders)), delta: '+4.5%', note: 'COD orders only', icon: TrendingUp },
          { label: 'Repeat customers', value: '62%', delta: '+3 pts', note: 'Higher than marketplace avg', icon: Users },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                  <p className="mt-2 truncate font-display text-[21px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">{stat.value}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[8.5px] font-semibold text-sage-700">
                    <TrendingUp size={9} /> {stat.delta}
                  </p>
                  <p className="mt-1 text-[8.5px] text-[#9AA093]">{stat.note}</p>
                </div>
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700">
                  <Icon size={14} />
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Revenue trend"
            subtitle={range === 'week' ? 'Daily revenue · 17 – 23 November' : 'Selected days · November 2026'}
            action={
              <Badge tone="sage">
                <TrendingUp size={10} /> +18.2%
              </Badge>
            }
          />
          <div className="px-3 pb-3 sm:px-4">
            <AreaChart data={data} height={265} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-5 py-3 text-[9.5px] text-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={11} /> Best day: <strong className="font-semibold text-ink">Saturday · {formatPKR(112600)}</strong></span>
            <span>All figures in PKR · COD orders</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">Category mix</p>
              <h2 className="mt-1 font-display text-[15px] font-semibold tracking-[-0.02em] text-forest">Where revenue comes from</h2>
            </div>
            <Badge tone="outline">Share of sales</Badge>
          </div>
          <div className="mt-4 flex justify-center">
            <Donut
              segments={categoryMix}
              centerValue={range === 'week' ? '68' : '1,842'}
              centerLabel={range === 'week' ? 'orders today' : 'orders this month'}
              size={168}
              strokeWidth={18}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {categoryMix.map((segment) => (
              <div key={segment.label} className="flex items-center gap-2 text-[10px]">
                <span className="h-2 w-2 flex-none rounded-sm" style={{ backgroundColor: segment.color }} />
                <span className="min-w-0 flex-1 truncate text-[#5C655A]">{segment.label}</span>
                <span className="font-semibold text-ink tabular">{segment.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader
            title="Peak hours"
            subtitle="Orders by hour · today"
            action={<Badge tone="clay">7–9 PM rush</Badge>}
          />
          <div className="px-3 pb-3">
            <BarChart data={peakHours} height={210} />
          </div>
          <div className="border-t border-[#F0EDE4] px-5 py-3 text-[9.5px] text-muted">
            Dinner service drives <strong className="font-semibold text-ink">42%</strong> of daily orders.
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Fulfilment mix" subtitle="How customers receive orders" />
          <div className="grid gap-3.5 px-5 pb-4">
            {fulfilmentMix.map((mode) => (
              <div key={mode.label}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#5C655A]">{mode.label}</span>
                  <span className="font-semibold text-ink tabular">{mode.value}%</span>
                </div>
                <Progress value={mode.value} className="mt-1.5 h-1.5 bg-[#F0EDE4]" barClassName="" />
                <div className="mt-1 flex justify-between text-[8px] text-[#9AA093]">
                  <span>{mode.value} of 68 orders</span>
                  <span>{mode.label === 'Customer pickup' ? '12m pickup' : mode.label === 'Own rider' ? '28m avg' : '32m avg'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F0EDE4] px-5 py-3">
            <div className="flex items-center justify-between text-[9.5px] text-muted">
              <span>Late deliveries</span>
              <span className="font-semibold text-[#A14B38]">3 of 68 · 4.4%</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">Customer loyalty</p>
              <h2 className="mt-1 font-display text-[15px] font-semibold tracking-[-0.02em] text-forest">Regulars keep the kitchen busy</h2>
            </div>
            <Users size={16} className="text-sage-600" />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Donut
              segments={[
                { label: 'Returning', value: 62, color: '#4F6B3C' },
                { label: 'New', value: 38, color: '#DDE7D1' },
              ]}
              centerValue="62%"
              centerLabel="repeat customers"
              size={126}
              strokeWidth={14}
            />
            <div className="min-w-0 flex-1 grid gap-2.5 text-[9.5px]">
              <div>
                <p className="text-muted">Returning</p>
                <p className="mt-0.5 font-semibold text-forest">62% · 42 orders</p>
              </div>
              <div>
                <p className="text-muted">New customers</p>
                <p className="mt-0.5 font-semibold text-ink">38% · 26 orders</p>
              </div>
              <div>
                <p className="text-muted">Avg orders / customer</p>
                <p className="mt-0.5 font-semibold text-ink">2.4 / month</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FBFAF5] px-3 py-2 text-[9px] text-muted">
            <Star size={11} className="fill-[#C58B3C] text-[#C58B3C]" />
            <span><strong className="font-semibold text-ink">{store.rating}</strong> rating from {store.reviewCount.toLocaleString()} reviews</span>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Top performing items"
          subtitle="By revenue · this week"
          action={<Badge tone="sage">Menu leaders</Badge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#F0EDE4] bg-[#FBFAF5]">
                {['Item', 'Units sold', 'Revenue', 'Margin', 'Share of top revenue', 'Rating'].map((heading) => (
                  <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, index) => (
                <tr key={item.name} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 flex-none font-display text-[9px] font-semibold text-[#B0B4A9]">{index + 1}</span>
                      <FoodImage src={item.image} alt={item.name} className="h-10 w-10 flex-none rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate text-[10.5px] font-semibold text-ink">{item.name}</p>
                        <p className="text-[8.5px] text-muted">Menu item</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-[#5C655A] tabular">{item.sold}</td>
                  <td className="px-3 py-3 text-[10.5px] font-semibold text-forest tabular">{formatPKR(item.revenue)}</td>
                  <td className="px-3 py-3"><Badge tone="sage">{item.margin}%</Badge></td>
                  <td className="w-[180px] px-3 py-3">
                    <Progress value={(item.revenue / topRevenue) * 100} className="h-1.5 bg-[#F0EDE4]" />
                    <p className="mt-1 text-[8px] text-muted">{Math.round((item.revenue / topRevenue) * 100)}% of top 4</p>
                  </td>
                  <td className="py-3 pl-3 pr-5">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={item.margin / 20} size={10} />
                      <span className="text-[9px] font-semibold text-[#8A6A2E]">4.8</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Timer size={11} /> Data refreshes every 20 minutes</span>
          <button type="button" className="inline-flex items-center gap-1 font-semibold text-sage-700 hover:text-forest">
            Full menu report <ArrowUpRight size={11} />
          </button>
        </div>
      </Card>
    </div>
  )
}
