'use client'

import { useState } from 'react'

type Tool = {
  id: number
  name: string
  tag: string | null
  blurb: string
  url: string | null
  install_command: string | null
  feature_rank: number | null
}

export function TopFive({ tools }: { tools: Tool[] }) {
  return (
    <section id="top5">
      <div className="section-head">
        <div className="section-num">01 — The shortlist</div>
        <h2 className="serif">
          The five you should <em>install first.</em>
        </h2>
        <p className="section-lede">
          Ranked by real-world leverage. Click a card to reveal the install command.
        </p>
      </div>
      <div className="top5">
        {tools.map((t) => (
          <PickCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  )
}

function PickCard({ tool }: { tool: Tool }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!tool.install_command) return
    await navigator.clipboard.writeText(tool.install_command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <article className="pick">
      <div className="pick-meta">
        <span className="pick-rank">#{tool.feature_rank}</span>
        {tool.tag && <span className="pick-tag">{tool.tag}</span>}
      </div>
      <h3 className="pick-name">{tool.name}</h3>
      <p className="pick-desc">{tool.blurb}</p>
      <details className="pick-install">
        <summary>Show install command</summary>
        {tool.install_command && (
          <pre className="install-cmd">
            <code>{tool.install_command}</code>
            <button type="button" className="copy-btn" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </pre>
        )}
        {tool.url && (
          <a href={tool.url} target="_blank" rel="noopener noreferrer" className="pick-link">
            Open project ↗
          </a>
        )}
      </details>
    </article>
  )
}
