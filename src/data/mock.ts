export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type Fulfilment = 'JTBazar rider' | 'Own rider' | 'Pickup'
export interface OrderItem { name: string; qty: number; price: number }
export interface Order { id:string; customer:string; phone:string; area:string; address:string; items:OrderItem[]; status:OrderStatus; fulfilment:Fulfilment; payment:'COD'; placedMinutes:number; prepTarget:number; rider?:string; note?:string; subtotal:number; deliveryFee:number; total:number }
export interface MenuVariant { id:string; label:string; price:number }
export interface MenuAddOn { id:string; label:string; price:number }
export interface MenuItem { id:string; name:string; category:string; description:string; price:number; cost:number; stock:number; soldToday:number; rating:number; available:boolean; image:string; tags:string[]; prepTime?:number; variants?:MenuVariant[]; addOns?:MenuAddOn[]; modifiers?:string[] }
export type DealStatus = 'active' | 'scheduled' | 'draft' | 'ended'
export interface Deal { id:string; title:string; code:string; type:string; value:string; status:DealStatus; schedule:string; uses:number; limit:number; revenue:number; orders:number; description:string; image:string; appliesTo:string; eligibility?:string; flash?:boolean }
export interface Coupon { id:string; code:string; type:string; value:string; minSpend:number; uses:number; limit:number; expiry:string; active:boolean }
export interface Notification { id:string; title:string; detail:string; time:string; kind:'order'|'stock'|'review'|'money'; unread:boolean }
export interface Review { id:string; customer:string; rating:number; time:string; text:string; order:string; tags:string[]; replied:boolean; reply?:string }
export interface Ingredient { id:string; name:string; category:string; unit:string; onHand:number; par:number; daysCover:number; costPerUnit:number }
export type LedgerType = 'COD collection' | 'Commission' | 'Delivery fee' | 'Settlement' | 'Refund'
export interface LedgerEntry { id:string; date:string; reference:string; description:string; type:LedgerType; amount:number; status:'Settled'|'Pending'|'Paid' }
export interface Settlement { id:string; period:string; gross:number; commission:number; net:number; codWithVendor:number; transfer:number; status:'Paid'|'Pending'; reference:string }
export interface Customer { id:string; name:string; phone:string; area:string; orders:number; spent:number; lastOrder:string; lastOrderDate:string; fulfilment:Fulfilment; favourite:string; note?:string }
export interface SupportTicket { id:string; subject:string; preview:string; category:string; status:'Open'|'In progress'|'Resolved'; time:string; messages:Array<{from:'vendor'|'support';text:string;time:string}> }

// Legacy view models retained for type compatibility. Never seed these with demo data.
export const store = { name:'', type:'', tagline:'', owner:'', ownerRole:'', email:'', phone:'', address:'', area:'', rating:0, reviewCount:0, commissionRate:0, online:false, hours:'', minOrder:0, prepTime:0, joined:'', ordersThisMonth:0, repeatCustomers:0 }
export const weekRevenue: Array<{label:string;value:number;orders:number}> = []
export const monthRevenue: Array<{label:string;value:number;orders:number}> = []
export const peakHours: Array<{label:string;value:number}> = []
export const categoryMix: Array<{label:string;value:number;color:string}> = []
export const fulfilmentMix: Array<{label:string;value:number;color:string}> = []
export const orders: Order[] = []
export const menu: MenuItem[] = []
export const deals: Deal[] = []
export const coupons: Coupon[] = []
export const notifications: Notification[] = []
export const reviews: Review[] = []
export const ratingBreakdown: Array<{stars:number;count:number}> = []
export const customers: Customer[] = []
export const ingredients: Ingredient[] = []
export const ledger: LedgerEntry[] = []
export const settlements: Settlement[] = []
export const supportTickets: SupportTicket[] = []
export const topItems: Array<{name:string;category:string;sold:number;revenue:number;margin:number;image:string}> = []
