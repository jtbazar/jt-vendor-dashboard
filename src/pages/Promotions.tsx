import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Copy,
  Plus,
  Sparkles,
  Target,
  TicketPercent,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Field,
  FoodImage,
  Modal,
  PageHeader,
  Progress,
  Toggle,
  inputClass,
} from '../components/ui'
import { useApp } from '../store'
import type { DealStatus } from '../data/mock'
import { cx, formatPKR, imageUrl } from '../utils'

const defaultCampaignImage = imageUrl('photo-1555939594-58d7cb561ad1')

const statusTone: Record<DealStatus, 'sage' | 'amber' | 'neutral' | 'outline'> = {
  active: 'sage',
  scheduled: 'amber',
  draft: 'neutral',
  ended: 'outline',
}

const statusLabel: Record<DealStatus, string> = {
  active: 'Live',
  scheduled: 'Scheduled',
  draft: 'Draft',
  ended: 'Ended',
}

export function PromotionsPage() {
  const { deals, toggleDeal, addDeal, coupons, toggleCoupon, addCoupon, pushToast } = useApp()
  const [tab, setTab] = useState<'campaigns' | 'coupons'>('campaigns')
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [couponOpen, setCouponOpen] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    code: '',
    type: 'Percentage discount',
    value: '',
    schedule: '',
    description: '',
    limit: '100',
    appliesTo: 'All menu items',
    selectedItems: '',
    eligible: 'All customers',
    startAt: '',
    endAt: '',
  })
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'Percentage',
    value: '',
    minSpend: '1000',
    limit: '100',
    expiry: '',
  })

  const activeDeals = deals.filter((deal) => deal.status === 'active')
  const featured = activeDeals[0] ?? deals[0]
  const totalRedemptions = deals.reduce((sum, deal) => sum + deal.uses, 0)
  const promoRevenue = deals.reduce((sum, deal) => sum + deal.revenue, 0)
  const activeCoupons = coupons.filter((coupon) => coupon.active).length
  const couponUses = coupons.reduce((sum, coupon) => sum + coupon.uses, 0)

  const campaignStats = useMemo(
    () => [
      { label: 'Revenue influenced', value: formatPKR(promoRevenue) },
      { label: 'Redemptions', value: totalRedemptions.toLocaleString() },
      { label: 'Live campaigns', value: String(activeDeals.length) },
    ],
    [promoRevenue, totalRedemptions, activeDeals.length],
  )

  const saveCampaign = () => {
    if (!campaignForm.title.trim() || !campaignForm.code.trim() || !campaignForm.value.trim()) {
      pushToast('Complete the campaign details', 'Title, coupon code and offer value are required.', 'error')
      return
    }
    const isFlash = campaignForm.type === 'Flash sale'
    const schedule = isFlash && campaignForm.startAt && campaignForm.endAt
      ? `${campaignForm.startAt.replace('T', ' ')} – ${campaignForm.endAt.replace('T', ' ')}`
      : campaignForm.schedule.trim() || 'Schedule to be confirmed'
    const appliesTo = campaignForm.appliesTo === 'Selected items'
      ? `Selected items · ${campaignForm.selectedItems.trim() || 'To be selected'}`
      : campaignForm.appliesTo
    addDeal({
      title: campaignForm.title.trim(),
      code: campaignForm.code.trim().toUpperCase(),
      type: campaignForm.type,
      value: campaignForm.value.trim(),
      status: 'scheduled',
      schedule,
      limit: Math.max(1, Number(campaignForm.limit) || 100),
      description: campaignForm.description.trim() || 'New JTBazar vendor campaign.',
      image: defaultCampaignImage,
      appliesTo,
      eligibility: campaignForm.eligible,
      flash: isFlash,
    })
    pushToast('Campaign created', 'Submitted for JTBazar promotion review before it goes live.', 'success')
    setCampaignOpen(false)
    setCampaignForm({
      title: '',
      code: '',
      type: 'Percentage discount',
      value: '',
      schedule: '',
      description: '',
      limit: '100',
      appliesTo: 'All menu items',
      selectedItems: '',
      eligible: 'All customers',
      startAt: '',
      endAt: '',
    })
  }

  const saveCoupon = () => {
    if (!couponForm.code.trim() || !couponForm.value.trim()) {
      pushToast('Complete the coupon details', 'Coupon code and offer value are required.', 'error')
      return
    }
    addCoupon({
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      value: couponForm.value.trim(),
      minSpend: Math.max(0, Number(couponForm.minSpend) || 0),
      limit: Math.max(1, Number(couponForm.limit) || 100),
      expiry: couponForm.expiry.trim() || '31 Dec 2026',
      active: true,
    })
    pushToast('Coupon created', `${couponForm.code.toUpperCase()} is now active for your shop.`, 'success')
    setCouponOpen(false)
    setCouponForm({ code: '', type: 'Percentage', value: '', minSpend: '1000', limit: '100', expiry: '' })
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      pushToast('Code copied', `${code} copied to clipboard.`, 'info')
    } catch {
      pushToast('Copy unavailable', `Code: ${code}`, 'info')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><BadgePercent size={12} /> Growth &amp; offers</>}
        title="Fill quiet hours. Reward regulars."
        description="Run discounts, bundles, BOGO offers, flash sales and coupon codes across your menu. Choose exactly which items are included. JTBazar policy caps and approval rules always apply."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCouponOpen(true)}>
              <TicketPercent size={14} /> New coupon
            </Button>
            <Button variant="primary" onClick={() => setCampaignOpen(true)}>
              <Plus size={14} /> Create campaign
            </Button>
          </>
        }
      />

      <Card className="grid grid-cols-2 divide-x divide-y divide-[#F0EDE4] overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: 'Live campaigns', value: String(activeDeals.length), note: 'Across your menu', icon: BadgePercent },
          { label: 'Redemptions', value: totalRedemptions.toLocaleString(), note: 'All-time campaign uses', icon: Users },
          { label: 'Promo revenue', value: formatPKR(promoRevenue), note: 'Influenced by offers', icon: TrendingUp },
          { label: 'Active coupons', value: String(activeCoupons), note: `${couponUses} total redemptions`, icon: TicketPercent },
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

      <div className="flex gap-1.5">
        {(['campaigns', 'coupons'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={cx(
              'rounded-full border px-4 py-2 text-[10.5px] font-semibold capitalize transition',
              tab === option ? 'border-forest bg-forest text-cream-50' : 'border-line bg-white text-[#62695F] hover:text-forest',
            )}
          >
            {option} <span className={cx('ml-1 text-[8.5px]', tab === option ? 'text-cream-200/70' : 'text-[#9AA093]')}>{option === 'campaigns' ? deals.length : coupons.length}</span>
          </button>
        ))}
      </div>

      {tab === 'campaigns' ? (
        <div className="space-y-4">
          {featured ? (
            <section className="relative overflow-hidden rounded-2xl bg-forest text-cream-50 shadow-card">
              <img src={featured.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,#17241B_18%,rgba(23,36,27,0.92)_48%,rgba(23,36,27,0.55)_100%)]" />
              <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="sage" className="border-white/10 bg-white/10 text-sage-200">
                      <Sparkles size={10} /> Featured campaign
                    </Badge>
                    <Badge tone="sage" className="border-white/10 bg-white/10 text-cream-50">
                      <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-sage-300" /> {statusLabel[featured.status]}
                    </Badge>
                    {featured.flash ? (
                      <Badge tone="clay" className="border-white/10 bg-clay/25 text-cream-50">
                        <Zap size={10} /> Flash sale
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 max-w-xl font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold leading-[1.05] tracking-[-0.045em]">
                    {featured.title}
                  </h2>
                  <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-cream-200/70">{featured.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[9.5px] text-cream-200/70">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] text-cream-50">{featured.code}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {featured.schedule}</span>
                    <span>·</span>
                    <span>{featured.value}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-cream-200/60">
                    <span className="inline-flex items-center gap-1"><Target size={10} /> {featured.appliesTo}</span>
                    <span>Eligible: {featured.eligibility ?? 'All customers'}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="border-0 bg-cream-50 text-forest hover:bg-white"
                      onClick={() => pushToast('Campaign performance', 'Detailed campaign analytics are available in Analytics.', 'info')}
                    >
                      View performance <ArrowUpRight size={12} />
                    </Button>
                    <button
                      type="button"
                      onClick={() => copyCode(featured.code)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-[10px] font-semibold text-cream-50 transition hover:bg-white/10"
                    >
                      <Copy size={11} /> Copy code
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cream-200/50">Revenue</p>
                      <p className="mt-1 font-display text-[17px] font-semibold leading-none tabular">{formatPKR(featured.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cream-200/50">Orders</p>
                      <p className="mt-1 font-display text-[17px] font-semibold leading-none tabular">{featured.orders}</p>
                    </div>
                  </div>
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[8.5px] text-cream-200/60">
                      <span>Redemptions</span>
                      <span>{featured.uses} / {featured.limit}</span>
                    </div>
                    <Progress value={(featured.uses / featured.limit) * 100} className="mt-1.5 bg-white/10" barClassName="bg-sage-300" />
                  </div>
                  <div className="mt-3.5 border-t border-white/10 pt-3">
                    <p className="text-[8.5px] text-cream-200/50">Average order value</p>
                    <p className="mt-0.5 text-[11px] font-semibold">{formatPKR(featured.revenue / Math.max(1, featured.orders))}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {deals.map((deal) => (
              <Card key={deal.id} className="overflow-hidden">
                <div className="relative">
                  <FoodImage src={deal.image} alt={deal.title} className="h-32 w-full" imgClassName={deal.status === 'ended' ? 'grayscale' : undefined} />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={statusTone[deal.status]}>{statusLabel[deal.status]}</Badge>
                      {deal.flash ? <Badge tone="clay"><Zap size={9} /> Flash</Badge> : null}
                    </div>
                    <span className="rounded-full bg-white/90 px-2 py-1 text-[8.5px] font-bold text-forest shadow-sm backdrop-blur">{deal.value}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-[13.5px] font-semibold leading-snug text-ink">{deal.title}</h3>
                      <p className="mt-0.5 text-[9px] text-muted">{deal.type} · {deal.schedule}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-sage-700"><Target size={9} /> {deal.appliesTo}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">Eligible: {deal.eligibility ?? 'All customers'}</p>
                    </div>
                    {deal.status === 'active' || deal.status === 'scheduled' ? (
                      <Toggle
                        checked={deal.status === 'active'}
                        onChange={() => {
                          toggleDeal(deal.id)
                          pushToast(
                            deal.status === 'active' ? 'Campaign paused' : 'Campaign resumed',
                            `${deal.title} ${deal.status === 'active' ? 'will stop showing to customers.' : 'is live again.'}`,
                            deal.status === 'active' ? 'warning' : 'success',
                          )
                        }}
                        label={`${deal.status === 'active' ? 'Pause' : 'Activate'} ${deal.title}`}
                        size="sm"
                      />
                    ) : deal.status === 'draft' ? (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => pushToast('Submitted for approval', 'JTBazar will review the campaign before activation.', 'info')}
                      >
                        Submit
                      </Button>
                    ) : (
                      <span className="text-[8.5px] font-semibold text-[#9AA093]">Archived</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[28px] text-[9.5px] leading-relaxed text-muted">{deal.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[#FBFAF5] px-2.5 py-2 text-[9px]">
                    <div>
                      <p className="text-[8px] text-muted">Revenue</p>
                      <p className="mt-0.5 font-semibold text-forest tabular">{deal.revenue ? formatPKR(deal.revenue) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-muted">Redemptions</p>
                      <p className="mt-0.5 font-semibold text-ink tabular">{deal.uses} / {deal.limit}</p>
                    </div>
                  </div>
                  <Progress value={(deal.uses / Math.max(1, deal.limit)) * 100} className="mt-2.5 h-1 bg-[#F0EDE4]" barClassName={deal.status === 'ended' ? 'bg-[#B9BDB2]' : 'bg-clay'} />
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => copyCode(deal.code)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-mono text-[8.5px] font-semibold text-sage-700 transition hover:bg-sage-100"
                    >
                      <Copy size={9} /> {deal.code}
                    </button>
                    <button
                      type="button"
                      onClick={() => pushToast('Campaign details', `${deal.title} · ${deal.type} · ${deal.value}`, 'info')}
                      className="inline-flex items-center gap-1 text-[9px] font-semibold text-sage-700 hover:text-forest"
                    >
                      Details <ArrowUpRight size={10} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-[#FBF3E1] text-[#8E6218]">
                <CheckCircle2 size={15} />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold text-ink">JTBazar promotion policy applies</p>
                <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">Maximum discount caps, prohibited pricing tricks and high-value campaign approvals are controlled by JTBazar. Vendors cannot change platform commission or delivery fees.</p>
              </div>
            </div>
            <div className="flex flex-none flex-wrap gap-2">
              {campaignStats.slice(0, 2).map((stat) => (
                <div key={stat.label} className="rounded-lg border border-line bg-[#FBFAF5] px-3 py-2 text-right">
                  <p className="text-[8px] uppercase tracking-[0.08em] text-muted">{stat.label}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-forest tabular">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Coupon redemptions', value: couponUses.toLocaleString(), note: 'Across all active codes' },
              { label: 'Discount given', value: '—', note: 'Live redemption data not connected' },
              { label: 'Avg redeemed order', value: '—', note: 'Live order attribution not connected' },
            ].map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                <p className="mt-1.5 font-display text-[20px] font-semibold leading-none tracking-[-0.04em] text-forest tabular">{stat.value}</p>
                <p className="mt-1 text-[8.5px] text-[#9AA093]">{stat.note}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EDE4] px-5 py-4">
              <div>
                <h2 className="font-display text-[14px] font-semibold text-forest">Coupon codes</h2>
                <p className="mt-0.5 text-[10px] text-muted">Share these with customers on social media or inside your shop.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setCouponOpen(true)}>
                <Plus size={12} /> New coupon
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                    {['Code', 'Offer', 'Minimum spend', 'Usage', 'Expiry', 'Status'].map((heading) => (
                      <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-[#F3F0E8] last:border-0 hover:bg-[#FBFAF5]">
                      <td className="py-3.5 pl-5 pr-3">
                        <button
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#F4F1E8] px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.04em] text-forest transition hover:bg-sage-100"
                        >
                          {coupon.code} <Copy size={9} />
                        </button>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-[10.5px] font-semibold text-ink">{coupon.value}</p>
                        <p className="mt-0.5 text-[9px] text-muted">{coupon.type}</p>
                      </td>
                      <td className="px-3 py-3.5 text-[10px] text-[#5C655A] tabular">{formatPKR(coupon.minSpend)}</td>
                      <td className="w-[150px] px-3 py-3.5">
                        <div className="flex items-center justify-between text-[9px] text-muted">
                          <span>{coupon.uses} used</span>
                          <span>{coupon.limit}</span>
                        </div>
                        <Progress value={(coupon.uses / Math.max(1, coupon.limit)) * 100} className="mt-1 h-1 bg-[#F0EDE4]" barClassName="bg-clay" />
                      </td>
                      <td className="px-3 py-3.5 text-[10px] text-[#5C655A]">{coupon.expiry}</td>
                      <td className="py-3.5 pl-3 pr-5">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={coupon.active}
                            onChange={() => {
                              toggleCoupon(coupon.id)
                              pushToast(
                                coupon.active ? 'Coupon paused' : 'Coupon activated',
                                `${coupon.code} ${coupon.active ? 'can no longer be redeemed.' : 'is now redeemable.'}`,
                                coupon.active ? 'warning' : 'success',
                              )
                            }}
                            label={`${coupon.active ? 'Pause' : 'Activate'} ${coupon.code}`}
                            size="sm"
                          />
                          <span className={cx('text-[9px] font-semibold', coupon.active ? 'text-sage-700' : 'text-[#9AA093]')}>
                            {coupon.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={campaignOpen}
        onClose={() => setCampaignOpen(false)}
        title="Create campaign"
        description="New campaigns go to JTBazar for review before they appear to customers."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCampaignOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveCampaign}>Submit campaign</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <Field label="Campaign title">
            <input value={campaignForm.title} onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })} className={inputClass} placeholder="e.g. Weekend Family Feast" />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Coupon code">
              <input value={campaignForm.code} onChange={(event) => setCampaignForm({ ...campaignForm, code: event.target.value })} className={cx(inputClass, 'font-mono uppercase')} placeholder="FAMILY20" />
            </Field>
            <Field label="Offer type">
              <select value={campaignForm.type} onChange={(event) => setCampaignForm({ ...campaignForm, type: event.target.value })} className={inputClass}>
                <option>Percentage discount</option>
                <option>Fixed amount discount</option>
                <option>Buy one get one</option>
                <option>Multi-buy offer</option>
                <option>Product bundle / combo</option>
                <option>Flash sale</option>
                <option>Free delivery</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Applies to">
              <select value={campaignForm.appliesTo} onChange={(event) => setCampaignForm({ ...campaignForm, appliesTo: event.target.value })} className={inputClass}>
                <option>All menu items</option>
                <option>Selected items</option>
                <option>Signature Grills category</option>
                <option>Fast Food category</option>
                <option>Drinks &amp; Desserts category</option>
              </select>
            </Field>
            <Field label="Eligible customers">
              <select value={campaignForm.eligible} onChange={(event) => setCampaignForm({ ...campaignForm, eligible: event.target.value })} className={inputClass}>
                <option>All customers</option>
                <option>New customers</option>
                <option>Repeat customers</option>
                <option>Orders above PKR 1,500</option>
              </select>
            </Field>
          </div>
          {campaignForm.appliesTo === 'Selected items' ? (
            <Field label="Selected items" hint="Comma-separated item names from your menu.">
              <input
                value={campaignForm.selectedItems}
                onChange={(event) => setCampaignForm({ ...campaignForm, selectedItems: event.target.value })}
                className={inputClass}
                placeholder="e.g. Family Feast, BBQ Platter"
              />
            </Field>
          ) : null}
          {campaignForm.type === 'Flash sale' ? (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Flash sale starts">
                <input type="datetime-local" value={campaignForm.startAt} onChange={(event) => setCampaignForm({ ...campaignForm, startAt: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Flash sale ends">
                <input type="datetime-local" value={campaignForm.endAt} onChange={(event) => setCampaignForm({ ...campaignForm, endAt: event.target.value })} className={inputClass} />
              </Field>
            </div>
          ) : null}
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Field label="Offer value">
              <input value={campaignForm.value} onChange={(event) => setCampaignForm({ ...campaignForm, value: event.target.value })} className={inputClass} placeholder="20% off" />
            </Field>
            <Field label="Usage limit">
              <input type="number" min="1" value={campaignForm.limit} onChange={(event) => setCampaignForm({ ...campaignForm, limit: event.target.value })} className={inputClass} />
            </Field>
            <Field label={campaignForm.type === 'Flash sale' ? 'Schedule note' : 'Schedule'}>
              <input value={campaignForm.schedule} onChange={(event) => setCampaignForm({ ...campaignForm, schedule: event.target.value })} className={inputClass} placeholder={campaignForm.type === 'Flash sale' ? 'Auto from start/end' : 'Fri–Sun, 6–11 PM'} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={campaignForm.description} onChange={(event) => setCampaignForm({ ...campaignForm, description: event.target.value })} rows={2} className={cx(inputClass, 'resize-none')} placeholder="What is included and when is it valid?" />
          </Field>
          <div className="rounded-xl bg-[#FBF3E1] px-3.5 py-2.5 text-[9.5px] leading-relaxed text-[#8E6218]">
            Campaign discounts are deducted from your selling price. JTBazar commission is calculated on the discounted subtotal.
          </div>
        </div>
      </Modal>

      <Modal
        open={couponOpen}
        onClose={() => setCouponOpen(false)}
        title="Create coupon"
        description="Coupon codes work on your shop only and can be paused at any time."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCouponOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveCoupon}>Create coupon</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Coupon code">
              <input value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })} className={cx(inputClass, 'font-mono uppercase')} placeholder="WELCOME100" />
            </Field>
            <Field label="Type">
              <select value={couponForm.type} onChange={(event) => setCouponForm({ ...couponForm, type: event.target.value })} className={inputClass}>
                <option>Percentage</option>
                <option>Flat amount</option>
                <option>Free delivery</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Offer value">
              <input value={couponForm.value} onChange={(event) => setCouponForm({ ...couponForm, value: event.target.value })} className={inputClass} placeholder="15% off" />
            </Field>
            <Field label="Minimum spend (PKR)">
              <input type="number" min="0" value={couponForm.minSpend} onChange={(event) => setCouponForm({ ...couponForm, minSpend: event.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Usage limit">
              <input type="number" min="1" value={couponForm.limit} onChange={(event) => setCouponForm({ ...couponForm, limit: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Expiry date" hint="Use a format like 31 Dec 2026.">
              <input value={couponForm.expiry} onChange={(event) => setCouponForm({ ...couponForm, expiry: event.target.value })} className={inputClass} placeholder="31 Dec 2026" />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
