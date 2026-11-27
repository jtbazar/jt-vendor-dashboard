import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completeVendorGoogleSignIn } from '../services/marketplaceApi'

export function VendorAuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function finish() {
      try {
        const providerError = params.get('error_description') || params.get('error')
        if (providerError) throw new Error(providerError.replace(/\\+/g, ' '))
        const code = params.get('code')
        const expectedEmail = params.get('expected_email') || ''
        if (!code || !expectedEmail) throw new Error('The Google sign-in response is incomplete. Please start again.')
        await completeVendorGoogleSignIn(code, expectedEmail)
        if (active) navigate('/marketplace', { replace: true })
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Google sign-in could not be completed.')
      }
    }
    void finish()
    return () => { active = false }
  }, [navigate, params])

  return <main className="min-h-screen bg-cream-50 px-4 py-12 text-ink"><section className="mx-auto max-w-md rounded-3xl border border-line bg-white p-7 shadow-soft"><h1 className="font-display text-2xl font-semibold text-forest">Completing secure sign-in</h1>{error ? <><p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p><button onClick={() => navigate('/vendor-login', { replace: true })} className="mt-5 h-11 w-full rounded-xl bg-forest px-4 text-sm font-semibold text-white">Back to Vendor Center login</button></> : <p className="mt-3 text-sm text-muted">Verifying your existing JTBazar account…</p>}</section></main>
}
