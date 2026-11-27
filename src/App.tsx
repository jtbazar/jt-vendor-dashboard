import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext'
import { VendorLoginPage } from './pages/VendorLogin'
import { VendorAuthCallbackPage } from './pages/VendorAuthCallback'

function VendorAccessLayout() {
  const { user, seller, loading, configured } = useVendorAuth()
  if (!configured) return <Navigate to="/vendor-login" replace />
  if (loading) return <main className="min-h-screen grid place-items-center text-sm text-muted">Checking your JTBazar seller access…</main>
  if (!user) return <Navigate to="/vendor-login" replace />
  if (!seller || seller.status !== 'approved' || seller.vendor_locked) return <MarketplacePage />
  return <Layout />
}
import { MarketplacePage } from './pages/Marketplace'
import { Layout } from './components/Layout'
import { OrdersPage } from './pages/Orders'
import { KitchenPage } from './pages/Kitchen'
import { MenuPage } from './pages/Menu'
import { PromotionsPage } from './pages/Promotions'
import { CustomersPage } from './pages/Customers'
import { ReviewsPage } from './pages/Reviews'
import { InventoryPage } from './pages/Inventory'
import { EarningsPage } from './pages/Earnings'
import { AnalyticsPage } from './pages/Analytics'
import { SupportPage } from './pages/Support'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <VendorAuthProvider>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/vendor-login" element={<VendorLoginPage />} />
          <Route path="/auth/callback" element={<VendorAuthCallbackPage />} />
          <Route element={<VendorAccessLayout />}>
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route index element={<Navigate to="/marketplace" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="kitchen" element={<KitchenPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </VendorAuthProvider>
  )
}
