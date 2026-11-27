import { BookOpen, CheckCircle2, ClipboardList, Image, Package, PackageCheck, MessageCircle, ShoppingBag, Store, Truck, Wallet } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useVendorLanguage } from '../context/VendorLanguageContext'

const guideCopy = {
  en: {
    eyebrow: 'JTBazar help centre',
    title: 'Vendor Guide',
    description: 'A practical, step-by-step guide to managing your JTBazar shop. Choose your language below; the entire guide changes with it.',
    noteTitle: 'Start here',
    note: 'Your dashboard shows live information from your seller account. If a number or record is not visible, refresh the page and contact Support if it still does not appear.',
    sections: [
      { title: '1. Understand your dashboard', icon: Store, intro: 'The Overview page is your starting point. It summarises your products, live listings, recent orders and low-stock records.', steps: ['Use the product cards to open Products and review your listings.', 'Use Recent open orders or the Orders menu to handle customer purchases.', 'Use Low-stock records to identify products that may need replenishment.', 'Use Refresh data when you want to reload the latest marketplace records.'] },
      { title: '2. Add or edit a product', icon: Package, intro: 'Keep product information accurate so customers know exactly what they are ordering.', steps: ['Open Products from the left menu.', 'Choose the option to add a product, or open an existing listing to edit it.', 'Enter a clear product name and select the most relevant category.', 'Complete the description and any fields shown on the form. Do not enter guesses or misleading information.', 'Add the product price and any applicable discount. Review the displayed price/commission information before submitting.', 'Save or submit the listing. New or changed listings may need JTBazar review before they become visible to customers.'] },
      { title: '3. Product photos and variants', icon: Image, intro: 'Good photos and accurate options help customers choose the right item.', steps: ['Upload clear, genuine photos of the actual product. Use bright lighting and show the item from useful angles.', 'If the product has options such as size, colour or model, add the correct variants.', 'Check each variant’s price and stock quantity carefully.', 'Do not use a photo or variant that does not match the item you will deliver.'] },
      { title: '4. Manage regular product stock', icon: ClipboardList, intro: 'Use the normal inventory tools for non-food products and any products that use standard stock tracking.', steps: ['Open Inventory to see your stock records.', 'Use the available stock action to add stock or correct a quantity.', 'Enter the real quantity and a clear reason/note when the form asks for one.', 'Check low-stock and out-of-stock records regularly. Update stock promptly when new stock arrives.', 'Do not use food daily-availability controls for ordinary products.'] },
      { title: '5. Food products: daily availability and today’s quantity', icon: ShoppingBag, intro: 'Food-specific controls are only for eligible Restaurant and Home-Made Food vendors, and appear only when the relevant food product/category supports them.', steps: ['When adding or editing an eligible food product, complete the food selling unit and quantity fields shown on the product form.', 'For dishes whose availability changes by day, use the daily item/availability controls provided for that food product.', 'Set the correct status for today and enter today’s available quantity when the item is available.', 'Update today’s quantity when portions run out or more portions are prepared. Keep the quantity truthful so customers cannot order unavailable food.', 'These daily food controls are different from shop opening hours. They do not change the shop’s general operating status.'] },
      { title: '6. Process customer orders', icon: Truck, intro: 'Check each order carefully and keep its fulfilment status accurate.', steps: ['Open Orders and select an order to view its details.', 'Check the ordered products, quantities and selected variants before preparing anything.', 'Prepare and pack the correct items carefully.', 'When the order is genuinely prepared and ready for collection, use the Ready for Pickup action where available.', 'Use the order details and print slip when you need a preparation/collection reference.', 'Only update a status after the real-world step has happened. Never mark an order ready, collected or completed in advance.'] },
      { title: '7. Promotions and customer reviews', icon: Wallet, intro: 'Use the growth tools to support your shop and understand customer feedback.', steps: ['Open Promotions to review available promotion options and submit a promotion request when you want to participate.', 'A submitted promotion may require JTBazar review before it becomes active.', 'Open Reviews to read customer feedback about your products or shop.', 'Keep product quality, descriptions and fulfilment consistent with what customers were promised.'] },
      { title: '8. Support, account settings and safety', icon: MessageCircle, intro: 'Keep your seller details current and ask for help when something is unclear.', steps: ['Open Support to review your support conversations and reply with clear, respectful information.', 'Open Settings to review your shop profile and account details.', 'Keep your contact information and shop information accurate so JTBazar can reach you when necessary.', 'Never share your password or one-time verification codes with anyone.', 'If an order, payment, stock record or customer issue looks incorrect, contact JTBazar Support instead of creating duplicate records.'] },
    ],
    footerTitle: 'Before you finish',
    footer: 'Double-check product details, prices, photos, stock and order statuses. Accurate information protects your customers and your shop.',
    support: 'Need help? Open Support from the left menu.',
    languageLabel: 'Guide language',
    languages: { en: 'English', ur: 'اردو', roman: 'Roman Urdu' },
    tip: 'Important',
  },
  ur: {
    eyebrow: 'JTBazar رہنمائی مرکز',
    title: 'وینڈر گائیڈ',
    description: 'اپنی JTBazar دکان چلانے کے لیے یہ مرحلہ وار رہنمائی پڑھیں۔ نیچے زبان منتخب کریں؛ پوری گائیڈ اسی زبان میں تبدیل ہو جائے گی۔',
    noteTitle: 'یہاں سے شروع کریں',
    note: 'آپ کا ڈیش بورڈ آپ کے سیلر اکاؤنٹ کا تازہ ڈیٹا دکھاتا ہے۔ اگر کوئی معلومات نظر نہ آئے تو صفحہ ریفریش کریں؛ پھر بھی مسئلہ ہو تو سپورٹ سے رابطہ کریں۔',
    sections: [
      { title: '1. ڈیش بورڈ کو سمجھیں', icon: Store, intro: 'Overview آپ کے کام کی ابتدا ہے۔ یہاں پروڈکٹس، فعال لسٹنگز، حالیہ آرڈرز اور کم اسٹاک کا خلاصہ نظر آتا ہے۔', steps: ['پروڈکٹ کارڈز پر کلک کرکے Products میں اپنی لسٹنگز دیکھیں۔', 'حالیہ آرڈرز یا بائیں جانب Orders کھول کر کسٹمر کے آرڈرز سنبھالیں۔', 'Low-stock ریکارڈز دیکھیں تاکہ معلوم ہو سکے کن پروڈکٹس کا اسٹاک دوبارہ منگوانا ہے۔', 'تازہ مارکیٹ پلیس ڈیٹا حاصل کرنے کے لیے Refresh data استعمال کریں۔'] },
      { title: '2. پروڈکٹ شامل یا تبدیل کریں', icon: Package, intro: 'پروڈکٹ کی معلومات درست رکھیں تاکہ کسٹمر کو معلوم ہو کہ وہ کیا آرڈر کر رہا ہے۔', steps: ['بائیں مینو سے Products کھولیں۔', 'نئی پروڈکٹ شامل کرنے کا آپشن منتخب کریں یا موجودہ لسٹنگ کھول کر تبدیل کریں۔', 'پروڈکٹ کا واضح نام لکھیں اور درست کیٹیگری منتخب کریں۔', 'تفصیل اور فارم میں دکھائے گئے متعلقہ خانے مکمل کریں۔ غلط یا اندازے پر مبنی معلومات نہ دیں۔', 'قیمت اور اگر لاگو ہو تو ڈسکاؤنٹ درج کریں۔ جمع کرانے سے پہلے قیمت اور کمیشن کی معلومات دیکھ لیں۔', 'لسٹنگ محفوظ یا جمع کرائیں۔ نئی یا تبدیل شدہ لسٹنگ کسٹمر کو نظر آنے سے پہلے JTBazar کی جانچ سے گزر سکتی ہے۔'] },
      { title: '3. پروڈکٹ کی تصاویر اور ویریئنٹس', icon: Image, intro: 'اچھی تصاویر اور درست اختیارات کسٹمر کو صحیح چیز منتخب کرنے میں مدد دیتے ہیں۔', steps: ['اصل پروڈکٹ کی صاف اور حقیقی تصاویر اپ لوڈ کریں۔ اچھی روشنی میں مختلف مفید زاویوں سے تصویر لیں۔', 'اگر پروڈکٹ کے سائز، رنگ یا ماڈل کے اختیارات ہیں تو درست ویریئنٹس شامل کریں۔', 'ہر ویریئنٹ کی قیمت اور اسٹاک کی مقدار اچھی طرح چیک کریں۔', 'ایسی تصویر یا ویریئنٹ استعمال نہ کریں جو آپ کی ڈیلیور کی جانے والی چیز سے مختلف ہو۔'] },
      { title: '4. عام پروڈکٹس کا اسٹاک سنبھالیں', icon: ClipboardList, intro: 'عام انوینٹری سسٹم نان فوڈ پروڈکٹس اور ان اشیا کے لیے استعمال کریں جن کا اسٹاک معمول کے مطابق ٹریک ہوتا ہے۔', steps: ['اسٹاک ریکارڈز دیکھنے کے لیے Inventory کھولیں۔', 'اسٹاک شامل کرنے یا مقدار درست کرنے کے لیے دستیاب اسٹاک ایکشن استعمال کریں۔', 'درست مقدار درج کریں اور اگر فارم وجہ یا نوٹ مانگے تو واضح وجہ لکھیں۔', 'کم یا ختم ہونے والے اسٹاک کو باقاعدگی سے چیک کریں۔ نیا اسٹاک آنے پر مقدار بروقت اپ ڈیٹ کریں۔', 'عام پروڈکٹس کے لیے فوڈ کی روزانہ دستیابی والے کنٹرول استعمال نہ کریں۔'] },
      { title: '5. فوڈ پروڈکٹس: روزانہ دستیابی اور آج کا اسٹاک', icon: ShoppingBag, intro: 'فوڈ کے خصوصی کنٹرول صرف اہل Restaurant اور Home-Made Food وینڈرز کے لیے ہیں، اور متعلقہ فوڈ پروڈکٹ/کیٹیگری پر ہی دکھائی دیتے ہیں۔', steps: ['اہل فوڈ پروڈکٹ شامل یا تبدیل کرتے وقت فارم میں دکھائی دینے والی فروخت کی اکائی اور مقدار کے خانے مکمل کریں۔', 'جن کھانوں کی دستیابی روز بدلتی ہے، ان کے لیے روزانہ دستیابی کے کنٹرول استعمال کریں۔', 'آج کے لیے درست اسٹیٹس منتخب کریں اور کھانا دستیاب ہو تو آج کی دستیاب مقدار درج کریں۔', 'جب پورشن ختم ہوں یا مزید تیار ہوں تو آج کی مقدار اپ ڈیٹ کریں۔ مقدار درست رکھیں تاکہ کسٹمر غیر دستیاب کھانا آرڈر نہ کر سکے۔', 'روزانہ فوڈ دستیابی دکان کے کھلنے یا بند ہونے کے اوقات سے الگ چیز ہے۔ اس سے دکان کا عمومی اسٹیٹس تبدیل نہیں ہوتا۔'] },
      { title: '6. کسٹمر کے آرڈرز مکمل کریں', icon: Truck, intro: 'ہر آرڈر غور سے دیکھیں اور اس کی تکمیل کا اسٹیٹس درست رکھیں۔', steps: ['Orders کھولیں اور آرڈر کی تفصیلات دیکھنے کے لیے اسے منتخب کریں۔', 'تیاری سے پہلے آرڈر کی مصنوعات، مقدار اور منتخب ویریئنٹس چیک کریں۔', 'درست اشیا احتیاط سے تیار اور پیک کریں۔', 'جب آرڈر حقیقت میں تیار ہو اور کلیکشن کے لیے تیار ہو تو دستیاب Ready for Pickup ایکشن استعمال کریں۔', 'تیاری یا کلیکشن کے حوالے کے لیے آرڈر کی تفصیلات اور پرنٹ سلپ استعمال کریں۔', 'اسٹیٹس صرف حقیقی کام مکمل ہونے کے بعد تبدیل کریں۔ آرڈر کو وقت سے پہلے تیار، کلیکٹ یا مکمل ظاہر نہ کریں۔'] },
      { title: '7. پروموشنز اور کسٹمر ریویوز', icon: Wallet, intro: 'اپنی دکان کی ترقی اور کسٹمر کی رائے سمجھنے کے لیے یہ سہولیات استعمال کریں۔', steps: ['Promotions کھول کر دستیاب آپشنز دیکھیں اور حصہ لینے کے لیے درخواست جمع کرائیں۔', 'جمع کرائی گئی پروموشن فعال ہونے سے پہلے JTBazar کی منظوری کی محتاج ہو سکتی ہے۔', 'Reviews کھول کر اپنی پروڈکٹس یا دکان کے بارے میں کسٹمر کی رائے پڑھیں۔', 'پروڈکٹ کا معیار، تفصیل اور آرڈر کی تکمیل ہمیشہ کسٹمر سے کیے گئے وعدے کے مطابق رکھیں۔'] },
      { title: '8. سپورٹ، اکاؤنٹ سیٹنگز اور حفاظت', icon: MessageCircle, intro: 'اپنے سیلر کی معلومات تازہ رکھیں اور کسی بات میں الجھن ہو تو مدد طلب کریں۔', steps: ['Support کھول کر اپنی سپورٹ گفتگو دیکھیں اور واضح اور مؤدبانہ جواب دیں۔', 'Settings کھول کر دکان اور اکاؤنٹ کی معلومات چیک کریں۔', 'رابطے اور دکان کی معلومات درست رکھیں تاکہ ضرورت کے وقت JTBazar آپ سے رابطہ کر سکے۔', 'اپنا پاس ورڈ یا ایک بار استعمال ہونے والا تصدیقی کوڈ کسی کو نہ دیں۔', 'اگر آرڈر، ادائیگی، اسٹاک یا کسٹمر کا مسئلہ غلط لگے تو ڈپلیکیٹ ریکارڈ بنانے کے بجائے JTBazar سپورٹ سے رابطہ کریں۔'] },
    ],
    footerTitle: 'ختم کرنے سے پہلے',
    footer: 'پروڈکٹ کی تفصیلات، قیمت، تصاویر، اسٹاک اور آرڈر کے اسٹیٹس دوبارہ چیک کریں۔ درست معلومات آپ کے کسٹمر اور دکان دونوں کے تحفظ کے لیے ضروری ہیں۔',
    support: 'مدد چاہیے؟ بائیں مینو سے Support کھولیں۔',
    languageLabel: 'گائیڈ کی زبان',
    languages: { en: 'English', ur: 'اردو', roman: 'Roman Urdu' },
    tip: 'اہم بات',
  },
  roman: {
    eyebrow: 'JTBazar rehnumai markaz',
    title: 'Vendor Guide',
    description: 'Apni JTBazar shop chalane ke liye ye step-by-step guide parhein. Neeche zaban select karein; poori guide usi zaban mein badal jayegi.',
    noteTitle: 'Yahan se shuru karein',
    note: 'Aap ka dashboard aap ke seller account ka latest data dikhata hai. Agar koi information nazar na aaye to page refresh karein; phir bhi masla ho to Support se rabta karein.',
    sections: [
      { title: '1. Dashboard ko samjhein', icon: Store, intro: 'Overview aap ke kaam ki shuruaat hai. Yahan products, live listings, recent orders aur low-stock records ka khulasa nazar aata hai.', steps: ['Product cards par click karke Products mein apni listings dekhein.', 'Recent orders ya left menu se Orders khol kar customer orders handle karein.', 'Low-stock records dekhein taake pata chale kin products ka stock dobara mangwana hai.', 'Latest marketplace data load karne ke liye Refresh data use karein.'] },
      { title: '2. Product add ya edit karein', icon: Package, intro: 'Product ki information durust rakhein taake customer ko maloom ho ke woh kya order kar raha hai.', steps: ['Left menu se Products kholein.', 'Naya product add karne ka option select karein ya existing listing khol kar edit karein.', 'Product ka clear naam likhein aur sab se relevant category select karein.', 'Description aur form mein dikhaye gaye relevant fields complete karein. Andazay ya ghalat information na dein.', 'Price aur agar lagu ho to discount enter karein. Submit karne se pehle price aur commission details check karein.', 'Listing save ya submit karein. Nayi ya edited listing customer ko nazar aane se pehle JTBazar review se guzar sakti hai.'] },
      { title: '3. Product photos aur variants', icon: Image, intro: 'Achhi photos aur sahi options customer ko theek item choose karne mein madad dete hain.', steps: ['Asal product ki clear aur genuine photos upload karein. Achhi roshni mein mukhtalif useful angles se tasveer lein.', 'Agar product ke size, colour ya model options hain to sahi variants add karein.', 'Har variant ki price aur stock quantity achhi tarah check karein.', 'Aisi photo ya variant use na karein jo aap deliver karne wali item se different ho.'] },
      { title: '4. Normal products ka stock manage karein', icon: ClipboardList, intro: 'Normal inventory system non-food products aur un items ke liye use karein jin ka stock aam tareeqe se track hota hai.', steps: ['Stock records dekhne ke liye Inventory kholein.', 'Stock add karne ya quantity correct karne ke liye available stock action use karein.', 'Asal quantity enter karein aur agar form reason/note mange to clear wajah likhein.', 'Low-stock aur out-of-stock records regular check karein. Naya stock aaye to quantity waqt par update karein.', 'Normal products ke liye food daily availability controls use na karein.'] },
      { title: '5. Food products: daily availability aur aaj ka stock', icon: ShoppingBag, intro: 'Food ke special controls sirf eligible Restaurant aur Home-Made Food vendors ke liye hain, aur sirf relevant food product/category par nazar aate hain.', steps: ['Eligible food product add ya edit karte waqt form mein dikhaye gaye selling unit aur quantity fields complete karein.', 'Jin dishes ki availability roz badalti hai un ke liye daily availability controls use karein.', 'Aaj ke liye sahi status select karein aur item available ho to aaj ki available quantity enter karein.', 'Portions khatam hon ya mazeed tayyar hon to aaj ki quantity update karein. Quantity sach rakhein taake customer unavailable food order na kar sake.', 'Daily food availability, shop opening/closing timing se alag hai. Is se shop ka general status change nahi hota.'] },
      { title: '6. Customer orders process karein', icon: Truck, intro: 'Har order dhyan se check karein aur fulfilment status bilkul sahi rakhein.', steps: ['Orders kholein aur details dekhne ke liye order select karein.', 'Kuch prepare karne se pehle ordered products, quantities aur selected variants check karein.', 'Sahi items ehtiyat se prepare aur pack karein.', 'Jab order waqai tayyar ho aur collection ke liye ready ho tab Ready for Pickup action use karein, agar available ho.', 'Preparation ya collection reference ke liye order details aur print slip use karein.', 'Status sirf real step complete hone ke baad update karein. Order ko pehle se ready, collected ya completed mark na karein.'] },
      { title: '7. Promotions aur customer reviews', icon: Wallet, intro: 'Shop grow karne aur customer feedback samajhne ke liye ye tools use karein.', steps: ['Promotions khol kar available options dekhein aur participate karne ke liye promotion request submit karein.', 'Submitted promotion active hone se pehle JTBazar review ki zaroorat ho sakti hai.', 'Reviews khol kar apne products ya shop ke bare mein customer feedback parhein.', 'Product quality, description aur order fulfilment hamesha customer se kiye gaye waade ke mutabiq rakhein.'] },
      { title: '8. Support, account settings aur safety', icon: MessageCircle, intro: 'Seller details updated rakhein aur kisi baat mein confusion ho to help lein.', steps: ['Support khol kar support conversations dekhein aur clear, respectful reply dein.', 'Settings khol kar shop profile aur account details check karein.', 'Contact aur shop information sahi rakhein taake zaroorat par JTBazar aap se rabta kar sake.', 'Apna password ya one-time verification code kisi ke sath share na karein.', 'Agar order, payment, stock ya customer issue ghalat lage to duplicate record banane ke bajaye JTBazar Support se rabta karein.'] },
    ],
    footerTitle: 'Khatam karne se pehle',
    footer: 'Product details, price, photos, stock aur order statuses dobara check karein. Sahi information aap ke customers aur shop dono ke liye zaroori hai.',
    support: 'Madad chahiye? Left menu se Support kholein.',
    languageLabel: 'Guide ki zaban',
    languages: { en: 'English', ur: 'اردو', roman: 'Roman Urdu' },
    tip: 'Aham baat',
  },
} as const

export function GuidePage() {
  const { language, setLanguage } = useVendorLanguage()
  const copy = guideCopy[language]
  const isUrdu = language === 'ur'



  return (
    <div className="space-y-5" dir={isUrdu ? 'rtl' : 'ltr'}>
      <PageHeader
        eyebrow={<><BookOpen size={12} /> {copy.eyebrow}</>}
        title={copy.title}
        description={copy.description}
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{copy.languageLabel}</p>
            <p className="mt-1 text-xs text-muted">{isUrdu ? 'اپنی پسند کی زبان منتخب کریں' : language === 'roman' ? 'Apni pasand ki zaban select karein' : 'Select the language you are most comfortable with.'}</p>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-cream-100 p-1" role="group" aria-label={copy.languageLabel}>
            {(['en', 'ur', 'roman'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setLanguage(value)} aria-pressed={language === value}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition ${language === value ? 'bg-forest text-white shadow-sm' : 'text-muted hover:bg-white hover:text-forest'}`}>
                {copy.languages[value]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border border-sage-200 bg-sage-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white text-sage-700"><CheckCircle2 size={18}/></span>
          <div><h2 className="text-sm font-semibold text-forest">{copy.noteTitle}</h2><p className="mt-1 text-xs leading-6 text-[#596657]">{copy.note}</p></div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {copy.sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-cream-100 text-sage-700"><Icon size={18}/></span>
                <div className="min-w-0"><h2 className="font-display text-base font-semibold text-forest">{section.title}</h2><p className="mt-1 text-xs leading-6 text-muted">{section.intro}</p></div>
              </div>
              <ol className="mt-4 space-y-2.5">
                {section.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs leading-6 text-[#4F5B50]">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-cream-100 text-[9px] font-bold text-sage-700">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-cream-100 text-sage-700"><PackageCheck size={18}/></span>
          <div><h2 className="text-sm font-semibold text-forest">{copy.footerTitle}</h2><p className="mt-1 text-xs leading-6 text-muted">{copy.footer}</p><p className="mt-3 text-xs font-semibold text-sage-700">{copy.support}</p></div>
        </div>
      </Card>
    </div>
  )
}
