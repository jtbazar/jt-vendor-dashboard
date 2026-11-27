import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info, LoaderCircle, RefreshCw, Star } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { listVendorReviews, type VendorReview } from '../services/marketplaceApi'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(value => (
        <Star key={value} size={13} className={value <= rating ? 'fill-[#D9A441] text-[#D9A441]' : 'text-[#D8D8CF]'} />
      ))}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return 'Date not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date not available' : date.toLocaleDateString()
}

export function ReviewsPage() {
  const { seller } = useVendorAuth()
  const [reviews, setReviews] = useState<VendorReview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<'all' | 'shop' | 'product'>('all')

  const load = useCallback(async (quiet = false) => {
    if (!seller?.id) {
      setReviews([])
      setLoading(false)
      return
    }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const result = await listVendorReviews(String(seller.id))
      setReviews(result.reviews)
    } catch (cause) {
      setReviews([])
      setError(cause instanceof Error ? cause.message : 'Live reviews could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [seller?.id])

  useEffect(() => { void load() }, [load])

  const visible = useMemo(
    () => reviews.filter(review => source === 'all' || review.source === source),
    [reviews, source],
  )
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
  const shopCount = reviews.filter(review => review.source === 'shop').length
  const productCount = reviews.filter(review => review.source === 'product').length

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Star size={12} /> Customer feedback</>}
        title="Reviews for your shop."
        description="Read-only approved reviews for your shop and your own products. This page does not create, edit, reply to, or publish reviews."
        actions={<Button variant="secondary" onClick={() => void load(true)} disabled={loading || refreshing}>
          {refreshing ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </Button>}
      />
      {error ? <Card className="border border-red-200 bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Reviews could not be loaded</p><p className="mt-1 text-xs text-red-700">{error}</p><Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}>Try again</Button></Card> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading ? '—' : average.toFixed(1)}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Average rating</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading ? '—' : shopCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Shop reviews</p></Card>
        <Card className="col-span-2 p-4 sm:col-span-1"><p className="font-display text-2xl font-semibold text-forest tabular">{loading ? '—' : productCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Product reviews</p></Card>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1" role="group" aria-label="Review type">
          {([['all', 'All reviews'], ['shop', 'Shop'], ['product', 'Products']] as const).map(([value, label]) => (
            <Button key={value} size="sm" variant={source === value ? 'soft' : 'ghost'} onClick={() => setSource(value)}>{label}</Button>
          ))}
        </div>
        <p className="text-[9px] text-muted">Only reviews already approved on JTBazar are shown.</p>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-xs text-muted"><LoaderCircle size={16} className="animate-spin" />Loading live reviews…</div>
        ) : visible.length ? (
          <div className="divide-y divide-line">
            {visible.map(review => (
              <article key={`${review.source}-${review.id}`} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Stars rating={review.rating} /><Badge tone={review.source === 'shop' ? 'sage' : 'neutral'}>{review.source === 'shop' ? 'Shop' : 'Product'}</Badge></div>
                    <p className="mt-1.5 text-xs font-semibold text-ink">{review.title || review.targetName}</p>
                    {review.title ? <p className="mt-0.5 text-[9px] text-muted">{review.targetName}</p> : null}
                  </div>
                  <p className="text-[9px] text-muted">{formatDate(review.createdAt)}</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#555B52]">{review.comment || 'No written comment was provided.'}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center"><Star size={24} className="mx-auto text-muted" /><p className="mt-2 text-xs font-semibold text-ink">{reviews.length ? 'No reviews of this type' : 'No approved reviews yet'}</p><p className="mt-1 text-[9px] text-muted">Published buyer reviews will appear here automatically. Nothing is simulated.</p></div>
        )}
      </Card>
      <div className="flex items-start gap-2 rounded-xl border border-line bg-cream-50 p-3 text-[10px] leading-relaxed text-muted"><Info size={14} className="mt-0.5 flex-none text-sage-700" /><p>Reviews are managed by JTBazar moderation. Vendor access here is read-only; replying, editing or removing reviews is not available.</p></div>
    </div>
  )
}
