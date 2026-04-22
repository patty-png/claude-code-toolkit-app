'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/explore', label: 'Explore' },
  { href: '/skills', label: 'Skills' },
  { href: '/marketplaces', label: 'Marketplaces' },
  { href: '/free-ai', label: 'Free AI' },
  { href: '/learn', label: 'Learn' },
  { href: '/stack', label: 'My Stack' },
]

export function Header() {
  const pathname = usePathname() ?? ''

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <Link href="/" className="app-brand" aria-label="Claude Code Stack home">
          <span className="brand-mark" aria-hidden="true">&gt;_</span>
          <span className="brand-text">Claude Code <em>Stack</em></span>
        </Link>
        <nav className="app-nav">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/')) ||
              // Publisher pages should light up Marketplaces
              (item.href === '/marketplaces' && pathname.startsWith('/publisher/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
