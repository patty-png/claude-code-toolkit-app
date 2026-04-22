'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  source?: string
}

export function FooterSignup({ source = 'toolkit-footer' }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormValues) {
    setStatus('submitting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'failed')
      }
      setStatus('success')
      reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="footer-signup">
      <div className="footer-signup__pitch">
        <span className="footer-signup__eyebrow">Claude Code, weekly</span>
        <p className="footer-signup__copy">
          New tools, skills, and patterns. By{' '}
          <a href="https://instagram.com/pattythedev" target="_blank" rel="noreferrer">
            patty dev
          </a>
          .
        </p>
      </div>

      {status === 'success' ? (
        <p className="footer-signup__success">Check your inbox — you&apos;re in.</p>
      ) : (
        <form className="footer-signup__form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="sr-only" htmlFor="footer-signup-email">
            Email
          </label>
          <input
            id="footer-signup-email"
            type="email"
            placeholder="you@domain.com"
            autoComplete="email"
            disabled={status === 'submitting'}
            {...register('email')}
          />
          <button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending…' : 'Subscribe'}
          </button>
          {errors.email && <span className="footer-signup__error">{errors.email.message}</span>}
          {status === 'error' && errorMsg && (
            <span className="footer-signup__error">{errorMsg}</span>
          )}
        </form>
      )}
    </div>
  )
}
