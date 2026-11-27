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
  setSellerProfile: (profile: Record<string, any>) => void
  signOut: () => Promise<void>
}

const VendorAuthContext = createContext<VendorAuthValue | null>(null)

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [seller, setSeller] = useState<Record<string, any> | null>(null)
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const clearSeller = useCallback(() => {
    setSeller(null)
    setSuspensionReason(null)
  }, [])

  /**
   * Load the seller profile once per signed-in user. `refreshSeller` is still
   * available for settings saves, but it no longer re-reads the auth session.
   */
  const refreshSeller = useCallback(async (authUser?: { id: string; banned_until?: string | null } | null) => {
    if (!supabase) {
      clearSeller()
      return
    }
    const user = authUser ?? (await supabase.auth.getUser()).data.user
    if (!user) {
      clearSeller()
      return
    }
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    const reason = await getVendorAccountSuspensionReason(user)
    setSeller((data as Record<string, any> | null) ?? null)
    setSuspensionReason(reason)
  }, [clearSeller])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    let loadedUserId: string | null = null

    const syncSeller = async (nextSession: Session | null, force = false) => {
      if (!active) return
      const nextUserId = nextSession?.user?.id ?? null
      setSession(nextSession)
      if (!nextUserId || !nextSession) {
        loadedUserId = null
        clearSeller()
        setLoading(false)
        return
      }
      // Token refresh and repeated SIGNED_IN events must not refetch the profile.
      if (!force && loadedUserId === nextUserId) {
        setLoading(false)
        return
      }
      loadedUserId = nextUserId
      setLoading(true)
      try {
        await refreshSeller(nextSession.user)
      } catch {
        if (active) clearSeller()
      } finally {
        if (active) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      // Supabase refreshes tokens silently; the user and seller data are unchanged.
      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession)
        return
      }
      if (event === 'INITIAL_SESSION') return
      if (event === 'SIGNED_OUT') {
        void syncSeller(null)
        return
      }
      void syncSeller(nextSession)
    })

    void (async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return
      await syncSeller(error ? null : data.session)
    })()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [clearSeller, refreshSeller])

  const refreshSellerForCurrentUser = useCallback(async () => {
    const authUser = session?.user ?? (supabase ? (await supabase.auth.getUser()).data.user : null)
    if (!authUser) {
      clearSeller()
      return
    }
    await refreshSeller(authUser)
  }, [session?.user, refreshSeller, clearSeller])

  const setSellerProfile = useCallback((profile: Record<string, any>) => {
    setSeller(profile)
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut()
    if (error) throw new Error(error.message)
  }, [])

  const value = useMemo<VendorAuthValue>(() => ({
    user: session?.user ?? null,
    session,
    seller,
    suspensionReason,
    loading,
    configured: isSupabaseConfigured,
    refreshSeller: refreshSellerForCurrentUser,
    setSellerProfile,
    signOut,
  }), [session, seller, suspensionReason, loading, refreshSellerForCurrentUser, setSellerProfile, signOut])

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const value = useContext(VendorAuthContext)
  if (!value) throw new Error('useVendorAuth must be used inside VendorAuthProvider')
  return value
}
