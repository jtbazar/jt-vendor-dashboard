import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, Star, TriangleAlert, UtensilsCrossed, X } from 'lucide-react'
import { cx, initials } from '../utils'
import type { OrderStatus } from '../data/mock'

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-cream-50 shadow-[0_6px_18px_rgba(36,59,42,0.18)] hover:bg-forest-600 active:bg-forest-700',
  secondary:
    'bg-white text-ink border border-line hover:bg-cream-50 hover:border-[#D9D3C4] shadow-[0_1px_2px_rgba(31,42,34,0.04)]',
  outline:
    'bg-transparent text-forest border border-[#CFD6C8] hover:bg-sage-100/70',
  ghost: 'bg-transparent text-muted hover:bg-[#EFECE3] hover:text-ink',
  danger: 'bg-danger text-white hover:bg-[#9E4434] shadow-[0_6px_18px_rgba(180,81,62,0.18)]',
  soft: 'bg-sage-100 text-forest hover:bg-sage-200',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[11px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-xs gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[13px] gap-2.5 rounded-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 disabled:pointer-events-none disabled:opacity-45',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-[#EDE9DE] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'neutral' | 'sage' | 'clay' | 'amber' | 'danger' | 'forest' | 'outline'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-[#F0EEE7] text-[#62685F] border-[#E5E1D6]',
  sage: 'bg-[#EAF1E3] text-[#4C683B] border-[#DCE8D1]',
  clay: 'bg-clay-100 text-clay-700 border-[#F0D6C9]',
  amber: 'bg-[#FBF3E1] text-[#8E6218] border-[#F2E4C4]',
  danger: 'bg-[#F9EAE6] text-[#A14B38] border-[#F0D4CC]',
  forest: 'bg-forest text-cream-50 border-forest',
  outline: 'bg-transparent text-muted border-line',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const orderStatusMeta: Record<
  OrderStatus,
  { label: string; tone: BadgeTone; dot: string }
> = {
  new: { label: 'New', tone: 'clay', dot: 'bg-clay' },
  accepted: { label: 'Accepted', tone: 'forest', dot: 'bg-forest' },
  preparing: { label: 'Preparing', tone: 'amber', dot: 'bg-[#C08A2A]' },
  ready: { label: 'Ready', tone: 'sage', dot: 'bg-sage-600' },
  completed: { label: 'Completed', tone: 'neutral', dot: 'bg-[#98A091]' },
  cancelled: { label: 'Cancelled', tone: 'danger', dot: 'bg-danger' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status]
  return (
    <Badge tone={meta.tone}>
      <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  )
}

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <Badge tone="sage">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-600 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage-600" />
      </span>
      {label}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/* Stars                                                               */
/* ------------------------------------------------------------------ */

export function Stars({
  rating,
  size = 13,
  className,
}: {
  rating: number
  size?: number
  className?: string
}) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.6}
          className={star <= Math.round(rating) ? 'fill-[#C58B3C] text-[#C58B3C]' : 'fill-transparent text-[#D8D1C0]'}
        />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  size = 'md',
  tone = 'sage',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  size?: 'sm' | 'md'
  tone?: 'sage' | 'cream'
}) {
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const knob = size === 'sm' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex flex-none items-center rounded-full border border-transparent p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2',
        track,
        checked ? (tone === 'cream' ? 'bg-sage-400' : 'bg-forest') : 'bg-[#D8D4C8]',
      )}
    >
      <span
        className={cx(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          knob,
          checked ? shift : 'translate-x-0',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

const avatarTones = [
  'bg-[#E7EEDD] text-[#4A653A]',
  'bg-[#F6E7DE] text-[#9A5337]',
  'bg-[#E8E9E3] text-[#5B6557]',
  'bg-[#EFE9D8] text-[#7A642E]',
]

export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const tone = avatarTones[name.charCodeAt(0) % avatarTones.length]
  return (
    <span
      className={cx(
        'inline-grid flex-none place-items-center rounded-full font-semibold tracking-wide',
        tone,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-[#ECE8DD]', className)}>
      <div
        className={cx('h-full rounded-full bg-sage-600 transition-all duration-500', barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-600">{eyebrow}</div> : null}
        <h1 className="font-display text-[clamp(1.7rem,2.6vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-forest">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cx('rounded-2xl border border-line bg-white shadow-card', className)}>
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-none items-center gap-2">{action}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl'

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#121D16]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={cx(
          'animate-rise max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-white/40 bg-cream-50 shadow-lift sm:rounded-2xl',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-forest">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p> : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose} className="-mr-1 -mt-1">
            <X size={17} />
          </IconButton>
        </div>
        <div className="max-h-[calc(92vh-9.5rem)] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white/60 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end bg-[#121D16]/45 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Details'}
        className="animate-slideIn flex h-full w-full max-w-[480px] flex-col border-l border-white/30 bg-cream-50 shadow-drawer"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-forest">{title}</h2>
            {subtitle ? <div className="mt-1 text-xs text-muted">{subtitle}</div> : null}
          </div>
          <IconButton label="Close panel" onClick={onClose} className="-mr-1 -mt-1">
            <X size={17} />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="border-t border-line bg-white/70 px-5 py-3.5">{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */

export const inputClass =
  'w-full rounded-xl border border-[#DDD8CB] bg-white px-3.5 py-2.5 text-[13px] text-ink placeholder:text-[#A4A89E] transition focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-200'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('grid gap-1.5', className)}>
      <span className="text-[11px] font-semibold text-[#5D655B]">{label}</span>
      {children}
      {hint ? <span className="text-[10px] leading-relaxed text-muted">{hint}</span> : null}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Food image with graceful fallback                                   */
/* ------------------------------------------------------------------ */

export function FoodImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  return (
    <div className={cx('relative overflow-hidden bg-[#EDE9DD]', className)}>
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[radial-gradient(circle_at_30%_20%,#E9EEDF,#DDE5D2)] text-sage-600">
          <UtensilsCrossed size={20} strokeWidth={1.5} />
          <span className="px-2 text-center text-[9px] font-medium">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cx('h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 grid h-12 w-12 place-items-center rounded-full bg-[#EFECE2] text-[#8A9184]">
        {icon ?? <Info size={20} />}
      </span>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="max-w-sm text-[11px] leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toast icon helper                                                   */
/* ------------------------------------------------------------------ */

export function ToastIcon({ tone }: { tone: 'success' | 'info' | 'warning' | 'error' }) {
  if (tone === 'success') return <CheckCircle2 size={18} className="text-sage-600" />
  if (tone === 'warning') return <TriangleAlert size={18} className="text-[#B07B20]" />
  if (tone === 'error') return <TriangleAlert size={18} className="text-danger" />
  return <Info size={18} className="text-[#6E7C66]" />
}
