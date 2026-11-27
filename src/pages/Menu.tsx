import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, Eye, EyeOff, ImagePlus, LoaderCircle, Package, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  createVendorProduct, finalizeVendorProductSubmission, getVendorCommissionPreview,
  listVendorCategories, listVendorInventory, listVendorProductImages, listVendorProductPrimaryImages,
  listVendorProductVariants, listVendorProducts, requestVendorProductDeletion,
  saveVendorProductVariants, setProductVisibility, updateVendorProduct,
  uploadVendorProductImage, uploadVendorVariantImage,
  type VendorProduct, type VendorVariantInput,
} from '../services/marketplaceApi'
import { formatPKR } from '../utils'

type InventoryRow = { product_id: string; quantity: number; low_stock_threshold?: number | null }
type CategoryRow = { id: string; name: string; parent_id?: string | null; is_food_category?: boolean }
type ProductImage = { id: string; url: string; alt_text?: string | null; is_primary?: boolean }

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function codeFromName(value: string) {
  const slug = slugify(value)
  return slug ? `JTB-${slug.toUpperCase()}` : ''
}

function ProductEditor({ product, categories, onCancel, onSaved }: {
  product: VendorProduct | null
  categories: CategoryRow[]
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(String(product?.name ?? ''))
  const [slug, setSlug] = useState(String(product?.slug ?? ''))
  const [sku, setSku] = useState(String(product?.sku ?? ''))
  const [slugManual, setSlugManual] = useState(Boolean(product?.slug))
  const [skuManual, setSkuManual] = useState(Boolean(product?.sku))
  const [categoryId, setCategoryId] = useState(String(product?.category_id ?? ''))
  const [price, setPrice] = useState(String(product?.vendor_base_price ?? product?.price ?? ''))
  const [discount, setDiscount] = useState(String(product?.discount_percent ?? 0))
  const [supplierCost, setSupplierCost] = useState(product?.supplier_cost == null ? '' : String(product.supplier_cost))
  const [fulfilment, setFulfilment] = useState(String(product?.fulfillment_expense ?? 0))
  const [minimumProfit, setMinimumProfit] = useState(String(product?.minimum_profit ?? 0))
  const [weight, setWeight] = useState(product?.weight_grams == null ? '' : String(product.weight_grams))
  const [shortDescription, setShortDescription] = useState(String(product?.short_description ?? ''))
  const [description, setDescription] = useState(String(product?.description ?? ''))
  const [specifications, setSpecifications] = useState(JSON.stringify(product?.specifications ?? [], null, 2))
  const [dimensions, setDimensions] = useState(JSON.stringify(product?.dimensions ?? {}, null, 2))
  const [seoTitle, setSeoTitle] = useState(String(product?.seo_title ?? ''))
  const [seoDescription, setSeoDescription] = useState(String(product?.seo_description ?? ''))
  const [trackInventory, setTrackInventory] = useState(product?.track_inventory !== false)
  const [initialStock, setInitialStock] = useState('0')
  const [commission, setCommission] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState('')
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [variants, setVariants] = useState<VendorVariantInput[]>([])
  const [variantFiles, setVariantFiles] = useState<Record<string, File>>({})
  const [loadingDetails, setLoadingDetails] = useState(Boolean(product?.id))


  useEffect(() => {
    let active = true
    setCommissionLoading(true)
    setCommissionError('')
    getVendorCommissionPreview(categoryId || null)
      .then(rate => { if (active) setCommission(rate) })
      .catch(cause => { if (active) { setCommission(null); setCommissionError(cause instanceof Error ? cause.message : 'Commission could not be verified.') } })
      .finally(() => { if (active) setCommissionLoading(false) })
    return () => { active = false }
  }, [categoryId])

  useEffect(() => {
    let active = true
    if (!product?.id) { setLoadingDetails(false); return }
    Promise.all([listVendorProductImages(String(product.id)), listVendorProductVariants(String(product.id))])
      .then(([images, savedVariants]) => {
        if (!active) return
        setExistingImages(images as ProductImage[])
        setVariants(savedVariants)
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Product details could not be loaded.') })
      .finally(() => { if (active) setLoadingDetails(false) })
    return () => { active = false }
  }, [product?.id])

  const base = Math.max(0, Number(price) || 0)
  const rate = commission ?? 0
  const fee = Number((base * rate / 100).toFixed(2))
  const customerPrice = Number((base + fee).toFixed(2))
  const discountRate = Math.min(100, Math.max(0, Number(discount) || 0))
  const discountAmount = Number((customerPrice * discountRate / 100).toFixed(2))
  const supplier = Math.max(0, Number(supplierCost) || 0)
  const fulfilmentCost = Math.max(0, Number(fulfilment) || 0)
  const profit = Number((base - supplier - fulfilmentCost).toFixed(2))
  const imageCount = existingImages.length + imageFiles.length

  const addImages = (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files)
    const valid = selected.filter(file => file.size <= 10 * 1024 * 1024 && ['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))
    if (valid.length !== selected.length) setError('Only JPG, PNG, WebP or AVIF images up to 10 MB each are allowed.')
    if (valid.length > 8 - imageCount) setError('You can add a maximum of 8 product images in total.')
    setImageFiles(current => [...current, ...valid.slice(0, Math.max(0, 8 - imageCount))])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !categoryId) {
      setError('Enter a product name, valid URL slug and category.')
      return
    }
    if (commission === null || commissionError || commissionLoading) {
      setError('The category commission could not be verified. Please wait and try again.')
      return
    }
    if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(Number(fulfilment)) || Number(fulfilment) < 0 ||
      !Number.isFinite(Number(minimumProfit)) || Number(minimumProfit) < 0 ||
      (supplierCost.trim() && (!Number.isFinite(Number(supplierCost)) || Number(supplierCost) < 0)) ||
      !Number.isFinite(Number(discount)) || Number(discount) < 0 || Number(discount) > 100 ||
      (weight && (!Number.isInteger(Number(weight)) || Number(weight) < 0)) ||
      (!product && (!Number.isInteger(Number(initialStock)) || Number(initialStock) < 0))) {
      setError('Please enter valid price, cost, discount, weight and stock values.')
      return
    }
    if (imageCount < 1) { setError('Upload at least one product image before submitting.'); return }
    const keys = variants.map(row => row.option_label.trim().toLowerCase() + '::' + row.option_value.trim().toLowerCase())
    if (variants.some(row => !row.option_label.trim() || !row.option_value.trim() || !Number.isInteger(row.quantity) || row.quantity < 0 || (row.price_override !== null && (!Number.isFinite(row.price_override) || row.price_override < 0))) || new Set(keys).size !== keys.length) {
      setError('Each variant needs a unique option/value and valid price and whole-number stock.')
      return
    }
    let specs: unknown, dims: unknown
    try { specs = JSON.parse(specifications || '[]'); dims = JSON.parse(dimensions || '{}') }
    catch { setError('Specifications must be a valid JSON array and dimensions a valid JSON object.'); return }
    if (!Array.isArray(specs) || !dims || typeof dims !== 'object' || Array.isArray(dims)) {
      setError('Specifications must be a JSON array and dimensions must be a JSON object.')
      return
    }
    setSaving(true)
    try {
      const input = {
        category_id: categoryId, name: name.trim(), slug, sku: sku.trim() || null,
        short_description: shortDescription.trim(), description: description.trim(),
        price: base, supplier_cost: supplierCost.trim() ? Number(supplierCost) : null,
        fulfillment_expense: Number(fulfilment), minimum_profit: Number(minimumProfit),
        discount_percent: Number(discount), weight_grams: weight ? Number(weight) : null,
        specifications: specs, dimensions: dims, seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      }
      const productId = product?.id
        ? (await updateVendorProduct(String(product.id), input), String(product.id))
        : await createVendorProduct({ ...input, track_inventory: trackInventory, initial_stock: Number(initialStock) })
      const variantRows = await Promise.all(variants.map(async row => {
        const file = variantFiles[row.id ?? '']
        return file ? { ...row, image_url: await uploadVendorVariantImage(productId, file) } : row
      }))
      await saveVendorProductVariants(productId, variantRows)
      for (const file of imageFiles) await uploadVendorProductImage(productId, file, name.trim())
      await finalizeVendorProductSubmission(productId)
      await onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The product could not be saved.')
    } finally { setSaving(false) }
  }

  return <Card className="p-4 sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-wider text-sage-700">Product catalogue</p><h2 className="mt-1 font-display text-lg font-semibold text-forest">{product ? 'Edit product' : 'Create product'}</h2><p className="mt-1 text-[10px] text-muted">Listing changes use the existing vendor-authorized Supabase workflows.</p></div><Button variant="secondary" size="sm" onClick={onCancel}><X size={13}/> Close</Button></div>
    {error ? <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[10px] text-red-800"><AlertCircle size={13} className="mr-1 inline"/>{error}</div> : null}
    {loadingDetails ? <div className="flex items-center gap-2 py-8 text-xs text-muted"><LoaderCircle size={14} className="animate-spin"/> Loading saved images and variants…</div> : <form onSubmit={submit} className="space-y-4">
      <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-forest">Product details</h3><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold text-muted sm:col-span-2">Product name *<input required minLength={2} maxLength={180} value={name} onChange={e=>{const v=e.target.value;setName(v);if(!slugManual)setSlug(slugify(v));if(!skuManual)setSku(codeFromName(v))}} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Product URL slug *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={e=>{setSlugManual(true);setSlug(slugify(e.target.value))}} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">SKU / Product code<input value={sku} onChange={e=>{setSkuManual(true);setSku(e.target.value)}} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted sm:col-span-2">Category *<select required value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div></section>
      <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-forest">Pricing and commission</h3><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold text-muted">Your base price (PKR) *<input required type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Discount (%)<input type="number" min="0" max="100" step="0.01" value={discount} onChange={e=>setDiscount(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
      </div><div className="mt-3 rounded-xl border border-sage-200 bg-sage-50 p-3 text-[10px]"><div className="flex justify-between gap-3"><strong>Price breakdown</strong><span>{commissionLoading?'Loading…':commission===null?'Not verified':commission+'% commission'}</span></div>{commissionError?<p className="mt-2 text-red-700">{commissionError}</p>:<><div className="mt-2 flex justify-between"><span>Your base price</span><strong>{formatPKR(base)}</strong></div><div className="mt-1 flex justify-between"><span>JTBazar commission</span><strong>+ {formatPKR(fee)}</strong></div><div className="mt-1 flex justify-between border-t border-sage-200 pt-2"><span>Customer price before discount</span><strong>{formatPKR(customerPrice)}</strong></div><div className="mt-1 flex justify-between"><span>Discount amount</span><strong>− {formatPKR(discountAmount)}</strong></div><div className="mt-1 flex justify-between border-t border-sage-200 pt-2"><span>Customer price after discount</span><strong>{formatPKR(customerPrice-discountAmount)}</strong></div></>}</div></section>
      <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-forest">Private cost and profit</h3><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold text-muted">Supplier cost (private)<input type="number" min="0" step="0.01" value={supplierCost} onChange={e=>setSupplierCost(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Fulfilment expense<input type="number" min="0" step="0.01" value={fulfilment} onChange={e=>setFulfilment(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Minimum profit target<input type="number" min="0" step="0.01" value={minimumProfit} onChange={e=>setMinimumProfit(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Shipping weight (grams)<input type="number" min="0" step="1" value={weight} onChange={e=>setWeight(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label>
      </div><div className="mt-3 rounded-xl border border-line bg-cream-50 p-3 text-[10px]"><div className="flex justify-between"><span>Supplier + fulfilment cost</span><strong>{formatPKR(supplier+fulfilmentCost)}</strong></div><div className="mt-1 flex justify-between"><span>Estimated vendor profit before other expenses</span><strong>{formatPKR(profit)}</strong></div><p className="mt-2 text-[9px] text-muted">Profit = your base price − supplier cost − fulfilment expense. Minimum profit is a target, not an automatically guaranteed margin.</p></div></section>
      {!product ? <section className="rounded-xl border border-line p-3"><h3 className="text-xs font-bold text-forest">Inventory tracking</h3><label className="mt-2 flex items-center gap-2 text-[10px]"><input type="checkbox" checked={trackInventory} onChange={e=>setTrackInventory(e.target.checked)}/> Track inventory for this listing</label><label className="mt-2 block text-[10px] font-semibold text-muted">Initial stock quantity<input type="number" min="0" step="1" value={initialStock} onChange={e=>setInitialStock(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label></section> : null}
      <section><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-forest">Variants</h3><Button size="sm" variant="secondary" onClick={()=>setVariants(rows=>[...rows,{id:'new-'+crypto.randomUUID(),option_label:'Size',option_value:'',sku:null,price_override:null,attributes:{},quantity:0}])}><Plus size={12}/> Add variant</Button></div><p className="mb-3 text-[9px] text-muted">Add options such as Size, Color or Material. Each option has its own SKU, optional price and stock.</p>{variants.map((row,index)=><div key={row.id??index} className="mb-2 grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-[9px] font-semibold text-muted">Option name<input value={row.option_label} onChange={e=>setVariants(rows=>rows.map((v,i)=>i===index?{...v,option_label:e.target.value}:v))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink"/></label>
        <label className="text-[9px] font-semibold text-muted">Option value<input value={row.option_value} onChange={e=>setVariants(rows=>rows.map((v,i)=>i===index?{...v,option_value:e.target.value}:v))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink"/></label>
        <label className="text-[9px] font-semibold text-muted">Variant SKU<input value={row.sku??''} onChange={e=>setVariants(rows=>rows.map((v,i)=>i===index?{...v,sku:e.target.value||null}:v))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink"/></label>
        <label className="text-[9px] font-semibold text-muted">Price override<input type="number" min="0" step="0.01" value={row.price_override??''} onChange={e=>setVariants(rows=>rows.map((v,i)=>i===index?{...v,price_override:e.target.value===''?null:Number(e.target.value)}:v))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink"/></label>
        <div className="flex items-end gap-2"><label className="flex-1 text-[9px] font-semibold text-muted">Stock<input type="number" min="0" step="1" value={row.quantity} onChange={e=>setVariants(rows=>rows.map((v,i)=>i===index?{...v,quantity:Number(e.target.value)}:v))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink"/></label><Button size="sm" variant="ghost" color="danger" onClick={()=>setVariants(rows=>rows.filter((_,i)=>i!==index))}><X size={13}/></Button></div>
        <label className="text-[9px] font-semibold text-muted sm:col-span-2">Variant image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];if(file&&file.size<=10*1024*1024)setVariantFiles(current=>({...current,[row.id??'']:file}));else if(file)setError('Variant images must be 10 MB or smaller.')}} className="mt-1 block w-full text-[9px]"/></label>
      </div>)}</section>
      <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-forest">Product images ({imageCount}/8)</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{existingImages.map(image=><div key={image.id} className="overflow-hidden rounded-lg border border-line"><img src={image.url} alt={image.alt_text??name} className="aspect-square w-full object-cover"/><p className="p-1 text-[8px] text-muted">{image.is_primary?'Primary image':'Saved image'}</p></div>)}{imageFiles.map((file,index)=><div key={file.name+index} className="relative overflow-hidden rounded-lg border border-line"><img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square w-full object-cover"/><button type="button" onClick={()=>setImageFiles(rows=>rows.filter((_,i)=>i!==index))} className="absolute right-1 top-1 rounded-full bg-white p-1"><X size={12}/></button></div>)}</div><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-sage-400 p-3 text-[10px] font-semibold text-sage-700"><ImagePlus size={14}/> Add JPG / PNG / WebP / AVIF images<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={imageCount>=8} onChange={e=>addImages(e.target.files)} className="hidden"/></label><p className="mt-1 text-[9px] text-muted">At least one image required. Maximum 8 total, 10 MB each. Existing images are retained when you add more.</p></section>
      <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-forest">Description and SEO</h3><div className="grid gap-3"><label className="text-[10px] font-semibold text-muted">Short description<textarea maxLength={300} rows={2} value={shortDescription} onChange={e=>setShortDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 text-xs text-ink"/></label><label className="text-[10px] font-semibold text-muted">Full description<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 text-xs text-ink"/></label><label className="text-[10px] font-semibold text-muted">Specifications (JSON array)<textarea rows={3} value={specifications} onChange={e=>setSpecifications(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 font-mono text-[10px] text-ink"/></label><label className="text-[10px] font-semibold text-muted">Dimensions (JSON object)<textarea rows={3} value={dimensions} onChange={e=>setDimensions(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 font-mono text-[10px] text-ink"/></label><label className="text-[10px] font-semibold text-muted">SEO title<input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label><label className="text-[10px] font-semibold text-muted">SEO description<textarea rows={2} value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 text-xs text-ink"/></label></div></section>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4"><Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button><button type="submit" disabled={saving||commission===null||commissionLoading||loadingDetails} className="inline-flex h-9 items-center gap-2 rounded-lg bg-forest px-3 text-[10px] font-semibold text-white disabled:opacity-50">{saving?<LoaderCircle size={13} className="animate-spin"/>:<Package size={13}/>} {saving?'Saving…':product?'Save changes':'Submit listing'}</button></div>
    </form>}
  </Card>
}

export function MenuPage() {
  const { user } = useVendorAuth()
  const [products,setProducts]=useState<VendorProduct[]>([])
  const [inventory,setInventory]=useState<InventoryRow[]>([])
  const [categories,setCategories]=useState<CategoryRow[]>([])
  const [images,setImages]=useState<Record<string,string>>({})
  const [deletionRequests,setDeletionRequests]=useState<Array<{product_id:string;status:string}>>([])
  const [loading,setLoading]=useState(true)
  const [refreshing,setRefreshing]=useState(false)
  const [actionId,setActionId]=useState<string|null>(null)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [categoryFilter,setCategoryFilter]=useState('all')
  const [moderation,setModeration]=useState('all')
  const [visibility,setVisibility]=useState('all')
  const [stockFilter,setStockFilter]=useState('all')
  const [editing,setEditing]=useState<VendorProduct|null>(null)
  const [creating,setCreating]=useState(false)
  const [deletionTarget,setDeletionTarget]=useState<VendorProduct|null>(null)
  const [deletionReason,setDeletionReason]=useState('')
  const [deleting,setDeleting]=useState(false)

  const load=useCallback(async(quiet=false)=>{
    if(!user){setProducts([]);setInventory([]);setCategories([]);setImages({});setLoading(false);return}
    quiet?setRefreshing(true):setLoading(true);setError('')
    try{
      const [p,i,c,d]=await Promise.all([listVendorProducts(),listVendorInventory(),listVendorCategories(),listVendorProductDeletionRequests()])
      setProducts(p);setInventory(i as InventoryRow[]);setCategories(c);setDeletionRequests(d)
      setImages(await listVendorProductPrimaryImages(p.map(row=>String(row.id))))
    }catch(cause){setError(cause instanceof Error?cause.message:'Your live product data could not be loaded.')}
    finally{setLoading(false);setRefreshing(false)}
  },[user])
  useEffect(()=>{void load()},[load])

  const categoryNames=useMemo(()=>new Map(categories.map(c=>[c.id,c.name])),[categories])
  const stockByProduct=useMemo(()=>{const map=new Map<string,number>();for(const row of inventory)map.set(row.product_id,(map.get(row.product_id)??0)+Number(row.quantity??0));return map},[inventory])
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase()
    return products.filter(p=>{
      if(q&&![p.name,p.sku,p.slug,categoryNames.get(String(p.category_id??''))].some(v=>String(v??'').toLowerCase().includes(q)))return false
      if(categoryFilter!=='all'&&String(p.category_id)!==categoryFilter)return false
      if(moderation!=='all'&&String(p.moderation_status)!==moderation)return false
      if(visibility==='visible'&&p.vendor_hidden)return false
      if(visibility==='hidden'&&!p.vendor_hidden)return false
      const qty=stockByProduct.get(String(p.id))??0
      if(stockFilter==='in_stock'&&qty<=0)return false
      if(stockFilter==='out_of_stock'&&qty>0)return false
      if(stockFilter==='low_stock'&&(qty<=0||qty>(inventory.find(row=>row.product_id===p.id)?.low_stock_threshold??5)))return false
      return true
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name)))
  },[products,search,categoryFilter,moderation,visibility,stockFilter,categoryNames,stockByProduct,inventory])

  const toggleVisibility=async(product:VendorProduct)=>{
    const id=String(product.id);setActionId(id);setError('')
    try{await setProductVisibility(id,!Boolean(product.vendor_hidden));await load(true)}
    catch(cause){setError(cause instanceof Error?cause.message:'Product visibility could not be updated.')}
    finally{setActionId(null)}
  }
  const submitDeletion=async()=>{
    if(!deletionTarget||deletionReason.trim().length<3)return
    setDeleting(true);setError('')
    try{await requestVendorProductDeletion(String(deletionTarget.id),deletionReason);setDeletionTarget(null);setDeletionReason('');await load(true)}
    catch(cause){setError(cause instanceof Error?cause.message:'Deletion request could not be submitted.')}
    finally{setDeleting(false)}
  }
  const saveComplete=async()=>{setCreating(false);setEditing(null);await load(true)}

  return <div className="space-y-4">
    <PageHeader eyebrow={<><Package size={12}/> Product catalogue</>} title="Your products, your business." description="Create and edit your own listings, manage variants, pricing, images and moderation requests using existing vendor-authorized marketplace workflows." actions={<><Button variant="secondary" onClick={()=>void load(true)} disabled={loading||refreshing}>{refreshing?<LoaderCircle size={13} className="animate-spin"/>:<RefreshCw size={13}/>} Refresh</Button><Button variant="primary" onClick={()=>{setEditing(null);setCreating(true)}}><Plus size={13}/> Add product</Button></>}/>
    {error?<Card className="border border-red-200 bg-red-50 p-3 text-[10px] text-red-800">{error}</Card>:null}
    {creating||editing?<ProductEditor key={editing?.id??'new'} product={editing} categories={categories} onCancel={()=>{setCreating(false);setEditing(null)}} onSaved={saveComplete}/>:<>
      <Card className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {[['Total listings',products.length],['Approved',products.filter(p=>p.moderation_status==='approved').length],['Under review',products.filter(p=>p.moderation_status==='pending_review').length],['Deletion requests',deletionRequests.filter(r=>r.status==='pending').length]].map(([label,value])=><div key={String(label)} className="p-4"><p className="font-display text-xl font-semibold text-forest tabular">{loading?'—':value}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</p></div>)}
      </Card>
      <Card className="p-3"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative sm:col-span-2 xl:col-span-1"><Search size={13} className="absolute left-3 top-3 text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, SKU, slug…" className="h-9 w-full rounded-lg border border-line pl-8 pr-2 text-[10px]"/></label>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[10px]"><option value="all">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={moderation} onChange={e=>setModeration(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[10px]"><option value="all">All approval statuses</option><option value="approved">Approved</option><option value="pending_review">Under review</option><option value="rejected">Rejected</option></select>
        <select value={visibility} onChange={e=>setVisibility(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[10px]"><option value="all">All visibility</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select>
        <select value={stockFilter} onChange={e=>setStockFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-white px-2 text-[10px]"><option value="all">All stock levels</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select>
      </div></Card>
      {loading?<Card className="flex justify-center p-10 text-xs text-muted"><LoaderCircle size={15} className="mr-2 animate-spin"/>Loading live products…</Card>:filtered.length===0?<Card className="p-10 text-center"><Package size={24} className="mx-auto text-muted"/><p className="mt-2 text-xs font-semibold text-ink">{products.length?'No products match these filters':'No products found'}</p><p className="mt-1 text-[9px] text-muted">Create a listing or adjust your filters.</p></Card>:<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(product=>{
        const id=String(product.id),hidden=Boolean(product.vendor_hidden),approved=product.moderation_status==='approved',qty=stockByProduct.get(id)??0
        const request=deletionRequests.find(row=>row.product_id===id)
        return <article key={id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="relative grid h-40 place-items-center bg-cream-50">{images[id]?<img src={images[id]} alt={String(product.name)} className="h-full w-full object-cover"/>:<Package size={26} className="text-muted"/>}<div className="absolute left-2 top-2 flex gap-1"><Badge tone={approved?'forest':product.moderation_status==='rejected'?'amber':'sage'}>{String(product.moderation_status??'not submitted').replaceAll('_',' ')}</Badge>{hidden?<Badge tone="amber">Hidden</Badge>:null}</div></div><div className="p-4"><p className="text-[8px] font-semibold uppercase tracking-wider text-sage-700">{categoryNames.get(String(product.category_id??''))??'Uncategorized'}</p><h3 className="mt-1 font-display text-sm font-semibold text-ink">{String(product.name)}</h3><p className="mt-1 text-[9px] text-muted">SKU: {String(product.sku??'—')}</p><div className="mt-3 flex justify-between"><strong className="font-display text-base text-forest">{formatPKR(Number(product.vendor_base_price??product.price??0))}</strong><span className="text-right text-[10px]"><strong>{qty}</strong><span className="block text-[8px] text-muted">in stock</span></span></div>{request?<p className="mt-2 text-[9px] text-amber-700">Deletion request: {request.status}</p>:null}<div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3"><Button size="sm" variant="secondary" onClick={()=>{setEditing(product);setCreating(false)}}><Pencil size={11}/> Edit</Button><Button size="sm" variant="secondary" disabled={!approved||actionId===id} onClick={()=>void toggleVisibility(product)}>{actionId===id?<LoaderCircle size={11} className="animate-spin"/>:hidden?<Eye size={11}/>:<EyeOff size={11}/>} {hidden?'Show':'Hide'}</Button><Button size="sm" variant="ghost" color="danger" disabled={Boolean(request?.status==='pending')} onClick={()=>{setDeletionTarget(product);setDeletionReason('')}}><Trash2 size={11}/> Request removal</Button></div></div></article>
      })}</div>}
    </>}
    {deletionTarget?<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><Card className="w-full max-w-md p-5"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold text-forest">Request product deletion</h2><Button size="sm" variant="ghost" onClick={()=>setDeletionTarget(null)}><X size={14}/></Button></div><p className="mt-2 text-xs text-muted">{deletionTarget.name}</p><label className="mt-4 block text-[10px] font-semibold text-muted">Reason for deletion<textarea rows={4} minLength={3} value={deletionReason} onChange={e=>setDeletionReason(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-3 text-xs text-ink"/></label><p className="mt-2 text-[9px] text-muted">The listing is not deleted automatically. JTBazar Admin must review and approve this request.</p><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setDeletionTarget(null)}>Cancel</Button><Button variant="primary" disabled={deleting||deletionReason.trim().length<3} onClick={()=>void submitDeletion()}>{deleting?<LoaderCircle size={12} className="animate-spin"/>:'Submit request'}</Button></div></Card></div>:null}
  </div>
}
