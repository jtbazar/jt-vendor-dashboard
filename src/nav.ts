import {
  BarChart3,
  Store,
  BadgePercent,
  Boxes,
  ChefHat,
  LayoutDashboard,
  LifeBuoy,
  ReceiptText,
  Settings,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badgeKey?: 'newOrders' | 'preparing'
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Marketplace',
    items: [
      { label: 'Marketplace dashboard', to: '/marketplace', icon: Store },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', to: '/', icon: LayoutDashboard },
      { label: 'Orders', to: '/orders', icon: ReceiptText, badgeKey: 'newOrders' },
      { label: 'Kitchen board', to: '/kitchen', icon: ChefHat, badgeKey: 'preparing' },
      { label: 'Menu', to: '/menu', icon: UtensilsCrossed },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Promotions', to: '/promotions', icon: BadgePercent },
      { label: 'Customers', to: '/customers', icon: Users },
      { label: 'Reviews', to: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory', to: '/inventory', icon: Boxes },
      { label: 'Earnings', to: '/earnings', icon: Wallet },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Support', to: '/support', icon: LifeBuoy },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export const allNavItems = navSections.flatMap((section) => section.items)

export const pageTitles: Record<string, string> = {
  '/marketplace': 'Marketplace dashboard',
  '/': 'Overview',
  '/orders': 'Orders',
  '/kitchen': 'Kitchen board',
  '/menu': 'Menu',
  '/promotions': 'Promotions',
  '/customers': 'Customers',
  '/reviews': 'Reviews',
  '/inventory': 'Inventory',
  '/earnings': 'Earnings',
  '/analytics': 'Analytics',
  '/support': 'Support',
  '/settings': 'Settings',
}
