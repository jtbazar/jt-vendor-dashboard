import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgePercent,
  CalendarDays,
  Clock3,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TicketPercent,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, inputClass, type BadgeTone } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { createVendorPromotion, updateVendorPromotion, listVendorPromotions, removeVendorPromotionImage, uploadVendorPromotionImage, type VendorPromotion } from '../services/marketplaceApi'
import { useApp } from '../store'

const statusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_review: { label: 'Pending review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'forest' },
  rejected: { label: 'Rejected', tone: 'danger' },
  hidden: { label: 'Hidden', tone: 'outline' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const emptyForm = {
  title: '',
  description: '',
  couponCode: '',
  discountPercent: '',
  startDate: '',
  endDate: '',
  ctaText: '',
  ctaDestination: '',
  displayPosition: 'shop_top' as 'shop_top' | 'shop_before_products' | 'shop_after_products',
}

function statusOf(value: unknown) {
  return statusMeta[String(value ?? '')] ?? { label: String(value ?? 'unknown').replaceAll('_', ' '), tone: 'neutral' as BadgeTone }
}

function formatDate(value: unknown) {
  if (!value) return 'Not scheduled'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? 'Not scheduled' : date.toLocaleString()
}

function toIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function PromotionsPage() {
  const { seller } = useVendorAuth()
  const { pushToast } = useApp()
  const [promotions, setPromotions] = useState<VendorPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [editingPromotion, setEditingPromotion] = useState<VendorPromotion | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState('')

  useEffect(() => {
    if (!bannerFile) { setBannerPreview(''); return }
    const url = URL.createObjectURL(bannerFile)
    setBannerPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [bannerFile])

  const load = useCallback(async (quiet = false) => {
    if (!seller?.id) {
      setPromotions([])
      setLoading(false)
      return
    }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      setPromotions(await listVendorPromotions(seller.id))
    } catch (cause) {
      setPromotions([])
      setError(cause instanceof Error ? cause.message : 'Live promotions could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [seller?.id])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => ({
    pending: promotions.filter((row) => row.status === 'pending_review').length,
    approved: promotions.filter((row) => row.status === 'approved').length,
    rejected: promotions.filter((row) => row.status === 'rejected').length,
  }), [promotions])

  const save = async () => {
    if (!seller?.id) {
      pushToast('Promotion unavailable', 'An approved seller profile is required.', 'error')
      return
    }
    setSaving(true)
    try {
      if (!bannerFile && !existingBannerUrl) throw new Error('Please upload a promotion banner image.')
      const discount = form.discountPercent.trim() ? Number(form.discountPercent) : null
      const uploadedBanner = bannerFile ? await uploadVendorPromotionImage(bannerFile) : null
      const bannerImageUrl = uploadedBanner?.url ?? existingBannerUrl
      try {
      const payload = {
        sellerId: seller.id,
        title: form.title,
        description: form.description,
        couponCode: form.couponCode,
        discountPercent: discount,
        startDate: toIso(form.startDate),
        endDate: toIso(form.endDate),
        bannerImageUrl,
        ctaText: form.ctaText,
        ctaDestination: form.ctaDestination,
        displayPosition: form.displayPosition,
      }
      if (editingPromotion) {
        await updateVendorPromotion({ ...payload, promotionId: String(editingPromotion.id) })
      } else {
        await createVendorPromotion(payload)
      }
      } catch (cause) {
        if (uploadedBanner) await removeVendorPromotionImage(uploadedBanner.path).catch(() => undefined)
        throw cause
      }
      pushToast(editingPromotion ? 'Changes submitted for review' : 'Promotion submitted', 'JTBazar Admin will review it before it appears on your shop.', 'success')
      setFormOpen(false)
      setForm(emptyForm)
      setEditingPromotion(null)
      setExistingBannerUrl('')
      setBannerFile(null)
      await load(true)
    } catch (cause) {
      pushToast('Promotion not submitted', cause instanceof Error ? cause.message : 'Please check the details and try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><BadgePercent size={12} /> Growth &amp; offers</>}
        title="Promotions submitted for review."
        description="Seller promotions are read from live marketplace records. New promotions are submitted for JTBazar Admin review; no sample campaigns, coupon records, redemptions or revenue figures are shown."
        actions={
          <>
            <Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}>
              {refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
            </Button>
            <Button
              variant="primary"
              disabled={seller?.status !== 'approved'}
              onClick={() => { setForm(emptyForm); setEditingPromotion(null); setExistingBannerUrl(''); setBannerFile(null); setFormOpen(true) }}
            >
              <Plus size={14} /> Create promotion
            </Button>
          </>
        }
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold text-red-800">Promotions could not be loaded</p>
          <p className="mt-1 text-xs text-red-700">{error}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}>Try again</Button>
        </Card>
      ) : null}

      {seller?.status !== 'approved' ? (
        <Card className="border border-amber-200 bg-amber-50 p-4 text-[10px] leading-relaxed text-amber-800">
          Promotion creation becomes available after your seller application is approved. Existing records, if any, remain read-only.
        </Card>
      ) : null}

      <Card className="grid grid-cols-3 divide-x divide-line overflow-hidden">
        {[
          { label: 'Pending review', value: counts.pending, icon: Clock3 },
          { label: 'Approved', value: counts.approved, icon: Sparkles },
          { label: 'Rejected', value: counts.rejected, icon: TicketPercent },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="flex items-start gap-3 p-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700"><Icon size={14} /></span>
              <div className="min-w-0">
                <p className="font-display text-[17px] font-semibold leading-none text-forest tabular">{loading ? '—' : stat.value}</p>
                <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-wider text-muted">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </Card>

      {loading ? (
        <Card className="flex justify-center p-10 text-xs text-muted"><LoaderCircle size={15} className="mr-2 animate-spin" />Loading live promotions…</Card>
      ) : promotions.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promotion) => {
            const meta = statusOf(promotion.status)
            return (
              <Card key={String(promotion.id)} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-[13px] font-semibold leading-snug text-ink">{String(promotion.title ?? 'Untitled promotion')}</h2>
                    <p className="mt-1 text-[9px] text-muted">{String(promotion.campaign_type ?? 'banner')} · {String(promotion.target_platform ?? 'both')}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                {promotion.banner_image_url ? <img src={String(promotion.banner_image_url)} alt={`${String(promotion.title ?? 'Promotion')} banner`} className="mt-3 h-36 w-full rounded-lg object-cover" loading="lazy" /> : null}
                <p className="mt-2 line-clamp-3 text-[9.5px] leading-relaxed text-muted">{String(promotion.description ?? 'No description was provided for this promotion.')}</p>
                <div className="mt-3 grid gap-2 rounded-lg bg-cream-50 p-3 text-[9px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Coupon code</span>
                    <span className="font-mono font-semibold text-ink">{promotion.coupon_code ? String(promotion.coupon_code) : 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Discount</span>
                    <span className="font-semibold text-forest">{promotion.discount_percent == null ? 'Not set' : `${Number(promotion.discount_percent)}%`}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-muted"><CalendarDays size={10} /> Start</span>
                    <span className="text-right font-semibold text-ink">{formatDate(promotion.start_date ?? promotion.starts_at)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-muted"><CalendarDays size={10} /> End</span>
                    <span className="text-right font-semibold text-ink">{formatDate(promotion.end_date ?? promotion.ends_at)}</span>
                  </div>
                </div>
                {promotion.status === 'rejected' && promotion.rejection_reason ? (
                  <p className="mt-2 rounded-lg bg-red-50 p-2 text-[9px] leading-relaxed text-red-700">Review note: {String(promotion.rejection_reason)}</p>
                ) : null}
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="secondary" disabled={saving} onClick={() => {
                    setEditingPromotion(promotion)
                    setExistingBannerUrl(String(promotion.banner_image_url ?? ''))
                    setBannerFile(null)
                    setForm({
                      title: String(promotion.title ?? ''),
                      description: String(promotion.description ?? ''),
                      couponCode: String(promotion.coupon_code ?? ''),
                      discountPercent: promotion.discount_percent == null ? '' : String(promotion.discount_percent),
                      startDate: promotion.start_date ? new Date(String(promotion.start_date)).toISOString().slice(0, 16) : '',
                      endDate: promotion.end_date ? new Date(String(promotion.end_date)).toISOString().slice(0, 16) : '',
                      ctaText: String(promotion.cta_text ?? ''),
                      ctaDestination: String(promotion.cta_destination ?? ''),
                      displayPosition: (['shop_top', 'shop_before_products', 'shop_after_products'].includes(String(promotion.display_position)) ? String(promotion.display_position) : 'shop_top') as 'shop_top' | 'shop_before_products' | 'shop_after_products',
                    })
                    setFormOpen(true)
                  }}>Edit promotion</Button>
                </div>
                <p className="mt-3 text-[8.5px] text-muted">Created {formatDate(promotion.created_at)}</p>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<BadgePercent size={20} />}
            title="No seller promotions found"
            description="Promotions you submit will appear here with their live review status. No demo offers are created for your shop."
          />
        </Card>
      )}

      <Card className="flex flex-wrap items-start gap-2 p-4 text-[9px] leading-relaxed text-muted">
        <ShieldCheck size={13} className="mt-0.5 flex-none text-sage-700" />
        <p>Promotions are marketplace campaigns, not a separate coupon wallet. Discount pricing is applied by the existing checkout workflow after JTBazar Admin approval; vendor accounts cannot set platform commission or delivery fees.</p>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => { if (!saving) setFormOpen(false) }}
        title={editingPromotion ? "Edit your shop promotion" : "Create a seller promotion"}
        description="Only your shop banner is supported. New or edited promotions need JTBazar Admin approval."
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving || form.title.trim().length < 3 || (!bannerFile && !existingBannerUrl)}>
              {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />} {editingPromotion ? 'Save changes for review' : 'Submit for review'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-lg border border-line bg-cream-50 p-3 text-[9px] leading-relaxed text-muted">
            <strong className="text-ink">Your shop only:</strong> Choose one of the three banner positions on your own shop page. JTBazar Admin approval is required before customers can see it. Homepage ads, popups, app placement and approval status stay under Admin control.
          </div>
          <Field label="Promotion title" className="sm:col-span-2">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} placeholder="e.g. Weekend shop offer" />
          </Field>
          <Field label="Promotion banner image" hint="Required. JPG, PNG, WebP or AVIF · Maximum 5 MB." className="sm:col-span-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)}
              className={inputClass}
            />
            {bannerPreview || existingBannerUrl ? (
              <div className="mt-2 space-y-2">
                <img src={bannerPreview || existingBannerUrl} alt="Promotion banner preview" className="h-40 w-full rounded-lg border border-line object-cover" />
                <Button size="sm" variant="secondary" onClick={() => { setBannerFile(null); setExistingBannerUrl('') }} disabled={saving}>Remove image</Button>
              </div>
            ) : null}
          </Field>
          <Field label="Show banner at" className="sm:col-span-2">
            <select value={form.displayPosition} onChange={(event) => setForm({ ...form, displayPosition: event.target.value as 'shop_top' | 'shop_before_products' | 'shop_after_products' })} className={inputClass}>
              <option value="shop_top">Top of shop — below shop header</option>
              <option value="shop_before_products">Before products — after shop details and reviews</option>
              <option value="shop_after_products">After products — below the product list</option>
            </select>
            <span className="mt-1 block text-[9px] text-muted">Choose where customers will see this banner on your own shop page.</span>
          </Field>
          <Field label="Discount percent" hint="Optional. Must be between 0 and 100.">
            <input type="number" min="0" max="100" step="0.01" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} className={inputClass} placeholder="10" />
          </Field>
          <Field label="Coupon code" hint="Optional. Stored on the promotion record.">
            <input value={form.couponCode} onChange={(event) => setForm({ ...form, couponCode: event.target.value.toUpperCase() })} className={inputClass} placeholder="WEEKEND10" />
          </Field>
          <Field label="Starts at">
            <input type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Ends at">
            <input type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Button text (optional)">
            <input value={form.ctaText} onChange={(event) => setForm({ ...form, ctaText: event.target.value })} className={inputClass} placeholder="e.g. Shop now" maxLength={40} />
          </Field>
          <Field label="Button link (optional)" hint="Use a link to a product or page in your own shop.">
            <input value={form.ctaDestination} onChange={(event) => setForm({ ...form, ctaDestination: event.target.value })} className={inputClass} placeholder="/shop/your-product" maxLength={500} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} h-auto py-2`} placeholder="Tell customers what this promotion offers." />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
