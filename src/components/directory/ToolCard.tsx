'use client'

import { useState } from 'react'

type Tool = {
  id: number
  slug: string
  name: string
  category_id: string | null
  tag: string | null
  blurb: string
  url: string | null
  install_command: string | null
  is_featured?: boolean
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

  return (
    <article
      className="dir-card"
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
        <p className="dir-card-blurb">{tool.blurb}</p>
      </div>

      {open && (
        <div className="dir-card-expand" onClick={(e) => e.stopPropagation()}>
          {tool.install_command && (
            <div className="install-block">
              <div className="install-label">Install</div>
              <pre className="install-cmd">
                <code>{tool.install_command}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={copy}
                  aria-label="Copy install command"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </pre>
            </div>
          )}
          {tool.url && (
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="dir-card-link">
              Open project ↗
            </a>
          )}
        </div>
      )}
    </article>
  )
}
