import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Activity, AlertCircle, Boxes, CheckCircle2, ClipboardList, Eye, EyeOff, LifeBuoy, Package, RefreshCw, ShieldCheck, Store, Truck, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'
import { createVendorProduct, createVendorSupportTicket, finalizeVendorProductSubmission, getVendorDashboardData, listVendorCategories, listVendorProductVariants, listVendorSupportMessages, listVendorSupportTickets, markOrderReady, replyToCase, saveVendorProductVariants, sendVendorSupportMessage, setProductStock as setProductInventory, setProductVisibility, updateVendorShopProfile, uploadVendorProductImage, type VendorCase, type VendorInventory, type VendorOrderItem, type VendorProduct, type VendorVariantInput } from '../services/marketplaceApi'

type Tab = 'overview' | 'listings' | 'inventory' | 'orders' | 'cases' | 'support' | 'settings'
const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'listings', label: 'Listings', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders & fulfilment', icon: Truck },
  { id: 'cases', label: 'Customer cases', icon: ClipboardList },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'settings', label: 'Shop profile', icon: Store },
]

function money(value: unknown) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)
}
function date(value: unknown) {
  if (!value) return '—'
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}
function Status({ value }: { value: unknown }) {
  const text = String(value ?? 'unknown').replace(/_/g, ' ')
  return <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-sage-800">{text}</span>
}

export function MarketplacePage() {
  const navigate = useNavigate()
  const { user, seller, loading, configured, signOut, refreshSeller } = useVendorAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [inventory, setInventory] = useState<VendorInventory[]>([])
  const [orders, setOrders] = useState<VendorOrderItem[]>([])
  const [cases, setCases] = useState<VendorCase[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stockTarget, setStockTarget] = useState<VendorInventory | null>(null)
  const [stockValue, setStockValue] = useState('0')
  const [stockNote, setStockNote] = useState('')
  const [caseTarget, setCaseTarget] = useState<VendorCase | null>(null)
  const [caseReply, setCaseReply] = useState('')
  const [categories, setCategories] = useState<Array<{id:string;name:string;parent_id:string|null}>>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productStock, setProductStock] = useState('0')
  const [productImage, setProductImage] = useState<File | null>(null)
  const [variantProduct, setVariantProduct] = useState<VendorProduct | null>(null)
  const [variantRows, setVariantRows] = useState<VendorVariantInput[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [supportTickets, setSupportTickets] = useState<Array<Record<string, any>>>([])
  const [supportMessages, setSupportMessages] = useState<Array<Record<string, any>>>([])
  const [activeTicket, setActiveTicket] = useState<Record<string, any> | null>(null)
  const [supportSubject, setSupportSubject] = useState('')
  const [supportDraft, setSupportDraft] = useState('')
  const [newTicketMessage, setNewTicketMessage] = useState('')
  const [shopEdit, setShopEdit] = useState(false)
  const [shopName, setShopName] = useState('')
  const [shopDescription, setShopDescription] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopCompleteAddress, setShopCompleteAddress] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setBusy(true); setError('')
    try {
      const data = await getVendorDashboardData()
      setProducts(data.products); setInventory(data.inventory); setOrders(data.orders); setCases(data.cases)
      const [categoryRows, ticketRows] = await Promise.all([listVendorCategories(), listVendorSupportTickets()])
      setCategories(categoryRows); setSupportTickets(ticketRows)
      await refreshSeller()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Vendor data could not be loaded.')
    } finally { setBusy(false) }
  }, [user, refreshSeller])

  useEffect(() => {
    if (!loading && !user) navigate('/vendor-login', { replace: true })
  }, [loading, user, navigate])
  useEffect(() => { if (user && seller?.status === 'approved') void load() }, [user?.id, seller?.status, load])

  const openOrders = useMemo(() => orders.filter(row => !['delivered','cancelled'].includes(String(row.vendor_fulfillment_status))), [orders])
  const lowStock = useMemo(() => inventory.filter(row => Number(row.quantity) <= Number(row.low_stock_threshold ?? 5)), [inventory])
  const stats = [
    { label: 'Active listings', value: products.filter(p => p.moderation_status === 'approved' && !p.vendor_hidden).length, icon: Package },
    { label: 'Open fulfilment', value: new Set(openOrders.map(o => o.order_id)).size, icon: Truck },
    { label: 'Low-stock items', value: lowStock.length, icon: Boxes },
    { label: 'Open customer cases', value: cases.filter(c => !['resolved','rejected','approved'].includes(String(c.status))).length, icon: ClipboardList },
  ]

  async function runAction(action: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(success); await load(); return true }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The action could not be completed.'); return false }
    finally { setBusy(false) }
  }

  async function submitStock(event: FormEvent) {
    event.preventDefault()
    if (!stockTarget) return
    if (await runAction(() => setProductInventory(stockTarget.product_id, Number(stockValue), stockNote, stockTarget.variant_id), 'Inventory updated.')) setStockTarget(null)
  }
  async function submitNewProduct(event: FormEvent) {
    event.preventDefault()
    if (!productImage) { setError('Add at least one clear product image.'); return }
    const cleanName = productName.trim()
    if (cleanName.length < 2) { setError('Enter a product name.'); return }
    const slug = cleanName.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const succeeded = await runAction(async () => {
      const productId = await createVendorProduct({
        category_id: productCategory || null,
        name: cleanName,
        slug: `${slug}-${Date.now().toString(36)}`,
        sku: null,
        short_description: productDescription.trim().slice(0, 300),
        description: productDescription.trim(),
        price: Number(productPrice),
        supplier_cost: null,
        fulfillment_expense: 0,
        minimum_profit: 0,
        track_inventory: true,
        discount_percent: 0,
        weight_grams: null,
        specifications: [],
        dimensions: {},
        seo_title: null,
        seo_description: null,
        initial_stock: Number(productStock),
      })
      await uploadVendorProductImage(productId, productImage, cleanName)
      await finalizeVendorProductSubmission(productId)
    }, 'Product submitted for JTBazar review.')
    if (succeeded) { setShowProductForm(false); setProductName(''); setProductCategory(''); setProductPrice(''); setProductDescription(''); setProductStock('0'); setProductImage(null) }
  }

  async function openVariants(product: VendorProduct) {
    setVariantProduct(product); setVariantsLoading(true); setError('')
    try {
      const rows = await listVendorProductVariants(product.id)
      setVariantRows(rows.length ? rows : [{ id: null, option_label: 'Size', option_value: '', sku: null, price_override: null, attributes: {}, image_url: null, quantity: 0 }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Product variants could not be loaded.')
      setVariantProduct(null)
    } finally { setVariantsLoading(false) }
  }

  async function submitVariants(event: FormEvent) {
    event.preventDefault()
    if (!variantProduct) return
    if (await runAction(() => saveVendorProductVariants(variantProduct.id, variantRows), 'Product variants saved.')) setVariantProduct(null)
  }

  async function openSupportTicket(ticket: Record<string, any>) {
    setActiveTicket(ticket); setError('')
    try { setSupportMessages(await listVendorSupportMessages(ticket.id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Support messages could not be loaded.') }
  }

  async function submitNewTicket(event: FormEvent) {
    event.preventDefault()
    if (!seller?.id) return
    if (await runAction(() => createVendorSupportTicket(seller.id, supportSubject, newTicketMessage), 'Support ticket created.')) {
      setSupportSubject(''); setNewTicketMessage('')
      setSupportTickets(await listVendorSupportTickets())
    }
  }

  async function submitSupportReply(event: FormEvent) {
    event.preventDefault()
    if (!activeTicket) return
    if (await runAction(() => sendVendorSupportMessage(activeTicket.id, supportDraft), 'Reply sent.')) {
      setSupportDraft('')
      setSupportMessages(await listVendorSupportMessages(activeTicket.id))
    }
  }

  async function saveShopProfile(event: FormEvent) {
    event.preventDefault()
    if (await runAction(() => updateVendorShopProfile({ shop_name: shopName, description: shopDescription, phone: shopPhone, current_address: shopAddress, complete_address: shopCompleteAddress }), 'Shop profile updated.')) {
      setShopEdit(false)
      await refreshSeller()
    }
  }

  async function submitCase(event: FormEvent) {
    event.preventDefault()
    if (!caseTarget) return
    if (await runAction(() => replyToCase(caseTarget.id, caseReply), 'Your response was sent.')) { setCaseTarget(null); setCaseReply('') }
  }

  if (!configured) return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-semibold">Connect Supabase</h1><p className="mt-2 text-sm text-muted">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Vendor Center environment. This app uses the existing JTBazar project; it does not create or migrate database objects.</p></main>
  if (loading) return <main className="p-10 text-center text-muted">Checking your JTBazar seller account…</main>
  if (!user) return null
  if (!seller) return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-semibold">No seller profile found</h1><p className="mt-2 text-sm text-muted">Sign in with the JTBazar account that owns an existing seller application. Apply for a shop from the customer website if you have not applied yet.</p><a className="mt-4 inline-block text-sm font-semibold text-sage-700 underline" href="https://www.jt-bazar.com/">Open JTBazar</a></main>
  if (seller.status !== 'approved') return <main className="mx-auto max-w-3xl p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-sage-700"/><h1 className="text-2xl font-semibold">{seller.shop_name}</h1></div><div className="mt-5 rounded-2xl border border-line bg-white p-6"><Status value={seller.status}/><h2 className="mt-3 text-lg font-semibold">Seller access is not active yet</h2><p className="mt-2 text-sm text-muted">{seller.status === 'pending' ? 'Your application is being reviewed by JTBazar Admin.' : seller.status === 'rejected' ? (seller.rejection_reason || 'Please review the feedback on your seller application.') : 'Vendor tools are unavailable for this account status.'}</p></div></main>

  return <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-forest p-6 text-cream-50">
      <div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/10">{seller.shop_image_url ? <img src={seller.shop_image_url} alt="" className="h-full w-full object-cover"/> : <Store size={26}/>}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-semibold">{seller.shop_name}</h1><span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold">Verified seller</span></div><p className="mt-1 text-sm text-cream-50/75">{seller.shop_location_label || seller.current_address || 'JTBazar seller'} · {seller.business_type || seller.vendor_type}</p></div></div>
      <div className="flex items-center gap-2"><button onClick={()=>void load()} disabled={busy} className="rounded-xl border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10"><RefreshCw size={15} className="mr-1 inline"/>Refresh</button><button onClick={()=>void signOut()} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-forest">Sign out</button></div>
    </header>
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-line bg-white p-2">{tabs.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab===item.id?'bg-forest text-white':'text-muted hover:bg-cream-50'}`}><Icon size={15}/>{item.label}</button>})}</nav>
    {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17}/>{error}</div>}
    {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-sage-50 p-3 text-sm text-sage-800"><CheckCircle2 size={17}/>{notice}</div>}
    {busy && <p className="mb-3 text-xs text-muted">Syncing with JTBazar…</p>}
    {tab==='overview' && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({label,value,icon:Icon})=><article key={label} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between text-muted"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span><Icon size={18}/></div><p className="mt-3 font-display text-3xl font-semibold text-forest">{value}</p></article>)}</section>
      <section className="mt-5 grid gap-4 xl:grid-cols-2"><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Recent orders</h2>{orders.slice(0,5).map(row=><div key={row.id} className="flex items-center justify-between gap-3 border-b border-line py-3 text-sm"><div><strong>Order #{String(row.order_number ?? row.order_id).slice(-8)}</strong><p className="text-xs text-muted">{row.product_name} · Qty {row.quantity}</p></div><Status value={row.vendor_fulfillment_status}/></div>)}{!orders.length&&<p className="py-5 text-sm text-muted">No vendor orders yet.</p>}</article><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Stock requiring attention</h2>{lowStock.slice(0,6).map(row=><div key={row.id} className="flex items-center justify-between border-b border-line py-3 text-sm"><span>{row.product_name}{row.variant_name&&<small className="block text-muted">{row.variant_name}</small>}</span><strong>{row.quantity} left</strong></div>)}{!lowStock.length&&<p className="py-5 text-sm text-muted">No low-stock alerts.</p>}</article></section>
    </>}
    {tab==='listings' && <section className="rounded-2xl border border-line bg-white p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Your product listings</h2><p className="text-xs text-muted">Products are loaded through the existing vendor_list_products RPC.</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted">{products.length} products</span><button onClick={()=>setShowProductForm(v=>!v)} className="rounded-xl bg-forest px-4 py-2 text-xs font-semibold text-white">{showProductForm?'Close':'Add product'}</button></div></div>
      {showProductForm&&<form onSubmit={submitNewProduct} className="mb-5 grid gap-3 rounded-2xl bg-cream-50 p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold">Product name<input required minLength={2} value={productName} onChange={e=>setProductName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Category<select required value={productCategory} onChange={e=>setProductCategory(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3"><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs font-semibold">Your base price (PKR)<input required type="number" min="1" step="0.01" value={productPrice} onChange={e=>setProductPrice(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Initial stock<input required type="number" min="0" step="1" value={productStock} onChange={e=>setProductStock(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Description<textarea required minLength={10} value={productDescription} onChange={e=>setProductDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-line p-3"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Main product image (JPG, PNG, WebP or AVIF; max 10 MB)<input required type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setProductImage(e.target.files?.[0]??null)} className="mt-1 block w-full text-xs"/></label>
        <p className="text-xs leading-5 text-muted sm:col-span-2">The listing is created through the existing vendor RPC, image is saved to the existing product-images bucket, and the submission is sent for Admin review. No schema or migration changes are made.</p>
        <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Create and submit</button><button type="button" onClick={()=>setShowProductForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div>
      </form>}<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Product</th><th>Price</th><th>Review</th><th>Visibility</th><th>Action</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t border-line"><td className="py-3"><strong>{p.name}</strong><small className="block text-muted">{p.sku||p.slug}</small></td><td>{money(p.price)}</td><td><Status value={p.moderation_status}/></td><td><Status value={p.vendor_hidden?'hidden':'visible'}/></td><td><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void runAction(()=>setProductVisibility(p.id,!p.vendor_hidden),p.vendor_hidden?'Product shown.':'Product hidden.')} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">{p.vendor_hidden?<Eye size={13}/>:<EyeOff size={13}/>} {p.vendor_hidden?'Show':'Hide'}</button><button disabled={busy} onClick={()=>void openVariants(p)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Variants</button></div></td></tr>)}</tbody></table></div>
      {variantProduct&&<form onSubmit={submitVariants} className="mt-5 rounded-2xl bg-cream-50 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Variants · {variantProduct.name}</h3><p className="text-xs text-muted">Options such as size, colour or pack. Changes use the existing vendor_save_product_variants RPC.</p></div><button type="button" onClick={()=>setVariantProduct(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs">Close</button></div>
        {variantsLoading?<p className="py-3 text-sm text-muted">Loading variants…</p>:<div className="space-y-2">{variantRows.map((v,i)=><div key={v.id||`new-${i}`} className="grid gap-2 rounded-xl border border-line bg-white p-3 sm:grid-cols-5"><label className="text-[11px] font-semibold">Option<input value={v.option_label} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,option_label:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Value<input value={v.option_value} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,option_value:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm" placeholder="Large / Black"/></label><label className="text-[11px] font-semibold">SKU<input value={v.sku||''} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,sku:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Price override<input type="number" min="0" step="0.01" value={v.price_override??''} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,price_override:e.target.value===''?null:Number(e.target.value)}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Stock<input type="number" min="0" step="1" value={v.quantity} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,quantity:Number(e.target.value)}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label></div>)}</div>}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>setVariantRows(rows=>[...rows,{id:null,option_label:'Size',option_value:'',sku:null,price_override:null,attributes:{},image_url:null,quantity:0}])} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold">Add variant</button><button disabled={busy||variantsLoading} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white">Save variants</button></div>
      </form>}
    </section>}
    {tab==='inventory' && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Inventory & stock</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Product</th><th>Variant</th><th>Quantity</th><th>Updated</th><th>Action</th></tr></thead><tbody>{inventory.map(row=><tr key={row.id} className="border-t border-line"><td className="py-3 font-medium">{row.product_name}</td><td>{row.variant_name||'—'}</td><td><strong>{row.quantity}</strong></td><td>{date(row.updated_at)}</td><td><button onClick={()=>{setStockTarget(row);setStockValue(String(row.quantity));setStockNote('')}} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Adjust stock</button></td></tr>)}</tbody></table></div>{stockTarget&&<form onSubmit={submitStock} className="mt-5 grid gap-3 rounded-xl bg-cream-50 p-4 sm:grid-cols-3"><label className="text-xs font-semibold">New quantity<input type="number" min="0" step="1" required value={stockValue} onChange={e=>setStockValue(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Reason / note<input value={stockNote} onChange={e=>setStockNote(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3" placeholder="Stock count correction"/></label><div className="flex items-end gap-2"><button disabled={busy} className="h-10 rounded-lg bg-forest px-4 text-sm font-semibold text-white">Save stock</button><button type="button" onClick={()=>setStockTarget(null)} className="h-10 rounded-lg border border-line px-4 text-sm">Cancel</button></div></form>}</section>}
    {tab==='orders' && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Order fulfilment</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Order</th><th>Product</th><th>Qty</th><th>Vendor status</th><th>Pickup</th><th>Action</th></tr></thead><tbody>{orders.map(row=><tr key={row.id} className="border-t border-line"><td className="py-3">#{String(row.order_number??row.order_id).slice(-8)}<small className="block text-muted">{date(row.created_at)}</small></td><td>{row.product_name}</td><td>{row.quantity}</td><td><Status value={row.vendor_fulfillment_status}/></td><td><Status value={row.pickup_status||'not_applicable'}/></td><td>{!['ready_for_pickup','picked_up','delivered','cancelled'].includes(String(row.vendor_fulfillment_status))?<button disabled={busy} onClick={()=>void runAction(()=>markOrderReady(row.order_id), 'Order marked ready for pickup.')} className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white">Mark ready</button>:<span className="text-xs text-muted">No action</span>}</td></tr>)}</tbody></table></div>{!orders.length&&<p className="py-5 text-sm text-muted">No vendor order items yet.</p>}</section>}
    {tab==='cases' && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Customer cases</h2><div className="mt-4 space-y-3">{cases.map(c=><article key={c.id} className="rounded-xl border border-line p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{c.case_type?.replace(/_/g,' ')||'Customer case'}</strong><Status value={c.status}/></div><p className="mt-2 text-sm text-muted">{c.reason}</p>{c.seller_response&&<p className="mt-2 rounded-lg bg-cream-50 p-3 text-sm">Your response: {c.seller_response}</p>}<button onClick={()=>{setCaseTarget(c);setCaseReply(c.seller_response||'')}} className="mt-3 rounded-lg border border-line px-3 py-2 text-xs font-semibold">Respond to case</button></article>)}{!cases.length&&<p className="py-5 text-sm text-muted">No customer cases.</p>}</div>{caseTarget&&<form onSubmit={submitCase} className="mt-4 rounded-xl bg-cream-50 p-4"><label className="text-xs font-semibold">Your response<textarea required minLength={3} value={caseReply} onChange={e=>setCaseReply(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-line p-3"/></label><div className="mt-3 flex gap-2"><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Send response</button><button type="button" onClick={()=>setCaseTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div></form>}</section>}
    {tab==='support' && <section className="grid gap-4 xl:grid-cols-2"><article className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Support tickets</h2><span className="text-xs text-muted">{supportTickets.length} tickets</span></div><form onSubmit={submitNewTicket} className="mt-4 space-y-2 rounded-xl bg-cream-50 p-3"><input required minLength={3} value={supportSubject} onChange={e=>setSupportSubject(e.target.value)} placeholder="Ticket subject" className="h-10 w-full rounded-lg border border-line px-3 text-sm"/><textarea required minLength={5} value={newTicketMessage} onChange={e=>setNewTicketMessage(e.target.value)} placeholder="Describe how we can help…" className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"/><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white">Create ticket</button></form><div className="mt-4 space-y-2">{supportTickets.map(t=><button key={t.id} onClick={()=>void openSupportTicket(t)} className={`w-full rounded-xl border p-3 text-left ${activeTicket?.id===t.id?'border-sage-600 bg-sage-50':'border-line hover:bg-cream-50'}`}><div className="flex justify-between gap-2"><strong className="text-sm">{t.subject}</strong><Status value={t.status}/></div><p className="mt-1 line-clamp-2 text-xs text-muted">{t.message}</p><small className="text-muted">{date(t.created_at)}</small></button>)}{!supportTickets.length&&<p className="py-4 text-sm text-muted">No support tickets yet.</p>}</div></article><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">{activeTicket?.subject||'Ticket conversation'}</h2>{activeTicket?<><div className="mt-4 max-h-96 space-y-3 overflow-y-auto">{supportMessages.map(m=><div key={m.id} className={`max-w-[90%] rounded-xl p-3 text-sm ${m.sender_role==='seller'?'ml-auto bg-sage-50':'bg-cream-50'}`}><p>{m.message}</p><small className="mt-1 block text-[10px] text-muted">{m.sender_role==='seller'?'You':'JTBazar support'} · {date(m.created_at)}</small></div>)}{!supportMessages.length&&<p className="text-sm text-muted">No replies yet.</p>}</div><form onSubmit={submitSupportReply} className="mt-4 flex gap-2"><input required minLength={2} value={supportDraft} onChange={e=>setSupportDraft(e.target.value)} placeholder="Write a reply…" className="h-11 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm"/><button disabled={busy} className="rounded-lg bg-forest px-4 text-xs font-semibold text-white">Send</button></form></>:<p className="mt-4 text-sm text-muted">Select a ticket to view its conversation.</p>}</article></section>}
    {tab==='settings' && <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Shop information</h2><button onClick={()=>{setShopName(seller.shop_name||'');setShopDescription(seller.description||'');setShopPhone(seller.phone||'');setShopAddress(seller.current_address||'');setShopCompleteAddress(seller.complete_address||'');setShopEdit(v=>!v)}} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">{shopEdit?'Cancel':'Edit profile'}</button></div>{shopEdit?<form onSubmit={saveShopProfile} className="mt-4 space-y-3"><label className="block text-xs font-semibold">Shop name<input required minLength={2} value={shopName} onChange={e=>setShopName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Description<textarea required minLength={10} value={shopDescription} onChange={e=>setShopDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-line p-3"/></label><label className="block text-xs font-semibold">Phone<input required value={shopPhone} onChange={e=>setShopPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Area / city<input required value={shopAddress} onChange={e=>setShopAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Complete address<input required value={shopCompleteAddress} onChange={e=>setShopCompleteAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Save shop profile</button></form>:null}<dl className="mt-4 space-y-3 text-sm">{[['Shop name',seller.shop_name],['Business type',seller.business_type||seller.vendor_type],['Contact email',seller.contact_email],['Phone',seller.phone],['Address',seller.complete_address||seller.current_address],['Public area',seller.shop_location_label],['Approval status',seller.status]].map(([k,v])=><div key={k} className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-muted">{k}</dt><dd className="max-w-[65%] text-right font-medium">{v||'—'}</dd></div>)}</dl></article><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Platform safety</h2><p className="mt-3 text-sm leading-6 text-muted">Your seller access, product permissions, inventory changes and order actions are checked by the existing Supabase policies and vendor RPC functions. The Vendor Center does not contain a service-role key and does not create database tables.</p></article></section>}
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted"><span>JTBazar Vendor Center · Shared marketplace database</span><span className="inline-flex items-center gap-1"><Wallet size={13}/> Payout and settlement details remain in the Earnings module.</span></footer>

    {stockTarget&&<div className="sr-only" aria-live="polite">Editing stock for {stockTarget.product_name}</div>}
  </main>
}
