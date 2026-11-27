import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext'
import { VendorLoginPage } from './pages/VendorLogin'
import { VendorAuthCallbackPage } from './pages/VendorAuthCallback'
import { MarketplacePage } from './pages/Marketplace'

function VendorMarketplaceRoute() {
  const { user, loading, configured, suspensionReason } = useVendorAuth()
  if (!configured) return <Navigate to="/vendor-login" replace />
  if (loading) return <main className="min-h-screen grid place-items-center text-sm text-muted">Checking your JTBazar seller account…</main>
  if (!user) return <Navigate to="/vendor-login" replace />
  if (suspensionReason) return <main className="min-h-screen grid place-items-center bg-cream-50 px-4 py-12"><section className="w-full max-w-lg rounded-2xl border border-line bg-white p-7"><h1 className="font-display text-2xl font-semibold text-forest">JTBazar account suspended</h1><p className="mt-3 text-sm leading-6 text-muted">{suspensionReason}</p><p className="mt-3 text-sm text-muted">Vendor Center access is disabled while your customer account is suspended. Please contact JTBazar support if you believe this is a mistake.</p><button onClick={()=>void useVendorAuth} className="sr-only" aria-hidden="true" tabIndex={-1}> </button><a href="https://www.jt-bazar.com/" className="mt-5 inline-flex rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">Back to JTBazar</a></section></main>
  return <MarketplacePage />
}

export default function App() {
  return (
    <VendorAuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/vendor-login" element={<VendorLoginPage />} />
            <Route path="/auth/callback" element={<VendorAuthCallbackPage />} />
            <Route path="/marketplace" element={<VendorMarketplaceRoute />} />
            <Route path="/" element={<Navigate to="/marketplace" replace />} />
            <Route path="*" element={<Navigate to="/marketplace" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </VendorAuthProvider>
  )
}
