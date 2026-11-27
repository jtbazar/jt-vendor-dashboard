import {
  BadgePercent,
  BookOpen,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  ReceiptText,
  Settings,
  Star,
  Package,
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
      { label: 'Products', to: '/products', icon: Package },
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
      { label: 'Vendor Guide', to: '/guide', icon: BookOpen },
      { label: 'Support', to: '/support', icon: LifeBuoy },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export const allNavItems = navSections.flatMap((section) => section.items)

export const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/orders': 'Orders',
  '/products': 'Products',
  '/promotions': 'Promotions',
  '/reviews': 'Reviews',
  '/inventory': 'Inventory',
  '/guide': 'Vendor Guide',
  '/support': 'Support',
  '/settings': 'Settings',
}
