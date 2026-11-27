import { createEphemeralSupabase, getSupabase } from '../lib/supabase'

export type SellerProfile = Record<string, any>
export type VendorProduct = Record<string, any>
export type VendorInventory = Record<string, any>
export type VendorOrderItem = Record<string, any>
export type VendorCase = Record<string, any>

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function verifyVendorPassword(email: string, password: string) {
  const client = createEphemeralSupabase()
  let error: { message: string; code?: string } | null = null
  try {
    const response = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    error = response.error
  } finally {
    await client.auth.signOut({ scope: 'local' })
  }
  return { error }
}

export function sendVendorLoginOtp(email: string) {
  return getSupabase().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  })
}

export function verifyVendorLoginOtp(email: string, token: string) {
  return getSupabase().auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' })
}

export async function getSellerProfile(): Promise<SellerProfile | null> {
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) return null
  const { data, error } = await client.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle()
  assertNoError(error)
  return data as SellerProfile | null
}

export async function listVendorProducts(): Promise<VendorProduct[]> {
  const { data, error } = await getSupabase().rpc('vendor_list_products')
  assertNoError(error)
  return (data ?? []).map((product: any) => {
    const multiplier = 1 + Number(product.commission_percent ?? 0) / 100
    return {
      ...product,
      price: Number(product.vendor_base_price ?? product.price),
      food_unit_price: product.food_unit_price == null ? null : Number((Number(product.food_unit_price) / multiplier).toFixed(2)),
    }
  }) as VendorProduct[]
}

export async function listVendorInventory(): Promise<VendorInventory[]> {
  const { data, error } = await getSupabase().from('product_inventory')
    .select('id, product_id, variant_id, quantity, low_stock_threshold, updated_at, products!inner(name, seller_id), product_variants(option_label, option_value)')
    .order('updated_at', { ascending: false }).limit(200)
  assertNoError(error)
  return (data ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants
    return {
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      low_stock_threshold: row.low_stock_threshold,
      updated_at: row.updated_at,
      product_name: product?.name ?? 'Unknown product',
      variant_name: variant ? `${variant.option_label}: ${variant.option_value}` : null,
    }
  }) as VendorInventory[]
}

export async function listVendorOrders(options: { page?: number; pageSize?: number; search?: string; status?: string } = {}): Promise<VendorOrderItem[]> {
  const pageSize = Math.max(1, Math.min(15, options.pageSize ?? 12))
  const page = Math.max(0, options.page ?? 0)
  const { data, error } = await getSupabase().rpc('vendor_order_items_page_v2', {
    p_limit: pageSize,
    p_offset: page * pageSize,
    p_search: options.search?.trim() || null,
    p_status: options.status && options.status !== 'all' ? options.status : null,
  })
  assertNoError(error)
  const rows = (data ?? []) as VendorOrderItem[]
  if (!rows.length) return rows
  const orderIds = [...new Set(rows.map((row) => row.order_id))]
  const { data: pickupRows, error: pickupError } = await getSupabase().rpc('vendor_list_order_pickup_statuses', { p_order_ids: orderIds })
  assertNoError(pickupError)
  const allowed = ['awaiting_vendor', 'ready_for_pickup', 'picked_up', 'cancelled']
  const pickupMap = new Map<string, string | null>((pickupRows ?? []).map((row: any): [string, string | null] => [
    row.order_id,
    allowed.includes(row.status) ? row.status : null,
  ]))
  return rows.map((row) => ({ ...row, pickup_status: pickupMap.get(row.order_id) ?? null }))
}

export async function listVendorCases(): Promise<VendorCase[]> {
  const { data, error } = await getSupabase().from('marketplace_cases')
    .select('id, order_id, order_item_id, buyer_id, seller_id, case_type, status, reason, evidence_path, seller_response, admin_decision, decided_by, decided_at, created_at, updated_at')
    .order('created_at', { ascending: false }).limit(100)
  assertNoError(error)
  return (data ?? []) as VendorCase[]
}

export async function setProductVisibility(productId: string, hidden: boolean) {
  const { data, error } = await getSupabase().rpc('vendor_set_product_visibility', {
    p_product_id: productId,
    p_hidden: hidden,
  })
  assertNoError(error)
  if (!data) throw new Error('Product visibility could not be updated.')
  return data as VendorProduct
}

export async function setProductStock(productId: string, quantity: number, note: string, variantId: string | null = null) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Stock must be a whole number of zero or more.')
  const { error } = await getSupabase().rpc('vendor_set_product_inventory', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_new_quantity: quantity,
    p_note: note.trim(),
  })
  assertNoError(error)
}

export async function markOrderReady(orderId: string, note?: string) {
  const { data, error } = await getSupabase().rpc('vendor_mark_order_ready', {
    p_order_id: orderId,
    p_vendor_note: note?.trim() || null,
  })
  assertNoError(error)
  if (!data) throw new Error('Order could not be marked ready for pickup.')
}

export async function replyToCase(id: string, sellerResponse: string) {
  if (sellerResponse.trim().length < 3) throw new Error('Add a short response before sending.')
  const { error } = await getSupabase().from('marketplace_cases')
    .update({ seller_response: sellerResponse.trim(), status: 'seller_responded' })
    .eq('id', id)
  assertNoError(error)
}

export async function getVendorCommissionPreview(categoryId: string | null) {
  const { data, error } = await getSupabase().rpc('vendor_get_commission_preview', { p_category_id: categoryId })
  assertNoError(error)
  const rate = Number(data ?? 0)
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new Error('The commission rate could not be verified.')
  return rate
}

export async function createVendorProduct(input: {
  category_id: string | null
  name: string
  slug: string
  sku: string | null
  short_description: string
  description: string
  price: number
  supplier_cost: number | null
  fulfillment_expense: number
  minimum_profit: number
  track_inventory: boolean
  discount_percent: number
  weight_grams: number | null
  specifications: unknown
  dimensions: unknown
  seo_title: string | null
  seo_description: string | null
  initial_stock: number
}) {
  const { data, error } = await getSupabase().rpc('vendor_create_product', {
    p_category_id: input.category_id,
    p_name: input.name,
    p_slug: input.slug,
    p_sku: input.sku,
    p_short_description: input.short_description,
    p_description: input.description,
    p_price: input.price,
    p_supplier_cost: input.supplier_cost,
    p_fulfillment_expense: input.fulfillment_expense,
    p_minimum_profit: input.minimum_profit,
    p_track_inventory: input.track_inventory,
    p_discount_percent: input.discount_percent,
    p_weight_grams: input.weight_grams,
    p_specifications: input.specifications,
    p_dimensions: input.dimensions,
    p_seo_title: input.seo_title,
    p_seo_description: input.seo_description,
    p_initial_stock: input.initial_stock,
  })
  assertNoError(error)
  if (!data) throw new Error('The product was not created.')
  return String(data)
}

export async function listVendorCategories(): Promise<Array<{ id: string; name: string; parent_id: string | null }>> {
  const { data, error } = await getSupabase().from('categories')
    .select('id, name, parent_id')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(500)
  assertNoError(error)
  return (data ?? []) as Array<{ id: string; name: string; parent_id: string | null }>
}

export async function uploadVendorProductImage(productId: string, file: File, altText: string) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Product images must be 10 MB or smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP or AVIF product image.')
  }
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) throw new Error('Sign in before uploading a product image.')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${user.id}/${productId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await client.storage.from('product-images').upload(path, file, {
    cacheControl: '31536000', upsert: false, contentType: file.type,
  })
  assertNoError(uploadError)
  const { data: existing, error: listError } = await client.from('product_images')
    .select('id, sort_order').eq('product_id', productId).order('sort_order', { ascending: true }).limit(100)
  if (listError) {
    await client.storage.from('product-images').remove([path])
    throw new Error(listError.message)
  }
  const sortOrder = existing?.length ? Math.max(...existing.map((row: any) => Number(row.sort_order))) + 1 : 0
  const { error: insertError } = await client.from('product_images').insert({
    product_id: productId, storage_path: path, alt_text: altText.slice(0, 200),
    sort_order: sortOrder, is_primary: !existing?.length,
  })
  if (insertError) {
    await client.storage.from('product-images').remove([path])
    throw new Error(insertError.message)
  }
}

export async function finalizeVendorProductSubmission(productId: string) {
  const { data, error } = await getSupabase().rpc('vendor_finalize_product_submission', { p_product_id: productId })
  assertNoError(error)
  if (!data) throw new Error('The product submission could not be finalized.')
  return data as VendorProduct
}

export async function getVendorDashboardData() {
  const [profile, products, inventory, orders, cases] = await Promise.all([
    getSellerProfile(),
    listVendorProducts(),
    listVendorInventory(),
    listVendorOrders({ pageSize: 15 }),
    listVendorCases(),
  ])
  return { profile, products, inventory, orders, cases }
}
