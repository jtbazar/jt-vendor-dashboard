import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured, supabase } from '../lib/supabase'

export interface VendorAuthValue {
  user: User | null
  session: Session | null
  seller: Record<string, any> | null
  loading: boolean
  configured: boolean
  refreshSeller: () => Promise<void>
  signOut: () => Promise<void>
}

const VendorAuthContext = createContext<VendorAuthValue | null>(null)

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [seller, setSeller] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refreshSeller = useCallback(async () => {
    if (!supabase) {
      setSeller(null)
      return
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setSeller(null)
      return
    }
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    setSeller(data as Record<string, any> | null)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (!nextSession?.user) {
        setSeller(null)
        setLoading(false)
        return
      }
      setLoading(true)
      queueMicrotask(() => {
        void refreshSeller().catch(() => setSeller(null)).finally(() => {
          if (active) setLoading(false)
        })
      })
    })
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return
      setSession(error ? null : data.session)
      if (data.session?.user) {
        try { await refreshSeller() } catch { setSeller(null) }
      }
      if (active) setLoading(false)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [refreshSeller])

  const value = useMemo<VendorAuthValue>(() => ({
    user: session?.user ?? null,
    session,
    seller,
    loading,
    configured: isSupabaseConfigured,
    refreshSeller,
    signOut: async () => {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw new Error(error.message)
    },
  }), [session, seller, loading, refreshSeller])

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const value = useContext(VendorAuthContext)
  if (!value) throw new Error('useVendorAuth must be used inside VendorAuthProvider')
  return value
}
