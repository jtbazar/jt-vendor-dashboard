import {
  BadgePercent,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  ReceiptText,
  Settings,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', to: '/', icon: LayoutDashboard },
      { label: 'Orders', to: '/orders', icon: ReceiptText },
      { label: 'Products', to: '/menu', icon: UtensilsCrossed },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Promotions', to: '/promotions', icon: BadgePercent },
      { label: 'Reviews', to: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory', to: '/inventory', icon: Boxes },
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
  '/': 'Overview',
  '/orders': 'Orders',
  '/menu': 'Products',
  '/promotions': 'Promotions',
  '/reviews': 'Reviews',
  '/inventory': 'Inventory',
  '/support': 'Support',
  '/settings': 'Settings',
}
