import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { Topbar } from './layout/Topbar'
import { CommandPalette } from './layout/CommandPalette'
import { Toasts } from './layout/Toasts'
import { pageTitles } from '../nav'

export function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pageTitle = pageTitles[location.pathname] ?? 'Vendor Center'

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = `${pageTitle} · JTBazar Vendor Center`
  }, [pageTitle])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-cream-100 text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_88%_-4%,rgba(125,148,99,0.10),transparent_36%),radial-gradient(ellipse_at_12%_108%,rgba(192,113,79,0.055),transparent_30%)]" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <div
          className="animate-fade fixed inset-0 z-40 bg-[#121D16]/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      ) : null}

      <div className="relative z-10 lg:pl-[268px]">
        <Topbar
          pageTitle={pageTitle}
          onMenu={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1500px] px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <div className="animate-rise">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toasts />
    </div>
  )
}
