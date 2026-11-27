import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext'
import { VendorLoginPage } from './pages/VendorLogin'
import { VendorAuthCallbackPage } from './pages/VendorAuthCallback'
import { MarketplacePage } from './pages/Marketplace'

function VendorMarketplaceRoute() {
  const { user, loading, configured } = useVendorAuth()
  if (!configured) return <Navigate to="/vendor-login" replace />
  if (loading) return <main className="min-h-screen grid place-items-center text-sm text-muted">Checking your JTBazar seller account…</main>
  if (!user) return <Navigate to="/vendor-login" replace />
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
