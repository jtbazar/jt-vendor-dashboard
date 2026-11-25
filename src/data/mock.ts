import { imageUrl } from '../utils'

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type Fulfilment = 'JTBazar rider' | 'Own rider' | 'Pickup'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customer: string
  phone: string
  area: string
  address: string
  items: OrderItem[]
  status: OrderStatus
  fulfilment: Fulfilment
  payment: 'COD'
  placedMinutes: number
  prepTarget: number
  rider?: string
  note?: string
  subtotal: number
  deliveryFee: number
  total: number
}

export interface MenuVariant {
  id: string
  label: string
  price: number
}

export interface MenuAddOn {
  id: string
  label: string
  price: number
}

export interface MenuItem {
  id: string
  name: string
  category: string
  description: string
  price: number
  cost: number
  stock: number
  soldToday: number
  rating: number
  available: boolean
  image: string
  tags: string[]
  prepTime?: number
  variants?: MenuVariant[]
  addOns?: MenuAddOn[]
  modifiers?: string[]
}

export type DealStatus = 'active' | 'scheduled' | 'draft' | 'ended'

export interface Deal {
  id: string
  title: string
  code: string
  type: string
  value: string
  status: DealStatus
  schedule: string
  uses: number
  limit: number
  revenue: number
  orders: number
  description: string
  image: string
  appliesTo: string
  eligibility?: string
  flash?: boolean
}

export interface Coupon {
  id: string
  code: string
  type: string
  value: string
  minSpend: number
  uses: number
  limit: number
  expiry: string
  active: boolean
}

export interface Notification {
  id: string
  title: string
  detail: string
  time: string
  kind: 'order' | 'stock' | 'review' | 'money'
  unread: boolean
}

export interface Review {
  id: string
  customer: string
  rating: number
  time: string
  text: string
  order: string
  tags: string[]
  replied: boolean
  reply?: string
}

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  onHand: number
  par: number
  daysCover: number
  costPerUnit: number
}

export type LedgerType = 'COD collection' | 'Commission' | 'Delivery fee' | 'Settlement' | 'Refund'

export interface LedgerEntry {
  id: string
  date: string
  reference: string
  description: string
  type: LedgerType
  amount: number
  status: 'Settled' | 'Pending' | 'Paid'
}

export interface Settlement {
  id: string
  period: string
  gross: number
  commission: number
  net: number
  codWithVendor: number
  transfer: number
  status: 'Paid' | 'Pending'
  reference: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  area: string
  orders: number
  spent: number
  lastOrder: string
  lastOrderDate: string
  fulfilment: Fulfilment
  favourite: string
  note?: string
}

export interface SupportTicket {
  id: string
  subject: string
  preview: string
  category: string
  status: 'Open' | 'In progress' | 'Resolved'
  time: string
  messages: Array<{ from: 'vendor' | 'support'; text: string; time: string }>
}

export const store = {
  name: 'Al-Madina Grill',
  type: 'Restaurant',
  tagline: 'Flame-grilled desi & fast food',
  owner: 'Bilal Ahmed',
  ownerRole: 'Owner',
  email: 'bilal@almadinagrill.pk',
  phone: '+92 300 1234567',
  address: 'Shop 12, Bukhari Commercial, DHA Phase 6, Karachi',
  area: 'DHA Phase 6',
  rating: 4.8,
  reviewCount: 1264,
  commissionRate: 10,
  online: true,
  hours: '11:00 AM – 1:00 AM',
  minOrder: 350,
  prepTime: 22,
  joined: 'March 2024',
  ordersThisMonth: 1842,
  repeatCustomers: 62,
}

export const weekRevenue = [
  { label: 'Mon', value: 54200, orders: 41 },
  { label: 'Tue', value: 61800, orders: 46 },
  { label: 'Wed', value: 58400, orders: 44 },
  { label: 'Thu', value: 72900, orders: 52 },
  { label: 'Fri', value: 96400, orders: 67 },
  { label: 'Sat', value: 112600, orders: 78 },
  { label: 'Sun', value: 84250, orders: 68 },
]

export const monthRevenue = [
  { label: '26 Oct', value: 42600, orders: 34 },
  { label: '29 Oct', value: 51200, orders: 39 },
  { label: '1 Nov', value: 47800, orders: 37 },
  { label: '4 Nov', value: 61400, orders: 48 },
  { label: '7 Nov', value: 68900, orders: 52 },
  { label: '10 Nov', value: 64200, orders: 49 },
  { label: '13 Nov', value: 79600, orders: 58 },
  { label: '16 Nov', value: 91200, orders: 66 },
  { label: '19 Nov', value: 73400, orders: 55 },
  { label: '22 Nov', value: 84250, orders: 68 },
]

export const peakHours = [
  { label: '11a', value: 6 },
  { label: '12p', value: 12 },
  { label: '1p', value: 18 },
  { label: '2p', value: 14 },
  { label: '3p', value: 9 },
  { label: '4p', value: 7 },
  { label: '5p', value: 11 },
  { label: '6p', value: 17 },
  { label: '7p', value: 24 },
  { label: '8p', value: 28 },
  { label: '9p', value: 21 },
  { label: '10p', value: 15 },
  { label: '11p', value: 9 },
]

export const categoryMix = [
  { label: 'Signature Grills', value: 34, color: '#243B2A' },
  { label: 'Fast Food', value: 27, color: '#7D9463' },
  { label: 'Karahi & Curries', value: 19, color: '#C0714F' },
  { label: 'Rice & Biryani', value: 12, color: '#D6C7A8' },
  { label: 'Drinks & Desserts', value: 8, color: '#B9C9A6' },
]

export const fulfilmentMix = [
  { label: 'JTBazar rider', value: 54, color: '#243B2A' },
  { label: 'Own rider', value: 31, color: '#7D9463' },
  { label: 'Customer pickup', value: 15, color: '#C0714F' },
]

export const orders: Order[] = [
  {
    id: 'JT-2481',
    customer: 'Ayesha Khan',
    phone: '+92 321 4489021',
    area: 'DHA Phase 6',
    address: 'House 14, Street 5, DHA Phase 6',
    items: [
      { name: 'Chicken Malai Boti Platter', qty: 1, price: 1190 },
      { name: 'Garlic Naan', qty: 2, price: 80 },
      { name: 'Mint Mojito', qty: 1, price: 350 },
    ],
    status: 'new',
    fulfilment: 'JTBazar rider',
    payment: 'COD',
    placedMinutes: 2,
    prepTarget: 25,
    note: 'Less spice, extra raita on the side.',
    subtotal: 1700,
    deliveryFee: 150,
    total: 1850,
  },
  {
    id: 'JT-2480',
    customer: 'Hamza Siddiqui',
    phone: '+92 300 8871234',
    area: 'DHA Phase 5',
    address: 'Flat 3B, Al-Murtaza Heights, DHA Phase 5',
    items: [
      { name: 'Family Feast (4 pax)', qty: 1, price: 2640 },
      { name: 'Coca-Cola 1.5L', qty: 1, price: 250 },
    ],
    status: 'new',
    fulfilment: 'Own rider',
    payment: 'COD',
    placedMinutes: 6,
    prepTarget: 35,
    note: 'Call on arrival, gate bell is not working.',
    subtotal: 2890,
    deliveryFee: 150,
    total: 3040,
  },
  {
    id: 'JT-2479',
    customer: 'Fatima Noor',
    phone: '+92 333 1029876',
    area: 'Bukhari Commercial',
    address: 'Customer pickup — Shop 12, Bukhari Commercial',
    items: [
      { name: 'Zinger Burger', qty: 2, price: 490 },
      { name: 'Loaded Fries', qty: 1, price: 450 },
    ],
    status: 'new',
    fulfilment: 'Pickup',
    payment: 'COD',
    placedMinutes: 9,
    prepTarget: 15,
    subtotal: 1430,
    deliveryFee: 0,
    total: 1430,
  },
  {
    id: 'JT-2478',
    customer: 'Usman Ali',
    phone: '+92 345 7712093',
    area: 'DHA Phase 6',
    address: 'Bungalow 22-C, Khayaban-e-Bukhari, DHA Phase 6',
    items: [
      { name: 'Mutton Karahi (1 kg)', qty: 1, price: 2450 },
      { name: 'Garlic Naan', qty: 4, price: 80 },
    ],
    status: 'preparing',
    fulfilment: 'JTBazar rider',
    payment: 'COD',
    placedMinutes: 14,
    prepTarget: 30,
    rider: 'Imran Yousaf',
    note: 'Make it spicy — add green chillies.',
    subtotal: 2770,
    deliveryFee: 150,
    total: 2920,
  },
  {
    id: 'JT-2477',
    customer: 'Zara Ahmed',
    phone: '+92 302 5567890',
    area: 'DHA Phase 7',
    address: 'House 8, Street 12, DHA Phase 7',
    items: [
      { name: 'Fettuccine Alfredo', qty: 1, price: 1050 },
      { name: 'Mint Mojito', qty: 1, price: 350 },
    ],
    status: 'preparing',
    fulfilment: 'Own rider',
    payment: 'COD',
    placedMinutes: 19,
    prepTarget: 25,
    subtotal: 1400,
    deliveryFee: 150,
    total: 1550,
  },
  {
    id: 'JT-2476',
    customer: 'Bilal Hussain',
    phone: '+92 311 2233445',
    area: 'DHA Phase 6',
    address: 'Apartment 501, Coral Residency, DHA Phase 6',
    items: [
      { name: 'BBQ Platter', qty: 1, price: 2180 },
      { name: 'Raita', qty: 1, price: 120 },
    ],
    status: 'ready',
    fulfilment: 'JTBazar rider',
    payment: 'COD',
    placedMinutes: 27,
    prepTarget: 30,
    rider: 'Saad Khan',
    subtotal: 2300,
    deliveryFee: 150,
    total: 2450,
  },
  {
    id: 'JT-2475',
    customer: 'Sana Malik',
    phone: '+92 322 9988776',
    area: 'Bukhari Commercial',
    address: 'Customer pickup — Shop 12, Bukhari Commercial',
    items: [{ name: 'Chicken Shawarma', qty: 2, price: 380 }],
    status: 'ready',
    fulfilment: 'Pickup',
    payment: 'COD',
    placedMinutes: 33,
    prepTarget: 12,
    subtotal: 760,
    deliveryFee: 0,
    total: 760,
  },
  {
    id: 'JT-2474',
    customer: 'Ahmed Raza',
    phone: '+92 300 4567812',
    area: 'DHA Phase 5',
    address: 'House 41, Street 3, DHA Phase 5',
    items: [
      { name: 'Chicken Biryani', qty: 1, price: 650 },
      { name: 'Loaded Fries', qty: 1, price: 450 },
      { name: 'Mint Mojito', qty: 1, price: 350 },
    ],
    status: 'completed',
    fulfilment: 'JTBazar rider',
    payment: 'COD',
    placedMinutes: 45,
    prepTarget: 20,
    rider: 'Rehan Ali',
    subtotal: 1450,
    deliveryFee: 150,
    total: 1600,
  },
  {
    id: 'JT-2473',
    customer: 'Mahnoor Tariq',
    phone: '+92 336 1122334',
    area: 'DHA Phase 8',
    address: 'House 7, Street 9, DHA Phase 8',
    items: [
      { name: 'Family Feast (4 pax)', qty: 1, price: 2640 },
      { name: 'Chocolate Lava Cake', qty: 1, price: 390 },
      { name: 'Coca-Cola 1.5L', qty: 2, price: 250 },
    ],
    status: 'completed',
    fulfilment: 'Own rider',
    payment: 'COD',
    placedMinutes: 58,
    prepTarget: 35,
    subtotal: 3530,
    deliveryFee: 150,
    total: 3680,
  },
  {
    id: 'JT-2472',
    customer: 'Danish Iqbal',
    phone: '+92 303 7788990',
    area: 'Bukhari Commercial',
    address: 'Customer pickup — Shop 12, Bukhari Commercial',
    items: [
      { name: 'Zinger Burger', qty: 1, price: 490 },
      { name: 'Loaded Fries', qty: 1, price: 450 },
      { name: 'Mint Mojito', qty: 1, price: 350 },
    ],
    status: 'completed',
    fulfilment: 'Pickup',
    payment: 'COD',
    placedMinutes: 74,
    prepTarget: 15,
    subtotal: 1290,
    deliveryFee: 0,
    total: 1290,
  },
  {
    id: 'JT-2471',
    customer: 'Hira Shah',
    phone: '+92 320 6655443',
    area: 'DHA Phase 6',
    address: 'House 19, Street 2, DHA Phase 6',
    items: [
      { name: 'BBQ Platter', qty: 1, price: 2180 },
      { name: 'Garlic Naan', qty: 2, price: 80 },
    ],
    status: 'cancelled',
    fulfilment: 'JTBazar rider',
    payment: 'COD',
    placedMinutes: 86,
    prepTarget: 30,
    note: 'Customer cancelled — waiting time too long.',
    subtotal: 2340,
    deliveryFee: 150,
    total: 2490,
  },
  {
    id: 'JT-2470',
    customer: 'Fahad Qureshi',
    phone: '+92 314 2233110',
    area: 'DHA Phase 7',
    address: 'House 5, Street 18, DHA Phase 7',
    items: [
      { name: 'Mutton Karahi (1 kg)', qty: 1, price: 2450 },
      { name: 'Chicken Biryani', qty: 1, price: 650 },
      { name: 'Garlic Naan', qty: 4, price: 80 },
      { name: 'Mint Mojito', qty: 2, price: 350 },
    ],
    status: 'completed',
    fulfilment: 'Own rider',
    payment: 'COD',
    placedMinutes: 102,
    prepTarget: 35,
    subtotal: 4120,
    deliveryFee: 150,
    total: 4270,
  },
]

const menuImages: Record<string, string> = {
  boti: 'photo-1610057099443-fde8c4d50f91',
  karahi: 'photo-1596797038530-2c107229654b',
  zinger: 'photo-1594212699903-ec8a3eca50f5',
  feast: 'photo-1555939594-58d7cb561ad1',
  pasta: 'photo-1551183053-bf91a1d81141',
  bbq: 'photo-1603360946369-dc9bb6258143',
  shawarma: 'photo-1529006557810-274b9b2fc783',
  naan: 'photo-1565557623262-b51c2513a641',
  fries: 'photo-1573080496219-bb080dd4f877',
  mojito: 'photo-1513558161293-cdaf765ed2fd',
  lava: 'photo-1578985545062-69928b1d9587',
  biryani: 'photo-1633945274405-b6c8069047b0',
  pizza: 'photo-1565299624946-b28f40a0ae38',
  seekh: 'photo-1601050690117-94f5f6fa8bd7',
}

export const menu: MenuItem[] = [
  {
    id: 'm1',
    name: 'Chicken Malai Boti Platter',
    category: 'Signature Grills',
    description: 'Charcoal-grilled malai boti, mint chutney, salad and two garlic naan.',
    price: 1190,
    cost: 480,
    stock: 26,
    soldToday: 42,
    rating: 4.9,
    available: true,
    image: imageUrl(menuImages.boti),
    tags: ['Bestseller'],
    prepTime: 25,
    variants: [
      { id: 'm1-half', label: 'Half platter', price: 790 },
      { id: 'm1-full', label: 'Full platter', price: 1190 },
    ],
    addOns: [
      { id: 'm1-raita', label: 'Extra raita', price: 60 },
      { id: 'm1-naan', label: 'Extra garlic naan', price: 80 },
    ],
    modifiers: ['Spice level', 'Mint chutney on the side'],
  },
  {
    id: 'm2',
    name: 'Mutton Karahi (1 kg)',
    category: 'Karahi & Curries',
    description: 'Slow-cooked mutton in tomato, ginger and green chilli masala.',
    price: 2450,
    cost: 1320,
    stock: 12,
    soldToday: 18,
    rating: 4.8,
    available: true,
    image: imageUrl(menuImages.karahi),
    tags: ['Chef’s pick'],
    prepTime: 30,
    variants: [
      { id: 'm2-half', label: 'Half kg', price: 1390 },
      { id: 'm2-full', label: '1 kg', price: 2450 },
    ],
    addOns: [
      { id: 'm2-naan', label: 'Extra garlic naan', price: 80 },
      { id: 'm2-raita', label: 'Extra raita', price: 120 },
    ],
    modifiers: ['Spice level', 'Less oil'],
  },
  {
    id: 'm3',
    name: 'Zinger Burger',
    category: 'Fast Food',
    description: 'Crispy chicken fillet, spicy mayo, lettuce and a toasted sesame bun.',
    price: 490,
    cost: 205,
    stock: 38,
    soldToday: 56,
    rating: 4.7,
    available: true,
    image: imageUrl(menuImages.zinger),
    tags: [],
    prepTime: 12,
    variants: [
      { id: 'm3-single', label: 'Burger only', price: 490 },
      { id: 'm3-combo', label: 'Combo with fries & drink', price: 790 },
    ],
    addOns: [
      { id: 'm3-cheese', label: 'Cheese slice', price: 80 },
      { id: 'm3-patty', label: 'Extra chicken patty', price: 180 },
    ],
    modifiers: ['Spice: Regular / Spicy', 'Sauce: Mayo / Ketchup'],
  },
  {
    id: 'm4',
    name: 'Family Feast (4 pax)',
    category: 'Combos',
    description: 'Mixed grill platter, karahi, biryani, raita, salad and four naan.',
    price: 2640,
    cost: 1480,
    stock: 9,
    soldToday: 14,
    rating: 4.9,
    available: true,
    image: imageUrl(menuImages.feast),
    tags: ['Bestseller'],
    prepTime: 35,
    variants: [
      { id: 'm4-4pax', label: '4 pax', price: 2640 },
      { id: 'm4-6pax', label: '6 pax', price: 3690 },
    ],
    addOns: [
      { id: 'm4-naan', label: 'Extra naan (4 pcs)', price: 300 },
      { id: 'm4-raita', label: 'Extra raita', price: 120 },
    ],
    modifiers: ['Naan: Garlic / Plain'],
  },
  {
    id: 'm5',
    name: 'Fettuccine Alfredo',
    category: 'Fast Food',
    description: 'Creamy parmesan pasta with grilled chicken and cracked pepper.',
    price: 1050,
    cost: 420,
    stock: 15,
    soldToday: 11,
    rating: 4.5,
    available: true,
    image: imageUrl(menuImages.pasta),
    tags: [],
    prepTime: 20,
    addOns: [
      { id: 'm5-chicken', label: 'Extra grilled chicken', price: 250 },
      { id: 'm5-cheese', label: 'Extra parmesan', price: 100 },
    ],
    modifiers: ['Sauce: Alfredo / Arrabbiata'],
  },
  {
    id: 'm6',
    name: 'BBQ Platter',
    category: 'Signature Grills',
    description: 'Seekh kebab, malai boti, chicken tikka, naan and house sauces.',
    price: 2180,
    cost: 1100,
    stock: 7,
    soldToday: 21,
    rating: 4.8,
    available: true,
    image: imageUrl(menuImages.bbq),
    tags: ['Low stock'],
    prepTime: 30,
    variants: [
      { id: 'm6-half', label: 'Half platter', price: 1290 },
      { id: 'm6-full', label: 'Full platter', price: 2180 },
    ],
    addOns: [
      { id: 'm6-naan', label: 'Extra garlic naan', price: 80 },
      { id: 'm6-raita', label: 'Extra raita', price: 120 },
    ],
    modifiers: ['Spice level', 'Sauce: Mint / Imli'],
  },
  {
    id: 'm7',
    name: 'Chicken Shawarma',
    category: 'Fast Food',
    description: 'Garlic sauce, pickles and fresh chicken in a warm pita wrap.',
    price: 380,
    cost: 150,
    stock: 44,
    soldToday: 64,
    rating: 4.6,
    available: true,
    image: imageUrl(menuImages.shawarma),
    tags: [],
    prepTime: 10,
    variants: [
      { id: 'm7-regular', label: 'Regular', price: 380 },
      { id: 'm7-large', label: 'Large', price: 520 },
    ],
    addOns: [
      { id: 'm7-cheese', label: 'Cheese slice', price: 80 },
      { id: 'm7-chicken', label: 'Extra chicken', price: 150 },
    ],
    modifiers: ['Spice: Regular / Spicy', 'Sauce: Garlic / Chilli'],
  },
  {
    id: 'm8',
    name: 'Garlic Naan',
    category: 'Sides',
    description: 'Tandoor-baked naan brushed with garlic butter and coriander.',
    price: 80,
    cost: 24,
    stock: 90,
    soldToday: 128,
    rating: 4.7,
    available: true,
    image: imageUrl(menuImages.naan),
    tags: [],
    prepTime: 8,
    variants: [
      { id: 'm8-plain', label: 'Plain', price: 60 },
      { id: 'm8-garlic', label: 'Garlic', price: 80 },
      { id: 'm8-butter', label: 'Butter', price: 70 },
    ],
    modifiers: ['Butter: Normal / Extra'],
  },
  {
    id: 'm9',
    name: 'Loaded Fries',
    category: 'Sides',
    description: 'Crispy fries, melted cheese, jalapeños and chipotle drizzle.',
    price: 450,
    cost: 165,
    stock: 30,
    soldToday: 37,
    rating: 4.6,
    available: true,
    image: imageUrl(menuImages.fries),
    tags: [],
    prepTime: 12,
    variants: [
      { id: 'm9-regular', label: 'Regular', price: 450 },
      { id: 'm9-large', label: 'Large', price: 650 },
    ],
    addOns: [
      { id: 'm9-cheese', label: 'Extra cheese', price: 80 },
      { id: 'm9-jalapeno', label: 'Extra jalapeños', price: 40 },
    ],
    modifiers: ['Spice: Mild / Hot'],
  },
  {
    id: 'm10',
    name: 'Mint Mojito',
    category: 'Drinks',
    description: 'Fresh mint, lime, soda and crushed ice. Zero alcohol.',
    price: 350,
    cost: 85,
    stock: 52,
    soldToday: 29,
    rating: 4.7,
    available: true,
    image: imageUrl(menuImages.mojito),
    tags: [],
    prepTime: 5,
    variants: [
      { id: 'm10-regular', label: 'Regular', price: 350 },
      { id: 'm10-large', label: 'Large', price: 480 },
    ],
    addOns: [{ id: 'm10-mint', label: 'Extra fresh mint', price: 30 }],
    modifiers: ['Ice: Normal / Less'],
  },
  {
    id: 'm11',
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    description: 'Warm chocolate cake with a molten centre and vanilla cream.',
    price: 390,
    cost: 135,
    stock: 22,
    soldToday: 19,
    rating: 4.9,
    available: true,
    image: imageUrl(menuImages.lava),
    tags: [],
    prepTime: 8,
    addOns: [{ id: 'm11-cream', label: 'Extra vanilla cream', price: 60 }],
    modifiers: ['Serve: Warm / Chilled'],
  },
  {
    id: 'm12',
    name: 'Chicken Biryani',
    category: 'Rice & Biryani',
    description: 'Fragrant basmati rice layered with spiced chicken and raita.',
    price: 650,
    cost: 260,
    stock: 35,
    soldToday: 48,
    rating: 4.8,
    available: true,
    image: imageUrl(menuImages.biryani),
    tags: ['Bestseller'],
    prepTime: 18,
    variants: [
      { id: 'm12-single', label: 'Single plate', price: 650 },
      { id: 'm12-family', label: 'Family plate', price: 1290 },
    ],
    addOns: [
      { id: 'm12-raita', label: 'Extra raita', price: 60 },
      { id: 'm12-salad', label: 'Extra salad', price: 80 },
    ],
    modifiers: ['Spice level'],
  },
  {
    id: 'm13',
    name: 'Chicken Tikka Pizza',
    category: 'Fast Food',
    description: 'Tandoori chicken, onion, mozzarella and mint mayo drizzle.',
    price: 1450,
    cost: 620,
    stock: 10,
    soldToday: 16,
    rating: 4.6,
    available: false,
    image: imageUrl(menuImages.pizza),
    tags: ['Hidden'],
    prepTime: 22,
    variants: [
      { id: 'm13-small', label: 'Small 7"', price: 950 },
      { id: 'm13-medium', label: 'Medium 10"', price: 1450 },
      { id: 'm13-large', label: 'Large 13"', price: 1950 },
    ],
    addOns: [{ id: 'm13-cheese', label: 'Extra mozzarella', price: 150 }],
    modifiers: ['Crust: Thin / Regular'],
  },
  {
    id: 'm14',
    name: 'Mutton Seekh Kebab',
    category: 'Signature Grills',
    description: 'Four hand-rolled seekh kebabs served with mint chutney.',
    price: 990,
    cost: 470,
    stock: 18,
    soldToday: 25,
    rating: 4.8,
    available: true,
    image: imageUrl(menuImages.seekh),
    tags: [],
    prepTime: 20,
    variants: [
      { id: 'm14-4pcs', label: '4 pcs', price: 990 },
      { id: 'm14-8pcs', label: '8 pcs', price: 1890 },
    ],
    addOns: [{ id: 'm14-chutney', label: 'Extra mint chutney', price: 40 }],
    modifiers: ['Spice level'],
  },
]

export const deals: Deal[] = [
  {
    id: 'd1',
    title: 'Weekend Family Feast',
    code: 'FAMILY20',
    type: 'Percentage discount',
    value: '20% off',
    status: 'active',
    schedule: 'Ends today, 11:59 PM',
    uses: 46,
    limit: 100,
    revenue: 118400,
    orders: 46,
    description: '20% off on Family Feast and BBQ Platter. Friday to Sunday only.',
    image: imageUrl('photo-1555939594-58d7cb561ad1'),
    appliesTo: 'Selected items · Family Feast, BBQ Platter',
    eligibility: 'Repeat customers',
  },
  {
    id: 'd6',
    title: 'Flash Sale · Seekh Kebab',
    code: 'SEEKH30',
    type: 'Flash sale',
    value: '30% off',
    status: 'active',
    schedule: 'Today, 6:00 PM – 11:00 PM',
    uses: 38,
    limit: 80,
    revenue: 26334,
    orders: 38,
    description: 'Three-hour flash sale on Mutton Seekh Kebab. Starts and ends automatically.',
    image: imageUrl(menuImages.seekh),
    appliesTo: 'Mutton Seekh Kebab',
    eligibility: 'All customers',
    flash: true,
  },
  {
    id: 'd2',
    title: 'Lunch Rush',
    code: 'LUNCH15',
    type: 'Percentage discount',
    value: '15% off',
    status: 'active',
    schedule: 'Daily, 12:00 PM – 3:00 PM',
    uses: 128,
    limit: 300,
    revenue: 86400,
    orders: 128,
    description: 'Flat 15% off on all grills and rice items during lunch hours.',
    image: imageUrl('photo-1565557623262-b51c2513a641'),
    appliesTo: 'Categories · Signature Grills, Rice & Biryani',
    eligibility: 'All customers',
  },
  {
    id: 'd3',
    title: 'Buy 1 Get 1 Zinger',
    code: 'ZINGERBOGO',
    type: 'Buy one get one',
    value: 'BOGO',
    status: 'scheduled',
    schedule: 'Starts Mon, 24 Nov',
    uses: 0,
    limit: 150,
    revenue: 0,
    orders: 0,
    description: 'Buy one Zinger Burger and get a second one free. Dine-in and delivery.',
    image: imageUrl('photo-1594212699903-ec8a3eca50f5'),
    appliesTo: 'Zinger Burger',
    eligibility: 'All customers',
  },
  {
    id: 'd4',
    title: 'Eid Special Platter',
    code: 'EID25',
    type: 'Percentage discount',
    value: '25% off',
    status: 'draft',
    schedule: 'Not scheduled yet',
    uses: 0,
    limit: 200,
    revenue: 0,
    orders: 0,
    description: 'Eid campaign for family platters. Awaiting JTBazar promotion approval.',
    image: imageUrl('photo-1603360946369-dc9bb6258143'),
    appliesTo: 'Selected items · Family Feast, BBQ Platter',
    eligibility: 'All customers',
  },
  {
    id: 'd5',
    title: 'Midnight Cravings',
    code: 'NIGHT10',
    type: 'Percentage discount',
    value: '10% off',
    status: 'ended',
    schedule: 'Ended 15 Nov',
    uses: 212,
    limit: 250,
    revenue: 74500,
    orders: 212,
    description: '10% off on all orders placed between 11:00 PM and 1:00 AM.',
    image: imageUrl('photo-1568901346375-23c9450c58cd'),
    appliesTo: 'All menu items',
    eligibility: 'All customers',
  },
]

export const coupons: Coupon[] = [
  { id: 'c1', code: 'WELCOME100', type: 'Flat amount', value: 'Rs 100 off', minSpend: 800, uses: 64, limit: 200, expiry: '30 Nov 2026', active: true },
  { id: 'c2', code: 'FAMILY20', type: 'Percentage', value: '20% off', minSpend: 2500, uses: 46, limit: 100, expiry: '24 Nov 2026', active: true },
  { id: 'c3', code: 'LUNCH15', type: 'Percentage', value: '15% off', minSpend: 1000, uses: 128, limit: 300, expiry: '31 Dec 2026', active: true },
  { id: 'c4', code: 'FREEDEL', type: 'Free delivery', value: 'Delivery free', minSpend: 1500, uses: 89, limit: 150, expiry: '15 Dec 2026', active: true },
  { id: 'c5', code: 'EID25', type: 'Percentage', value: '25% off', minSpend: 3000, uses: 0, limit: 200, expiry: '20 Dec 2026', active: false },
]

export const notifications: Notification[] = [
  { id: 'n1', title: 'New order #JT-2481', detail: '2 items · PKR 1,850 · COD · JTBazar rider', time: '2 min ago', kind: 'order', unread: true },
  { id: 'n2', title: 'Low stock alert', detail: 'Mozzarella, burger buns and cooking oil are below par level.', time: '10 min ago', kind: 'stock', unread: true },
  { id: 'n3', title: 'New 5-star review', detail: 'Ayesha K. loved the Chicken Malai Boti Platter.', time: '1 hour ago', kind: 'review', unread: true },
  { id: 'n4', title: 'Weekly statement ready', detail: 'Settlement for 10–16 Nov is ready for review.', time: '3 hours ago', kind: 'money', unread: false },
]

export const reviews: Review[] = [
  {
    id: 'r1',
    customer: 'Ayesha Khan',
    rating: 5,
    time: '2 hours ago',
    text: 'The malai boti was perfectly smoky and juicy, and the mint chutney was fresh. Packaging kept everything warm. This is my third order this month!',
    order: 'JT-2481',
    tags: ['Food quality', 'Packaging'],
    replied: false,
  },
  {
    id: 'r2',
    customer: 'Hamza Siddiqui',
    rating: 5,
    time: 'Yesterday',
    text: 'Family Feast easily fed five people. Great value and the naan arrived soft. Rider was polite and on time.',
    order: 'JT-2440',
    tags: ['Value', 'Delivery'],
    replied: true,
    reply: 'Thank you Hamza! Glad the family enjoyed it. See you next weekend.',
  },
  {
    id: 'r3',
    customer: 'Usman Ali',
    rating: 4,
    time: 'Yesterday',
    text: 'Karahi was excellent and properly spicy as requested. One naan was slightly cold, otherwise a solid order.',
    order: 'JT-2478',
    tags: ['Taste'],
    replied: false,
  },
  {
    id: 'r4',
    customer: 'Fatima Noor',
    rating: 5,
    time: '2 days ago',
    text: 'Zinger burger was still crispy when it reached us. Loaded fries are dangerously good.',
    order: 'JT-2431',
    tags: ['Food quality'],
    replied: true,
    reply: 'Thank you Fatima! The loaded fries are a team favourite too.',
  },
  {
    id: 'r5',
    customer: 'Sana Malik',
    rating: 3,
    time: '3 days ago',
    text: 'Food was good but delivery took about 20 minutes longer than the estimate. Would appreciate a heads-up next time.',
    order: 'JT-2398',
    tags: ['Delivery'],
    replied: false,
  },
  {
    id: 'r6',
    customer: 'Danish Iqbal',
    rating: 4,
    time: '4 days ago',
    text: 'Good portions and polite rider. Pickup was ready right when I arrived.',
    order: 'JT-2360',
    tags: ['Pickup'],
    replied: false,
  },
]

export const ratingBreakdown = [
  { stars: 5, count: 892 },
  { stars: 4, count: 246 },
  { stars: 3, count: 78 },
  { stars: 2, count: 30 },
  { stars: 1, count: 18 },
]

export const customers: Customer[] = [
  { id: 'c1', name: 'Ayesha Khan', phone: '+92 321 4489021', area: 'DHA Phase 6', orders: 14, spent: 18420, lastOrder: 'JT-2481', lastOrderDate: 'Today, 1:42 PM', fulfilment: 'JTBazar rider', favourite: 'Chicken Malai Boti Platter', note: 'Prefers less spice and extra raita.' },
  { id: 'c2', name: 'Hamza Siddiqui', phone: '+92 300 8871234', area: 'DHA Phase 5', orders: 9, spent: 22780, lastOrder: 'JT-2480', lastOrderDate: 'Today, 1:38 PM', fulfilment: 'Own rider', favourite: 'Family Feast (4 pax)', note: 'Regular weekend family order.' },
  { id: 'c3', name: 'Fatima Noor', phone: '+92 333 1029876', area: 'Bukhari Commercial', orders: 22, spent: 19640, lastOrder: 'JT-2479', lastOrderDate: 'Today, 1:35 PM', fulfilment: 'Pickup', favourite: 'Zinger Burger' },
  { id: 'c4', name: 'Usman Ali', phone: '+92 345 7712093', area: 'DHA Phase 6', orders: 6, spent: 16280, lastOrder: 'JT-2478', lastOrderDate: 'Today, 1:30 PM', fulfilment: 'JTBazar rider', favourite: 'Mutton Karahi (1 kg)', note: 'Always asks for extra green chillies.' },
  { id: 'c5', name: 'Zara Ahmed', phone: '+92 302 5567890', area: 'DHA Phase 7', orders: 11, spent: 14260, lastOrder: 'JT-2477', lastOrderDate: 'Today, 1:25 PM', fulfilment: 'Own rider', favourite: 'Fettuccine Alfredo' },
  { id: 'c6', name: 'Bilal Hussain', phone: '+92 311 2233445', area: 'DHA Phase 6', orders: 4, spent: 9850, lastOrder: 'JT-2476', lastOrderDate: 'Today, 1:17 PM', fulfilment: 'JTBazar rider', favourite: 'BBQ Platter' },
  { id: 'c7', name: 'Sana Malik', phone: '+92 322 9988776', area: 'Bukhari Commercial', orders: 17, spent: 11480, lastOrder: 'JT-2475', lastOrderDate: 'Today, 1:11 PM', fulfilment: 'Pickup', favourite: 'Chicken Shawarma' },
  { id: 'c8', name: 'Ahmed Raza', phone: '+92 300 4567812', area: 'DHA Phase 5', orders: 8, spent: 12640, lastOrder: 'JT-2474', lastOrderDate: 'Today, 12:59 PM', fulfilment: 'JTBazar rider', favourite: 'Chicken Biryani' },
]

export const ingredients: Ingredient[] = [
  { id: 'i1', name: 'Chicken breast', category: 'Meat', unit: 'kg', onHand: 8, par: 20, daysCover: 0.5, costPerUnit: 720 },
  { id: 'i2', name: 'Mutton', category: 'Meat', unit: 'kg', onHand: 14, par: 12, daysCover: 2.5, costPerUnit: 1850 },
  { id: 'i3', name: 'Burger buns', category: 'Bakery', unit: 'pcs', onHand: 42, par: 80, daysCover: 0.8, costPerUnit: 35 },
  { id: 'i4', name: 'Mozzarella', category: 'Dairy', unit: 'kg', onHand: 3.2, par: 8, daysCover: 1, costPerUnit: 1450 },
  { id: 'i5', name: 'Basmati rice', category: 'Dry goods', unit: 'kg', onHand: 28, par: 20, daysCover: 4, costPerUnit: 320 },
  { id: 'i6', name: 'Cooking oil', category: 'Dry goods', unit: 'L', onHand: 9, par: 15, daysCover: 1.2, costPerUnit: 580 },
  { id: 'i7', name: 'Garlic', category: 'Produce', unit: 'kg', onHand: 4, par: 3, daysCover: 3, costPerUnit: 420 },
  { id: 'i8', name: 'Tomatoes', category: 'Produce', unit: 'kg', onHand: 11, par: 8, daysCover: 2, costPerUnit: 180 },
  { id: 'i9', name: 'Coca-Cola 1.5L', category: 'Beverages', unit: 'bottles', onHand: 24, par: 30, daysCover: 1.5, costPerUnit: 190 },
  { id: 'i10', name: 'Chicken mince', category: 'Meat', unit: 'kg', onHand: 0, par: 10, daysCover: 0, costPerUnit: 690 },
  { id: 'i11', name: 'Flour', category: 'Dry goods', unit: 'kg', onHand: 35, par: 25, daysCover: 5, costPerUnit: 140 },
  { id: 'i12', name: 'Fresh mint', category: 'Produce', unit: 'kg', onHand: 1.2, par: 1, daysCover: 1.5, costPerUnit: 260 },
  { id: 'i13', name: 'Yogurt', category: 'Dairy', unit: 'kg', onHand: 7, par: 5, daysCover: 2, costPerUnit: 380 },
  { id: 'i14', name: 'Cheese slices', category: 'Dairy', unit: 'pcs', onHand: 60, par: 100, daysCover: 1.8, costPerUnit: 65 },
  { id: 'i15', name: 'Lettuce', category: 'Produce', unit: 'kg', onHand: 5, par: 4, daysCover: 2.2, costPerUnit: 240 },
  { id: 'i16', name: 'Ice', category: 'Beverages', unit: 'kg', onHand: 18, par: 10, daysCover: 1, costPerUnit: 40 },
]

export const ledger: LedgerEntry[] = [
  { id: 'l1', date: '22 Nov', reference: '#JT-2481', description: 'COD collected by JTBazar rider', type: 'COD collection', amount: 1850, status: 'Pending' },
  { id: 'l2', date: '22 Nov', reference: '#JT-2481', description: 'JTBazar commission · 10% of food subtotal', type: 'Commission', amount: -170, status: 'Pending' },
  { id: 'l3', date: '22 Nov', reference: '#JT-2481', description: 'Delivery fee retained by JTBazar', type: 'Delivery fee', amount: -150, status: 'Pending' },
  { id: 'l4', date: '22 Nov', reference: '#JT-2479', description: 'COD collected by restaurant · pickup', type: 'COD collection', amount: 1430, status: 'Pending' },
  { id: 'l5', date: '22 Nov', reference: '#JT-2479', description: 'JTBazar commission · 10% of food subtotal', type: 'Commission', amount: -143, status: 'Pending' },
  { id: 'l6', date: '22 Nov', reference: '#JT-2473', description: 'COD collected by restaurant · own rider', type: 'COD collection', amount: 3680, status: 'Settled' },
  { id: 'l7', date: '22 Nov', reference: '#JT-2473', description: 'JTBazar commission · 10% of food subtotal', type: 'Commission', amount: -353, status: 'Settled' },
  { id: 'l8', date: '22 Nov', reference: '#JT-2473', description: 'Delivery fee passed to restaurant driver', type: 'Delivery fee', amount: -150, status: 'Settled' },
  { id: 'l9', date: '21 Nov', reference: 'SETTLE-1042', description: 'Weekly settlement · JTBazar paid vendor', type: 'Settlement', amount: 251740, status: 'Paid' },
  { id: 'l10', date: '19 Nov', reference: '#JT-2412', description: 'Refund · missing item', type: 'Refund', amount: -650, status: 'Settled' },
]

export const settlements: Settlement[] = [
  { id: 's1', period: '17 – 23 Nov 2026', gross: 540550, commission: 54055, net: 486495, codWithVendor: 214300, transfer: 272195, status: 'Pending', reference: 'Due Mon, 24 Nov' },
  { id: 's2', period: '10 – 16 Nov 2026', gross: 498200, commission: 49820, net: 448380, codWithVendor: 196640, transfer: 251740, status: 'Paid', reference: 'Bank transfer · 18 Nov' },
  { id: 's3', period: '3 – 9 Nov 2026', gross: 462900, commission: 46290, net: 416610, codWithVendor: 215230, transfer: 201380, status: 'Paid', reference: 'Easypaisa · 11 Nov' },
  { id: 's4', period: '27 Oct – 2 Nov 2026', gross: 389400, commission: 38940, net: 350460, codWithVendor: 369060, transfer: -18600, status: 'Paid', reference: 'Vendor paid · JazzCash · 4 Nov' },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 't1',
    subject: 'Payout not received for last week',
    preview: 'The statement says paid but I cannot see the amount in my bank account.',
    category: 'Finance',
    status: 'Open',
    time: '2 hours ago',
    messages: [
      { from: 'vendor', text: 'Assalam-o-Alaikum. The 10–16 Nov settlement shows paid on 18 Nov but the amount is not in my bank account yet. Can you please check the reference?', time: '2 hours ago' },
    ],
  },
  {
    id: 't2',
    subject: 'Customer complaint about missing raita',
    preview: 'Order #JT-2418 — customer says raita was missing from the bag.',
    category: 'Order issue',
    status: 'In progress',
    time: 'Yesterday',
    messages: [
      { from: 'vendor', text: 'Customer reported missing raita on order #JT-2418. We have the packing photo, please advise.', time: 'Yesterday' },
      { from: 'support', text: 'Thanks for the photo. We are reviewing the case with the rider and will update you within 24 hours.', time: 'Yesterday' },
    ],
  },
  {
    id: 't3',
    subject: 'Change shop timings for winter',
    preview: 'Request to update closing time from 1:00 AM to 12:00 AM.',
    category: 'Shop settings',
    status: 'Resolved',
    time: '3 days ago',
    messages: [
      { from: 'vendor', text: 'Please update our closing time to 12:00 AM from next week.', time: '3 days ago' },
      { from: 'support', text: 'Done. Your shop hours are updated on the storefront and app.', time: '3 days ago' },
    ],
  },
]

export const topItems = [
  { name: 'Chicken Shawarma', sold: 64, revenue: 24320, image: imageUrl(menuImages.shawarma), margin: 61 },
  { name: 'Zinger Burger', sold: 56, revenue: 27440, image: imageUrl(menuImages.zinger), margin: 58 },
  { name: 'Chicken Biryani', sold: 48, revenue: 31200, image: imageUrl(menuImages.biryani), margin: 60 },
  { name: 'Chicken Malai Boti Platter', sold: 42, revenue: 49980, image: imageUrl(menuImages.boti), margin: 60 },
]
