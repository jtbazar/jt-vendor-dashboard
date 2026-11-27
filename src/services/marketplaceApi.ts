import { createEphemeralSupabase, getSupabase } from '../lib/supabase'

export type SellerProfile = Record<string, any>
export type VendorProduct = Record<string, any>
export type VendorInventory = Record<string, any>
export type VendorOrderItem = Record<string, any>
export type VendorCase = Record<string, any>

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

async function compressVendorImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) { bitmap.close(); return file }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.84))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\\.[^.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() })
  } catch { return file }
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

export async function startVendorGoogleSignIn(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Enter the email address already registered on your JTBazar account.')
  const { data: method, error: lookupError } = await getSupabase().rpc('get_auth_method_for_email', { p_email: normalizedEmail })
  assertNoError(lookupError)
  if (method !== 'google' && method !== 'mixed') {
    throw new Error(method === 'password'
      ? 'This JTBazar account uses email and password. Please use the email + OTP sign-in instead.'
      : 'No existing JTBazar Google account was found for this email. Apply as a customer on JTBazar first.')
  }
  const callback = new URL('/auth/callback?provider=google&next=%2Fmarketplace&expected_email=' + encodeURIComponent(normalizedEmail), window.location.origin).toString()
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback, queryParams: { login_hint: normalizedEmail, prompt: 'select_account' } },
  })
  assertNoError(error)
}

export async function completeVendorGoogleSignIn(code: string, expectedEmail: string) {
  const { data, error } = await getSupabase().auth.exchangeCodeForSession(code)
  assertNoError(error)
  const actualEmail = data.session?.user.email?.trim().toLowerCase() ?? ''
  if (!data.session || actualEmail !== expectedEmail.trim().toLowerCase()) {
    await getSupabase().auth.signOut({ scope: 'local' })
    throw new Error('The Google account selected does not match the existing JTBazar email. Please try again.')
  }
  const identities = data.session.user.identities ?? []
  if (!identities.some((identity) => identity.provider === 'google')) {
    await getSupabase().auth.signOut({ scope: 'local' })
    throw new Error('This account is not linked to Google. Please use email + OTP sign-in.')
  }
  return data.session
}

export async function getVendorAccountSuspensionReason(): Promise<string | null> {
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) return null
  const activeAuthBan = Boolean(user.banned_until && Date.parse(user.banned_until) > Date.now())
  const { data: notices, error } = await client.from('notifications')
    .select('kind, title, body, created_at').eq('audience', 'customer')
    .order('created_at', { ascending: false }).limit(30)
  if (error) throw new Error(error.message)
  const suspensionState = (notices ?? []).find(notice =>
    notice.kind === 'account' && ['Account suspended', 'Account restored'].includes(notice.title)
  )
  if (suspensionState?.title === 'Account restored') return null
  return (suspensionState?.title === 'Account suspended' ? String(suspensionState.body ?? '').trim() : '')
    || (activeAuthBan ? 'Your account is suspended by marketplace administration.' : null)
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

export interface VendorVariantInput {
  id?: string | null
  option_label: string
  option_value: string
  sku?: string | null
  price_override: number | null
  attributes?: Record<string, unknown>
  image_url?: string | null
  quantity: number
}

export async function listVendorProductVariants(productId: string): Promise<VendorVariantInput[]> {
  const client = getSupabase()
  const [variants, inventory, product] = await Promise.all([
    client.from('product_variants').select('id, option_label, option_value, sku, price_override, attributes, image_url, sort_order')
      .eq('product_id', productId).order('sort_order').limit(100),
    client.from('product_inventory').select('variant_id, quantity').eq('product_id', productId).limit(100),
    client.from('products').select('commission_percent').eq('id', productId).maybeSingle(),
  ])
  assertNoError(variants.error)
  assertNoError(inventory.error)
  assertNoError(product.error)
  const stockByVariant = new Map<string, number>((inventory.data ?? []).map((row: any): [string, number] => [row.variant_id, Number(row.quantity)]))
  const commissionMultiplier = 1 + Number(product.data?.commission_percent ?? 0) / 100
  return (variants.data ?? []).map((row: any) => ({
    id: row.id,
    option_label: row.option_label,
    option_value: row.option_value,
    sku: row.sku,
    price_override: row.price_override == null ? null : Number((Number(row.price_override) / commissionMultiplier).toFixed(2)),
    attributes: row.attributes ?? {},
    image_url: row.image_url ?? null,
    quantity: stockByVariant.get(row.id) ?? 0,
  }))
}

export async function saveVendorProductVariants(productId: string, variants: VendorVariantInput[]) {
  if (variants.length > 100) throw new Error('A product can have no more than 100 variants.')
  const seen = new Set<string>()
  for (const variant of variants) {
    const label = variant.option_label.trim()
    const value = variant.option_value.trim()
    const key = `${label.toLocaleLowerCase()}::${value.toLocaleLowerCase()}`
    if (!label || !value) throw new Error('Every variant needs an option name and value.')
    if (seen.has(key)) throw new Error('Duplicate variant option and value. Please make each variant unique.')
    seen.add(key)
    if (!Number.isInteger(variant.quantity) || variant.quantity < 0) throw new Error('Variant stock must be a whole number of zero or more.')
    if (variant.price_override !== null && (!Number.isFinite(variant.price_override) || variant.price_override < 0)) throw new Error('Enter a valid variant price.')
  }
  const { error } = await getSupabase().rpc('vendor_save_product_variants', {
    p_product_id: productId,
    p_variants: variants.map((variant) => ({
      id: variant.id && !variant.id.startsWith('new-') ? variant.id : null,
      option_label: variant.option_label.trim(),
      option_value: variant.option_value.trim(),
      sku: variant.sku?.trim() || null,
      price_override: variant.price_override,
      attributes: variant.attributes ?? {},
      image_url: variant.image_url ?? null,
      quantity: variant.quantity,
    })),
  })
  assertNoError(error)
}

export async function updateVendorProduct(productId: string, input: {
  category_id: string | null; name: string; slug: string; sku: string | null;
  short_description: string; description: string; price: number;
  supplier_cost: number | null; fulfillment_expense: number; minimum_profit: number;
  discount_percent: number; weight_grams: number | null; specifications: unknown;
  dimensions: unknown; seo_title: string | null; seo_description: string | null;
}) {
  const { data, error } = await getSupabase().rpc('vendor_update_product', {
    p_product_id: productId,
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
    p_discount_percent: input.discount_percent,
    p_weight_grams: input.weight_grams,
    p_specifications: input.specifications,
    p_dimensions: input.dimensions,
    p_seo_title: input.seo_title,
    p_seo_description: input.seo_description,
  })
  assertNoError(error)
  if (!data) throw new Error('The product was not updated.')
  return data as VendorProduct
}

export async function listVendorCategories(): Promise<Array<{ id: string; name: string; parent_id: string | null; is_food_category: boolean }>> {
  const { data, error } = await getSupabase().from('categories')
    .select('id, name, parent_id, is_food_category')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(500)
  assertNoError(error)
  return (data ?? []) as Array<{ id: string; name: string; parent_id: string | null; is_food_category: boolean }>
}

export async function uploadVendorProductImage(productId: string, file: File, altText: string) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Product images must be 10 MB or smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF product image.')
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) throw new Error('Sign in before uploading a product image.')
  const optimizedFile = await compressVendorImage(file)
  const safeName = optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${user.id}/${productId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await client.storage.from('product-images').upload(path, optimizedFile, {
    cacheControl: '31536000', upsert: false, contentType: optimizedFile.type,
  })
  assertNoError(uploadError)
  const { data: existing, error: listError } = await client.from('product_images')
    .select('sort_order').eq('product_id', productId).order('sort_order', { ascending: true }).limit(100)
  if (listError) {
    await client.storage.from('product-images').remove([path])
    throw new Error(listError.message)
  }
  const nextSort = (existing ?? []).length
    ? Math.max(...(existing ?? []).map(image => Number(image.sort_order))) + 1
    : 0
  const { error: insertError } = await client.from('product_images').insert({
    product_id: productId, storage_path: path, alt_text: altText.slice(0, 200),
    sort_order: nextSort, is_primary: (existing ?? []).length === 0,
  })
  if (insertError) {
    await client.storage.from('product-images').remove([path])
    throw new Error(insertError.message)
  }
}

export async function getVendorCaseEvidenceUrl(path: string) {
  if (!path) return null
  const { data, error } = await getSupabase().storage.from('complaint-evidence').createSignedUrl(path, 600)
  if (error || !data) return null
  return data.signedUrl
}

export async function listVendorInventoryMovements() {
  const { data, error } = await getSupabase().from('inventory_movements')
    .select('id, product_id, variant_id, quantity_delta, movement_type, note, created_at')
    .order('created_at', { ascending: false }).limit(100)
  assertNoError(error)
  return data ?? []
}

export async function listVendorProductImages(productId: string) {
  const client = getSupabase()
  const { data, error } = await client.from('product_images')
    .select('id, image_url, storage_path, alt_text, sort_order, is_primary')
    .eq('product_id', productId).order('sort_order', { ascending: true }).limit(100)
  assertNoError(error)
  return (data ?? []).map((image: any) => ({
    ...image,
    url: image.image_url || (image.storage_path ? client.storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl : ''),
  })).filter((image: any) => image.url)
}

export async function uploadVendorVariantImage(productId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Variant images must be 10 MB or smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF variant image.')
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) throw new Error('Sign in before uploading a variant image.')
  const optimizedFile = await compressVendorImage(file)
  const safeName = optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `${user.id}/${productId}/variants/${crypto.randomUUID()}-${safeName}`
  const { error } = await client.storage.from('product-images').upload(path, optimizedFile, { cacheControl: '31536000', upsert: false, contentType: optimizedFile.type })
  assertNoError(error)
  return client.storage.from('product-images').getPublicUrl(path).data.publicUrl
}


export async function requestVendorProductDeletion(productId: string, reason: string) {
  if (reason.trim().length < 3) throw new Error('Please provide a reason for the deletion request.')
  const { error } = await getSupabase().rpc('vendor_request_product_deletion', { p_product_id: productId, p_reason: reason.trim() })
  assertNoError(error)
}

export async function listVendorProductDeletionRequests(): Promise<Array<{ product_id: string; status: string }>> {
  const { data, error } = await getSupabase().from('product_deletion_requests')
    .select('product_id,status').order('created_at', { ascending: false }).limit(200)
  assertNoError(error)
  return data ?? []
}

export async function adjustVendorInventory(inventoryId: string, quantity: number, note: string) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Stock must be a whole number of zero or more.')
  const { error } = await getSupabase().rpc('vendor_adjust_inventory', { p_inventory_id: inventoryId, p_new_quantity: quantity, p_note: note.trim() })
  assertNoError(error)
}

export async function setVendorDailyAvailability(input: { productId: string; isDailyItem: boolean; availableQuantity: number; minimumQuantity?: number; minimumOrderValue?: number | null; shopIsOpen?: boolean | null }) {
  if (!Number.isInteger(input.availableQuantity) || input.availableQuantity < 0) throw new Error('Daily availability must be a whole number of zero or more.')
  const { data, error } = await getSupabase().rpc('vendor_set_daily_availability', {
    p_product_id: input.productId, p_is_daily_item: input.isDailyItem,
    p_available_quantity: input.availableQuantity, p_minimum_quantity: input.minimumQuantity ?? 1,
    p_minimum_order_value: input.minimumOrderValue ?? null, p_shop_is_open: input.shopIsOpen ?? null,
  })
  assertNoError(error)
  if (!data) throw new Error('Daily availability could not be saved.')
  return data as VendorProduct
}

export async function setVendorFoodProductDetails(input: { productId: string; sellingUnit: string; unitPrice: number; quantityIncrement: number; minimumQuantity: number; isDailyItem: boolean; dailyStatus: 'available' | 'not_today' | 'coming_soon'; dailyAvailableQuantity: number }) {
  const { error } = await getSupabase().rpc('vendor_update_food_product_details', {
    p_product_id: input.productId, p_selling_unit: input.sellingUnit, p_unit_price: input.unitPrice,
    p_quantity_increment: input.quantityIncrement, p_minimum_quantity: input.minimumQuantity,
    p_is_daily_item: input.isDailyItem, p_daily_status: input.dailyStatus,
    p_daily_available_quantity: input.dailyAvailableQuantity,
  })
  assertNoError(error)
}

export async function finalizeVendorProductSubmission(productId: string) {
  const { data, error } = await getSupabase().rpc('vendor_finalize_product_submission', { p_product_id: productId })
  assertNoError(error)
  if (!data) throw new Error('The product submission could not be finalized.')
  return data as VendorProduct
}

export async function listVendorSupportTickets() {
  const { data, error } = await getSupabase().from('support_tickets')
    .select('*').order('created_at', { ascending: false }).limit(100)
  assertNoError(error)
  return data ?? []
}

export async function listVendorSupportMessages(ticketId: string) {
  const { data, error } = await getSupabase().from('support_ticket_messages')
    .select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }).limit(500)
  assertNoError(error)
  return data ?? []
}

export async function createVendorSupportTicket(sellerId: string, subject: string, message: string) {
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) throw new Error('Sign in before creating a support ticket.')
  const { data, error } = await client.from('support_tickets')
    .insert({ seller_id: sellerId, created_by: user.id, subject: subject.trim(), message: message.trim() })
    .select('id').single()
  assertNoError(error)
  if (!data) throw new Error('Support ticket could not be confirmed.')
  try { await client.functions.invoke('support-email', { body: { ticket_id: data.id, ticket_kind: 'seller', event: 'created' } }) } catch { /* Ticket creation remains successful if email notification is unavailable. */ }
  return data.id
}

export async function sendVendorSupportMessage(ticketId: string, message: string) {
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user) throw new Error('Sign in before replying to support.')
  const { data, error } = await client.from('support_ticket_messages')
    .insert({ ticket_id: ticketId, sender_id: user.id, sender_role: 'seller', message: message.trim() })
    .select('*').single()
  assertNoError(error)
  if (!data) throw new Error('Your message could not be confirmed.')
  return data
}

export async function getVendorDocumentSignedUrls(profile: SellerProfile) {
  const client = getSupabase()
  const entries = await Promise.all([
    ['cnicFront', profile.cnic_front_path], ['cnicBack', profile.cnic_back_path], ['verification', profile.document_path],
  ].map(async ([key, path]) => {
    if (!path || typeof path !== 'string') return [key, null] as const
    const { data, error } = await client.storage.from('vendor-documents').createSignedUrl(path, 300)
    return [key, error ? null : data.signedUrl] as const
  }))
  return Object.fromEntries(entries) as { cnicFront: string | null; cnicBack: string | null; verification: string | null }
}

export async function uploadVendorShopImage(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Shop images must be 5 MB or smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF shop image.')
  const client = getSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  assertNoError(error)
  if (!user) throw new Error('Sign in before uploading a shop image.')
  const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error: uploadError } = await client.storage.from('shop-images').upload(path, file, { upsert: false, contentType: file.type })
  assertNoError(uploadError)
  return { path, url: client.storage.from('shop-images').getPublicUrl(path).data.publicUrl }
}

export async function uploadVendorDocument(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Business information PDFs must be 10 MB or smaller.')
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Upload a PDF document.')
  const client = getSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  assertNoError(error)
  if (!user) throw new Error('Sign in before uploading verification documents.')
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await client.storage.from('vendor-documents').upload(path, file, { cacheControl: '3600', upsert: false, contentType: 'application/pdf' })
  assertNoError(uploadError)
  return path
}

export async function removeVendorDocument(path: string) {
  if (!path) return
  const { error } = await getSupabase().storage.from('vendor-documents').remove([path])
  assertNoError(error)
}

export async function uploadVendorCnicImage(file: File, side: 'cnic-front' | 'cnic-back') {
  if (file.size > 10 * 1024 * 1024) throw new Error('CNIC images must be 10 MB or smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('CNIC images must be JPG, PNG or WebP.')
  const client = getSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  assertNoError(error)
  if (!user) throw new Error('Sign in before uploading CNIC images.')
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${user.id}/${side}-${Date.now()}-${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await client.storage.from('vendor-documents').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  assertNoError(uploadError)
  return path
}

export async function updateVendorShopProfile(input: {
  shop_name: string; slug?: string; description: string; phone: string;
  current_address: string; complete_address: string; shop_lat?: number | null;
  shop_lng?: number | null; shop_location_label?: string; show_shop_on_map?: boolean;
  shop_hours?: Record<string, unknown>;
  shop_is_open?: boolean; shop_image_url?: string | null;
  document_path?: string | null; cnic_front_path?: string | null; cnic_back_path?: string | null;
}) {
  const client = getSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  assertNoError(authError)
  if (!user || !user.email_confirmed_at) throw new Error('Verify your JTBazar account email before updating seller details.')
  const { data, error } = await client.from('seller_profiles').update({
    shop_name: input.shop_name.trim(),
    ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
    description: input.description.trim(),
    contact_email: user.email?.trim().toLowerCase(),
    ...(input.shop_lat !== undefined ? { shop_lat: input.shop_lat } : {}),
    ...(input.shop_lng !== undefined ? { shop_lng: input.shop_lng } : {}),
    ...(input.shop_location_label !== undefined ? { shop_location_label: input.shop_location_label.trim() } : {}),
    ...(input.show_shop_on_map !== undefined ? { show_shop_on_map: input.show_shop_on_map } : {}),
    ...(input.shop_hours !== undefined ? { shop_hours: input.shop_hours } : {}),
    ...(input.shop_is_open !== undefined ? { shop_is_open: input.shop_is_open } : {}),
    ...(input.shop_image_url !== undefined ? { shop_image_url: input.shop_image_url } : {}),
    ...(input.document_path !== undefined ? { document_path: input.document_path } : {}),
    ...(input.cnic_front_path !== undefined ? { cnic_front_path: input.cnic_front_path } : {}),
    ...(input.cnic_back_path !== undefined ? { cnic_back_path: input.cnic_back_path } : {}),
    phone: input.phone.trim(),
    current_address: input.current_address.trim(),
    complete_address: input.complete_address.trim(),
  }).eq('user_id', user.id).select('*').single()
  assertNoError(error)
  if (!data) throw new Error('The shop profile was not updated.')
  return data
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
