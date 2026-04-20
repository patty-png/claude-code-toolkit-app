'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<'github' | 'email' | null>(null)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const signInGitHub = async () => {
    setLoading('github')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading('email')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(null)
  }

  if (sent) {
    return (
      <div className="sign-success">
        <div className="success-icon">✓</div>
        <h3>Check your inbox</h3>
        <p>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
      </div>
    )
  }

  return (
    <div className="sign-form">
      <button
        type="button"
        className="sign-btn sign-btn-github"
        onClick={signInGitHub}
        disabled={loading !== null}
      >
        {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
      </button>

      <div className="sign-divider"><span>or email</span></div>

      <form onSubmit={signInEmail} className="sign-email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <button type="submit" className="sign-btn sign-btn-email" disabled={loading !== null || !email}>
          {loading === 'email' ? 'Sending…' : 'Send magic link →'}
        </button>
      </form>

      {error && <div className="sign-error">{error}</div>}

      <div className="sign-foot">
        By signing in you agree to store your stack data in Supabase.
        Credentials are visible only to you (row-level security).
      </div>
    </div>
  )
}
