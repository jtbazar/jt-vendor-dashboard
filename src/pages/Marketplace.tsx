import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Activity, AlertCircle, Boxes, CheckCircle2, ClipboardList, Eye, EyeOff, LifeBuoy, Package, RefreshCw, ShieldCheck, Store, Truck, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'
import { createVendorProduct, createVendorSupportTicket, finalizeVendorProductSubmission, getVendorDashboardData, getVendorDocumentSignedUrls, listVendorCategories, listVendorProductVariants, listVendorProductImages, listVendorProductDeletionRequests, listVendorOrders, listVendorSupportMessages, listVendorSupportTickets, markOrderReady, removeVendorProductImage, replyToCase, requestVendorProductDeletion, saveVendorProductVariants, sendVendorSupportMessage, setProductStock as setProductInventory, setProductVisibility, setVendorPrimaryProductImage, updateVendorProduct, updateVendorShopProfile, uploadVendorProductImage, uploadVendorShopImage, uploadVendorVariantImage, type VendorCase, type VendorInventory, type VendorOrderItem, type VendorProduct, type VendorVariantInput } from '../services/marketplaceApi'

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
  const [orderPage, setOrderPage] = useState(0)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [ordersHasNext, setOrdersHasNext] = useState(false)
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
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([])
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editShortDescription, setEditShortDescription] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [variantProduct, setVariantProduct] = useState<VendorProduct | null>(null)
  const [variantRows, setVariantRows] = useState<VendorVariantInput[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [variantImageFiles, setVariantImageFiles] = useState<Record<string, File>>({})
  const [imageProduct, setImageProduct] = useState<VendorProduct | null>(null)
  const [productImages, setProductImages] = useState<Array<{id:string;url:string;storage_path:string|null;is_primary:boolean;sort_order:number;alt_text?:string|null}>>([])
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [deletionRequests, setDeletionRequests] = useState<Array<{product_id:string;status:string}>>([])
  const [deletionTarget, setDeletionTarget] = useState<VendorProduct | null>(null)
  const [deletionReason, setDeletionReason] = useState('')
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
  const [shopImageFile, setShopImageFile] = useState<File | null>(null)
  const [sellerDocumentUrls, setSellerDocumentUrls] = useState<{cnicFront:string|null;cnicBack:string|null;verification:string|null}>({cnicFront:null,cnicBack:null,verification:null})

  const load = useCallback(async () => {
    if (!user) return
    setBusy(true); setError('')
    try {
      const data = await getVendorDashboardData()
      setProducts(data.products); setInventory(data.inventory); setOrders(data.orders); setCases(data.cases)
      const [categoryRows, ticketRows, deletionRows] = await Promise.all([listVendorCategories(), listVendorSupportTickets(), listVendorProductDeletionRequests()])
      setCategories(categoryRows); setSupportTickets(ticketRows); setDeletionRequests(deletionRows)
      await refreshSeller()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Vendor data could not be loaded.')
    } finally { setBusy(false) }
  }, [user, refreshSeller])

  useEffect(() => {
    if (!loading && !user) navigate('/vendor-login', { replace: true })
  }, [loading, user, navigate])
  useEffect(() => { if (user && seller?.status === 'approved') void load() }, [user?.id, seller?.status, load])
  useEffect(() => { if (seller) void getVendorDocumentSignedUrls(seller).then(setSellerDocumentUrls).catch(() => setSellerDocumentUrls({cnicFront:null,cnicBack:null,verification:null})) }, [seller?.id, seller?.cnic_front_path, seller?.cnic_back_path, seller?.document_path])

  const openOrders = useMemo(() => orders.filter(row => !['delivered','cancelled'].includes(String(row.vendor_fulfillment_status))), [orders])
  const lowStock = useMemo(() => inventory.filter(row => Number(row.quantity) <= Number(row.low_stock_threshold ?? 5)), [inventory])
  const stats = [
    { label: 'Active listings', value: products.filter(p => p.moderation_status === 'approved' && !p.vendor_hidden).length, icon: Package },
    { label: 'Open fulfilment', value: new Set(openOrders.map(o => o.order_id)).size, icon: Truck },
    { label: 'Low-stock items', value: lowStock.length, icon: Boxes },
    { label: 'Open customer cases', value: cases.filter(c => !['resolved','rejected','approved'].includes(String(c.status))).length, icon: ClipboardList },
  ]

  async function loadOrdersPage(page = 0, search = orderSearch, status = orderStatus) {
    setBusy(true); setError('')
    try {
      const rows = await listVendorOrders({ page, pageSize: 15, search, status })
      setOrders(rows); setOrderPage(page); setOrdersHasNext(rows.length === 15 && (rows[0]?.total_orders == null || Number(rows[0].total_orders) > (page + 1) * 15))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Vendor orders could not be loaded.')
    } finally { setBusy(false) }
  }

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
  async function submitNewProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!productImagesFiles.length) { setError('Add at least one clear product image.'); return }
    const cleanName = productName.trim()
    if (cleanName.length < 2) { setError('Enter a product name.'); return }
    const data = new FormData(event.currentTarget)
    const readNumber = (key: string, fallback = 0) => {
      const raw = String(data.get(key) ?? '').trim()
      return raw ? Number(raw) : fallback
    }
    let specifications: unknown = []
    let dimensions: unknown = {}
    try {
      specifications = JSON.parse(String(data.get('specifications') || '[]'))
      dimensions = JSON.parse(String(data.get('dimensions') || '{}'))
    } catch { setError('Specifications must be a valid JSON array and dimensions a valid JSON object.'); return }
    const slug = cleanName.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const succeeded = await runAction(async () => {
      const productId = await createVendorProduct({
        category_id: productCategory || null,
        name: cleanName,
        slug: `${slug}-${Date.now().toString(36)}`,
        sku: String(data.get('sku') ?? '').trim() || null,
        short_description: String(data.get('short_description') ?? productDescription).trim().slice(0, 300),
        description: String(data.get('description') ?? productDescription).trim(),
        price: Number(productPrice),
        supplier_cost: data.get('supplier_cost') ? readNumber('supplier_cost') : null,
        fulfillment_expense: readNumber('fulfillment_expense'),
        minimum_profit: readNumber('minimum_profit'),
        track_inventory: data.get('track_inventory') !== 'off',
        discount_percent: readNumber('discount_percent'),
        weight_grams: data.get('weight_grams') ? readNumber('weight_grams') : null,
        specifications,
        dimensions,
        seo_title: String(data.get('seo_title') ?? '').trim() || null,
        seo_description: String(data.get('seo_description') ?? '').trim() || null,
        initial_stock: Number(productStock),
      })
      for (const imageFile of productImagesFiles) await uploadVendorProductImage(productId, imageFile, cleanName)
      await finalizeVendorProductSubmission(productId)
    }, 'Product submitted for JTBazar review.')
    if (succeeded) { setShowProductForm(false); setProductName(''); setProductCategory(''); setProductPrice(''); setProductDescription(''); setProductStock('0'); setProductImagesFiles([]) }
  }

  function startProductEdit(product: VendorProduct) {
    setEditingProduct(product)
    setEditName(String(product.name ?? ''))
    setEditPrice(String(product.price ?? ''))
    setEditShortDescription(String(product.short_description ?? ''))
    setEditDescription(String(product.description ?? ''))
    setShowProductForm(false)
  }

  async function submitProductEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProduct) return
    const data = new FormData(event.currentTarget)
    let specifications: unknown = editingProduct.specifications ?? []
    let dimensions: unknown = editingProduct.dimensions ?? {}
    try { specifications = JSON.parse(String(data.get('specifications') ?? '[]')); dimensions = JSON.parse(String(data.get('dimensions') ?? '{}')) }
    catch { setError('Specifications and dimensions must be valid JSON.'); return }
    const optionalNumber = (key: string, fallback: number | null = null) => { const raw=String(data.get(key)??'').trim(); return raw ? Number(raw) : fallback }
    if (await runAction(() => updateVendorProduct(editingProduct.id, {
      category_id: String(data.get('category_id') ?? '') || null,
      name: editName.trim(),
      slug: editingProduct.slug,
      sku: String(data.get('sku') ?? '').trim() || null,
      short_description: editShortDescription.trim().slice(0, 300),
      description: editDescription.trim(),
      price: Number(editPrice),
      supplier_cost: optionalNumber('supplier_cost', null),
      fulfillment_expense: optionalNumber('fulfillment_expense', 0) ?? 0,
      minimum_profit: optionalNumber('minimum_profit', 0) ?? 0,
      discount_percent: optionalNumber('discount_percent', 0) ?? 0,
      weight_grams: optionalNumber('weight_grams', null),
      specifications,
      dimensions,
      seo_title: String(data.get('seo_title') ?? '').trim() || null,
      seo_description: String(data.get('seo_description') ?? '').trim() || null,
    }), 'Product details updated.')) setEditingProduct(null)
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
    const saved = await runAction(async () => {
      const rows = await Promise.all(variantRows.map(async (row, index) => {
        const key = row.id || `new-${index}`
        const file = variantImageFiles[key]
        return file ? { ...row, image_url: await uploadVendorVariantImage(variantProduct.id, file) } : row
      }))
      await saveVendorProductVariants(variantProduct.id, rows)
    }, 'Product variants and images saved.')
    if (saved) { setVariantProduct(null); setVariantImageFiles({}) }
  }

  async function openImageGallery(product: VendorProduct) {
    setImageProduct(product); setProductImages([]); setGalleryFile(null); setError('')
    try { setProductImages(await listVendorProductImages(product.id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Product images could not be loaded.') }
  }

  async function uploadGalleryImage() {
    if (!imageProduct || !galleryFile) return
    if (productImages.length >= 8) { setError('A product can have no more than 8 images.'); return }
    const saved = await runAction(async () => {
      await uploadVendorProductImage(imageProduct.id, galleryFile, imageProduct.name)
      setProductImages(await listVendorProductImages(imageProduct.id))
    }, 'Product image uploaded and optimized.')
    if (saved) setGalleryFile(null)
  }

  async function makePrimaryImage(imageId: string) {
    if (!imageProduct) return
    await runAction(async () => {
      await setVendorPrimaryProductImage(imageProduct.id, imageId)
      setProductImages(await listVendorProductImages(imageProduct.id))
    }, 'Primary product image updated.')
  }

  async function deleteGalleryImage(image: {id:string;storage_path:string|null}) {
    if (!imageProduct) return
    if (productImages.length <= 1) { setError('Keep at least one product image on the listing.'); return }
    if (!window.confirm('Remove this product image?')) return
    await runAction(async () => {
      await removeVendorProductImage(image.id, image.storage_path)
      setProductImages(await listVendorProductImages(imageProduct.id))
    }, 'Product image removed.')
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

  async function submitDeletionRequest(event: FormEvent) {
    event.preventDefault()
    if (!deletionTarget) return
    if (await runAction(() => requestVendorProductDeletion(deletionTarget.id, deletionReason), 'Product removal request sent to JTBazar for review.')) {
      setDeletionTarget(null); setDeletionReason('')
      setDeletionRequests(await listVendorProductDeletionRequests())
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

  async function saveShopProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const latitudeRaw = String(form.get('shop_lat') ?? '').trim()
    const longitudeRaw = String(form.get('shop_lng') ?? '').trim()
    const latitude = latitudeRaw ? Number(latitudeRaw) : null
    const longitude = longitudeRaw ? Number(longitudeRaw) : null
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) { setError('Enter valid shop latitude.'); return }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) { setError('Enter valid shop longitude.'); return }
    let shopHours: Record<string, {open:boolean;start:string;end:string}> = {}
    try { shopHours = JSON.parse(String(form.get('shop_hours') || '{}')) } catch { setError('Shop hours must be valid JSON.'); return }
    if (form.get('show_shop_on_map') === 'on' && (latitude === null || longitude === null || !String(form.get('shop_location_label') || '').trim())) {
      setError('Add valid coordinates and a public area label before showing your shop on the map.'); return
    }
    if (await runAction(async () => {
      let shopImageUrl: string | undefined
      if (shopImageFile) shopImageUrl = (await uploadVendorShopImage(shopImageFile)).url
      await updateVendorShopProfile({
        shop_name: shopName, slug: String(form.get('slug') || seller?.slug || ''),
        description: shopDescription, phone: shopPhone, current_address: shopAddress,
        complete_address: shopCompleteAddress, shop_lat: latitude, shop_lng: longitude,
        shop_location_label: String(form.get('shop_location_label') || ''),
        show_shop_on_map: form.get('show_shop_on_map') === 'on',
        shop_is_open: form.get('shop_is_open') === 'on', shop_hours: shopHours,
        ...(shopImageUrl ? { shop_image_url: shopImageUrl } : {}),
      })
    }, 'Shop profile and availability settings updated.')) {
      setShopEdit(false); setShopImageFile(null); await refreshSeller()
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
      {editingProduct&&<form onSubmit={submitProductEdit} className="mb-5 grid gap-3 rounded-2xl bg-cream-50 p-4 sm:grid-cols-2"><div className="sm:col-span-2"><h3 className="font-semibold">Edit product · {editingProduct.name}</h3><p className="text-xs text-muted">The existing vendor_update_product RPC saves the changes; review status remains controlled by JTBazar.</p></div><label className="text-xs font-semibold">Product name<input required minLength={2} value={editName} onChange={e=>setEditName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Your base price (PKR)<input required type="number" min="1" step="0.01" value={editPrice} onChange={e=>setEditPrice(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Category<select name="category_id" defaultValue={editingProduct.category_id??""} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3"><option value="">Uncategorized</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-xs font-semibold">SKU<input name="sku" defaultValue={editingProduct.sku??""} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Discount (%)<input name="discount_percent" type="number" min="0" max="100" step="0.01" defaultValue={editingProduct.discount_percent??0} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Supplier cost (PKR)<input name="supplier_cost" type="number" min="0" step="0.01" defaultValue={editingProduct.supplier_cost??""} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Fulfilment expense (PKR)<input name="fulfillment_expense" type="number" min="0" step="0.01" defaultValue={editingProduct.fulfillment_expense??0} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Minimum profit (PKR)<input name="minimum_profit" type="number" min="0" step="0.01" defaultValue={editingProduct.minimum_profit??0} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Weight (grams)<input name="weight_grams" type="number" min="0" step="1" defaultValue={editingProduct.weight_grams??""} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold sm:col-span-2">Short description<input value={editShortDescription} maxLength={300} onChange={e=>setEditShortDescription(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold sm:col-span-2">Full description<textarea required minLength={10} value={editDescription} onChange={e=>setEditDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-line p-3"/></label><label className="text-xs font-semibold sm:col-span-2">Specifications (JSON array)<textarea name="specifications" defaultValue={JSON.stringify(editingProduct.specifications??[],null,2)} className="mt-1 min-h-16 w-full rounded-lg border border-line p-3 font-mono text-xs"/></label><label className="text-xs font-semibold sm:col-span-2">Dimensions (JSON object)<textarea name="dimensions" defaultValue={JSON.stringify(editingProduct.dimensions??{},null,2)} className="mt-1 min-h-16 w-full rounded-lg border border-line p-3 font-mono text-xs"/></label><label className="text-xs font-semibold">SEO title<input name="seo_title" defaultValue={editingProduct.seo_title??""} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">SEO description<input name="seo_description" defaultValue={editingProduct.seo_description??""} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Save product</button><button type="button" onClick={()=>setEditingProduct(null)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div></form>}
      {showProductForm&&<form onSubmit={submitNewProduct} className="mb-5 grid gap-3 rounded-2xl bg-cream-50 p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold">Product name<input required minLength={2} value={productName} onChange={e=>setProductName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Category<select required value={productCategory} onChange={e=>setProductCategory(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3"><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs font-semibold">Your base price (PKR)<input required type="number" min="1" step="0.01" value={productPrice} onChange={e=>setProductPrice(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Initial stock<input required type="number" name="initial_stock" min="0" step="1" value={productStock} onChange={e=>setProductStock(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">SKU / product code<input name="sku" className="mt-1 h-10 w-full rounded-lg border border-line px-3" placeholder="Optional product code"/></label>
        <label className="text-xs font-semibold">Discount (%)<input name="discount_percent" type="number" min="0" max="100" step="0.01" defaultValue="0" className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Supplier cost (PKR)<input name="supplier_cost" type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Fulfilment expense (PKR)<input name="fulfillment_expense" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Minimum profit (PKR)<input name="minimum_profit" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Shipping weight (grams)<input name="weight_grams" type="number" min="0" step="1" className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">Track inventory<select name="track_inventory" defaultValue="on" className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3"><option value="on">Yes</option><option value="off">No</option></select></label>
        <label className="text-xs font-semibold sm:col-span-2">Short description<input name="short_description" maxLength={300} value={productDescription} onChange={e=>setProductDescription(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Full description<textarea required minLength={10} name="description" value={productDescription} onChange={e=>setProductDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-line p-3"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Specifications (JSON array)<textarea name="specifications" defaultValue="[]" className="mt-1 min-h-16 w-full rounded-lg border border-line p-3 font-mono text-xs"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Dimensions (JSON object)<textarea name="dimensions" defaultValue="{}" className="mt-1 min-h-16 w-full rounded-lg border border-line p-3 font-mono text-xs"/></label>
        <label className="text-xs font-semibold">SEO title<input name="seo_title" maxLength={70} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold">SEO description<input name="seo_description" maxLength={170} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Product images (JPG, PNG, WebP or AVIF; max 10 MB each; up to 8)<input required type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const files=Array.from(e.target.files??[]);const valid=files.filter(file=>file.size<=10*1024*1024&&['image/jpeg','image/png','image/webp','image/avif'].includes(file.type));if(valid.length!==files.length)setError('Only JPG, PNG, WebP or AVIF images up to 10 MB each are allowed.');if(valid.length>8)setError('You can upload up to 8 images.');setProductImagesFiles(valid.slice(0,8));e.target.value='';}} className="mt-1 block w-full text-xs"/></label>
        <p className="text-xs leading-5 text-muted sm:col-span-2">The listing is created through the existing vendor RPC, images are compressed and saved to the existing product-images bucket, and the submission is sent for Admin review. No schema or migration changes are made.</p>
        <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Create and submit</button><button type="button" onClick={()=>setShowProductForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div>
      </form>}<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Product</th><th>Price</th><th>Review</th><th>Visibility</th><th>Action</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-t border-line"><td className="py-3"><strong>{p.name}</strong><small className="block text-muted">{p.sku||p.slug}</small></td><td>{money(p.price)}</td><td><Status value={p.moderation_status}/></td><td><Status value={p.vendor_hidden?'hidden':'visible'}/></td><td><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void runAction(()=>setProductVisibility(p.id,!p.vendor_hidden),p.vendor_hidden?'Product shown.':'Product hidden.')} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">{p.vendor_hidden?<Eye size={13}/>:<EyeOff size={13}/>} {p.vendor_hidden?'Show':'Hide'}</button><button disabled={busy} onClick={()=>startProductEdit(p)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Edit</button><button disabled={busy} onClick={()=>void openVariants(p)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Variants</button><button disabled={busy} onClick={()=>void openImageGallery(p)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Images</button><button disabled={busy || deletionRequests.some(r=>r.product_id===p.id&&r.status==="pending")} onClick={()=>{setDeletionTarget(p);setDeletionReason("");}} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Request removal</button></div></td></tr>)}</tbody></table></div>
      {deletionRequests.length>0&&<div className="mt-4 rounded-xl border border-line p-3"><h3 className="text-sm font-semibold">Product removal requests</h3><div className="mt-2 space-y-2">{deletionRequests.map((request,i)=><div key={`${request.product_id}-${i}`} className="flex items-center justify-between gap-3 text-xs"><span>{products.find(p=>p.id===request.product_id)?.name||request.product_id}</span><Status value={request.status}/></div>)}</div></div>}
      {variantProduct&&<form onSubmit={submitVariants} className="mt-5 rounded-2xl bg-cream-50 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Variants · {variantProduct.name}</h3><p className="text-xs text-muted">Options such as size, colour or pack. Changes use the existing vendor_save_product_variants RPC.</p></div><button type="button" onClick={()=>setVariantProduct(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs">Close</button></div>
        {variantsLoading?<p className="py-3 text-sm text-muted">Loading variants…</p>:<div className="space-y-2">{variantRows.map((v,i)=><div key={v.id||`new-${i}`} className="grid gap-2 rounded-xl border border-line bg-white p-3 sm:grid-cols-5"><label className="text-[11px] font-semibold">Option<input value={v.option_label} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,option_label:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Value<input value={v.option_value} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,option_value:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm" placeholder="Large / Black"/></label><label className="text-[11px] font-semibold">SKU<input value={v.sku||''} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,sku:e.target.value}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Price override<input type="number" min="0" step="0.01" value={v.price_override??''} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,price_override:e.target.value===''?null:Number(e.target.value)}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Stock<input type="number" min="0" step="1" value={v.quantity} onChange={e=>setVariantRows(rows=>rows.map((r,j)=>j===i?{...r,quantity:Number(e.target.value)}:r))} className="mt-1 h-9 w-full rounded-lg border border-line px-2 text-sm"/></label><label className="text-[11px] font-semibold">Variant image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file&&file.size<=10*1024*1024)setVariantImageFiles(files=>({...files,[v.id||`new-${i}`]:file}));else if(file)setError("Variant image must be 10 MB or smaller.");e.target.value="";}} className="mt-1 block w-full text-[10px]"/>{v.image_url&&<a href={v.image_url} target="_blank" rel="noreferrer" className="text-[10px] text-sage-700 underline">Current image</a>}</label></div>)}</div>}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>setVariantRows(rows=>[...rows,{id:null,option_label:'Size',option_value:'',sku:null,price_override:null,attributes:{},image_url:null,quantity:0}])} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold">Add variant</button><button disabled={busy||variantsLoading} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white">Save variants</button></div>
      </form>}
    </section>}
    {tab==='inventory' && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Inventory & stock</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Product</th><th>Variant</th><th>Quantity</th><th>Updated</th><th>Action</th></tr></thead><tbody>{inventory.map(row=><tr key={row.id} className="border-t border-line"><td className="py-3 font-medium">{row.product_name}</td><td>{row.variant_name||'—'}</td><td><strong>{row.quantity}</strong></td><td>{date(row.updated_at)}</td><td><button onClick={()=>{setStockTarget(row);setStockValue(String(row.quantity));setStockNote('')}} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Adjust stock</button></td></tr>)}</tbody></table></div>{stockTarget&&<form onSubmit={submitStock} className="mt-5 grid gap-3 rounded-xl bg-cream-50 p-4 sm:grid-cols-3"><label className="text-xs font-semibold">New quantity<input type="number" min="0" step="1" required value={stockValue} onChange={e=>setStockValue(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="text-xs font-semibold">Reason / note<input value={stockNote} onChange={e=>setStockNote(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3" placeholder="Stock count correction"/></label><div className="flex items-end gap-2"><button disabled={busy} className="h-10 rounded-lg bg-forest px-4 text-sm font-semibold text-white">Save stock</button><button type="button" onClick={()=>setStockTarget(null)} className="h-10 rounded-lg border border-line px-4 text-sm">Cancel</button></div></form>}</section>}
    {tab==='orders' && <section className="rounded-2xl border border-line bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Order fulfilment</h2><form onSubmit={e=>{e.preventDefault();void loadOrdersPage(0,orderSearch,orderStatus)}} className="flex flex-wrap gap-2"><input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search order or product" className="h-10 rounded-lg border border-line px-3 text-sm"/><select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)} className="h-10 rounded-lg border border-line bg-white px-3 text-sm"><option value="all">All statuses</option><option value="pending">Pending</option><option value="delivered">Delivered</option><option value="not_delivered">Not delivered</option></select><button disabled={busy} className="h-10 rounded-lg bg-forest px-4 text-xs font-semibold text-white">Filter</button></form></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs text-muted"><tr><th className="py-2">Order</th><th>Product</th><th>Qty</th><th>Vendor status</th><th>Pickup</th><th>Action</th></tr></thead><tbody>{orders.map(row=><tr key={row.id} className="border-t border-line"><td className="py-3">#{String(row.order_number??row.order_id).slice(-8)}<small className="block text-muted">{date(row.created_at)}</small></td><td>{row.product_name}</td><td>{row.quantity}</td><td><Status value={row.vendor_fulfillment_status}/></td><td><Status value={row.pickup_status||'not_applicable'}/></td><td>{!['ready_for_pickup','picked_up','delivered','cancelled'].includes(String(row.vendor_fulfillment_status))?<button disabled={busy} onClick={()=>void runAction(()=>markOrderReady(row.order_id), 'Order marked ready for pickup.')} className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white">Mark ready</button>:<span className="text-xs text-muted">No action</span>}</td></tr>)}</tbody></table></div>{!orders.length&&<p className="py-5 text-sm text-muted">No vendor order items found for these filters.</p>}<div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted">Page {orderPage+1}</span><div className="flex gap-2"><button disabled={busy||orderPage===0} onClick={()=>void loadOrdersPage(orderPage-1)} className="rounded-lg border border-line px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={busy||!ordersHasNext} onClick={()=>void loadOrdersPage(orderPage+1)} className="rounded-lg border border-line px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div></section>}
    {tab==='cases' && <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Customer cases</h2><div className="mt-4 space-y-3">{cases.map(c=><article key={c.id} className="rounded-xl border border-line p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{c.case_type?.replace(/_/g,' ')||'Customer case'}</strong><Status value={c.status}/></div><p className="mt-2 text-sm text-muted">{c.reason}</p>{c.seller_response&&<p className="mt-2 rounded-lg bg-cream-50 p-3 text-sm">Your response: {c.seller_response}</p>}<button onClick={()=>{setCaseTarget(c);setCaseReply(c.seller_response||'')}} className="mt-3 rounded-lg border border-line px-3 py-2 text-xs font-semibold">Respond to case</button></article>)}{!cases.length&&<p className="py-5 text-sm text-muted">No customer cases.</p>}</div>{caseTarget&&<form onSubmit={submitCase} className="mt-4 rounded-xl bg-cream-50 p-4"><label className="text-xs font-semibold">Your response<textarea required minLength={3} value={caseReply} onChange={e=>setCaseReply(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-line p-3"/></label><div className="mt-3 flex gap-2"><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Send response</button><button type="button" onClick={()=>setCaseTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div></form>}</section>}
    {tab==='support' && <section className="grid gap-4 xl:grid-cols-2"><article className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Support tickets</h2><span className="text-xs text-muted">{supportTickets.length} tickets</span></div><form onSubmit={submitNewTicket} className="mt-4 space-y-2 rounded-xl bg-cream-50 p-3"><input required minLength={3} value={supportSubject} onChange={e=>setSupportSubject(e.target.value)} placeholder="Ticket subject" className="h-10 w-full rounded-lg border border-line px-3 text-sm"/><textarea required minLength={5} value={newTicketMessage} onChange={e=>setNewTicketMessage(e.target.value)} placeholder="Describe how we can help…" className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"/><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white">Create ticket</button></form><div className="mt-4 space-y-2">{supportTickets.map(t=><button key={t.id} onClick={()=>void openSupportTicket(t)} className={`w-full rounded-xl border p-3 text-left ${activeTicket?.id===t.id?'border-sage-600 bg-sage-50':'border-line hover:bg-cream-50'}`}><div className="flex justify-between gap-2"><strong className="text-sm">{t.subject}</strong><Status value={t.status}/></div><p className="mt-1 line-clamp-2 text-xs text-muted">{t.message}</p><small className="text-muted">{date(t.created_at)}</small></button>)}{!supportTickets.length&&<p className="py-4 text-sm text-muted">No support tickets yet.</p>}</div></article><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">{activeTicket?.subject||'Ticket conversation'}</h2>{activeTicket?<><div className="mt-4 max-h-96 space-y-3 overflow-y-auto">{supportMessages.map(m=><div key={m.id} className={`max-w-[90%] rounded-xl p-3 text-sm ${m.sender_role==='seller'?'ml-auto bg-sage-50':'bg-cream-50'}`}><p>{m.message}</p><small className="mt-1 block text-[10px] text-muted">{m.sender_role==='seller'?'You':'JTBazar support'} · {date(m.created_at)}</small></div>)}{!supportMessages.length&&<p className="text-sm text-muted">No replies yet.</p>}</div><form onSubmit={submitSupportReply} className="mt-4 flex gap-2"><input required minLength={2} value={supportDraft} onChange={e=>setSupportDraft(e.target.value)} placeholder="Write a reply…" className="h-11 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm"/><button disabled={busy} className="rounded-lg bg-forest px-4 text-xs font-semibold text-white">Send</button></form></>:<p className="mt-4 text-sm text-muted">Select a ticket to view its conversation.</p>}</article></section>}
    {tab==='settings' && <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Shop information</h2><button onClick={()=>{setShopName(seller.shop_name||'');setShopDescription(seller.description||'');setShopPhone(seller.phone||'');setShopAddress(seller.current_address||'');setShopCompleteAddress(seller.complete_address||'');setShopEdit(v=>!v)}} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">{shopEdit?'Cancel':'Edit profile'}</button></div>{shopEdit?<form onSubmit={saveShopProfile} className="mt-4 space-y-3"><label className="block text-xs font-semibold">Shop name<input required minLength={2} value={shopName} onChange={e=>setShopName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Shop URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" name="slug" defaultValue={seller.slug||''} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Description<textarea required minLength={10} value={shopDescription} onChange={e=>setShopDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-line p-3"/></label><label className="block text-xs font-semibold">Account contact email<input readOnly value={user.email||''} className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3"/></label><label className="block text-xs font-semibold">Phone<input required value={shopPhone} onChange={e=>setShopPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Area / city<input required value={shopAddress} onChange={e=>setShopAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Complete address<input required value={shopCompleteAddress} onChange={e=>setShopCompleteAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold">Latitude<input name="shop_lat" type="number" step="any" defaultValue={seller.shop_lat??''} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="block text-xs font-semibold">Longitude<input name="shop_lng" type="number" step="any" defaultValue={seller.shop_lng??''} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label></div><label className="block text-xs font-semibold">Public map area label<input name="shop_location_label" defaultValue={seller.shop_location_label||''} className="mt-1 h-10 w-full rounded-lg border border-line px-3"/></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="show_shop_on_map" defaultChecked={Boolean(seller.show_shop_on_map)}/> Show shop on public map</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="shop_is_open" defaultChecked={seller.shop_is_open!==false}/> Shop is currently open</label><label className="block text-xs font-semibold">Weekly shop hours (JSON)<textarea name="shop_hours" defaultValue={JSON.stringify(seller.shop_hours||{},null,2)} className="mt-1 min-h-32 w-full rounded-lg border border-line p-3 font-mono text-xs"/></label><label className="block text-xs font-semibold">Shop image (JPG, PNG, WebP or AVIF; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setShopImageFile(e.target.files?.[0]??null)} className="mt-1 block w-full text-xs"/></label><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Save shop profile</button></form>:null}<dl className="mt-4 space-y-3 text-sm">{[['Shop name',seller.shop_name],['Business type',seller.business_type||seller.vendor_type],['Contact email',seller.contact_email],['Phone',seller.phone],['Address',seller.complete_address||seller.current_address],['Public area',seller.shop_location_label],['Approval status',seller.status]].map(([k,v])=><div key={k} className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-muted">{k}</dt><dd className="max-w-[65%] text-right font-medium">{v||'—'}</dd></div>)}</dl><div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-semibold">Private verification documents</h3><p className="mt-1 text-xs text-muted">Your documents are private. Links are short-lived and visible only to your signed-in seller account.</p><div className="mt-3 flex flex-wrap gap-3 text-xs">{sellerDocumentUrls.cnicFront&&<a className="text-sage-700 underline" href={sellerDocumentUrls.cnicFront} target="_blank" rel="noreferrer">CNIC front</a>}{sellerDocumentUrls.cnicBack&&<a className="text-sage-700 underline" href={sellerDocumentUrls.cnicBack} target="_blank" rel="noreferrer">CNIC back</a>}{sellerDocumentUrls.verification&&<a className="text-sage-700 underline" href={sellerDocumentUrls.verification} target="_blank" rel="noreferrer">Business document PDF</a>}{!sellerDocumentUrls.cnicFront&&!sellerDocumentUrls.cnicBack&&!sellerDocumentUrls.verification&&<span className="text-muted">No documents available.</span>}</div></div></article><article className="rounded-2xl border border-line bg-white p-5"><h2 className="font-display text-lg font-semibold">Platform safety</h2><p className="mt-3 text-sm leading-6 text-muted">Your seller access, product permissions, inventory changes and order actions are checked by the existing Supabase policies and vendor RPC functions. The Vendor Center does not contain a service-role key and does not create database tables.</p></article></section>}
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted"><span>JTBazar Vendor Center · Shared marketplace database</span><span className="inline-flex items-center gap-1"><Wallet size={13}/> Payout and settlement details remain in the Earnings module.</span></footer>

    {deletionTarget&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={submitDeletionRequest} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-display text-xl font-semibold">Request product removal</h2><p className="mt-2 text-sm text-muted">JTBazar Admin will review this request. The listing will not be deleted automatically.</p><p className="mt-2 text-sm font-semibold">{deletionTarget.name}</p><label className="mt-4 block text-xs font-semibold">Reason<textarea required minLength={3} value={deletionReason} onChange={e=>setDeletionReason(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-line p-3"/></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setDeletionTarget(null)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Send request</button></div></form></div>}
    {imageProduct&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-label={`Images for ${imageProduct.name}`} className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Product images</h2><p className="text-xs text-muted">{imageProduct.name} · Keep the clearest image as primary</p></div><button onClick={()=>setImageProduct(null)} className="rounded-lg border border-line px-3 py-2 text-sm">Close</button></div><div className="my-4 flex flex-wrap items-center gap-3 rounded-xl bg-cream-50 p-3"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setGalleryFile(e.target.files?.[0]??null)} className="min-w-0 flex-1 text-xs"/><button disabled={!galleryFile||busy||productImages.length>=8} onClick={()=>void uploadGalleryImage()} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Upload image</button></div><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{productImages.map(image=><article key={image.id} className="overflow-hidden rounded-xl border border-line"><img src={image.url} alt={image.alt_text||imageProduct.name} className="aspect-square w-full object-cover"/><div className="flex items-center justify-between gap-2 p-2"><span className="text-xs">{image.is_primary?'Primary image':'Gallery image'}</span><div className="flex gap-1">{!image.is_primary&&<button onClick={()=>void makePrimaryImage(image.id)} disabled={busy} className="rounded border border-line px-2 py-1 text-[10px]">Make primary</button>}<button onClick={()=>void deleteGalleryImage(image)} disabled={busy} className="rounded border border-red-200 px-2 py-1 text-[10px] text-red-700">Remove</button></div></div></article>)}</div>{!productImages.length&&<p className="py-6 text-center text-sm text-muted">No product images are attached yet.</p>}</section></div>}
    {stockTarget&&<div className="sr-only" aria-live="polite">Editing stock for {stockTarget.product_name}</div>}
  </main>
}
