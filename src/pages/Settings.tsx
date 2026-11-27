import { useEffect, useState } from 'react'
import { Building2, LoaderCircle, MapPin, Save, ShieldCheck, Store, Upload } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  getVendorDocumentSignedUrls, updateVendorShopProfile, uploadVendorShopImage,
} from '../services/marketplaceApi'

export function SettingsPage() {
  const { user, seller, setSellerProfile } = useVendorAuth()
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
  const [shopImageFile,setShopImageFile]=useState<File|null>(null)
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
  },[seller?.id,seller?.shop_name,seller?.slug,seller?.description,seller?.phone,seller?.current_address,seller?.complete_address,seller?.shop_lat,seller?.shop_lng,seller?.shop_location_label,seller?.show_shop_on_map])

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
      setError('The saved shop location is incomplete. Use device location or contact support before saving.');return
    }
    if(showOnMap&&(!locationLabel.trim()||lat===null||lng===null)){setError('Add a public area label and set your shop location on the map before enabling public map visibility.');return}
    if(shopImageFile&&(shopImageFile.size>5*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(shopImageFile.type))){setError('Shop image must be JPG, PNG, WebP or AVIF and no larger than 5 MB.');return}
    setSaving(true);setError('');setSuccess('')
    try{
      const newImage=shopImageFile?await uploadVendorShopImage(shopImageFile):null
      const saved=await updateVendorShopProfile({
        shop_name:shopName,slug,description,phone,current_address:currentAddress,complete_address:completeAddress,
        shop_lat:lat,shop_lng:lng,shop_location_label:locationLabel,show_shop_on_map:showOnMap,
        ...(newImage?{shop_image_url:newImage.url}:{}),
      })
      setSellerProfile(saved)
      setShopImageFile(null)
      setSuccess('Shop profile and location settings saved successfully.')
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Your shop settings could not be saved.')
    }finally{setSaving(false)}
  }

  const getCurrentLocation=()=>{
    if(!navigator.geolocation){setError('This browser does not support device location.');return}
    setError('')
    navigator.geolocation.getCurrentPosition(({coords})=>{setLatitude(coords.latitude.toFixed(6));setLongitude(coords.longitude.toFixed(6))},()=>setError('Location could not be read. Allow location access and try again.'),{enableHighAccuracy:true,timeout:15000,maximumAge:60000})
  }

  return <div className="space-y-4">
    <PageHeader eyebrow={<><Store size={12}/> Shop settings</>} title="Your shop, your settings." description="Manage public shop details and map visibility. Verification documents already on file are shown as read-only links." actions={<Button variant="primary" onClick={()=>void save()} disabled={saving||!seller}>{saving?<LoaderCircle size={14} className="animate-spin"/>:<Save size={14}/>} Save all settings</Button>}/>
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
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><MapPin size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Shop location and public map</h2><p className="text-[9px] text-muted">Exact coordinates are saved to your seller profile; public map visibility is a separate choice.</p></div></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold text-muted">Public area label<input value={locationLabel} onChange={e=>setLocationLabel(e.target.value)} placeholder="e.g. Gulistan-e-Fatima, Karachi" className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink"/></label>
          <label className="flex items-start gap-2 rounded-xl border border-line bg-cream-50 p-3 text-[10px] leading-relaxed text-ink"><input type="checkbox" className="mt-0.5" checked={showOnMap} onChange={e=>setShowOnMap(e.target.checked)}/><span><strong className="block">Show approximate shop area on public map</strong><span className="mt-0.5 block text-muted">Buyers see only a general area, never your exact coordinates.</span></span></label>
          <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="secondary" onClick={getCurrentLocation}><MapPin size={12}/> Use device location</Button><span className="text-[9px] text-muted">Updates the map marker saved with your shop.</span></div>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-cream-50">
          {latitude && longitude && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) ? (
            <iframe
              title="Shop location map"
              className="h-[260px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude)-0.012}%2C${Number(latitude)-0.009}%2C${Number(longitude)+0.012}%2C${Number(latitude)+0.009}&layer=mapnik&marker=${Number(latitude)}%2C${Number(longitude)}`}
            />
          ) : (
            <div className="grid h-[260px] place-items-center p-6 text-center"><div><MapPin size={24} className="mx-auto text-muted"/><p className="mt-2 text-xs font-semibold text-ink">No shop location set yet</p><p className="mt-1 text-[9px] text-muted">Use device location to place your marker. Your address stays private until you enable public map visibility.</p></div></div>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2 text-[9px] text-muted"><span className="truncate">{locationLabel || completeAddress || 'Private shop location'}</span><Badge tone={showOnMap ? 'sage' : 'neutral'}>{showOnMap ? 'Public area visible' : 'Private only'}</Badge></div>
        </div>
      </div>
    </Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><Upload size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Public shop picture</h2><p className="text-[9px] text-muted">JPG, PNG, WebP or AVIF · maximum 5 MB</p></div></div>{seller?.shop_image_url?<img src={String(seller.shop_image_url)} alt="Current shop" className="mb-3 h-24 w-24 rounded-xl border border-line object-cover"/>:null}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setShopImageFile(e.target.files?.[0]??null)} className="block w-full text-[10px]"/>{shopImageFile?<p className="mt-1 text-[9px] text-sage-700">Selected: {shopImageFile.name}</p>:null}</Card>
    <Card className="p-4 sm:p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-sage-700"/><div><h2 className="font-display text-sm font-semibold text-forest">Verification documents</h2><p className="text-[9px] text-muted">Saved CNIC and business files remain on record. JTBazar Admin manages verification and document replacement.</p></div></div>
      {loadingDocuments?<p className="text-[10px] text-muted">Loading saved document links…</p>:<div className="flex flex-wrap gap-3 text-[10px]">{documentUrls.cnicFront?<a href={documentUrls.cnicFront} target="_blank" rel="noreferrer" className="text-sage-700 underline">Open saved CNIC front</a>:<span className="text-muted">No CNIC front saved</span>}{documentUrls.cnicBack?<a href={documentUrls.cnicBack} target="_blank" rel="noreferrer" className="text-sage-700 underline">Open saved CNIC back</a>:<span className="text-muted">No CNIC back saved</span>}{documentUrls.verification?<a href={documentUrls.verification} target="_blank" rel="noreferrer" className="text-sage-700 underline">Open saved business PDF</a>:null}</div>}
    </Card>
    <div className="flex justify-end"><Button variant="primary" onClick={()=>void save()} disabled={saving||!seller}>{saving?<LoaderCircle size={14} className="animate-spin"/>:<Save size={14}/>} Save all settings</Button></div>
  </div>
}
