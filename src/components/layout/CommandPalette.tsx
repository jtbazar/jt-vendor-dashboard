import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search, X, type LucideIcon } from 'lucide-react'
import { allNavItems } from '../../nav'
import { cx } from '../../utils'

interface Result {
  id: string
  label: string
  hint: string
  path: string
  icon: LucideIcon
  group: string
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase()
    return allNavItems
      .filter((item) => !needle || item.label.toLowerCase().includes(needle))
      .map((item) => ({
        id: `page-${item.to}`,
        label: item.label,
        hint: 'Go to page',
        path: item.to,
        icon: item.icon,
        group: 'Pages',
      }))
  }, [query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  if (!open) return null

  const goTo = (result: Result | undefined) => {
    if (!result) return
    navigate(result.path)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-[#121D16]/50 px-4 pt-[12vh] backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search JTBazar Vendor Center"
        className="animate-rise w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/40 bg-cream-50 shadow-lift"
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelected((current) => (results.length ? (current + 1) % results.length : 0))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelected((current) => (current - 1 + results.length) % results.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            goTo(results[selected])
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="flex-none text-[#8B9187]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages…"
            className="h-[58px] min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-[#A4A89E]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="grid h-6 w-6 flex-none place-items-center rounded-md border border-line bg-white text-[#8B9187] transition hover:text-ink"
          >
            <X size={12} />
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-display text-sm font-semibold text-forest">No matches for “{query}”</p>
              <p className="mt-1 text-[11px] text-muted">Try a page name.</p>
            </div>
          ) : (
            results.map((result, index) => {
              const Icon = result.icon
              const showGroup = index === 0 || results[index - 1].group !== result.group
              return (
                <div key={result.id}>
                  {showGroup ? (
                    <p className="px-3 pb-1 pt-2 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#9AA093]">
                      {result.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => goTo(result)}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                      selected === index ? 'bg-sage-100' : 'hover:bg-[#F0EDE4]',
                    )}
                  >
                    <span
                      className={cx(
                        'grid h-8 w-8 flex-none place-items-center rounded-lg',
                        selected === index ? 'bg-white text-forest' : 'bg-[#EFECE2] text-[#6F7C66]',
                      )}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink">{result.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted">{result.hint}</span>
                    </span>
                    {selected === index ? <CornerDownLeft size={13} className="flex-none text-sage-600" /> : null}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-white/60 px-4 py-2.5 text-[9px] text-muted">
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[8px] font-semibold">↑</kbd><kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[8px] font-semibold">↓</kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[8px] font-semibold">↵</kbd> open</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[8px] font-semibold">esc</kbd> close</span>
          <span className="ml-auto hidden sm:inline">JTBazar Vendor Center</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
