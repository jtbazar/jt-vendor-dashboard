import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sendVendorLoginOtp, startVendorGoogleSignIn, verifyVendorLoginOtp, verifyVendorPassword } from '../services/marketplaceApi'

export function VendorLoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await verifyVendorPassword(email, password)
      if (result.error) throw new Error(result.error.message)
      const sent = await sendVendorLoginOtp(email)
      if (sent.error) throw new Error(sent.error.message)
      setStep('otp')
      setResendSeconds(60)
      setNotice('A 6-digit verification code has been sent to your email.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in could not be completed.')
    } finally { setBusy(false) }
  }

  async function submitGoogle() {
    setBusy(true); setError(''); setNotice('')
    try { await startVendorGoogleSignIn(email) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Google sign-in could not be started.') }
    finally { setBusy(false) }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^\\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await verifyVendorLoginOtp(email, otp)
      if (result.error) throw new Error(result.error.message)
      navigate('/marketplace', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The verification code could not be confirmed.')
    } finally { setBusy(false) }
  }

  async function resendOtp() {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await sendVendorLoginOtp(email)
      if (result.error) throw new Error(result.error.message)
      setResendSeconds(60)
      setNotice('A new verification code has been sent.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The code could not be resent.')
    } finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-cream-50 px-4 py-12 text-ink">
    <section className="mx-auto w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-soft">
      <div className="mb-7 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream-50"><ShieldCheck size={23}/></span>
        <div><p className="font-display text-xl font-semibold text-forest">JTBazar</p><p className="text-xs text-muted">Vendor Center secure access</p></div>
      </div>
      {step === 'password' ? <>
        <h1 className="font-display text-2xl font-semibold text-forest">Sign in to your shop</h1>
        <p className="mt-2 text-sm text-muted">Use the same email as your existing JTBazar customer account. No separate vendor registration is needed.</p>
        <label className="mt-5 block text-sm font-medium">JTBazar account email<div className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3"><Mail size={16} className="text-muted"/><input className="h-11 w-full outline-none" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value.trim())} placeholder="you@example.com"/></div></label>
        <button type="button" disabled={busy || !email.trim()} onClick={()=>void submitGoogle()} className="mt-4 h-11 w-full rounded-xl border border-line bg-white px-4 text-sm font-semibold text-forest disabled:opacity-60">{busy ? 'Connecting…' : 'Continue with Google'}</button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line"/><span>OR USE EMAIL + PASSWORD</span><span className="h-px flex-1 bg-line"/></div>
        <form className="space-y-4" onSubmit={submitPassword}>
          <label className="block text-sm font-medium">Password<div className="mt-1 flex items-center gap-2 rounded-xl border border-line px-3"><LockKeyhole size={16} className="text-muted"/><input className="h-11 w-full outline-none" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></div></label>
          <button type="submit" disabled={busy || !email.trim()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white disabled:opacity-60">{busy?'Checking…':'Continue'} <ArrowRight size={16}/></button>
        </form>
      </> : <>
        <h1 className="font-display text-2xl font-semibold text-forest">Verify your email</h1>
        <p className="mt-2 text-sm text-muted">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        <form className="mt-6 space-y-4" onSubmit={submitOtp}>
          <label className="block text-sm font-medium">Email verification code<input className="mt-1 h-12 w-full rounded-xl border border-line px-4 text-center text-xl tracking-[.35em] outline-none" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,'').slice(0,6))}/></label>
          <button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-forest px-4 text-sm font-semibold text-white disabled:opacity-60">{busy?'Verifying…':'Verify and sign in'}</button>
          <button type="button" disabled={busy || resendSeconds > 0} onClick={()=>void resendOtp()} className="w-full text-sm font-medium text-sage-700 disabled:opacity-50">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend verification code'}</button>
          <button type="button" disabled={busy} onClick={()=>{setStep('password');setOtp('');setNotice('');setResendSeconds(0)}} className="w-full text-sm font-medium text-sage-700">Back to sign in</button>
        </form>
      </>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-sage-50 p-3 text-sm text-sage-800">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">Vendor access is available only to an approved seller account. Your account role and permissions are enforced by Supabase.</p>
    </section>
  </main>
}
