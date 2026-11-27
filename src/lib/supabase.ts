import { createClient } from '@supabase/supabase-js'

const env = (import.meta as any).env ?? {}
const supabaseUrl = String(env.VITE_SUPABASE_URL ?? '').trim()
const publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('https://') &&
  publishableKey &&
  !supabaseUrl.includes('YOUR_PROJECT') &&
  !publishableKey.includes('YOUR_SUPABASE'),
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        storage: typeof window === 'undefined' ? undefined : window.localStorage,
        storageKey: 'jtbazar-vendor-center-auth',
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }
  return supabase
}

export function createEphemeralSupabase() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'jtbazar-vendor-password-check',
      flowType: 'pkce',
    },
  })
}
