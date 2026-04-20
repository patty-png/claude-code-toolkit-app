import { SignInForm } from '@/components/stack/SignInForm'
import { Header } from '@/components/Header'

export const metadata = { title: 'Sign in · Claude Code Toolkit' }

export default function SignInPage() {
  return (
    <div className="view-app">
      <Header />

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
