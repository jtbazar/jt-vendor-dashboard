import { Link, NavLink } from 'react-router-dom'
import { ChevronsUpDown, Store } from 'lucide-react'
import { navSections } from '../../nav'
import { useVendorAuth } from '../../context/VendorAuthContext'
import { cx } from '../../utils'
import { useVendorLanguage } from '../../context/VendorLanguageContext'

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-xl bg-white p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src="/jtbazar-logo.png" alt="" className="h-full w-full object-contain" />
    </span>
  )
}

function ShopAvatar({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="h-full w-full rounded-lg object-cover" />
  }
  return (
    <span className="grid h-full w-full place-items-center rounded-lg bg-sage-400/20 text-sage-200">
      <Store size={16} />
    </span>
  )
}

function businessTypeLabel(value?: string | null) {
  return (value || 'Individual seller').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { seller } = useVendorAuth()
  const { t } = useVendorLanguage()
  const shopName = seller?.shop_name || 'Your store'
  const businessType = businessTypeLabel(seller?.business_type)
  const isOpen = seller?.shop_is_open !== false

  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col overflow-y-auto border-r border-white/[0.06] bg-forest-800 px-3.5 pb-4 pt-5 text-cream-50 transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      aria-label="Vendor navigation"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top_left,rgba(125,148,99,0.22),transparent_68%)]" />

      <div className="relative flex items-center gap-2.5 px-2.5">
        <BrandMark />
        <div className="min-w-0">
          <p className="font-display text-[16px] font-semibold leading-none tracking-[-0.05em] text-cream-50">
            JTBazar<span className="text-sage-400">.</span>
          </p>
          <p className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.19em] text-[#8FA088]">
            {t('Vendor Center')}
          </p>
        </div>
      </div>

      <Link
        to="/settings"
        onClick={onClose}
        className="relative mt-5 flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.055] p-2.5 transition hover:bg-white/[0.09]"
      >
        <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-lg bg-white/95">
          <ShopAvatar imageUrl={seller?.shop_image_url} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold text-cream-50">{shopName}</span>
            <span className={cx('h-1.5 w-1.5 flex-none rounded-full', isOpen ? 'bg-[#9CC47D]' : 'bg-clay')} />
          </span>
          <span className="mt-0.5 block truncate text-[9.5px] text-[#93A18D]">{businessType}</span>
        </span>
        <ChevronsUpDown size={13} className="flex-none text-[#7F8D79]" />
      </Link>

      <nav className="relative mt-6 flex-1">
        {navSections.map((section) => (
          <div key={t(section.label)} className="mb-5">
            <p className="mb-1.5 px-3 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#74836E]">
              {t(section.label)}
            </p>
            <div className="grid gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cx(
                        'group relative flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[12px] font-medium transition-colors',
                        isActive ? 'bg-white/[0.085] text-white' : 'text-[#B3BFAE] hover:bg-white/[0.045] hover:text-cream-50',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cx('absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-r-full bg-clay transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                        <Icon size={16} strokeWidth={1.8} className={cx('flex-none transition-colors', isActive ? 'text-sage-300' : 'text-[#8B9A85] group-hover:text-sage-300')} />
                        <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative mt-2 grid gap-2.5">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-cream-50">
              <span className={cx('h-1.5 w-1.5 rounded-full', isOpen ? 'bg-[#9CC47D]' : 'bg-clay')} />
              {isOpen ? t('Store open') : t('Store closed')}
            </p>
            <p className="mt-0.5 text-[9px] text-[#8A9884]">{t('Manual switch in Settings')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
