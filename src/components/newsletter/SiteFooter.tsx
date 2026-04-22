import { FooterSignup } from './FooterSignup'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <FooterSignup />
        <div className="site-footer__meta">
          <span className="site-footer__credit">
            Built by{' '}
            <a href="https://instagram.com/pattythedev" target="_blank" rel="noreferrer">
              patty dev
            </a>
          </span>
          <span className="site-footer__sep" aria-hidden>
            ·
          </span>
          <a href="https://github.com/patty-png" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
