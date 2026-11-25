import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store'
import { Layout } from './components/Layout'
import { OverviewPage } from './pages/Overview'
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
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
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
  )
}
