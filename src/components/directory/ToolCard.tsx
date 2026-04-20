'use client'

import { useState } from 'react'

export type Tool = {
  id: number
  slug: string
  name: string
  category_id: string | null
  tag: string | null
  blurb: string
  url: string | null
  install_command: string | null
  is_featured?: boolean | null
  github_url: string | null
  github_stars: number | null
  publisher: string | null
  repo_name: string | null
  installs_count: number | null
  upvotes: number | null
}

// Compact human-readable numbers: 1234 → 1.2k, 1000000 → 1.0M
function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return ''
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function ToolCard({ tool }: { tool: Tool }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!tool.install_command) return
    await navigator.clipboard.writeText(tool.install_command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const stars = compact(tool.github_stars)
  const installs = compact(tool.installs_count)
  const votes = (tool.upvotes ?? 0) > 0 ? (tool.upvotes ?? 0) : null

  return (
    <article
      className={`dir-card ${open ? 'open' : ''}`}
      onClick={() => setOpen(!open)}
      role="button"
      aria-expanded={open}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(!open)
        }
      }}
    >
      <div className="dir-card-head">
        <div className="dir-card-title">
          <strong>{tool.name}</strong>
          {tool.tag && <span className="dir-card-tag">{tool.tag}</span>}
        </div>
        {tool.publisher && (
          <div className="dir-card-publisher">
            {tool.publisher}
            {tool.repo_name && <span>/{tool.repo_name}</span>}
          </div>
        )}
        <p className="dir-card-blurb">{tool.blurb}</p>
        {(stars || installs || votes) && (
          <div className="dir-card-stats" onClick={(e) => e.stopPropagation()}>
            {votes !== null && (
              <span className="stat stat-votes" title={`${tool.upvotes} upvotes`}>
                <span className="stat-icon">▲</span>{votes}
              </span>
            )}
            {installs && (
              <span className="stat" title={`${tool.installs_count?.toLocaleString()} installs`}>
                <span className="stat-icon">↓</span>{installs}
              </span>
            )}
            {stars && (
              <span className="stat stat-stars" title={`${tool.github_stars?.toLocaleString()} GitHub stars`}>
                <span className="stat-icon">★</span>{stars}
              </span>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="dir-card-expand" onClick={(e) => e.stopPropagation()}>
          {tool.install_command && (
            <div className="install-block">
              <div className="install-label">Install</div>
              <pre className="install-cmd">
                <code>{tool.install_command}</code>
                <button type="button" className="copy-btn" onClick={copy} aria-label="Copy install command">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </pre>
            </div>
          )}
          <div className="dir-card-actions">
            {tool.github_url && (
              <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="dir-card-link">
                GitHub ↗
              </a>
            )}
            {tool.url && tool.url !== tool.github_url && (
              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="dir-card-link">
                Website ↗
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export function ToolCardSkeleton() {
  return (
    <article className="dir-card skeleton">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-sub" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-short" />
    </article>
  )
}
