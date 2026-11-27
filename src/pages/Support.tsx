import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, FileText, LifeBuoy, LoaderCircle, MessageSquare, Plus, RefreshCw, Send } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  createVendorSupportTicket,
  getVendorCaseEvidenceUrl,
  listVendorCases,
  listVendorSupportMessages,
  listVendorSupportTickets,
  replyToCase,
  sendVendorSupportMessage,
} from '../services/marketplaceApi'

type CaseRow = Record<string, any>
type TicketRow = Record<string, any>
type MessageRow = Record<string, any>

function dateLabel(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function SupportPage() {
  const { seller, user } = useVendorAuth()
  const [tab, setTab] = useState<'cases' | 'tickets'>('cases')
  const [cases, setCases] = useState<CaseRow[]>([])
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [reply, setReply] = useState('')
  const [subject, setSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) { setCases([]); setTickets([]); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [caseRows, ticketRows] = await Promise.all([listVendorCases(), listVendorSupportTickets()])
      setCases(caseRows)
      setTickets(ticketRows)
      setSelectedId(current => current || String(tab === 'cases' ? caseRows[0]?.id ?? '' : ticketRows[0]?.id ?? ''))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cases and support records could not be loaded.')
    } finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { void load() }, [load])

  const activeRows = tab === 'cases' ? cases : tickets
  const selected = activeRows.find(row => String(row.id) === selectedId) ?? activeRows[0] ?? null

  useEffect(() => {
    let active = true
    setMessages([])
    setEvidenceUrl(null)
    if (!selected) return
    if (tab === 'tickets') {
      void listVendorSupportMessages(String(selected.id)).then(rows => { if (active) setMessages(rows) })
        .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Support messages could not be loaded.') })
    } else if (selected.evidence_path) {
      void getVendorCaseEvidenceUrl(String(selected.evidence_path)).then(url => { if (active) setEvidenceUrl(url) })
    }
    return () => { active = false }
  }, [selected?.id, selected?.evidence_path, tab])

  const openCount = useMemo(() => tickets.filter(row => !['resolved','closed'].includes(String(row.status).toLowerCase())).length, [tickets])

  const submitCaseReply = async () => {
    if (!selected || reply.trim().length < 3) return
    setBusy(true); setError('')
    try {
      await replyToCase(String(selected.id), reply)
      setReply('')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your case response could not be sent.') }
    finally { setBusy(false) }
  }

  const submitTicketReply = async () => {
    if (!selected || !reply.trim()) return
    setBusy(true); setError('')
    try {
      await sendVendorSupportMessage(String(selected.id), reply)
      setReply('')
      const rows = await listVendorSupportMessages(String(selected.id))
      setMessages(rows)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your support reply could not be sent.') }
    finally { setBusy(false) }
  }

  const createTicket = async () => {
    if (!seller?.id || !subject.trim() || !newMessage.trim()) return
    setCreating(true); setError('')
    try {
      const id = await createVendorSupportTicket(String(seller.id), subject, newMessage)
      setSubject(''); setNewMessage(''); setTab('tickets'); setSelectedId(id)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your support ticket could not be created.') }
    finally { setCreating(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={<><LifeBuoy size={12}/> Seller cases & support</>} title="Cases and support, connected live." description="Customer cases, evidence and seller responses use the existing marketplace case service. Support tickets and replies use your signed-in seller account." actions={<Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</Button>}/>
      {error ? <Card className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</Card> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading?'—':cases.length}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Customer cases</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-forest tabular">{loading?'—':tickets.length}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Support tickets</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-amber-700 tabular">{loading?'—':openCount}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Open tickets</p></Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tab==='cases'?'primary':'secondary'} onClick={()=>{setTab('cases');setSelectedId(String(cases[0]?.id??''))}}>Customer cases</Button>
        <Button size="sm" variant={tab==='tickets'?'primary':'secondary'} onClick={()=>{setTab('tickets');setSelectedId(String(tickets[0]?.id??''))}}>Support tickets</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.3fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-line p-4"><h2 className="font-display text-sm font-semibold text-forest">{tab==='cases'?'Customer cases':'Your support tickets'}</h2><p className="mt-1 text-[9px] text-muted">{activeRows.length} live records</p></div>
          {loading ? <div className="flex justify-center p-10 text-muted"><LoaderCircle size={17} className="animate-spin"/></div> : activeRows.length ? <div className="divide-y divide-line">{activeRows.map(row=><button key={row.id} onClick={()=>setSelectedId(String(row.id))} className={`block w-full p-4 text-left hover:bg-cream-50 ${String(selected?.id)===String(row.id)?'bg-sage-50':''}`}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-ink">{tab==='cases'?String(row.case_type??'Customer case').replaceAll('_',' '):row.subject}</span><Badge tone={String(row.status).toLowerCase()==='resolved'?'sage':'amber'}>{String(row.status??'unknown').replaceAll('_',' ')}</Badge></div><p className="mt-1 line-clamp-2 text-[9px] text-muted">{tab==='cases'?row.reason:row.message}</p><p className="mt-2 text-[8px] text-muted">{dateLabel(row.created_at)}</p></button>)}</div> : <div className="p-8 text-center"><MessageSquare size={22} className="mx-auto text-muted"/><p className="mt-2 text-xs font-semibold text-ink">No {tab==='cases'?'customer cases':'support tickets'} yet</p><p className="mt-1 text-[9px] text-muted">Live records will appear here when available.</p></div>}
        </Card>
        <Card className="min-h-[360px] p-4 sm:p-5">
          {selected ? <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[9px] uppercase tracking-wider text-muted">{tab==='cases'?'Customer case':'Support ticket'} · {String(selected.id).slice(0,8)}</p><h2 className="mt-1 font-display text-base font-semibold text-forest">{tab==='cases'?String(selected.case_type??'Customer case').replaceAll('_',' '):selected.subject}</h2></div><Badge tone="amber">{String(selected.status??'unknown').replaceAll('_',' ')}</Badge></div>
            <div className="rounded-xl bg-cream-50 p-3"><p className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink">{tab==='cases'?selected.reason:selected.message}</p><p className="mt-2 text-[8px] text-muted">{dateLabel(selected.created_at)}</p></div>
            {tab==='cases' ? <>
              {evidenceUrl ? <a href={evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-semibold text-sage-700"><FileText size={13}/> View customer evidence</a> : null}
              {selected.seller_response ? <div className="rounded-xl border border-line p-3"><p className="text-[9px] font-semibold text-muted">Your previous response</p><p className="mt-1 whitespace-pre-wrap text-[11px] text-ink">{selected.seller_response}</p></div> : null}
              <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4} placeholder="Write your response to this customer case…" className="w-full rounded-xl border border-line bg-white p-3 text-[11px] outline-none focus:border-sage-600"/>
              <Button onClick={()=>void submitCaseReply()} disabled={busy||reply.trim().length<3}><Send size={13}/>{busy?'Sending…':'Send case response'}</Button>
            </> : <>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-cream-50 p-3">{messages.length ? messages.map(message=><div key={message.id} className={`max-w-[85%] rounded-xl p-3 ${message.sender_role==='seller'?'ml-auto bg-forest text-white':'bg-white text-ink'}`}><p className="whitespace-pre-wrap text-[10px]">{message.message}</p><p className="mt-1 text-[8px] opacity-60">{message.sender_role==='seller'?'You':'JTBazar support'} · {dateLabel(message.created_at)}</p></div>) : <p className="text-[10px] text-muted">No replies in this ticket yet.</p>}</div>
              {['resolved','closed'].includes(String(selected.status).toLowerCase()) ? <p className="text-[10px] text-muted">This ticket is closed; replies are unavailable.</p> : <><textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Reply to JTBazar support…" className="w-full rounded-xl border border-line bg-white p-3 text-[11px] outline-none focus:border-sage-600"/><Button onClick={()=>void submitTicketReply()} disabled={busy||!reply.trim()}><Send size={13}/>{busy?'Sending…':'Send reply'}</Button></>}
            </>}
          </div> : <div className="grid min-h-[300px] place-items-center text-center"><div><AlertCircle size={22} className="mx-auto text-muted"/><p className="mt-2 text-xs font-semibold text-ink">Select a live record</p><p className="mt-1 text-[9px] text-muted">Choose a case or ticket from the list.</p></div></div>}
        </Card>
      </div>
      <Card className="p-4 sm:p-5"><div className="flex items-center gap-2"><Plus size={15} className="text-sage-700"/><h2 className="font-display text-sm font-semibold text-forest">Create support ticket</h2></div><div className="mt-3 grid gap-3"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Ticket subject" className="h-10 rounded-lg border border-line px-3 text-[11px] outline-none focus:border-sage-600"/><textarea value={newMessage} onChange={e=>setNewMessage(e.target.value)} rows={3} placeholder="Describe the issue and include relevant order details…" className="rounded-lg border border-line p-3 text-[11px] outline-none focus:border-sage-600"/><div><Button onClick={()=>void createTicket()} disabled={creating||!subject.trim()||!newMessage.trim()||!seller?.id}>{creating?<LoaderCircle size={13} className="animate-spin"/>:<Plus size={13}/>} Create ticket</Button></div></div></Card>
    </div>
  )
}
