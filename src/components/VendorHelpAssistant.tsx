import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ChevronRight, CircleHelp, X } from 'lucide-react'

const topics = [
  { id: 'orders', title: 'New orders aur delivery', answer: 'Orders page kholein, order details aur items check karein. Status sirf tab update karein jab woh kaam waqai complete ho. Ready for pickup tab use karein jab parcel tayyar ho.', path: '/orders', action: 'Orders kholein' },
  { id: 'stock', title: 'Product stock update', answer: 'Inventory page mein product search karein. Edit stock se exact quantity set karein ya Add stock se units barhayein. Har update ke liye chhoti si reason bhi likhein.', path: '/inventory', action: 'Inventory kholein' },
  { id: 'products', title: 'Product add ya edit', answer: 'Products page se apni listing kholein. Naam, photos, price, variants aur stock ko customer ko dikhane se pehle dobara check karein.', path: '/products', action: 'Products kholein' },
  { id: 'promotion', title: 'Promotion submit karna', answer: 'Promotions page se offer submit karein. JTBazar Admin review karega. Approval ke baad vendor promotion sirf aapki apni shop page par show hogi, main homepage par nahi.', path: '/promotions', action: 'Promotions kholein' },
  { id: 'support', title: 'Masla ya complaint', answer: 'Agar order, customer, stock ya account ka masla ho to Support page par ticket banayein. Password aur OTP kisi ke sath share na karein.', path: '/support', action: 'Support kholein' },
]

export function VendorHelpAssistant() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<(typeof topics)[number] | null>(null)
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open ? (
        <section className="mb-3 w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift" aria-label="Vendor Help Assistant">
          <header className="flex items-center justify-between bg-forest px-4 py-3 text-white">
            <div className="flex items-center gap-2"><Bot size={18} /><div><p className="text-xs font-semibold">Vendor Help Assistant</p><p className="text-[9px] text-white/70">Simple step-by-step help</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close help assistant" className="rounded-lg p-1 hover:bg-white/10"><X size={16} /></button>
          </header>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
            {selected ? (
              <div className="rounded-xl bg-cream-50 p-3">
                <p className="text-xs font-semibold text-forest">{selected.title}</p>
                <p className="mt-2 text-[11px] leading-6 text-muted">{selected.answer}</p>
                <button type="button" onClick={() => { navigate(selected.path); setOpen(false); setSelected(null) }} className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700">{selected.action}<ChevronRight size={12} /></button>
                <button type="button" onClick={() => setSelected(null)} className="mt-3 block text-[10px] text-muted underline">Doosra sawal</button>
              </div>
            ) : (
              <>
                <p className="text-[11px] leading-5 text-muted">Assalam-o-alaikum! Kis kaam mein madad chahiye? Neeche topic select karein.</p>
                <div className="grid gap-2">
                  {topics.map(topic => <button key={topic.id} type="button" onClick={() => setSelected(topic)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-line px-3 py-3 text-left text-[11px] font-medium text-ink transition hover:border-sage-500 hover:bg-cream-50">{topic.title}<ChevronRight size={14} className="flex-none text-muted" /></button>)}
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen(value => !value)} className="ml-auto flex h-12 items-center gap-2 rounded-full bg-forest px-4 text-white shadow-lift transition hover:bg-forest-700" aria-expanded={open} aria-label="Open Vendor Help Assistant">
        {open ? <X size={17} /> : <CircleHelp size={18} />}
        <span className="text-[11px] font-semibold">Help</span>
      </button>
    </div>
  )
}
