import { useState } from 'react'

const rules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function PasswordStrength({ password }) {
  if (!password) return null
  const passed = rules.filter((r) => r.test(password)).length
  const strength = passed <= 2 ? 'Weak' : passed <= 4 ? 'Fair' : 'Strong'
  const color = passed <= 2 ? 'bg-red-400' : passed <= 4 ? 'bg-yellow-400' : 'bg-emerald-500'
  const textColor = passed <= 2 ? 'text-red-500' : passed <= 4 ? 'text-yellow-500' : 'text-emerald-600'

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 rounded-full h-1.5 transition-all ${i <= passed ? color : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className={`text-xs font-medium ${textColor}`}>{strength}</span>
      </div>
      <ul className="space-y-1">
        {rules.map((r) => (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{r.test(password) ? '✓' : '○'}</span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const isPasswordValid = rules.every((r) => r.test(form.password))

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!isPasswordValid) return setError('Password does not meet all requirements.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Signup failed')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed')
      localStorage.setItem('token', data.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to resend')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-primary">PaisaTrack</a>
          <p className="text-gray-500 text-sm mt-2">
            {step === 1 ? 'Create your free account' : 'Check your inbox'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {step === 1 ? (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign up</h1>

              {/* Google button at top */}
              <a
                href="http://localhost:5000/api/auth/google"
                className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </a>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or sign up with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Asiya Thapa"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  <PasswordStrength password={form.password} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <input
                    type="password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    required
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
                      form.confirm && form.confirm !== form.password
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                        : form.confirm && form.confirm === form.password
                        ? 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-400'
                        : 'border-gray-200 focus:ring-primary/30 focus:border-primary'
                    }`}
                  />
                  {form.confirm && form.confirm !== form.password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {form.confirm && form.confirm === form.password && (
                    <p className="text-xs text-emerald-600 mt-1">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <a href="/login" className="text-primary font-medium hover:underline">Log in</a>
              </p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <span className="text-5xl"></span>
                <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Verify your email</h1>
                <p className="text-sm text-gray-500">
                  We sent a 6-digit code to <span className="font-medium text-gray-700">{form.email}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError('') }}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Verify email'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Didn't get the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  Resend
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
