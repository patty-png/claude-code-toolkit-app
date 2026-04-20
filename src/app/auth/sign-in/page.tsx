import { SignInForm } from '@/components/stack/SignInForm'
import Link from 'next/link'

export const metadata = { title: 'Sign in · Claude Code Toolkit' }

export default function SignInPage() {
  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">Sign <em>in</em></div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <main style={{ maxWidth: 420, paddingTop: 64 }}>
        <div className="section-head">
          <div className="section-num">Access your stack</div>
          <h2 className="serif">Sign in to <em>sync.</em></h2>
          <p className="section-lede">
            Save your stack across devices. Credentials stored privately under your account.
            No password needed — use GitHub or a magic email link.
          </p>
        </div>
        <SignInForm />
      </main>
    </div>
  )
}
