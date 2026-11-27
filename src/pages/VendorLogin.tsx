import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'
import { sendVendorLoginOtp, startVendorGoogleSignIn, verifyVendorLoginOtp, verifyVendorPassword } from '../services/marketplaceApi'
import { cx } from '../utils'

const OTP_LENGTH = 6
type AuthStatus = 'ready' | 'loading' | 'success' | 'error'

function GoogleIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
    </svg>
  )
}

function StatusMessage({ status, message }: { status: AuthStatus; message: string }) {
  if (status === 'loading') {
    return <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-cream-50 px-3 py-2.5 text-[11px] leading-relaxed text-[#53584E]" role="status" aria-live="polite"><Info size={15} className="mt-0.5 flex-none" />Connecting securely…</p>
  }
  if (status === 'success') {
    return <p className="mb-4 flex items-start gap-2 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2.5 text-[11px] leading-relaxed text-sage-800" role="status" aria-live="polite"><CheckCircle2 size={15} className="mt-0.5 flex-none" />{message}</p>
  }
  if (status === 'error') {
    return <p className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-800" role="alert"><AlertCircle size={15} className="mt-0.5 flex-none" />{message}</p>
  }
  return null
}

export function VendorLoginPage() {
  const navigate = useNavigate()
  const { configured } = useVendorAuth()
  const [step, setStep] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [status, setStatus] = useState<AuthStatus>('ready')
  const [message, setMessage] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const verifyingRef = useRef(false)

  const busy = status === 'loading'
  const code = digits.join('')

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus()
  }, [step])

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const result = await verifyVendorPassword(email, password)
      if (result.error) throw new Error(result.error.message)
      const sent = await sendVendorLoginOtp(email)
      if (sent.error) throw new Error(sent.error.message)
      setStep('otp')
      setDigits(Array(OTP_LENGTH).fill(''))
      setResendSeconds(60)
      setStatus('success')
      setMessage('A six-digit verification code has been sent to your email.')
    } catch (cause) {
      setStatus('error')
      setMessage(cause instanceof Error ? cause.message : 'Sign in could not be completed.')
    }
  }

  async function submitGoogle() {
    setStatus('loading')
    setMessage('')
    try {
      await startVendorGoogleSignIn(email)
    } catch (cause) {
      setStatus('error')
      setMessage(cause instanceof Error ? cause.message : 'Google sign-in could not be started.')
    }
  }

  async function verifyCode(value: string) {
    if (value.length !== OTP_LENGTH || verifyingRef.current || busy) return
    verifyingRef.current = true
    setStatus('loading')
    setMessage('')
    try {
      const result = await verifyVendorLoginOtp(email, value)
      if (result.error) throw new Error(result.error.message)
      navigate('/', { replace: true })
    } catch (cause) {
      setStatus('error')
      setMessage(cause instanceof Error ? cause.message : 'The verification code could not be confirmed.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      verifyingRef.current = false
    }
  }

  function updateDigit(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, '')
    setStatus('ready')
    setMessage('')
    if (value.length > 1) {
      const pasted = value.slice(0, OTP_LENGTH).split('')
      const next = Array(OTP_LENGTH).fill('').map((_, position) => pasted[position] ?? '')
      setDigits(next)
      if (pasted.length === OTP_LENGTH) void verifyCode(next.join(''))
      else inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
      return
    }
    if (!value) {
      setDigits(current => current.map((digit, position) => position === index ? '' : digit))
      return
    }
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
    if (next.join('').length === OTP_LENGTH) void verifyCode(next.join(''))
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('').map((_, index) => pasted[index] ?? '')
    setDigits(next)
    setStatus('ready')
    setMessage('')
    if (pasted.length === OTP_LENGTH) void verifyCode(pasted)
    else inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  async function resendOtp() {
    if (resendSeconds > 0 || busy) return
    setStatus('loading')
    setMessage('')
    try {
      const result = await sendVendorLoginOtp(email)
      if (result.error) throw new Error(result.error.message)
      setResendSeconds(60)
      setStatus('success')
      setMessage('A new verification code has been sent. Please check your inbox.')
    } catch (cause) {
      setStatus('error')
      setMessage(cause instanceof Error ? cause.message : 'The code could not be resent.')
    }
  }

  if (!configured) {
    return (
      <main className="min-h-screen grid place-items-center bg-cream-50 px-4 py-12 text-ink">
        <section className="w-full max-w-md rounded-2xl border border-line bg-white p-7">
          <h1 className="font-display text-xl font-semibold text-forest">Connect Supabase</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Vendor Center environment before signing in.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 px-4 py-8 text-ink sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-[580px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-cream-50"><ShieldCheck size={19} /></span>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-[-0.04em] text-forest">JTBazar<span className="text-sage-500">.</span></p>
              <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-muted">Vendor Center</p>
            </div>
          </div>
          <a href="https://www.jt-bazar.com/" className="text-[11px] font-semibold text-sage-700 hover:text-forest">Main website</a>
        </div>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-9">
          <header className="mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clay">{step === 'password' ? 'Vendor access' : 'Account security'}</span>
            <h1 className="mt-2 font-display text-[clamp(1.9rem,5vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-forest">
              {step === 'password' ? 'Sign in to Vendor Center' : 'Verify your sign-in'}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {step === 'password'
                ? 'Use the JTBazar account linked to your approved seller profile. The six-digit email code keeps vendor access secure.'
                : 'Enter the six-digit code sent to your JTBazar email address to finish signing in securely.'}
            </p>
          </header>

          <StatusMessage status={status} message={message} />

          {step === 'password' ? (
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="flex items-center justify-between gap-2 text-[12px] font-semibold text-ink">
                  Email <span className="text-[10px] font-normal text-muted">Registered JTBazar account</span>
                </span>
                <span className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-200">
                  <Mail size={16} className="flex-none text-muted" />
                  <input className="h-full w-full min-w-0 bg-transparent text-sm outline-none" type="email" autoComplete="email" required value={email} onChange={event => { setEmail(event.target.value.trim()); setStatus('ready'); setMessage('') }} placeholder="you@example.com" />
                </span>
              </label>

              <button type="button" disabled={busy || !email.trim()} onClick={() => void submitGoogle()} className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink transition hover:bg-cream-50 disabled:opacity-50">
                <GoogleIcon /> Continue with Google
              </button>

              <div className="flex items-center gap-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted" role="separator">
                <span className="h-px flex-1 bg-line" /> or use email + password <span className="h-px flex-1 bg-line" />
              </div>

              <form className="grid gap-4" onSubmit={submitPassword}>
                <label className="grid gap-1.5">
                  <span className="flex items-center justify-between gap-2 text-[12px] font-semibold text-ink">
                    Password <span className="text-[10px] font-normal text-muted">Required</span>
                  </span>
                  <span className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-200">
                    <LockKeyhole size={16} className="flex-none text-muted" />
                    <input className="h-full w-full min-w-0 bg-transparent text-sm outline-none" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => { setPassword(event.target.value); setStatus('ready'); setMessage('') }} placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} className="flex flex-none items-center gap-1 text-[10px] font-semibold text-sage-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </span>
                </label>
                <button type="submit" disabled={busy || !email.trim() || !password} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-[13px] font-semibold text-white transition hover:bg-forest-600 disabled:opacity-50">
                  {busy ? 'Checking…' : 'Continue securely'} <ArrowRight size={16} />
                </button>
                <a href="https://www.jt-bazar.com/forgot-password" className="justify-self-end text-[11px] font-semibold text-clay hover:text-forest">Forgot password?</a>
              </form>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={event => { event.preventDefault(); void verifyCode(code) }}>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-cream-50 p-3.5">
                <Mail size={19} className="mt-0.5 flex-none text-clay" />
                <div className="min-w-0">
                  <h2 className="text-[13px] font-semibold text-ink">Check your inbox</h2>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">We sent a six-digit verification code to <strong className="text-ink">{email}</strong>.</p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5" role="group" aria-label="Six-digit verification code">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={element => { inputRefs.current[index] = element }}
                    className={cx('h-14 w-full min-w-0 rounded-xl border border-line bg-white text-center text-lg font-semibold text-forest outline-none transition focus:border-sage-600 focus:ring-2 focus:ring-sage-200 sm:h-16 sm:text-xl', busy && 'opacity-60')}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1}`}
                    disabled={busy}
                    onChange={event => updateDigit(index, event.target.value)}
                    onPaste={pasteCode}
                    onKeyDown={event => {
                      if (event.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
                      if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
                      if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
                    }}
                  />
                ))}
              </div>

              <button type="submit" disabled={busy || code.length !== OTP_LENGTH} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-[13px] font-semibold text-white transition hover:bg-forest-600 disabled:opacity-50">
                {busy ? 'Verifying code…' : 'Verify and sign in'} <ArrowRight size={16} />
              </button>
              <button type="button" disabled={busy || resendSeconds > 0} onClick={() => void resendOtp()} className="justify-self-center text-[11px] font-semibold text-sage-700 disabled:opacity-50">
                {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend verification code'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => { setStep('password'); setDigits(Array(OTP_LENGTH).fill('')); setStatus('ready'); setMessage(''); setResendSeconds(0) }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-clay hover:text-forest"
              >
                <ArrowLeft size={13} /> Back to sign in
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line pt-4 text-[11px] text-muted">
            <a href="https://www.jt-bazar.com/vendor/apply" className="font-semibold text-sage-700 hover:text-forest">Apply as a seller</a>
            <a href="https://www.jt-bazar.com/contact" className="font-semibold text-sage-700 hover:text-forest">Marketplace support</a>
          </div>
          <p className="mt-3 text-center text-[10px] leading-5 text-muted">Vendor access is available only to approved JTBazar sellers. Account role and permissions are enforced by Supabase.</p>
        </section>
      </div>
    </main>
  )
}
