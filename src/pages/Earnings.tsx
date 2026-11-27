import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Bike,
  CalendarDays,
  CheckCircle2,
  Download,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  Upload,
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
import { useApp } from '../store'
import { ledger, settlements, store, type LedgerType } from '../data/mock'
import { cx, formatPKR } from '../utils'

const typeTone: Record<LedgerType, 'sage' | 'amber' | 'neutral' | 'forest' | 'danger'> = {
  'COD collection': 'sage',
  Commission: 'amber',
  'Delivery fee': 'neutral',
  Settlement: 'forest',
  Refund: 'danger',
}

export function EarningsPage() {
  const { pushToast } = useApp()
  const [tab, setTab] = useState<'ledger' | 'settlements'>('ledger')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payment, setPayment] = useState({ method: 'Bank transfer', reference: '', amount: '0' })

  const gross = ledger.filter((entry) => entry.type === 'COD collection').reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  const commission = ledger.filter((entry) => entry.type === 'Commission').reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  const net = gross - commission
  const codWithVendor = settlements.reduce((sum, entry) => sum + Number(entry.codWithVendor || 0), 0)
  const codWithJtb = Math.max(0, gross - codWithVendor)
  const commissionDue = ledger.filter((entry) => entry.type === 'Commission' && entry.status === 'Pending').reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  const jtbCommission = Math.max(0, commission - commissionDue)
  const jtbPayable = codWithJtb - jtbCommission
  const transfer = net - codWithVendor
  const vendorPays = transfer < 0

  const submitPayment = () => {
    if (!payment.reference.trim() || !payment.amount.trim()) {
      pushToast('Payment reference required', 'Add the method, amount and transaction reference before submitting.', 'error')
      return
    }
    pushToast(
      'Payment proof submitted',
      `${payment.method} · ${payment.reference.trim()} sent to JTBazar Admin for verification.`,
      'success',
    )
    setPaymentOpen(false)
    setPayment({ method: 'Bank transfer', reference: '', amount: String(commissionDue) })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Wallet size={12} /> Money &amp; settlements</>}
        title="COD, commission, one clear ledger."
        description="Own-rider and pickup cash stays with you; JTBazar-rider cash is collected by the platform. Every commission entry is reconciled weekly and Admin verifies the payment before it is marked paid."
        actions={
          <>
            <Button variant="secondary" onClick={() => pushToast('Statement download', 'A PDF statement for 17–23 Nov would download here.', 'info')}>
              <Download size={14} /> Download statement
            </Button>
            <Button variant="primary" onClick={() => setPaymentOpen(true)}>
              <Upload size={14} /> Record payment proof
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className="relative overflow-hidden rounded-2xl bg-forest p-5 text-cream-50 shadow-card sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sage-400/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-sage-300">
                  {vendorPays ? 'Commission payable to JTBazar' : 'Net settlement due to you'}
                </p>
                <p className="mt-2 font-display text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-none tracking-[-0.05em] tabular">
                  {formatPKR(Math.abs(transfer))}
                </p>
                <p className="mt-2 text-[9.5px] text-cream-200/60">
                  {vendorPays ? 'You pay JTBazar on Mon, 24 Nov' : 'JTBazar pays you on Mon, 24 Nov'} · after COD offset
                </p>
              </div>
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sage-300">
                <Landmark size={18} />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.055] px-3 py-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-cream-200/50">COD with you</p>
                <p className="mt-1 font-display text-[15px] font-semibold tabular">{formatPKR(codWithVendor)}</p>
                <p className="mt-0.5 text-[8px] text-cream-200/45">Own rider + pickup</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.055] px-3 py-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-cream-200/50">Commission due</p>
                <p className="mt-1 font-display text-[15px] font-semibold tabular">{formatPKR(commissionDue)}</p>
                <p className="mt-0.5 text-[8px] text-cream-200/45">On COD you collected</p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.055] px-3 py-2.5 sm:col-span-1">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-cream-200/50">JTBazar rider payable</p>
                <p className="mt-1 font-display text-[15px] font-semibold tabular">{formatPKR(jtbPayable)}</p>
                <p className="mt-0.5 text-[8px] text-cream-200/45">After commission &amp; delivery</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[9px] text-cream-200/60">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={11} className="text-sage-300" /> Admin-verified weekly settlement</span>
              <span>Bank transfer · HBL •• 4821</span>
            </div>
          </div>
        </section>

        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">Next settlement</p>
              <p className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.04em] text-forest">Mon, 24 Nov</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream-100 text-sage-700">
              <CalendarDays size={16} />
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-[#FBFAF5] p-3">
            <div className="flex items-center justify-between text-[9px] text-muted">
              <span>Weekly cycle</span>
              <span>5 of 7 days</span>
            </div>
            <Progress value={71} className="mt-2 h-1.5 bg-[#E9E4D7]" />
            <div className="mt-2.5 flex items-center justify-between text-[9.5px]">
              <span className="text-muted">{vendorPays ? 'You pay JTBazar' : 'JTBazar pays you'}</span>
              <span className="font-semibold text-forest">{formatPKR(Math.abs(transfer))}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">Last settlement</span>
              <span className="font-semibold text-ink">{formatPKR(settlements[1].transfer)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Paid on</span>
              <span className="font-semibold text-ink">18 Nov 2026</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => pushToast('Settlement settings', 'Bank and wallet details are managed in Settings → Payout details.', 'info')}
            className="mt-auto flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[9.5px] font-semibold text-forest transition hover:bg-cream-50"
          >
            Settlement settings <ArrowUpRight size={11} />
          </button>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Gross food sales', value: gross, note: '17 – 23 Nov', icon: ReceiptText, accent: false },
          { label: 'JTBazar commission', value: commission, note: `${store.commissionRate}% of food subtotal`, icon: Banknote, accent: true },
          { label: 'Net earnings', value: net, note: 'After commission', icon: Wallet, accent: false },
          { label: 'COD collected by you', value: codWithVendor, note: 'Own rider + pickup', icon: CheckCircle2, accent: false },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                  <p className="mt-2 truncate font-display text-[21px] font-semibold leading-none tracking-[-0.05em] text-forest tabular">{formatPKR(stat.value)}</p>
                  <p className="mt-1.5 text-[8.5px] text-[#9AA093]">{stat.note}</p>
                </div>
                <span className={cx('grid h-8 w-8 flex-none place-items-center rounded-lg', stat.accent ? 'bg-[#FBF3E1] text-[#8E6218]' : 'bg-cream-100 text-sage-700')}>
                  <Icon size={14} />
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FBF3E1] text-[#8E6218]">
                  <Bike size={16} />
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold text-ink">Own rider or customer pickup</p>
                  <p className="text-[9px] text-muted">You collect cash from the customer</p>
                </div>
              </div>
              <Badge tone="amber">You pay commission</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">COD collected by you</span>
                <span className="font-semibold text-ink tabular">{formatPKR(codWithVendor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Commission due · {store.commissionRate}%</span>
                <span className="font-semibold text-[#A14B38] tabular">− {formatPKR(commissionDue)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#F0EDE4] pt-2">
                <span className="font-semibold text-ink">Cash you keep before settlement</span>
                <span className="font-display text-[14px] font-semibold text-forest tabular">{formatPKR(codWithVendor - commissionDue)}</span>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-[#FBFAF5] px-3 py-2 text-[8.5px] leading-relaxed text-muted">
              Settle the commission weekly by bank transfer, Easypaisa, JazzCash or an approved manual collection. Admin verifies the payment before marking it paid.
            </p>
          </div>

          <div className="border-t border-[#F0EDE4] p-5 lg:border-l lg:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage-100 text-sage-700">
                  <Truck size={16} />
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold text-ink">JTBazar rider</p>
                  <p className="text-[9px] text-muted">JTBazar collects cash from the customer</p>
                </div>
              </div>
              <Badge tone="sage">JTBazar pays you</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">COD collected by JTBazar</span>
                <span className="font-semibold text-ink tabular">{formatPKR(codWithJtb)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Commission deducted · {store.commissionRate}%</span>
                <span className="font-semibold text-[#A14B38] tabular">− {formatPKR(jtbCommission)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#F0EDE4] pt-2">
                <span className="font-semibold text-ink">Net payable to you</span>
                <span className="font-display text-[14px] font-semibold text-forest tabular">{formatPKR(jtbPayable)}</span>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-[#FBFAF5] px-3 py-2 text-[8.5px] leading-relaxed text-muted">
              Delivery fee and rider payment are separate ledger entries. JTBazar pays the restaurant only the food amount after commission.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] bg-[#FBFAF5] px-5 py-3 text-[9px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Store size={11} /> Pickup orders have no delivery fee.</span>
          <span>Commission is always calculated on food subtotal, excluding delivery fee.</span>
        </div>
      </Card>

      <div className="flex gap-1.5">
        {(['ledger', 'settlements'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={cx(
              'rounded-full border px-4 py-2 text-[10.5px] font-semibold capitalize transition',
              tab === option ? 'border-forest bg-forest text-cream-50' : 'border-line bg-white text-[#62695F] hover:text-forest',
            )}
          >
            {option} <span className={cx('ml-1 text-[8.5px]', tab === option ? 'text-cream-200/70' : 'text-[#9AA093]')}>{option === 'ledger' ? ledger.length : settlements.length}</span>
          </button>
        ))}
      </div>

      {tab === 'ledger' ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EDE4] px-5 py-4">
            <div>
              <h2 className="font-display text-[14px] font-semibold text-forest">Commission ledger</h2>
              <p className="mt-0.5 text-[10px] text-muted">Order-level entries · positive amounts are cash in or owed to you; negative amounts are deductions or amounts you owe.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => pushToast('Ledger export', 'A CSV of the ledger would download here.', 'info')}>
              <Download size={12} /> Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                  {['Date', 'Reference', 'Description', 'Type', 'Amount', 'Status'].map((heading) => (
                    <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                    <td className="py-3 pl-5 pr-3 text-[10px] text-[#5C655A] tabular">{entry.date}</td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[9px] font-semibold text-[#737A6F]">{entry.reference}</span>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#4F584D]">{entry.description}</td>
                    <td className="px-3 py-3"><Badge tone={typeTone[entry.type]}>{entry.type}</Badge></td>
                    <td className={cx('px-3 py-3 text-[10.5px] font-semibold tabular', entry.amount >= 0 ? 'text-sage-700' : 'text-[#A14B38]')}>
                      {entry.amount >= 0 ? '+' : '−'} {formatPKR(Math.abs(entry.amount))}
                    </td>
                    <td className="py-3 pl-3 pr-5">
                      <span className={cx('inline-flex items-center gap-1.5 text-[9px] font-semibold', entry.status === 'Paid' ? 'text-sage-700' : entry.status === 'Pending' ? 'text-[#8E6218]' : 'text-[#737A6F]')}>
                        <span className={cx('h-1.5 w-1.5 rounded-full', entry.status === 'Paid' ? 'bg-sage-600' : entry.status === 'Pending' ? 'bg-[#C08A2A]' : 'bg-[#AAB0A4]')} />
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
            <span>Commission is calculated on food subtotal, excluding delivery fee.</span>
            <span>Illustrative rate · final rate set by JTBazar</span>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-[#F0EDE4] px-5 py-4">
            <h2 className="font-display text-[14px] font-semibold text-forest">Settlement history</h2>
            <p className="mt-0.5 text-[10px] text-muted">Weekly manual settlement · bank transfer, Easypaisa or JazzCash. COD already with you is shown separately.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                  {['Period', 'Gross sales', 'Commission', 'Net earnings', 'COD with you', 'Settlement', 'Status', 'Reference'].map((heading) => (
                    <th key={heading} className="px-4 py-2.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-[#9AA093] first:pl-5 last:pr-5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b border-[#F3F0E8] transition hover:bg-[#FBFAF5] last:border-0">
                    <td className="py-3.5 pl-5 pr-3">
                      <p className="text-[10.5px] font-semibold text-ink">{settlement.period}</p>
                      <p className="mt-0.5 text-[8.5px] text-muted">Weekly cycle</p>
                    </td>
                    <td className="px-3 py-3.5 text-[10px] text-[#5C655A] tabular">{formatPKR(settlement.gross)}</td>
                    <td className="px-3 py-3.5 text-[10px] text-[#A14B38] tabular">− {formatPKR(settlement.commission)}</td>
                    <td className="px-3 py-3.5 text-[10px] font-semibold text-forest tabular">{formatPKR(settlement.net)}</td>
                    <td className="px-3 py-3.5 text-[10px] text-[#5C655A] tabular">{formatPKR(settlement.codWithVendor)}</td>
                    <td className="px-3 py-3.5">
                      <p className={cx('text-[10.5px] font-semibold tabular', settlement.transfer >= 0 ? 'text-sage-700' : 'text-[#A14B38]')}>
                        {settlement.transfer >= 0 ? '+' : '−'} {formatPKR(Math.abs(settlement.transfer))}
                      </p>
                      <p className="mt-0.5 text-[8.5px] text-muted">{settlement.transfer >= 0 ? 'JTBazar pays you' : 'You pay JTBazar'}</p>
                    </td>
                    <td className="px-3 py-3.5"><Badge tone={settlement.status === 'Paid' ? 'sage' : 'amber'}>{settlement.status}</Badge></td>
                    <td className="py-3.5 pl-3 pr-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-[#5C655A]">{settlement.reference}</span>
                        <button
                          type="button"
                          onClick={() => pushToast('Statement download', `${settlement.period} statement would download here.`, 'info')}
                          aria-label={`Download ${settlement.period} statement`}
                          className="grid h-7 w-7 flex-none place-items-center rounded-md border border-line bg-white text-[#8B9187] transition hover:text-forest"
                        >
                          <ArrowDownToLine size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] px-4 py-3 text-[9.5px] text-muted">
            <span>Settlement = net earnings − COD already collected by you.</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={11} className="text-sage-600" /> Admin verifies proof before paid</span>
            <span className="w-full text-[8.5px] text-[#9AA093]">Overdue reminders follow JTBazar policy; restrictions apply only after review, never as automatic arbitrary deductions.</span>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { step: '01', title: 'COD collected', detail: 'Own rider/pickup: restaurant collects. JTBazar rider: platform collects.' },
          { step: '02', title: 'Ledger entry', detail: 'Commission, delivery fee and rider payment post separately. Cancelled or refunded orders reverse commission per policy.' },
          { step: '03', title: 'Weekly statement', detail: 'COD already with you is offset against net earnings every Monday.' },
          { step: '04', title: 'Admin verifies', detail: 'Payment proof or reference is checked before the balance is marked paid.' },
        ].map((item) => (
          <div key={item.step} className="rounded-xl border border-line bg-white p-4">
            <span className="font-display text-[10px] font-semibold text-clay">{item.step}</span>
            <p className="mt-1.5 text-[10.5px] font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-[9px] leading-relaxed text-muted">{item.detail}</p>
          </div>
        ))}
      </div>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment proof"
        description="Use this when your statement shows an amount payable to JTBazar. Admin verifies the reference before the ledger is marked paid."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitPayment}>Submit for verification</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Payment method">
              <select value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })} className={inputClass}>
                <option>Bank transfer</option>
                <option>Easypaisa</option>
                <option>JazzCash</option>
                <option>Cash collection</option>
              </select>
            </Field>
            <Field label="Amount (PKR)">
              <input
                type="number"
                min="0"
                value={payment.amount}
                onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Transaction reference" hint="Bank reference, wallet transaction ID or receipt number.">
            <input
              value={payment.reference}
              onChange={(event) => setPayment({ ...payment, reference: event.target.value })}
              className={inputClass}
              placeholder="e.g. HBL-8842190"
            />
          </Field>
          <div className="rounded-xl bg-[#FBF3E1] px-3.5 py-2.5 text-[9.5px] leading-relaxed text-[#8E6218]">
            Payment is not marked paid automatically. JTBazar Admin checks the proof against the commission ledger first.
          </div>
        </div>
      </Modal>
    </div>
  )
}
