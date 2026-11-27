import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getVendorAccountSuspensionReason } from '../services/marketplaceApi'
import { getSupabase, isSupabaseConfigured, supabase } from '../lib/supabase'

export interface VendorAuthValue {
  user: User | null
  session: Session | null
  seller: Record<string, any> | null
  suspensionReason: string | null
  loading: boolean
  configured: boolean
  refreshSeller: () => Promise<void>
  signOut: () => Promise<void>
}

const VendorAuthContext = createContext<VendorAuthValue | null>(null)

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [seller, setSeller] = useState<Record<string, any> | null>(null)
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refreshSeller = useCallback(async () => {
    if (!supabase) {
      setSeller(null)
      return
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setSeller(null)
      setSuspensionReason(null)
      return
    }
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    const reason = await getVendorAccountSuspensionReason()
    setSeller(data as Record<string, any> | null)
    setSuspensionReason(reason)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    let receivedAuthEvent = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      receivedAuthEvent = true
      setSession(nextSession)
      if (!nextSession?.user) {
        setSeller(null)
        setSuspensionReason(null)
        setLoading(false)
        return
      }
      setLoading(true)
      queueMicrotask(() => {
        void refreshSeller().catch(() => { setSeller(null); setSuspensionReason(null) }).finally(() => {
          if (active) setLoading(false)
        })
      })
    })
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return
      if (!receivedAuthEvent) {
        setSession(error ? null : data.session)
        if (data.session?.user) {
          try { await refreshSeller() } catch { setSeller(null); setSuspensionReason(null) }
        }
        if (active) setLoading(false)
      }
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
    suspensionReason,
    loading,
    configured: isSupabaseConfigured,
    refreshSeller,
    signOut: async () => {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw new Error(error.message)
    },
  }), [session, seller, suspensionReason, loading, refreshSeller])

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const value = useContext(VendorAuthContext)
  if (!value) throw new Error('useVendorAuth must be used inside VendorAuthProvider')
  return value
}
