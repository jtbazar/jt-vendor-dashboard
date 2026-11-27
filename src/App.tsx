import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext'
import { VendorLoginPage } from './pages/VendorLogin'
import { VendorAuthCallbackPage } from './pages/VendorAuthCallback'
import { Layout } from './components/Layout'
import { OverviewPage } from './pages/Overview'
import { OrdersPage } from './pages/Orders'
import { MenuPage } from './pages/Menu'
import { PromotionsPage } from './pages/Promotions'
import { ReviewsPage } from './pages/Reviews'
import { InventoryPage } from './pages/Inventory'
import { GuidePage } from './pages/Guide'
import { SupportPage } from './pages/Support'
import { SettingsPage } from './pages/Settings'

function VendorAccessRoute() {
  const { user, seller, loading, configured, suspensionReason } = useVendorAuth()

  if (!configured) return <Navigate to="/vendor-login" replace />
  if (loading) return <main className="min-h-screen grid place-items-center text-sm text-muted">Checking your JTBazar seller account…</main>
  if (!user) return <Navigate to="/vendor-login" replace />
  if (suspensionReason || seller?.vendor_locked) {
    return <main className="min-h-screen grid place-items-center bg-cream-50 px-4 py-12"><section className="w-full max-w-lg rounded-2xl border border-line bg-white p-7"><h1 className="font-display text-2xl font-semibold text-forest">Vendor access suspended</h1><p className="mt-3 text-sm leading-6 text-muted">{suspensionReason || seller?.vendor_lock_reason || 'Your seller access has been suspended by JTBazar Admin.'}</p></section></main>
  }
  if (!seller || seller.status !== 'approved') {
    const status = seller?.status || 'not submitted'
    const message = status === 'pending'
      ? 'Your seller application is being reviewed by JTBazar Admin.'
      : status === 'rejected'
        ? (seller?.rejection_reason || 'Your seller application was not approved. Please contact JTBazar support.')
        : 'A JTBazar-approved seller profile is required to access Vendor Center.'
    return <main className="min-h-screen grid place-items-center bg-cream-50 px-4 py-12"><section className="w-full max-w-lg rounded-2xl border border-line bg-white p-7"><h1 className="font-display text-2xl font-semibold text-forest">Seller application {status}</h1><p className="mt-3 text-sm leading-6 text-muted">{message}</p></section></main>
  }

  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

export default function App() {
  return (
    <VendorAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/vendor-login" element={<VendorLoginPage />} />
          <Route path="/auth/callback" element={<VendorAuthCallbackPage />} />
          <Route path="/*" element={<VendorAccessRoute />} />
        </Routes>
      </BrowserRouter>
    </VendorAuthProvider>
  )
}
