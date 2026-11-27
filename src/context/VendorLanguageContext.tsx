import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type VendorLanguage = 'en' | 'ur' | 'roman'
const dictionaries: Record<'ur' | 'roman', Record<string, string>> = {
  ur: {
    Workspace:'ورک اسپیس',Grow:'ترقی',Operations:'آپریشنز',Account:'اکاؤنٹ',Overview:'جائزہ',Orders:'آرڈرز',Products:'پروڈکٹس',Promotions:'پروموشنز',Reviews:'ریویوز',Inventory:'انوینٹری','Vendor Guide':'وینڈر گائیڈ',Support:'مدد',Settings:'ترتیبات','Vendor Center':'وینڈر سینٹر','Store open':'دکان کھلی ہے','Store closed':'دکان بند ہے','Manual switch in Settings':'ترتیبات میں دستی کنٹرول',Search:'تلاش','Search orders, products, pages…':'آرڈرز، پروڈکٹس اور صفحات تلاش کریں…','Store live':'دکان فعال ہے',Notifications:'اطلاعات','Mark all read':'سب کو پڑھا ہوا نشان زد کریں','Try again':'دوبارہ کوشش کریں','Shop settings':'دکان کی ترتیبات','View storefront':'دکان دیکھیں','Help & support':'مدد اور سپورٹ','Sign out':'لاگ آؤٹ','Latest product listings':'تازہ پروڈکٹ لسٹنگز','Operations snapshot':'آپریشنز کا خلاصہ','View all':'سب دیکھیں','Open orders':'آرڈرز کھولیں','Orders from your customers.':'آپ کے کسٹمرز کے آرڈرز۔','Orders could not be loaded':'آرڈرز لوڈ نہیں ہو سکے','Orders in view':'دکھائے گئے آرڈرز','Waiting for dispatch':'بھیجنے کے منتظر','Ready for pickup':'پک اپ کے لیے تیار','Delivery status':'ڈیلیوری کی صورتحال','View Details':'تفصیلات دیکھیں',Previous:'پچھلا',Next:'اگلا',Close:'بند کریں',Cancel:'منسوخ کریں',Save:'محفوظ کریں',Refresh:'ریفریش','Your stock, from live records.':'آپ کا اسٹاک، تازہ ریکارڈ کے مطابق۔','Stock records':'اسٹاک ریکارڈز','Low stock':'کم اسٹاک','Out of stock':'اسٹاک ختم','In stock':'اسٹاک موجود','Add stock':'اسٹاک شامل کریں','Edit product stock':'پروڈکٹ اسٹاک تبدیل کریں','Reviews for your shop.':'آپ کی دکان کے ریویوز۔','Average rating':'اوسط ریٹنگ','Shop reviews':'دکان کے ریویوز','Product reviews':'پروڈکٹ ریویوز','Customer cases':'کسٹمر کیسز','Support tickets':'سپورٹ ٹکٹس','Open tickets':'کھلے ٹکٹس','Create support ticket':'سپورٹ ٹکٹ بنائیں','Send reply':'جواب بھیجیں','Shop name':'دکان کا نام','Business type':'کاروبار کی قسم','Owner name':'مالک کا نام','Account email':'اکاؤنٹ ای میل','Business phone':'کاروباری فون','Shop description':'دکان کی تفصیل','Complete address':'مکمل پتہ','Language':'زبان','Dashboard language':'ڈیش بورڈ کی زبان'
  },
  roman: {
    Workspace:'Kaam ka hissa',Grow:'Taraqqi',Operations:'Kaam ka nizaam',Account:'Account',Overview:'Khulasa',Orders:'Orders',Products:'Products',Promotions:'Promotions',Reviews:'Reviews',Inventory:'Stock','Vendor Guide':'Vendor Guide',Support:'Madad',Settings:'Settings','Vendor Center':'Vendor Center','Store open':'Dukaan khuli hai','Store closed':'Dukaan band hai','Manual switch in Settings':'Settings mein manual control',Search:'Talash','Search orders, products, pages…':'Orders, products aur pages talash karein…','Store live':'Dukaan active hai',Notifications:'Itlaaat','Mark all read':'Sab ko parha hua karein','Try again':'Dobara koshish karein','Shop settings':'Dukaan ki settings','View storefront':'Dukaan dekhein','Help & support':'Madad aur support','Sign out':'Logout','Latest product listings':'Nayi product listings','Operations snapshot':'Kaam ka khulasa','View all':'Sab dekhein','Open orders':'Orders kholein','Orders from your customers.':'Aap ke customers ke orders.','Orders could not be loaded':'Orders load nahi ho sakay','Orders in view':'Dikhaye gaye orders','Waiting for dispatch':'Bhejne ke muntazir','Ready for pickup':'Pickup ke liye tayyar','Delivery status':'Delivery ki surat-e-haal','View Details':'Tafseel dekhein',Previous:'Pichla',Next:'Agla',Close:'Band karein',Cancel:'Mansookh karein',Save:'Save karein',Refresh:'Refresh','Your stock, from live records.':'Aap ka stock, live record ke mutabiq.','Stock records':'Stock records','Low stock':'Kam stock','Out of stock':'Stock khatam','In stock':'Stock mojood','Add stock':'Stock shamil karein','Edit product stock':'Product stock tabdeel karein','Reviews for your shop.':'Aap ki dukaan ke reviews.','Average rating':'Ausat rating','Shop reviews':'Dukaan ke reviews','Product reviews':'Product reviews','Customer cases':'Customer cases','Support tickets':'Support tickets','Open tickets':'Khulay tickets','Create support ticket':'Support ticket banayein','Send reply':'Jawab bhejein','Shop name':'Dukaan ka naam','Business type':'Karobar ki qisam','Owner name':'Malik ka naam','Account email':'Account email','Business phone':'Karobari phone','Shop description':'Dukaan ki tafseel','Complete address':'Mukammal pata','Language':'Zaban','Dashboard language':'Dashboard ki zaban'
  }
}
const textOriginals = new WeakMap<Text, string>()
const attrOriginals = new WeakMap<Element, Map<string, string>>()
function translate(value: string, language: VendorLanguage) {
  if (language === 'en') return value
  const original = value.trim()
  const result = dictionaries[language][original]
  return result ? value.replace(original, result) : value
}
type ContextValue = { language: VendorLanguage; setLanguage: (value: VendorLanguage) => void; t: (value: string) => string }
const LanguageContext = createContext<ContextValue | null>(null)
export function VendorLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<VendorLanguage>(() => {
    try { const saved = localStorage.getItem('jtbazar-vendor-dashboard-language'); return saved === 'ur' || saved === 'roman' ? saved : 'en' } catch { return 'en' }
  })
  const setLanguage = (value: VendorLanguage) => {
    setLanguageState(value)
    try { localStorage.setItem('jtbazar-vendor-dashboard-language', value) } catch { /* optional storage */ }
  }
  useEffect(() => {
    document.documentElement.lang = language === 'ur' ? 'ur' : 'en'
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr'
    const scan = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const item = node as Text
        if (!textOriginals.has(item)) textOriginals.set(item, item.nodeValue || '')
        const parent = item.parentElement
        if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) continue
        item.nodeValue = translate(textOriginals.get(item) || '', language)
      }
      const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : []
      for (const element of elements) {
        let attrs = attrOriginals.get(element)
        if (!attrs) { attrs = new Map(); attrOriginals.set(element, attrs) }
        for (const name of ['placeholder','aria-label','title']) {
          const current = element.getAttribute(name)
          if (current && !attrs.has(name)) attrs.set(name, current)
          const original = attrs.get(name)
          if (original) element.setAttribute(name, translate(original, language))
        }
      }
    }
    scan(document.body)
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => scan(node))))
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (text: string) => translate(text, language) }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
export function useVendorLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useVendorLanguage must be used inside VendorLanguageProvider')
  return value
}
