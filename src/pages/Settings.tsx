import { useEffect, useState } from 'react'
import { Building2, LoaderCircle, Save, ShieldCheck, Store } from 'lucide-react'
import { Button, Card, PageHeader } from '../components/ui'
import { useVendorAuth } from '../context/VendorAuthContext'
import { updateVendorShopProfile } from '../services/marketplaceApi'

export function SettingsPage() {
  const { user, seller, refreshSeller } = useVendorAuth()
  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [completeAddress, setCompleteAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setShopName(String(seller?.shop_name ?? ''))
    setDescription(String(seller?.description ?? ''))
    setPhone(String(seller?.phone ?? ''))
    setCurrentAddress(String(seller?.current_address ?? seller?.shop_location_label ?? ''))
    setCompleteAddress(String(seller?.complete_address ?? ''))
  }, [seller?.id, seller?.shop_name, seller?.description, seller?.phone, seller?.current_address, seller?.complete_address, seller?.shop_location_label])

  const save = async () => {
    if (!user || !seller) return
    if (!shopName.trim() || !phone.trim() || !currentAddress.trim() || !completeAddress.trim()) {
      setError('Shop name, phone and both address fields are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateVendorShopProfile({
        shop_name: shopName,
        slug: String(seller.slug ?? ''),
        description,
        phone,
        current_address: currentAddress,
        complete_address: completeAddress,
        shop_lat: seller.shop_lat ?? null,
        shop_lng: seller.shop_lng ?? null,
        shop_location_label: String(seller.shop_location_label ?? currentAddress),
        show_shop_on_map: Boolean(seller.show_shop_on_map),
        shop_hours: seller.shop_hours ?? {},
        shop_is_open: Boolean(seller.shop_is_open),
        shop_image_url: seller.shop_image_url ?? null,
        document_path: seller.document_path ?? null,
        cnic_front_path: seller.cnic_front_path ?? null,
        cnic_back_path: seller.cnic_back_path ?? null,
      })
      await refreshSeller()
      setSuccess('Your seller profile has been saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your seller profile could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const businessType = String(seller?.business_type ?? 'seller').replaceAll('_', ' ')

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={<><Store size={12}/> Account settings</>} title="Your seller profile." description="Profile details below are loaded from your signed-in seller record. Saving uses the existing seller profile update API; unsupported payout, team and notification preferences are not shown as if they were saved." actions={<Button variant="primary" onClick={() => void save()} disabled={saving || !seller}>{saving?<LoaderCircle size={14} className="animate-spin"/>:<Save size={14}/>} Save changes</Button>}/>
      {error ? <Card className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</Card> : null}
      {success ? <Card className="border border-sage-200 bg-sage-50 p-3 text-xs text-sage-800">{success}</Card> : null}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cream-100 text-sage-700"><Building2 size={16}/></span><div><h2 className="font-display text-sm font-semibold text-forest">Business identity</h2><p className="mt-0.5 text-[9px] text-muted">Verified seller account details</p></div><span className="ml-auto inline-flex items-center gap-1 text-[9px] font-semibold text-sage-700"><ShieldCheck size={12}/> {String(seller?.status ?? 'loading')}</span></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-semibold text-[#62695F]">Shop name<input value={shopName} onChange={e=>setShopName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal text-ink outline-none focus:border-sage-600"/></label>
          <label className="text-[10px] font-semibold text-[#62695F]">Business type<input value={businessType} readOnly className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs font-normal capitalize text-muted"/></label>
          <label className="text-[10px] font-semibold text-[#62695F]">Owner name<input value={String(seller?.owner_full_name ?? '')} readOnly className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs font-normal text-muted"/></label>
          <label className="text-[10px] font-semibold text-[#62695F]">Account email<input value={String(user?.email ?? '')} readOnly className="mt-1 h-10 w-full rounded-lg border border-line bg-cream-50 px-3 text-xs font-normal text-muted"/></label>
          <label className="text-[10px] font-semibold text-[#62695F]">Contact phone<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal text-ink outline-none focus:border-sage-600"/></label>
          <label className="text-[10px] font-semibold text-[#62695F]">Shop location label<input value={currentAddress} onChange={e=>setCurrentAddress(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal text-ink outline-none focus:border-sage-600"/></label>
          <label className="text-[10px] font-semibold text-[#62695F] sm:col-span-2">Complete address<textarea value={completeAddress} onChange={e=>setCompleteAddress(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-line bg-white p-3 text-xs font-normal text-ink outline-none focus:border-sage-600"/></label>
          <label className="text-[10px] font-semibold text-[#62695F] sm:col-span-2">Shop description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line bg-white p-3 text-xs font-normal text-ink outline-none focus:border-sage-600"/></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><div><p className="text-[10px] font-semibold text-ink">Store availability</p><p className="mt-0.5 text-[9px] text-muted">Current value from your shop profile</p></div><Badge tone={seller?.shop_is_open ? 'forest' : 'amber'}>{seller?.shop_is_open ? 'Open' : 'Closed'}</Badge></div>
      </Card>
      <p className="text-[9px] text-muted">Payout accounts, team invitations, rider rosters and notification preferences are not editable here because verified live seller APIs for those settings are not currently exposed in this vendor app.</p>
    </div>
  )
}
