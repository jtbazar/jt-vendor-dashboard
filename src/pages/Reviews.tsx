import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  MessageSquare,
  Reply,
  Search,
  Star,
  ThumbsUp,
  Timer,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Progress,
  Stars,
} from '../components/ui'
import { Donut } from '../components/charts'
import { useApp } from '../store'
import { ratingBreakdown, store } from '../data/mock'
import { cx } from '../utils'

const filterOptions = [
  { key: 'all', label: 'All reviews' },
  { key: '5', label: '5 star' },
  { key: '4', label: '4 star' },
  { key: '3', label: '3 star' },
  { key: 'replied', label: 'Replied' },
  { key: 'unreplied', label: 'Needs reply' },
] as const

type FilterKey = (typeof filterOptions)[number]['key']

export function ReviewsPage() {
  const { reviews, replyToReview, pushToast } = useApp()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const totalReviews = ratingBreakdown.reduce((sum, row) => sum + row.count, 0)
  const unreplied = reviews.filter((review) => !review.replied).length
  const replyRate = Math.round(((reviews.length - unreplied) / Math.max(1, reviews.length)) * 100)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return reviews
      .filter((review) => {
        if (filter === 'all') return true
        if (filter === 'replied') return review.replied
        if (filter === 'unreplied') return !review.replied
        return review.rating === Number(filter)
      })
      .filter((review) =>
        needle
          ? review.customer.toLowerCase().includes(needle) ||
            review.text.toLowerCase().includes(needle) ||
            review.order.toLowerCase().includes(needle)
          : true,
      )
  }, [reviews, filter, search])

  const sendReply = (id: string) => {
    if (!replyText.trim()) {
      pushToast('Reply is empty', 'Write a short response before sending.', 'error')
      return
    }
    replyToReview(id, replyText.trim())
    pushToast('Reply published', 'Your response is now visible on the JTBazar storefront.', 'success')
    setReplyingTo(null)
    setReplyText('')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Star size={12} /> Customer feedback</>}
        title="Reputation is a kitchen metric."
        description="Only verified seller reviews should appear here. The live seller-review feed is not connected yet, so sample ratings and feedback have been removed."
        actions={
          <>
            <Button variant="secondary" disabled>
              Export feedback
            </Button>
            <Button variant="primary" disabled>
              View public page <ArrowUpRight size={14} />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
        <Card className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex flex-none flex-col items-center border-[#F0EDE4] px-2 sm:border-r sm:pr-7">
              {totalReviews > 0 ? (
                <>
                  <p className="font-display text-[52px] font-semibold leading-none tracking-[-0.06em] text-forest tabular">{store.rating.toFixed(1)}</p>
                  <Stars rating={store.rating} size={15} className="mt-2" />
                  <p className="mt-1.5 text-[9.5px] text-muted">{totalReviews.toLocaleString()} verified reviews</p>
                </>
              ) : (
                <p className="max-w-[150px] py-5 text-center text-[11px] text-muted">No verified customer reviews yet.</p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Rating breakdown</p>
                <span className="text-[9px] text-muted">Last 12 months</span>
              </div>
              <div className="mt-2.5 grid gap-1.5">
                {ratingBreakdown.map((row) => (
                  <div key={row.stars} className="flex items-center gap-2.5">
                    <span className="inline-flex w-8 flex-none items-center gap-1 text-[9px] font-medium text-[#5C655A]">
                      {row.stars} <Star size={8} className="fill-[#C58B3C] text-[#C58B3C]" />
                    </span>
                    <Progress value={(row.count / totalReviews) * 100} className="h-1.5 flex-1 bg-[#F0EDE4]" barClassName={row.stars >= 4 ? 'bg-sage-600' : row.stars === 3 ? 'bg-[#C08A2A]' : 'bg-clay'} />
                    <span className="w-9 flex-none text-right text-[9px] text-muted tabular">{row.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted">
                <span className="inline-flex items-center gap-1"><Star size={9} className="fill-[#C58B3C] text-[#C58B3C]" /> 88% are 4 stars or higher</span>
                <span>·</span>
                <span>+34 new reviews this month</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <Donut
            segments={[
              { label: 'Replied', value: replyRate, color: '#4F6B3C' },
              { label: 'Awaiting reply', value: 100 - replyRate, color: '#E7E3D8' },
            ]}
            centerValue={`${replyRate}%`}
            centerLabel="reply rate"
            size={118}
            strokeWidth={13}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Response health</p>
            <h2 className="mt-1 font-display text-[15px] font-semibold tracking-[-0.02em] text-forest">Keep it personal</h2>
            <div className="mt-2.5 grid gap-2 text-[9.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted"><MessageSquare size={10} /> Needs reply</span>
                <span className="font-semibold text-ink">{unreplied}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted"><Timer size={10} /> Avg reply time</span>
                <span className="font-semibold text-ink">4h 12m</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted"><Star size={10} /> This month</span>
                <span className="font-semibold text-sage-700">+34 reviews</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {filterOptions.map((option) => {
            const count =
              option.key === 'all'
                ? reviews.length
                : option.key === 'replied'
                  ? reviews.filter((review) => review.replied).length
                  : option.key === 'unreplied'
                    ? unreplied
                    : reviews.filter((review) => review.rating === Number(option.key)).length
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className={cx(
                  'flex-none rounded-full border px-3.5 py-2 text-[10.5px] font-semibold transition',
                  filter === option.key
                    ? 'border-forest bg-forest text-cream-50'
                    : 'border-line bg-white text-[#62695F] hover:border-[#D6D1C3] hover:text-forest',
                )}
              >
                {option.label} <span className={cx('ml-1 text-[8.5px]', filter === option.key ? 'text-cream-200/70' : 'text-[#9AA093]')}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="relative min-w-0 lg:w-[280px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reviews or order…"
            className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star size={20} />}
            title="No reviews match these filters"
            description="Try clearing the search or selecting a different rating."
            action={<Button size="sm" onClick={() => { setFilter('all'); setSearch('') }}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={review.customer} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11.5px] font-semibold text-ink">{review.customer}</p>
                        <span className="text-[8.5px] text-muted">·</span>
                        <span className="text-[9px] text-muted">{review.time}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars rating={review.rating} size={11} />
                        <span className="text-[8.5px] font-medium text-[#8A6A2E]">{review.rating}.0</span>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#FBFAF5] px-2 py-1 font-mono text-[8.5px] font-semibold text-[#8B9187]">
                      {review.order}
                    </span>
                  </div>
                  <p className="mt-2 text-[10.5px] leading-relaxed text-[#4F584D]">{review.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {review.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#F4F1E8] px-2 py-0.5 text-[8px] font-medium text-[#737A6F]">
                        {tag}
                      </span>
                    ))}
                    {review.replied ? (
                      <Badge tone="sage" className="ml-auto">Replied</Badge>
                    ) : (
                      <Badge tone="amber" className="ml-auto">Needs reply</Badge>
                    )}
                  </div>

                  {review.replied && review.reply ? (
                    <div className="mt-2.5 rounded-lg border border-[#E3EAD9] bg-[#F3F7EE] px-3 py-2.5">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-sage-700">Your reply</p>
                      <p className="mt-1 text-[9.5px] leading-relaxed text-[#4F584D]">{review.reply}</p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="mt-2.5">
                      <textarea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="Thank the customer and address their feedback…"
                        className="w-full resize-none rounded-lg border border-[#DDD8CB] bg-white px-3 py-2 text-[10.5px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
                      />
                      <div className="mt-1.5 flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText('') }}>Cancel</Button>
                        <Button size="sm" variant="primary" onClick={() => sendReply(review.id)}>Publish reply</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(review.id)
                        setReplyText('')
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-semibold text-sage-700 transition hover:bg-sage-100"
                    >
                      <Reply size={11} /> Reply publicly
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-line bg-white px-4 py-3 text-[9.5px] leading-relaxed text-muted">
        <strong className="font-semibold text-ink">Reply policy:</strong> keep responses professional and avoid sharing customer phone numbers or addresses publicly. For order-specific refunds, use the support ticket flow instead of a public reply.
      </div>
    </div>
  )
}
