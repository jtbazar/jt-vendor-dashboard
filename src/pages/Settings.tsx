import { useEffect, useState } from 'react'
import { Building2, Clock3, FileText, LoaderCircle, MapPin, Save, ShieldCheck, Store, Upload } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  getVendorDocumentSignedUrls, removeVendorDocument, removeVendorShopImage,
  updateVendorShopProfile, uploadVendorCnicImage, uploadVendorDocument, uploadVendorShopImage,
} from '../services/marketplaceApi'

type ShopHours = { _public_visible?: boolean; [key: string]: any }
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
const DEFAULT_HOURS: ShopHours = {
  monday:{open:true,start:'09:00',end:'22:00'},tuesday:{open:true,start:'09:00',end:'22:00'},
  wednesday:{open:true,start:'09:00',end:'22:00'},thursday:{open:true,start:'09:00',end:'22:00'},
  friday:{open:true,start:'09:00',end:'22:00'},saturday:{open:true,start:'10:00',end:'23:00'},
  sunday:{open:false,start:'09:00',end:'22:00'},_public_visible:true,
}

function shopImagePath(url: string | null | undefined) {
  if (!url) return null
  const marker='/shop-images/'
  const index=url.indexOf(marker)
  return index>=0?decodeURIComponent(url.slice(index+marker.length).split('?')[0]):null
}

export function SettingsPage() {
  const { user, seller, refreshSeller } = useVendorAuth()
  const [shopName,setShopName]=useState('')
  const [slug,setSlug]=useState('')
  const [description,setDescription]=useState('')
  const [phone,setPhone]=useState('')
  const [currentAddress,setCurrentAddress]=useState('')
  const [completeAddress,setCompleteAddress]=useState('')
  const [latitude,setLatitude]=useState('')
  const [longitude,setLongitude]=useState('')
  const [locationLabel,setLocationLabel]=useState('')
  const [showOnMap,setShowOnMap]=useState(false)
  const [shopIsOpen,setShopIsOpen]=useState(true)
  const [hours,setHours]=useState<ShopHours>(DEFAULT_HOURS)
  const [shopImageFile,setShopImageFile]=useState<File|null>(null)
  const [businessPdf,setBusinessPdf]=useState<File|null>(null)
  const [cnicFront,setCnicFront]=useState<File|null>(null)
  const [cnicBack,setCnicBack]=useState<File|null>(null)
  const [documentUrls,setDocumentUrls]=useState<{cnicFront:string|null;cnicBack:string|null;verification:string|null}>({cnicFront:null,cnicBack:null,verification:null})
  const [saving,setSaving]=useState(false)
  const [loadingDocuments,setLoadingDocuments]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')

  useEffect(()=>{
    setShopName(String(seller?.shop_name??''));setSlug(String(seller?.slug??''))
    setDescription(String(seller?.description??''));setPhone(String(seller?.phone??''))
    setCurrentAddress(String(seller?.current_address??seller?.shop_location_label??''))
    setCompleteAddress(String(seller?.complete_address??''))
    setLatitude(seller?.shop_lat==null?'':String(seller.shop_lat));setLongitude(seller?.shop_lng==null?'':String(seller.shop_lng))
    setLocationLabel(String(seller?.shop_location_label??''));setShowOnMap(Boolean(seller?.show_shop_on_map))
    setShopIsOpen(seller?.shop_is_open!==false)
    setHours({...DEFAULT_HOURS,...(seller?.shop_hours??{}),_public_visible:seller?.shop_hours?._public_visible!==false})
  },[seller?.id,seller?.shop_name,seller?.slug,seller?.description,seller?.phone,seller?.current_address,seller?.complete_address,seller?.shop_lat,seller?.shop_lng,seller?.shop_location_label,seller?.show_shop_on_map,seller?.shop_is_open,seller?.shop_hours])

  useEffect(()=>{
    let active=true
    if(!seller){setDocumentUrls({cnicFront:null,cnicBack:null,verification:null});return}
    setLoadingDocuments(true)
    getVendorDocumentSignedUrls(seller).then(urls=>{if(active)setDocumentUrls(urls)})
      .catch(()=>{if(active)setDocumentUrls({cnicFront:null,cnicBack:null,verification:null})})
      .finally(()=>{if(active)setLoadingDocuments(false)})
    return()=>{active=false}
  },[seller?.id,seller?.cnic_front_path,seller?.cnic_back_path,seller?.document_path])

  const save=async()=>{
    if(!user||!seller)return
    if(shopName.trim().length<2||!slug.trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||description.trim().length<10||!phone.trim()||currentAddress.trim().length<3||completeAddress.trim().length<10){
      setError('Please complete shop name, valid URL slug, description, phone and both address fields.');return
    }
    const lat=latitude.trim()?Number(latitude):null, lng=longitude.trim()?Number(longitude):null
    if((lat===null)!==(lng===null)|| (lat!==null&&(!Number.isFinite(lat)||lat < -90||lat>90||lng===null||lng < -180||lng>180))){
      setError('Enter valid latitude and longitude together, or leave both empty.');return
    }
    if(showOnMap&&(!locationLabel.trim()||lat===null||lng===null)){setError('Add a public area label and valid map coordinates before enabling public map visibility.');return}
    if(shopImageFile&&(shopImageFile.size>5*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(shopImageFile.type))){setError('Shop image must be JPG, PNG, WebP or AVIF and no larger than 5 MB.');return}
    if(businessPdf&&(businessPdf.size>10*1024*1024||(businessPdf.type!=='application/pdf'&&!businessPdf.name.toLowerCase().endsWith('.pdf')))){setError('Business information must be a PDF up to 10 MB.');return}
    if([cnicFront,cnicBack].some(file=>file&&(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)))){setError('CNIC images must be JPG, PNG or WebP and no larger than 10 MB.');return}
    setSaving(true);setError('');setSuccess('')
    let newImage:{path:string;url:string}|null=null
    let newPdf:string|null=null,newFront:string|null=null,newBack:string|null=null
    try{
      if(shopImageFile)newImage=await uploadVendorShopImage(shopImageFile)
      if(businessPdf)newPdf=await uploadVendorDocument(businessPdf)
      if(cnicFront)newFront=await uploadVendorCnicImage(cnicFront,'cnic-front')
      if(cnicBack)newBack=await uploadVendorCnicImage(cnicBack,'cnic-back')
      const saved=await updateVendorShopProfile({
        shop_name:shopName,slug,description,phone,current_address:currentAddress,complete_address:completeAddress,
        shop_lat:lat,shop_lng:lng,shop_location_label:locationLabel,show_shop_on_map:showOnMap,
        shop_hours:{...hours,_public_visible:hours._public_visible!==false},shop_is_open:shopIsOpen,
        ...(newImage?{shop_image_url:newImage.url}:{}),
        ...(newPdf?{document_path:newPdf}:{}),
        ...(newFront?{cnic_front_path:newFront}:{}),
        ...(newBack?{cnic_back_path:newBack}:{}),
      })
      if(newImage){const oldPath=shopImagePath(String(seller.shop_image_url??''));if(oldPath)await removeVendorShopImage(oldPath).catch(()=>undefined)}
      if(newPdf&&seller.document_path)await removeVendorDocument(String(seller.document_path)).catch(()=>undefined)
      if(newFront&&seller.cnic_front_path)await removeVendorDocument(String(seller.cnic_front_path)).catch(()=>undefined)
      if(newBack&&seller.cnic_back_path)await removeVendorDocument(String(seller.cnic_back_path)).catch(()=>undefined)
      await refreshSeller()
      setShopImageFile(null);setBusinessPdf(null);setCnicFront(null);setCnicBack(null)
      const urls=await getVendorDocumentSignedUrls(saved)
      setDocumentUrls(urls)
      setSuccess('Shop profile, operating hours and verification details saved successfully.')
    }catch(cause){
      if(newImage)await removeVendorShopImage(newImage.path).catch(()=>undefined)
      if(newPdf)await removeVendorDocument(newPdf).catch(()=>undefined)
      if(newFront)await removeVendorDocument(newFront).catch(()=>undefined)
      if(newBack)await removeVendorDocument(newBack).catch(()=>undefined)
      setError(cause instanceof Error?cause.message:'Your shop settings could not be saved.')
    }finally{setSaving(false)}
  }

  const getCurrentLocation=()=>{
    if(!navigator.geolocation){setError('This browser does not support device location.');return}
    setError('')
    navigator.geolocation.getCurrentPosition(({coords})=>{setLatitude(coords.latitude.toFixed(6));setLongitude(coords.longitude.toFixed(6))},()=>setError('Location could not be read. Allow location access and try again.'),{enableHighAccuracy:true,timeout:15000,maximumAge:60000})
  }

  return <div className="space-y-4">
    <PageHeader eyebrow={<><Store size={12}/> Shop settings</>} title="Your shop, your settings." description="Manage public shop details, opening hours, emergency availability, map visibility and private seller verification documents." actions={<Button variant="primary" onClick={()=>void save()} disabled={saving||!seller}>{saving?<LoaderCircle size={14} className="animate-spin"/>:<Save size={14}/>} Save all settings</Button>}/>
    {error?<Card className="border border-red-200 bg-red-50 p-3 text-[10px] text-red-800">{error}</Card>:null}
    {success?<Card className="border border-sage-200 bg-sage-50 p-3 text-[10px] text-sage-800">{success}</Card>:null}
    <Card className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cream-100 text-sage-700"><Building2 size={16}/></span><div><h2 className="font-display text-sm font-semibold text-forest">Shop identity and contact</h2><p className="mt-0.5 text-[9px] text-muted">Seller profile and public shop information</p></div><span className="ml-auto"><Badge tone={seller?.status==='approved'?'forest':'amber'}>{String(seller?.status??'loading')}</Badge></span></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold text-muted">Shop name<input value={shopName} onChange={e=>setShopName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Shop URL slug<input value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Business type<input readOnly value={String(seller?.business_type??'').replaceAll('_',' ')} className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs capitalize text-muted"/></label>
        <label className="text-[10px] font-semibold text-muted">Owner name<input readOnly value={String(seller?.owner_full_name??'')} className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs text-muted"/></label>
        <label className="text-[10px] font-semibold text-muted">Account email<input readOnly value={String(user?.email??'')} className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs text-muted"/></label>
        <label className="text-[10px] font-semibold text-muted">Business phone<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted sm:col-span-2">Shop description<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white p-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted">Current address / area<input value={currentAddress} onChange={e=>setCurrentAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"/></label>
        <label className="text-[10px] font-semibold text-muted sm:col-span-2">Complete address<textarea rows={2} value={completeAddress} onChange={e=>setCompleteAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white p-3 text-xs text-ink"/></label>
      </div>
    </Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><Clock3 size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Weekly opening hours</h2><p className="text-[9px] text-muted">Set your weekly schedule; public display is optional.</p></div></div>
      <label className="mb-3 flex items-center gap-2 text-[10px] font-semibold text-ink"><input type="checkbox" checked={hours._public_visible!==false} onChange={e=>setHours(current=>({...current,_public_visible:e.target.checked}))}/> Show opening hours on public shop</label>
      <div className="space-y-2">{DAYS.map(day=>{const slot=hours[day]??{open:false,start:'09:00',end:'22:00'};return <div key={day} className="grid grid-cols-2 items-center gap-2 rounded-lg border border-line p-3 sm:grid-cols-4"><strong className="text-[10px] capitalize text-ink">{day}</strong><label className="flex items-center gap-2 text-[10px]"><input type="checkbox" checked={slot.open} onChange={e=>setHours(current=>({...current,[day]:{...slot,open:e.target.checked}}))}/> Open</label><label className="text-[9px] text-muted">From<input type="time" value={slot.start} disabled={!slot.open} onChange={e=>setHours(current=>({...current,[day]:{...slot,start:e.target.value}}))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink disabled:bg-cream-50"/></label><label className="text-[9px] text-muted">To<input type="time" value={slot.end} disabled={!slot.open} onChange={e=>setHours(current=>({...current,[day]:{...slot,end:e.target.value}}))} className="mt-1 h-9 w-full rounded border border-line px-2 text-xs text-ink disabled:bg-cream-50"/></label></div>})}</div>
    </Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><MapPin size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Shop location and public map</h2><p className="text-[9px] text-muted">Exact coordinates are saved to your seller profile; public map visibility is a separate choice.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-muted">Latitude<input type="number" step="any" value={latitude} onChange={e=>setLatitude(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label><label className="text-[10px] font-semibold text-muted">Longitude<input type="number" step="any" value={longitude} onChange={e=>setLongitude(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label><label className="text-[10px] font-semibold text-muted sm:col-span-2">Public area label<input value={locationLabel} onChange={e=>setLocationLabel(e.target.value)} placeholder="e.g. Gulshan, Karachi" className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-xs text-ink"/></label></div>
      <div className="mt-3 flex flex-wrap items-center gap-3"><Button size="sm" variant="secondary" onClick={getCurrentLocation}><MapPin size={12}/> Use device location</Button><label className="flex items-center gap-2 text-[10px] font-semibold text-ink"><input type="checkbox" checked={showOnMap} onChange={e=>setShowOnMap(e.target.checked)}/> Show approximate shop area on public map</label></div>
    </Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><Store size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Emergency shop pause</h2><p className="text-[9px] text-muted">Turn off shop availability when you cannot accept new orders.</p></div></div><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"><div><p className="text-xs font-semibold text-ink">{shopIsOpen?'Shop enabled':'Shop paused'}</p><p className="mt-1 text-[9px] text-muted">This updates the existing shop_is_open seller setting.</p></div><Button color={shopIsOpen?'danger':'success'} variant="secondary" onClick={()=>setShopIsOpen(value=>!value)}>{shopIsOpen?'Pause shop':'Enable shop'}</Button></div></Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><Upload size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Public shop picture</h2><p className="text-[9px] text-muted">JPG, PNG, WebP or AVIF · maximum 5 MB</p></div></div>{seller?.shop_image_url?<img src={String(seller.shop_image_url)} alt="Current shop" className="mb-3 h-24 w-24 rounded-xl border border-line object-cover"/>:null}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setShopImageFile(e.target.files?.[0]??null)} className="block w-full text-[10px]"/>{shopImageFile?<p className="mt-1 text-[9px] text-sage-700">Selected: {shopImageFile.name}</p>:null}</Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Private identity verification</h2><p className="text-[9px] text-muted">CNIC files are stored in private vendor-documents storage and accessed with expiring signed links.</p></div></div>
      {loadingDocuments?<p className="text-[10px] text-muted">Loading saved document links…</p>:<div className="mb-3 flex flex-wrap gap-3 text-[10px]">{documentUrls.cnicFront?<a href={documentUrls.cnicFront} target="_blank" rel="noreferrer" className="text-sage-700 underline">Open saved CNIC front</a>:<span className="text-muted">No CNIC front saved</span>}{documentUrls.cnicBack?<a href={documentUrls.cnicBack} target="_blank" rel="noreferrer" className="text-sage-700 underline">Open saved CNIC back</a>:<span className="text-muted">No CNIC back saved</span>}</div>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-muted">Replace CNIC front (max 10 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCnicFront(e.target.files?.[0]??null)} className="mt-1 block w-full text-[9px]"/></label><label className="text-[10px] font-semibold text-muted">Replace CNIC back (max 10 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCnicBack(e.target.files?.[0]??null)} className="mt-1 block w-full text-[9px]"/></label></div>
    </Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><FileText size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Business information document</h2><p className="text-[9px] text-muted">Optional PDF for marketplace admin review; a business registration certificate is not compulsory.</p></div></div>{documentUrls.verification?<a href={documentUrls.verification} target="_blank" rel="noreferrer" className="mb-3 inline-block text-[10px] text-sage-700 underline">Open saved business PDF</a>:<p className="mb-2 text-[9px] text-muted">No business information PDF saved.</p>}<label className="text-[10px] font-semibold text-muted">Upload / replace PDF (maximum 10 MB)<input type="file" accept="application/pdf,.pdf" onChange={e=>setBusinessPdf(e.target.files?.[0]??null)} className="mt-1 block w-full text-[9px]"/></label>{businessPdf?<p className="mt-1 text-[9px] text-sage-700">Selected: {businessPdf.name}</p>:null}</Card>
    <div className="flex justify-end"><Button variant="primary" onClick={()=>void save()} disabled={saving||!seller}>{saving?<LoaderCircle size={14} className="animate-spin"/>:<Save size={14}/>} Save all settings</Button></div>
  </div>
}
