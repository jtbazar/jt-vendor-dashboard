import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Bike,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  Minus,
  Moon,
  PauseCircle,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  FoodImage,
  Modal,
  PageHeader,
  Stars,
  Toggle,
  inputClass,
} from '../components/ui'
import { useApp } from '../store'
import { store as shop } from '../data/mock'
import { cx, imageUrl } from '../utils'

type TabKey = 'profile' | 'operations' | 'payouts' | 'notifications' | 'team'

const tabs: Array<{ key: TabKey; label: string; detail: string; icon: LucideIcon }> = [
  { key: 'profile', label: 'Shop profile', detail: 'Public identity', icon: Store },
  { key: 'operations', label: 'Hours & delivery', detail: 'How you operate', icon: Clock3 },
  { key: 'payouts', label: 'Payout details', detail: 'Where money lands', icon: Landmark },
  { key: 'notifications', label: 'Notifications', detail: 'What reaches you', icon: Bell },
  { key: 'team', label: 'Team & access', detail: 'Who can do what', icon: Users },
]

const weekSeed = [
  { day: 'Monday', open: true, from: '11:00', to: '01:00' },
  { day: 'Tuesday', open: true, from: '11:00', to: '01:00' },
  { day: 'Wednesday', open: true, from: '11:00', to: '01:00' },
  { day: 'Thursday', open: true, from: '11:00', to: '01:00' },
  { day: 'Friday', open: true, from: '11:00', to: '01:30' },
  { day: 'Saturday', open: true, from: '11:00', to: '01:30' },
  { day: 'Sunday', open: true, from: '12:00', to: '12:00' },
]

type DayHours = (typeof weekSeed)[number]

type NotifyKey = 'orders' | 'status' | 'stock' | 'reviews' | 'payouts' | 'product'
type NotifyChannel = 'push' | 'sms' | 'email'

const notifySeed: Record<NotifyKey, Record<NotifyChannel, boolean>> = {
  orders: { push: true, sms: true, email: false },
  status: { push: true, sms: false, email: false },
  stock: { push: true, sms: false, email: true },
  reviews: { push: true, sms: false, email: false },
  payouts: { push: true, sms: true, email: true },
  product: { push: false, sms: false, email: true },
}

const notifyRows: Array<{ key: NotifyKey; label: string; detail: string }> = [
  { key: 'orders', label: 'New orders', detail: 'A new COD order lands in the kitchen' },
  { key: 'status', label: 'Order status changes', detail: 'Rider assigned, picked up or delivered' },
  { key: 'stock', label: 'Low stock alerts', detail: 'Ingredients or menu items below par' },
  { key: 'reviews', label: 'New customer reviews', detail: 'Every new rating or written review' },
  { key: 'payouts', label: 'Settlements & payouts', detail: 'Statement ready or payment marked paid' },
  { key: 'product', label: 'JTBazar updates', detail: 'New vendor tools and policy changes' },
]

type TeamRole = 'Owner' | 'Manager' | 'Kitchen lead'

const roleTone: Record<TeamRole, 'forest' | 'sage' | 'neutral'> = {
  Owner: 'forest',
  Manager: 'sage',
  'Kitchen lead': 'neutral',
}

const permissions: Array<{ area: string; owner: boolean; manager: boolean; kitchen: boolean }> = [
  { area: 'View & manage live orders', owner: true, manager: true, kitchen: true },
  { area: 'Edit menu, prices & stock', owner: true, manager: true, kitchen: false },
  { area: 'Approve refunds & cancellations', owner: true, manager: true, kitchen: false },
  { area: 'View earnings & settlements', owner: true, manager: false, kitchen: false },
  { area: 'Change shop & payout settings', owner: true, manager: false, kitchen: false },
  { area: 'Invite or remove teammates', owner: true, manager: false, kitchen: false },
]

const teamSeed = [
  { id: 'u1', name: 'Bilal Ahmed', role: 'Owner' as TeamRole, phone: shop.phone, lastActive: 'Active now' },
  { id: 'u2', name: 'Sana Riaz', role: 'Manager' as TeamRole, phone: '+92 301 5550192', lastActive: '12 min ago' },
  { id: 'u3', name: 'Kashif Mehmood', role: 'Kitchen lead' as TeamRole, phone: '+92 334 8871200', lastActive: '1 hour ago' },
]

const approvedDrivers = [
  { id: 'dr1', name: 'Imran Yousaf', phone: '+92 300 1122334', vehicle: 'Honda CD 70', status: 'Available', jobs: 42, approved: '12 Nov 2026' },
  { id: 'dr2', name: 'Saad Khan', phone: '+92 321 4455667', vehicle: 'Suzuki GD 110', status: 'On delivery', jobs: 38, approved: '8 Nov 2026' },
  { id: 'dr3', name: 'Rehan Ali', phone: '+92 333 7788990', vehicle: 'Honda Pridor', status: 'Off duty', jobs: 27, approved: '2 Nov 2026' },
]

const nearbyRiders = [
  { id: 'nr1', name: 'Waleed Aslam', area: 'DHA Phase 6', distance: '1.2 km', eta: '6 min', jobs: 51 },
  { id: 'nr2', name: 'Noman Bashir', area: 'Bukhari Commercial', distance: '2.4 km', eta: '9 min', jobs: 34 },
]

const businessModules = [
  'Food menu',
  'Sizes & variants',
  'Add-ons & modifiers',
  'Kitchen queue',
  'Prep time',
  'Delivery choice',
  'Approved drivers',
]

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-forest">{title}</h2>
      <p className="mt-0.5 max-w-xl text-[10.5px] leading-relaxed text-muted">{description}</p>
    </div>
  )
}

export function SettingsPage() {
  const { pushToast } = useApp()
  const [tab, setTab] = useState<TabKey>('profile')

  const [name, setName] = useState(shop.name)
  const [tagline, setTagline] = useState(shop.tagline)
  const [phone, setPhone] = useState(shop.phone)
  const [email, setEmail] = useState(shop.email)
  const [address, setAddress] = useState(shop.address)
  const [cuisine, setCuisine] = useState('Pakistani · BBQ · Fast food')
  const [description, setDescription] = useState(
    'Charcoal grills, slow-cooked karahi and family platters made fresh in DHA Phase 6. COD only, delivered hot across DHA and Bukhari Commercial.',
  )
  const [minOrder, setMinOrder] = useState(String(shop.minOrder))
  const [prepTime, setPrepTime] = useState(String(shop.prepTime))

  const [hours, setHours] = useState<DayHours[]>(weekSeed)
  const [fulfilment, setFulfilment] = useState({ jtbazar: true, own: true, pickup: true })
  const [autoAccept, setAutoAccept] = useState(true)
  const [busyMode, setBusyMode] = useState(false)
  const [radius, setRadius] = useState('6')

  const [accountTitle, setAccountTitle] = useState(shop.owner)
  const [bank, setBank] = useState('Habib Bank Limited (HBL)')
  const [iban, setIban] = useState('PK36 HABB 0000 1234 5678 9012')
  const [easypaisa, setEasypaisa] = useState(shop.phone)
  const [jazzcash, setJazzcash] = useState('')

  const [notify, setNotify] = useState(notifySeed)
  const [quietHours, setQuietHours] = useState(true)

  const [team, setTeam] = useState(teamSeed)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('Manager')

  const patchDay = (index: number, patch: Partial<DayHours>) => {
    setHours((current) => current.map((day, i) => (i === index ? { ...day, ...patch } : day)))
  }

  const toggleNotify = (key: NotifyKey, channel: NotifyChannel) => {
    setNotify((current) => ({
      ...current,
      [key]: { ...current[key], [channel]: !current[key][channel] },
    }))
  }

  const save = () => {
    pushToast('Settings saved', 'Your shop profile and preferences were updated for this prototype.', 'success')
  }

  const sendInvite = () => {
    if (!inviteName.trim() || !invitePhone.trim()) {
      pushToast('Missing details', 'Add a name and mobile number to send the invite.', 'error')
      return
    }
    setTeam((current) => [
      ...current,
      {
        id: `u-${Date.now()}`,
        name: inviteName.trim(),
        role: inviteRole,
        phone: invitePhone.trim(),
        lastActive: 'Invite sent just now',
      },
    ])
    setInviteOpen(false)
    setInviteName('')
    setInvitePhone('')
    setInviteRole('Manager')
    pushToast('Invite sent', `${inviteName.trim()} will get an SMS to join as ${inviteRole}.`, 'success')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={<><Store size={12} /> Shop settings</>}
        title="Your shop, your rules."
        description="Keep the public listing accurate, control how orders reach your kitchen and decide where payouts land. Changes here affect the storefront immediately after saving."
        actions={
          <>
            <span className="hidden items-center gap-1.5 text-[9.5px] text-muted sm:inline-flex">
              <ShieldCheck size={12} className="text-sage-600" /> Admin-verified account
            </span>
            <Button variant="primary" onClick={save}>
              <Save size={14} /> Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden p-1.5">
            {tabs.map((item) => {
              const Icon = item.icon
              const active = tab === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition',
                    active ? 'bg-forest text-cream-50 shadow-[0_6px_16px_rgba(36,59,42,0.16)]' : 'hover:bg-[#F5F2E9]',
                  )}
                >
                  <span className={cx('grid h-7 w-7 flex-none place-items-center rounded-lg', active ? 'bg-white/10 text-sage-300' : 'bg-cream-100 text-sage-700')}>
                    <Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-[10.5px] font-semibold', active ? 'text-cream-50' : 'text-ink')}>{item.label}</span>
                    <span className={cx('block text-[8.5px]', active ? 'text-cream-200/60' : 'text-muted')}>{item.detail}</span>
                  </span>
                  <ChevronRight size={12} className={cx('flex-none', active ? 'text-sage-300' : 'text-[#B3B8AC]')} />
                </button>
              )
            })}
          </Card>

          <div className="rounded-xl border border-line bg-white p-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-cream-100 text-sage-700">
                <ShieldCheck size={13} />
              </span>
              <p className="text-[10px] font-semibold text-ink">Verified vendor</p>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-muted">
              Shop licence, CNIC and bank account are verified. Payout detail changes need admin approval before the next cycle.
            </p>
            <button
              type="button"
              onClick={() => pushToast('Verification centre', 'Your documents and verification status would open here.', 'info')}
              className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-sage-700 hover:text-forest"
            >
              View documents <ChevronRight size={10} />
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {tab === 'profile' ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Business type</p>
                      <h2 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.03em] text-forest">Restaurant / Cafe</h2>
                      <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-muted">
                        Set by JTBazar Admin during vendor approval. The modules below are enabled for this business type in the same Vendor Center.
                      </p>
                    </div>
                    <Badge tone="forest" className="px-2.5 py-1 text-[9px]">
                      <UtensilsCrossed size={10} /> Restaurant modules active
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {businessModules.map((module) => (
                      <span key={module} className="rounded-full border border-[#E3EAD9] bg-[#F3F7EE] px-2.5 py-1 text-[8.5px] font-semibold text-sage-700">
                        {module}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 flex items-start gap-1.5 text-[8.5px] leading-relaxed text-muted">
                    <ShieldCheck size={10} className="mt-0.5 flex-none text-sage-600" />
                    Business type changes require Admin review. Retail, bakery and grocery vendors see different modules in the same Vendor Center shell.
                  </p>
                </Card>

                <Card className="overflow-hidden">
                  <div className="relative h-24 bg-gradient-to-br from-forest via-forest-600 to-[#466349]">
                    <div className="pointer-events-none absolute -right-6 -top-12 h-36 w-36 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-sage-400/10 blur-xl" />
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8.5px] font-semibold text-cream-50 backdrop-blur">
                      <ImageIcon size={10} /> Cover photo
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="-mt-8 flex items-end justify-between gap-3">
                      <span className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl border-4 border-white bg-cream-100 font-display text-xl font-semibold text-forest shadow-sm">
                        AM
                      </span>
                      <Button size="sm" variant="secondary" className="mb-1" onClick={() => pushToast('Logo upload', 'Image uploads are disabled in this prototype.', 'info')}>
                        Change logo
                      </Button>
                    </div>
                    <div className="mt-3">
                      <p className="text-[12px] font-semibold text-ink">{name}</p>
                      <p className="text-[9px] text-muted">Vendor since {shop.joined} · DHA Phase 6</p>
                    </div>

                    <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                      <Field label="Shop name">
                        <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Tagline">
                        <input value={tagline} onChange={(event) => setTagline(event.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Contact number">
                        <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Email address">
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Cuisine tags" hint="Shown as filters on the storefront." className="sm:col-span-2">
                        <input value={cuisine} onChange={(event) => setCuisine(event.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Shop address" className="sm:col-span-2">
                        <div className="relative">
                          <MapPin size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
                          <input value={address} onChange={(event) => setAddress(event.target.value)} className={cx(inputClass, 'pl-[34px]')} />
                        </div>
                      </Field>
                      <Field label="About the kitchen" hint="Keep it short — this appears under your shop name." className="sm:col-span-2">
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          rows={4}
                          className={cx(inputClass, 'resize-none leading-relaxed')}
                        />
                      </Field>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <SectionIntro
                    title="Order defaults"
                    description="These values set expectations on every listing. You can still override prep time per menu item later."
                  />
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Minimum order value (PKR)">
                      <input type="number" value={minOrder} onChange={(event) => setMinOrder(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Average prep time (minutes)">
                      <input type="number" value={prepTime} onChange={(event) => setPrepTime(event.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F0E6CC] bg-[#FBF6E9] px-3.5 py-3">
                    <div className="flex items-start gap-2.5">
                      <PauseCircle size={15} className="mt-0.5 flex-none text-[#A9761C]" />
                      <div>
                        <p className="text-[10px] font-semibold text-ink">Need a short break?</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted">Pausing hides the shop from new orders but keeps your dashboard and payouts active.</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => pushToast('Storefront paused', 'You can resume from this page at any time.', 'warning')}
                    >
                      Pause shop
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#F0EDE4] px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Storefront preview</p>
                    <Badge tone="sage" className="px-2 py-0.5 text-[8px]">Live</Badge>
                  </div>
                  <FoodImage
                    src={imageUrl('photo-1555939594-58d7cb561ad1', 700)}
                    alt="Mixed grill platter"
                    className="h-32 w-full"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[13px] font-semibold text-forest">{name}</p>
                        <p className="mt-0.5 truncate text-[9px] text-muted">{tagline}</p>
                      </div>
                      <span className="flex-none rounded-md bg-sage-100 px-1.5 py-0.5 text-[8px] font-semibold text-sage-700">Open</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Stars rating={shop.rating} size={10} />
                      <span className="text-[8.5px] font-semibold text-[#8A6A2E]">{shop.rating}</span>
                      <span className="text-[8px] text-muted">({shop.reviewCount.toLocaleString()})</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#F0EDE4] pt-2.5 text-[8.5px]">
                      <div>
                        <p className="text-muted">Delivery</p>
                        <p className="mt-0.5 font-semibold text-ink">25–35 min</p>
                      </div>
                      <div>
                        <p className="text-muted">Min. order</p>
                        <p className="mt-0.5 font-semibold text-ink">PKR {minOrder || '0'}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {['BBQ', 'Karahi', 'Fast food'].map((tag) => (
                        <span key={tag} className="rounded-full bg-[#F4F1E8] px-2 py-0.5 text-[8px] font-medium text-[#737A6F]">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Profile health</p>
                  <div className="mt-2.5 grid gap-2">
                    {[
                      { label: 'Storefront photos', value: '4 of 5' },
                      { label: 'Menu items live', value: '13 of 14' },
                      { label: 'Response rate', value: '96%' },
                      { label: 'Prep accuracy', value: '91%' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-2 text-[9.5px]">
                        <span className="text-muted">{row.label}</span>
                        <span className="font-semibold text-ink">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-[#F3F7EE] px-3 py-2.5 text-[8.5px] leading-relaxed text-[#4F584D]">
                    Adding one more cover photo can lift storefront clicks by up to 12%.
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Verification documents</p>
                    <Badge tone="sage" className="px-2 py-0.5 text-[8px]"><Check size={8} /> Verified</Badge>
                  </div>
                  <div className="mt-2.5 grid gap-2">
                    {[
                      { label: 'Food business licence', detail: 'Expires Mar 2027', icon: ShieldCheck },
                      { label: 'Owner CNIC', detail: 'Verified 12 Mar 2024', icon: CreditCard },
                      { label: 'Bank account', detail: 'HBL •• 4821', icon: Landmark },
                    ].map((document) => {
                      const Icon = document.icon
                      return (
                        <div key={document.label} className="flex items-center gap-2.5">
                          <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-[#F3F0E8] text-[#737A6F]">
                            <Icon size={11} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[9.5px] font-medium text-ink">{document.label}</p>
                            <p className="text-[8px] text-muted">{document.detail}</p>
                          </div>
                          <Check size={10} className="flex-none text-sage-600" />
                        </div>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => pushToast('Verification centre', 'Your documents and verification status would open here.', 'info')}
                    className="mt-2.5 flex w-full items-center justify-between border-t border-[#F0EDE4] pt-2 text-[8.5px] font-semibold text-sage-700 hover:text-forest"
                  >
                    Manage documents <ChevronRight size={10} />
                  </button>
                </Card>

                <Card className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Quick actions</p>
                  <div className="mt-2 grid gap-1">
                    {[
                      { label: 'Edit menu & prices', detail: '14 items', to: '/menu', icon: UtensilsCrossed },
                      { label: 'View earnings', detail: 'Next payout 24 Nov', to: '/earnings', icon: Wallet },
                      { label: 'Talk to support', detail: 'Avg. reply 18 min', to: '/support', icon: LifeBuoy },
                    ].map((action) => {
                      const Icon = action.icon
                      return (
                        <Link
                          key={action.label}
                          to={action.to}
                          className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-[#F5F2E9]"
                        >
                          <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-cream-100 text-sage-700">
                            <Icon size={11} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[9.5px] font-semibold text-ink group-hover:text-forest">{action.label}</span>
                            <span className="block text-[8px] text-muted">{action.detail}</span>
                          </span>
                          <ChevronRight size={11} className="flex-none text-[#B3B8AC] transition group-hover:translate-x-0.5 group-hover:text-forest" />
                        </Link>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'operations' ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.7fr)]">
              <div className="space-y-4">
                <Card className="p-5">
                  <SectionIntro
                    title="Weekly opening hours"
                    description="Times are Pakistan Standard Time. Orders stop 30 minutes before closing so the kitchen can finish cleanly."
                  />
                  <div className="divide-y divide-[#F3F0E8]">
                    {hours.map((day, index) => (
                      <div key={day.day} className="flex flex-wrap items-center gap-2 py-2 first:pt-0 last:pb-0">
                        <span className="w-20 flex-none text-[10px] font-semibold text-ink">{day.day}</span>
                        <Toggle
                          checked={day.open}
                          onChange={(value) => patchDay(index, { open: value })}
                          label={`${day.day} open`}
                          size="sm"
                        />
                        <div className={cx('ml-auto flex items-center gap-1.5', !day.open && 'opacity-45')}>
                          <input
                            type="time"
                            value={day.from}
                            disabled={!day.open}
                            onChange={(event) => patchDay(index, { from: event.target.value })}
                            aria-label={`${day.day} opening time`}
                            className="h-8 rounded-lg border border-line bg-white px-2 text-[9.5px] text-ink outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
                          />
                          <span className="text-[9px] text-muted">to</span>
                          <input
                            type="time"
                            value={day.to}
                            disabled={!day.open}
                            onChange={(event) => patchDay(index, { to: event.target.value })}
                            aria-label={`${day.day} closing time`}
                            className="h-8 rounded-lg border border-line bg-white px-2 text-[9.5px] text-ink outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-200"
                          />
                        </div>
                        {!day.open ? <span className="w-full text-[8.5px] text-clay sm:w-auto">Closed</span> : null}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 border-t border-[#F0EDE4] pt-2.5 text-[8.5px] text-muted">
                    <Clock3 size={10} /> Ramadan and Eid hours can be scheduled in advance from the Promotions calendar.
                  </p>
                </Card>

                <Card className="p-5">
                  <SectionIntro
                    title="Delivery & fulfilment"
                    description="Choose how customers can receive orders. You can switch modes off temporarily without changing your menu."
                  />
                  <div className="grid gap-2">
                    {[
                      {
                        key: 'jtbazar' as const,
                        icon: Bike,
                        title: 'JTBazar rider',
                        detail: 'Platform rider collects COD and delivers. Commission and delivery fee are deducted before your net payable.',
                      },
                      {
                        key: 'own' as const,
                        icon: Truck,
                        title: 'Own rider',
                        detail: 'Assign only a JTBazar Admin-approved driver. Cash handover is recorded in the vendor ledger.',
                      },
                      {
                        key: 'pickup' as const,
                        icon: ShoppingBag,
                        title: 'Customer pickup',
                        detail: 'Customers collect from Shop 12. No delivery fee or rider needed; the restaurant collects COD.',
                      },
                    ].map((channel) => {
                      const Icon = channel.icon
                      return (
                        <div key={channel.key} className="flex items-start gap-3 rounded-xl border border-line bg-[#FBFAF5] px-3.5 py-3">
                          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-sage-700 shadow-sm">
                            <Icon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] font-semibold text-ink">{channel.title}</p>
                            <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{channel.detail}</p>
                          </div>
                          <Toggle
                            checked={fulfilment[channel.key]}
                            onChange={(value) => setFulfilment((current) => ({ ...current, [channel.key]: value }))}
                            label={`Enable ${channel.title}`}
                            size="sm"
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                      <div>
                        <p className="text-[10px] font-semibold text-ink">Auto-accept new orders</p>
                        <p className="mt-0.5 text-[8.5px] text-muted">Send orders straight to the kitchen board when you are online.</p>
                      </div>
                      <Toggle checked={autoAccept} onChange={setAutoAccept} label="Auto-accept orders" size="sm" />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                      <div>
                        <p className="text-[10px] font-semibold text-ink">Busy mode</p>
                        <p className="mt-0.5 text-[8.5px] text-muted">Adds 10–15 minutes to quoted prep time across the menu.</p>
                      </div>
                      <Toggle checked={busyMode} onChange={setBusyMode} label="Busy mode" size="sm" />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#E3EAD9] bg-[#F3F7EE] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-ink">Approved driver unavailable?</p>
                      <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted">Request a JTBazar backup rider. Dispatch assigns the nearest available rider.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => pushToast('Backup rider requested', 'JTBazar dispatch will assign the nearest available rider to the order.', 'success')}
                    >
                      Request backup rider
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="p-5">
                  <SectionIntro title="Delivery zone" description="Set how far you deliver and the fee customers see." />
                  <div className="grid gap-3.5">
                    <Field label="Radius from shop (km)">
                      <input type="number" value={radius} onChange={(event) => setRadius(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Delivery fee (PKR)">
                      <input type="number" defaultValue="150" className={inputClass} />
                    </Field>
                    <Field label="Free delivery above (PKR)">
                      <input type="number" defaultValue="2500" className={inputClass} />
                    </Field>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#E3EAD9] bg-[#F3F7EE]">
                    <div className="relative h-28 bg-[radial-gradient(circle_at_50%_50%,#DDE7D1_0%,#EAF0E2_45%,#F3F7EE_100%)]">
                      <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sage-600/30 bg-sage-600/10" />
                      <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-sage-600/25" />
                      <span className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-cream-50 shadow">
                        <MapPin size={11} />
                      </span>
                    </div>
                    <p className="border-t border-[#E3EAD9] px-3 py-2 text-[8.5px] text-sage-700">
                      Covering DHA Phase 5–8 and Bukhari Commercial · {radius || '0'} km
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Today at a glance</p>
                  <div className="mt-2.5 grid gap-2 text-[9.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Hours</span>
                      <span className="font-semibold text-ink">11:00 AM – 1:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Active channels</span>
                      <span className="font-semibold text-ink">{Object.values(fulfilment).filter(Boolean).length} of 3</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Current wait</span>
                      <span className="font-semibold text-sage-700">{busyMode ? '35–45 min' : '25–35 min'}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-[#FBFAF5] px-3 py-2.5 text-[8.5px] leading-relaxed text-muted">
                    Closing time after midnight is treated as the next day. Saturday 01:30 means early Sunday morning.
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <SectionIntro
                      title="Approved delivery drivers"
                      description="Only drivers approved by JTBazar Admin can be assigned to own-rider orders."
                    />
                    <Badge tone="sage" className="px-2 py-0.5 text-[8px]">
                      <ShieldCheck size={9} /> Admin-managed
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {approvedDrivers.map((driver) => (
                      <div key={driver.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-[#FBFAF5] px-3 py-2.5">
                        <Avatar name={driver.name} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-[10px] font-semibold text-ink">{driver.name}</p>
                            <span className={cx(
                              'rounded-full px-1.5 py-0.5 text-[7.5px] font-semibold',
                              driver.status === 'Available'
                                ? 'bg-sage-100 text-sage-700'
                                : driver.status === 'On delivery'
                                  ? 'bg-[#FBF3E1] text-[#8E6218]'
                                  : 'bg-[#F0EEE7] text-[#737A6F]',
                            )}>
                              {driver.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[8px] text-muted">{driver.vehicle} · {driver.jobs} deliveries · approved {driver.approved}</p>
                        </div>
                        <a
                          href={`tel:${driver.phone.replace(/\s/g, '')}`}
                          aria-label={`Call ${driver.name}`}
                          className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-line bg-white text-sage-700 transition hover:bg-cream-50"
                        >
                          <Phone size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-[#F0E2C8] bg-[#FCF7EC] px-3 py-2.5 text-[8.5px] leading-relaxed text-[#8A6420]">
                    Vendors cannot create driver accounts or send driver requests. Driver onboarding, approval and suspension are controlled by JTBazar Admin.
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => pushToast('Driver policy', 'Only JTBazar Admin-approved drivers can be assigned. Vendors cannot create driver requests.', 'info')}
                  >
                    View driver policy
                  </Button>
                </Card>

                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <SectionIntro
                      title="Nearby JTBazar riders"
                      description="Only opted-in, online and available platform riders are shown, with approximate area, distance and ETA."
                    />
                    <Badge tone="sage" className="px-2 py-0.5 text-[8px]">
                      <MapPin size={9} /> {nearbyRiders.length} available
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {nearbyRiders.map((rider) => (
                      <div key={rider.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-[#FBFAF5] px-3 py-2.5">
                        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-sage-100 text-sage-700">
                          <Bike size={13} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-ink">{rider.name}</p>
                          <p className="mt-0.5 text-[8px] text-muted">{rider.area} · approx. {rider.distance} away</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9.5px] font-semibold text-forest">{rider.eta}</p>
                          <p className="text-[7.5px] text-muted">ETA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-[#FBFAF5] px-3 py-2.5 text-[8.5px] leading-relaxed text-muted">
                    Busy and offline riders never expose their exact location. Use <strong className="font-semibold text-ink">Request backup rider</strong> when your approved driver is unavailable.
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'payouts' ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.7fr)]">
              <div className="space-y-4">
                <Card className="p-5">
                  <SectionIntro
                    title="Bank account"
                    description="Weekly settlements are transferred here after Admin verification. When own-rider COD already with you exceeds your net earnings, the difference is paid to JTBazar instead. The account title must match your CNIC and shop registration."
                  />
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Account title" className="sm:col-span-2">
                      <input value={accountTitle} onChange={(event) => setAccountTitle(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Bank">
                      <select value={bank} onChange={(event) => setBank(event.target.value)} className={inputClass}>
                        <option>Habib Bank Limited (HBL)</option>
                        <option>Meezan Bank</option>
                        <option>Bank Alfalah</option>
                        <option>United Bank Limited (UBL)</option>
                        <option>Standard Chartered</option>
                      </select>
                    </Field>
                    <Field label="Branch code">
                      <input defaultValue="4821" className={inputClass} />
                    </Field>
                    <Field label="IBAN" hint="24 characters, starting with PK." className="sm:col-span-2">
                      <div className="relative">
                        <CreditCard size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
                        <input value={iban} onChange={(event) => setIban(event.target.value)} className={cx(inputClass, 'pl-[34px] font-mono text-[11px] tracking-wide')} />
                      </div>
                    </Field>
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#E3EAD9] bg-[#F3F7EE] px-3.5 py-2.5 text-[9px] leading-relaxed text-[#4F584D]">
                    <Lock size={12} className="mt-0.5 flex-none text-sage-700" />
                    Bank changes are reviewed by JTBazar finance. Payouts pause until the new account is verified, usually within one working day.
                  </div>
                </Card>

                <Card className="p-5">
                  <SectionIntro
                    title="Mobile wallets"
                    description="Optional backup payout methods for small or urgent settlements. Use the same CNIC registered with the wallet."
                  />
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Easypaisa number">
                      <div className="relative">
                        <Smartphone size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
                        <input value={easypaisa} onChange={(event) => setEasypaisa(event.target.value)} className={cx(inputClass, 'pl-[34px]')} />
                      </div>
                    </Field>
                    <Field label="JazzCash number">
                      <div className="relative">
                        <Smartphone size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
                        <input value={jazzcash} onChange={(event) => setJazzcash(event.target.value)} placeholder="+92 3XX XXXXXXX" className={cx(inputClass, 'pl-[34px]')} />
                      </div>
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="sage"><Check size={9} /> Easypaisa verified</Badge>
                    <Badge tone="outline">{jazzcash ? 'Pending verification' : 'Not added'}</Badge>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <section className="relative overflow-hidden rounded-2xl bg-forest p-5 text-cream-50 shadow-card">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-white/10" />
                  <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sage-300">Commercial terms</p>
                  <p className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.05em] tabular">{shop.commissionRate}%</p>
                  <p className="mt-1 text-[9px] text-cream-200/60">Commission on food subtotal</p>
                  <div className="mt-4 grid gap-2 border-t border-white/10 pt-3 text-[9px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-cream-200/60">Settlement cycle</span>
                      <span className="font-semibold">Weekly · Monday</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-cream-200/60">Payment mode</span>
                      <span className="font-semibold">COD only</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-cream-200/60">Delivery fee</span>
                      <span className="font-semibold">Rider / platform</span>
                    </div>
                  </div>
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[8.5px] leading-relaxed text-cream-200/70">
                    Final commission and settlement terms are set by JTBazar in the vendor agreement.
                  </p>
                </section>

                <Card className="p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Next settlement</p>
                  <p className="mt-1.5 font-display text-[18px] font-semibold tracking-[-0.03em] text-forest">PKR 272,195</p>
                  <p className="mt-0.5 text-[8.5px] text-muted">Monday, 24 Nov · JTBazar pays you</p>
                  <p className="mt-1 text-[8px] text-muted">Net after COD offset · HBL •• 4821</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-1 text-[8px] font-semibold text-sage-700">
                      <ShieldCheck size={9} /> Admin-verified
                    </span>
                    <span className="text-[8px] text-muted">No pending disputes</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => pushToast('Settlement history', 'Open Earnings → Settlements to review previous statements.', 'info')}
                  >
                    View settlement history
                  </Button>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'notifications' ? (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="border-b border-[#F0EDE4] px-5 py-4">
                  <SectionIntro
                    title="Choose your alerts"
                    description="Push notifications reach the dashboard and vendor app. SMS is best for new orders; email is best for statements."
                  />
                  <div className="grid grid-cols-[1fr_46px_46px_46px] items-center gap-1 rounded-lg bg-[#FBFAF5] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#9AA093] sm:grid-cols-[1fr_60px_60px_60px]">
                    <span>Event</span>
                    <span className="text-center">Push</span>
                    <span className="text-center">SMS</span>
                    <span className="text-center">Email</span>
                  </div>
                </div>
                <div className="divide-y divide-[#F3F0E8]">
                  {notifyRows.map((row) => (
                    <div key={row.key} className="grid grid-cols-[1fr_46px_46px_46px] items-center gap-1 px-5 py-3 sm:grid-cols-[1fr_60px_60px_60px]">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10.5px] font-semibold text-ink">{row.label}</p>
                        <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted">{row.detail}</p>
                      </div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div key={channel} className="flex justify-center">
                          <Toggle
                            checked={notify[row.key][channel]}
                            onChange={() => toggleNotify(row.key, channel)}
                            label={`${row.label} via ${channel}`}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE4] bg-[#FBFAF5] px-5 py-3 text-[8.5px] text-muted">
                  <span>Critical payout and account alerts are always sent by email.</span>
                  <span className="inline-flex items-center gap-1"><Lock size={9} /> Cannot be disabled</span>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-ink">Quiet hours</p>
                      <p className="mt-1 text-[9px] leading-relaxed text-muted">
                        Mute non-critical pushes between 2:00 AM and 9:00 AM. New orders and payout alerts still come through.
                      </p>
                    </div>
                    <Toggle checked={quietHours} onChange={setQuietHours} label="Quiet hours" size="sm" />
                  </div>
                  <div className={cx('mt-3 flex items-center gap-2 text-[9px] text-muted', !quietHours && 'opacity-45')}>
                    <Moon size={11} /> 2:00 AM <span className="text-[#B3B8AC]">→</span> 9:00 AM
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-[11px] font-semibold text-ink">Device & sound</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-muted">Kitchen tablet is connected and receiving order alerts.</p>
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-[#FBFAF5] px-3 py-2 text-[9px]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink"><Bell size={11} /> Kitchen tablet</span>
                    <Badge tone="sage" className="px-2 py-0.5 text-[8px]">Connected</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 w-full"
                    onClick={() => pushToast('Test alert sent', 'Check the kitchen tablet for a sample order sound.', 'success')}
                  >
                    Send test alert
                  </Button>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === 'team' ? (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0EDE4] px-5 py-4">
                  <SectionIntro
                    title="Team members"
                    description="Give managers and kitchen leads their own logins. Never share the owner account — every action is logged against a person."
                  />
                  <Button size="sm" variant="primary" onClick={() => setInviteOpen(true)}>
                    <Plus size={12} /> Invite teammate
                  </Button>
                </div>
                <div className="divide-y divide-[#F3F0E8]">
                  {team.map((member) => (
                    <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <Avatar name={member.name} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[10.5px] font-semibold text-ink">{member.name}</p>
                          {member.id === 'u1' ? <span className="text-[8px] text-muted">(you)</span> : null}
                        </div>
                        <p className="mt-0.5 text-[8.5px] text-muted">{member.phone} · {member.lastActive}</p>
                      </div>
                      <Badge tone={roleTone[member.role]} className="px-2 py-0.5 text-[8px]">{member.role}</Badge>
                      <button
                        type="button"
                        disabled={member.id === 'u1'}
                        onClick={() => pushToast('Access management', `Role settings for ${member.name} would open here.`, 'info')}
                        className="rounded-md border border-line bg-white px-2.5 py-1 text-[8.5px] font-semibold text-[#737A6F] transition hover:text-forest disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#F0EDE4] bg-[#FBFAF5] px-5 py-3 text-[8.5px] text-muted">
                  {team.length} of 5 seats used · Owner seat cannot be removed
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="border-b border-[#F0EDE4] px-5 py-4">
                  <SectionIntro
                    title="Role permissions"
                    description="Keep money and settings with the owner. Managers run day-to-day orders; kitchen leads focus on the board and stock."
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#F0EDE4] bg-[#FBFAF5]">
                        <th className="py-2.5 pl-5 pr-3 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9AA093]">Permission</th>
                        {(['Owner', 'Manager', 'Kitchen lead'] as const).map((role) => (
                          <th key={role} className="px-3 py-2.5 text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9AA093] last:pr-5">
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((row) => (
                        <tr key={row.area} className="border-b border-[#F3F0E8] last:border-0">
                          <td className="py-2.5 pl-5 pr-3 text-[9.5px] text-[#4F584D]">{row.area}</td>
                          {[row.owner, row.manager, row.kitchen].map((allowed, index) => (
                            <td key={index} className="px-3 py-2.5 text-center last:pr-5">
                              {allowed ? (
                                <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-sage-100 text-sage-700"><Check size={10} /></span>
                              ) : (
                                <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-[#F3F0E8] text-[#B3B8AC]"><Minus size={10} /></span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[9px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-sage-600" />
              Changes are logged in the vendor audit trail with your name and timestamp.
            </span>
            <Button size="sm" variant="primary" onClick={save}>
              <Save size={12} /> Save changes
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a teammate"
        description="They will receive an SMS with a one-time link to set a password and join your shop."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={sendInvite}>Send invite</Button>
          </>
        }
      >
        <div className="grid gap-3.5">
          <Field label="Full name">
            <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="e.g. Sana Riaz" className={inputClass} autoFocus />
          </Field>
          <Field label="Mobile number">
            <div className="relative">
              <Phone size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA093]" />
              <input value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} placeholder="+92 3XX XXXXXXX" className={cx(inputClass, 'pl-[34px]')} />
            </div>
          </Field>
          <Field label="Role" hint="Roles can be changed later by the owner.">
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as TeamRole)} className={inputClass}>
              <option>Manager</option>
              <option>Kitchen lead</option>
            </select>
          </Field>
          <div className="flex items-start gap-2 rounded-xl border border-[#F0E6CC] bg-[#FBF6E9] px-3 py-2.5 text-[9px] leading-relaxed text-[#7A642E]">
            <Mail size={12} className="mt-0.5 flex-none" />
            For security, a teammate cannot be given the owner role. Transfer ownership from the JTBazar admin team if needed.
          </div>
        </div>
      </Modal>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[8.5px] text-[#9AA093]">
        <span className="inline-flex items-center gap-1.5"><Building2 size={11} /> {shop.name} · Vendor ID JT-V-1042</span>
        <span className="inline-flex items-center gap-1.5"><Wallet size={11} /> COD-only marketplace · weekly settlements</span>
        <span className="inline-flex items-center gap-1.5"><Users size={11} /> 3 active seats</span>
        <span className="ml-auto inline-flex items-center gap-1.5"><Lock size={11} /> Prototype · changes are not persisted</span>
      </div>
    </div>
  )
}
