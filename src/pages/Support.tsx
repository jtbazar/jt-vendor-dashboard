import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Banknote,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  ReceiptText,
  Search,
  Send,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  inputClass,
} from '../components/ui'
import { useApp } from '../store'
import { supportTickets, type SupportTicket } from '../data/mock'
import { cx } from '../utils'

const statusTone = {
  Open: 'clay',
  'In progress': 'amber',
  Resolved: 'sage',
} as const

const categoryMeta: Record<string, { icon: LucideIcon; className: string }> = {
  Finance: { icon: Banknote, className: 'bg-[#FBF3E1] text-[#8E6218]' },
  'Order issue': { icon: ReceiptText, className: 'bg-clay-100 text-clay-700' },
  'Shop settings': { icon: Store, className: 'bg-sage-100 text-sage-700' },
}

const categories = ['Order issue', 'Finance', 'Shop settings', 'Account & access', 'Something else']

const helpTopics = [
  {
    title: 'Orders & delivery',
    detail: 'Late riders, missing items, cancellations and refunds.',
    icon: ReceiptText,
    category: 'Order issue',
  },
  {
    title: 'Payments & settlements',
    detail: 'COD reconciliation, commission and weekly payouts.',
    icon: Wallet,
    category: 'Finance',
  },
  {
    title: 'Menu & shop settings',
    detail: 'Prices, stock, opening hours and delivery areas.',
    icon: Store,
    category: 'Shop settings',
  },
]

const filters = ['All', 'Open', 'In progress', 'Resolved'] as const
type Filter = (typeof filters)[number]

export function SupportPage() {
  const { pushToast } = useApp()
  const [tickets, setTickets] = useState<SupportTicket[]>(supportTickets)
  const [selectedId, setSelectedId] = useState(supportTickets[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [reply, setReply] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [message, setMessage] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0]
  const openCount = tickets.filter((ticket) => ticket.status !== 'Resolved').length
  const resolvedCount = tickets.filter((ticket) => ticket.status === 'Resolved').length

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesFilter = filter === 'All' || ticket.status === filter
      const matchesQuery =
        !needle ||
        ticket.subject.toLowerCase().includes(needle) ||
        ticket.preview.toLowerCase().includes(needle) ||
        ticket.category.toLowerCase().includes(needle)
      return matchesFilter && matchesQuery
    })
  }, [tickets, filter, query])

  useEffect(() => {
    const node = threadRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [selectedId, tickets])

  const patchTicket = (id: string, patch: Partial<SupportTicket>) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket)),
    )
  }

  const sendReply = () => {
    if (!selected) return
    const text = reply.trim()
    if (!text) {
      pushToast('Nothing to send', 'Write a message before hitting send.', 'error')
      return
    }
    const nextMessages = [
      ...selected.messages,
      { from: 'vendor' as const, text, time: 'Just now' },
    ]
    patchTicket(selected.id, {
      messages: nextMessages,
      status: selected.status === 'Resolved' ? 'Open' : selected.status,
      preview: text,
      time: 'Just now',
    })
    setReply('')
    pushToast('Message sent', 'The JTBazar support team will reply in this thread.', 'success')
  }

  const resolveTicket = () => {
    if (!selected) return
    patchTicket(selected.id, { status: 'Resolved' })
    pushToast('Ticket resolved', `“${selected.subject}” has been marked resolved.`, 'success')
  }

  const openComposer = (presetCategory?: string) => {
    setCategory(presetCategory ?? categories[0])
    setSubject('')
    setMessage('')
    setComposerOpen(true)
  }

  const selectTicket = (id: string) => {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 1279px)').matches) {
      window.setTimeout(() => {
        document.getElementById('ticket-thread')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  const createTicket = () => {
    if (!subject.trim() || !message.trim()) {
      pushToast('Add a few details', 'A subject and a short description are required.', 'error')
      return
    }
    const ticket: SupportTicket = {
      id: `t-${Date.now()}`,
      subject: subject.trim(),
      preview: message.trim(),
      category,
      status: 'Open',
      time: 'Just now',
      messages: [{ from: 'vendor', text: message.trim(), time: 'Just now' }],
    }
    setTickets((current) => [ticket, ...current])
    setSelectedId(ticket.id)
    setFilter('All')
    setQuery('')
    setComposerOpen(false)
    pushToast('Ticket created', 'Our vendor support team usually replies within 30 minutes.', 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><LifeBuoy size={12} /> Vendor support</>}
        title="Help is one message away."
        description="Support ticket records will be loaded from the seller support API. Demo conversations have been removed; ticket creation is disabled until this page is connected to the live support service."
        actions={
          <>
            <Button
              variant="secondary"
              disabled
            >
              <Phone size={14} /> Request a call
            </Button>
            <Button variant="primary" disabled>
              <Plus size={14} /> New ticket
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Open tickets</p>
              <p className="mt-2 font-display text-[24px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">{openCount}</p>
              <p className="mt-1.5 text-[8.5px] text-[#9AA093]">Across all categories</p>
            </div>
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-clay-100 text-clay-700">
              <MessageSquare size={14} />
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">First response</p>
              <p className="mt-2 font-display text-[24px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">18 min</p>
              <p className="mt-1.5 text-[8.5px] text-sage-700">Within SLA · 30 min target</p>
            </div>
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700">
              <Clock3 size={14} />
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Resolved</p>
              <p className="mt-2 font-display text-[24px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">{resolvedCount + 21}</p>
              <p className="mt-1.5 text-[8.5px] text-[#9AA093]">This month · 96% satisfaction</p>
            </div>
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-sage-100 text-sage-700">
              <CheckCircle2 size={14} />
            </span>
          </div>
        </Card>
        <section className="relative overflow-hidden rounded-2xl bg-forest p-4 text-cream-50 shadow-card">
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full border border-white/10" />
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sage-300">Your account manager</p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <Avatar name="Areeba Farooq" size={32} />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">Areeba Farooq</p>
              <p className="text-[8.5px] text-cream-200/60">Karachi vendor desk</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[8.5px] text-cream-200/70">
            <span className="inline-flex items-center gap-1"><Mail size={9} /> areeba@jtbazar.pk</span>
            <span>10a – 10p</span>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.35fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-[#F0EDE4] px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14px] font-semibold text-forest">Your tickets</h2>
              <span className="text-[9px] text-muted">{filtered.length} shown</span>
            </div>
            <div className="relative mt-2.5">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets…"
                className="h-9 w-full rounded-lg border border-line bg-[#FBFAF5] pl-[34px] pr-3 text-[10.5px] text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-200"
              />
            </div>
            <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {filters.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={cx(
                    'flex-none rounded-full px-2.5 py-1 text-[9px] font-semibold transition',
                    filter === option
                      ? 'bg-forest text-cream-50'
                      : 'bg-[#F3F0E7] text-[#737A6F] hover:bg-[#EBE7DB] hover:text-forest',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<LifeBuoy size={19} />}
                title="No tickets found"
                description="Try another filter or start a new conversation with support."
                action={<Button size="sm" onClick={() => openComposer()}>New ticket</Button>}
              />
            ) : (
              filtered.map((ticket) => {
                const meta = categoryMeta[ticket.category] ?? {
                  icon: MessageSquare,
                  className: 'bg-[#F0EEE7] text-[#737A6F]',
                }
                const Icon = meta.icon
                const active = selected?.id === ticket.id
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => selectTicket(ticket.id)}
                    className={cx(
                      'flex w-full gap-2.5 border-b border-[#F3F0E8] px-4 py-3 text-left transition last:border-0',
                      active ? 'bg-[#F3F7EE]' : 'hover:bg-[#FBFAF5]',
                    )}
                  >
                    <span className={cx('mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg', meta.className)}>
                      <Icon size={12} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cx('line-clamp-1 text-[10.5px] font-semibold', active ? 'text-forest' : 'text-ink')}>
                          {ticket.subject}
                        </span>
                        <span className="flex-none text-[8px] text-muted">{ticket.time}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-[9px] leading-relaxed text-muted">{ticket.preview}</span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <Badge tone={statusTone[ticket.status]} className="px-1.5 py-0.5 text-[8px]">{ticket.status}</Badge>
                        <span className="text-[8px] text-[#9AA093]">{ticket.category}</span>
                        <ChevronRight size={10} className="ml-auto text-[#B3B8AC]" />
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <div id="ticket-thread" className="min-w-0 scroll-mt-24">
        <Card className="flex min-h-[420px] flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="border-b border-[#F0EDE4] px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={statusTone[selected.status]}>{selected.status}</Badge>
                      <Badge tone="outline">{selected.category}</Badge>
                      <span className="font-mono text-[8px] text-[#9AA093]">#{selected.id.toUpperCase()}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-[15px] font-semibold leading-snug tracking-[-0.02em] text-forest">
                      {selected.subject}
                    </h2>
                  </div>
                  {selected.status !== 'Resolved' ? (
                    <Button size="sm" variant="outline" onClick={resolveTicket}>
                      <CheckCircle2 size={12} /> Mark resolved
                    </Button>
                  ) : (
                    <Badge tone="sage"><CheckCircle2 size={10} /> Closed loop</Badge>
                  )}
                </div>
              </div>

              <div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FBFAF5] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9AA093]">
                  <span className="h-px flex-1 bg-[#EDE9DE]" />
                  Conversation
                  <span className="h-px flex-1 bg-[#EDE9DE]" />
                </div>
                {selected.messages.map((entry, index) => {
                  const fromSupport = entry.from === 'support'
                  return (
                    <div key={`${selected.id}-${index}`} className={cx('flex items-end gap-2', fromSupport ? 'justify-start' : 'justify-end')}>
                      {fromSupport ? (
                        <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-forest text-[8px] font-bold text-cream-50">JT</span>
                      ) : null}
                      <div className={cx('max-w-[82%]', fromSupport ? 'items-start' : 'items-end')}>
                        <div
                          className={cx(
                            'rounded-2xl px-3.5 py-2.5 text-[10.5px] leading-relaxed shadow-sm',
                            fromSupport
                              ? 'rounded-bl-md border border-line bg-white text-[#3F4A3E]'
                              : 'rounded-br-md bg-forest text-cream-50',
                          )}
                        >
                          {entry.text}
                        </div>
                        <p className={cx('mt-1 text-[8px] text-[#9AA093]', fromSupport ? 'text-left' : 'text-right')}>
                          {fromSupport ? 'JTBazar support' : 'You'} · {entry.time}
                        </p>
                      </div>
                      {!fromSupport ? <Avatar name="Vendor" size={24} /> : null}
                    </div>
                  )
                })}
                {selected.status === 'Resolved' ? (
                  <div className="flex items-center justify-center gap-1.5 pt-1 text-[8.5px] text-sage-700">
                    <CheckCircle2 size={11} /> This ticket was resolved by you
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line bg-white px-4 py-3 sm:px-5">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault()
                        sendReply()
                      }
                    }}
                    rows={2}
                    placeholder="Reply to JTBazar support…"
                    className="min-h-[44px] w-full resize-none rounded-xl border border-[#DDD8CB] bg-[#FBFAF5] px-3 py-2.5 text-[11px] leading-relaxed text-ink outline-none transition placeholder:text-[#A4A89E] focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-200"
                  />
                  <Button variant="primary" onClick={sendReply} aria-label="Send message" className="h-11 w-11 flex-none rounded-xl px-0">
                    <Send size={15} />
                  </Button>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[8px] text-[#9AA093]">
                  <span>Attach photos of packing or handover if the case needs evidence.</span>
                  <span className="hidden sm:inline">⌘ + Enter to send</span>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<LifeBuoy size={20} />}
              title="Select a ticket"
              description="Pick a conversation from the list or raise a new one."
              action={<Button size="sm" onClick={() => openComposer()}>New ticket</Button>}
            />
          )}
        </Card>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-[14px] font-semibold text-forest">Frequently asked</h2>
          <button
            type="button"
            onClick={() => pushToast('Help center', 'The full vendor knowledge base would open here.', 'info')}
            className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-sage-700 hover:text-forest"
          >
            Browse all guides <ArrowUpRight size={10} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {helpTopics.map((topic) => {
            const Icon = topic.icon
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => openComposer(topic.category)}
                className="group flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-left shadow-card transition hover:border-[#CBD5C0] hover:shadow-lift"
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-cream-100 text-sage-700">
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-semibold text-ink group-hover:text-forest">{topic.title}</span>
                  <span className="mt-0.5 block text-[9px] leading-relaxed text-muted">{topic.detail}</span>
                </span>
                <ChevronRight size={12} className="ml-auto mt-1 flex-none text-[#B3B8AC] transition group-hover:translate-x-0.5 group-hover:text-forest" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[9.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={12} className="text-sage-600" />
          Support hours: 10:00 AM – 10:00 PM, 7 days a week. Critical payout issues are escalated 24/7.
        </span>
        <span className="text-[8.5px] text-[#9AA093]">Avg. resolution 6h 40m</span>
      </div>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Raise a support ticket"
        description="Share the order number and what happened. Screenshots can be attached from the thread after creating the ticket."
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposerOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createTicket}>Create ticket</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <Field label="Subject">
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Missing item on order #JT-2480"
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="What happened?" hint="Include the order number, time and any detail that helps us check faster.">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Describe the issue…"
              className={cx(inputClass, 'resize-none leading-relaxed')}
            />
          </Field>
          <div className="rounded-xl border border-[#E3EAD9] bg-[#F3F7EE] px-3.5 py-3 text-[9.5px] leading-relaxed text-[#4F584D]">
            <span className="font-semibold text-sage-700">Response promise:</span> vendor support replies within 30 minutes during support hours. Finance cases may take up to one working day while the payment reference is verified.
          </div>
        </div>
      </Modal>
    </div>
  )
}
