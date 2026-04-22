'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Segment = { cls: string; text: string }

const DEMOS: Record<string, Segment[]> = {
  intro: [
    { cls: 't-dim', text: '// Click a node to see Claude Code in action\n' },
    { cls: 't-prompt', text: '$ ' },
    { cls: 't-cmd', text: 'claude ' },
    { cls: 't-accent', text: '--help\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: "Anthropic's agentic CLI\n" },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Extensible via MCP, skills, hooks, plugins\n' },
    { cls: 't-ok', text: '✓ Ready.\n' },
  ],
  mcp: [
    { cls: 't-prompt', text: '$ ' },
    { cls: 't-cmd', text: 'claude mcp add ' },
    { cls: 't-accent', text: 'github\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Fetching github-mcp-server…\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Registering 51 tools\n' },
    { cls: 't-ok', text: '✓ Connected. ' }, { cls: 't-dim', text: '/mcp to browse.\n' },
  ],
  skills: [
    { cls: 't-prompt', text: '$ ' },
    { cls: 't-cmd', text: 'claude skill create ' },
    { cls: 't-accent', text: 'pr-review\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Scaffolding .claude/skills/pr-review/\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Writing SKILL.md\n' },
    { cls: 't-ok', text: '✓ Loaded. ' }, { cls: 't-dim', text: 'Invoke via /pr-review.\n' },
  ],
  subagents: [
    { cls: 't-prompt', text: '$ ' },
    { cls: 't-cmd', text: 'Spawning ' },
    { cls: 't-accent', text: 'code-reviewer' },
    { cls: 't-cmd', text: ' agent…\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Analyzing 23 files in parallel\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: '3 issues, 12 suggestions\n' },
    { cls: 't-ok', text: '✓ Report ready.\n' },
  ],
  hooks: [
    { cls: 't-dim', text: '[hook] ' }, { cls: 't-accent', text: 'pre-tool-use ' }, { cls: 't-dim', text: '(Bash)\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-cmd', text: 'intercepted: ' }, { cls: 't-warn', text: 'rm -rf node_modules\n' },
    { cls: 't-warn', text: '⚠ blocked by policy\n' },
    { cls: 't-ok', text: '✓ Safe. ' }, { cls: 't-dim', text: 'Action cancelled.\n' },
  ],
  plugins: [
    { cls: 't-prompt', text: '$ ' },
    { cls: 't-cmd', text: 'claude plugin install ' },
    { cls: 't-accent', text: 'linear\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: 'Adding 14 slash commands\n' },
    { cls: 't-arrow', text: '→ ' }, { cls: 't-dim', text: '/linear-issue  /linear-comment  …\n' },
    { cls: 't-ok', text: '✓ Installed.\n' },
  ],
  claudemd: [
    { cls: 't-dim', text: '# CLAUDE.md\n' },
    { cls: 't-accent', text: '## Coding Style\n' },
    { cls: 't-cmd', text: '- Python 3.9+ with type hints\n' },
    { cls: 't-cmd', text: '- snake_case vars, PascalCase classes\n' },
    { cls: 't-accent', text: '## Rules\n' },
    { cls: 't-cmd', text: '- Never commit .env files\n' },
    { cls: 't-ok', text: '✓ Loaded into every session.\n' },
  ],
}

const NODES = [
  {
    key: 'mcp', label: 'MCP', desc: 'External tools & data',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
        <rect x="7" y="7" width="10" height="10" rx="2" />
      </svg>
    ),
  },
  {
    key: 'skills', label: 'Skills', desc: 'Reusable instruction sets',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    key: 'subagents', label: 'Subagents', desc: 'Parallel specialists',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="4" r="1.8" />
        <circle cx="12" cy="20" r="1.8" />
        <circle cx="4" cy="12" r="1.8" />
        <circle cx="20" cy="12" r="1.8" />
        <path d="M12 10V6M12 18v-4M10 12H6M18 12h-4" />
      </svg>
    ),
  },
  {
    key: 'hooks', label: 'Hooks', desc: 'Event automation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v6a4 4 0 0 0 8 0V6a3 3 0 0 0-6 0" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
  {
    key: 'plugins', label: 'Plugins', desc: 'Bundle-and-share kits',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v6H3v4a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-4h-6V2z" />
      </svg>
    ),
  },
  {
    key: 'claudemd', label: 'CLAUDE.md', desc: 'Project memory & rules',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
]

export function TerminalStage({
  toolCount = 2435,
  categoryCount = 7,
  publisherCount = 862,
}: {
  toolCount?: number
  categoryCount?: number
  publisherCount?: number
} = {}) {
  const [active, setActive] = useState<string>('intro')
  const bodyRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    if (timerRef.current) clearTimeout(timerRef.current)
    body.innerHTML = ''
    const segments = DEMOS[active] || DEMOS.intro
    let segIdx = 0, charIdx = 0
    let currentSpan: HTMLSpanElement | null = null
    const cursor = document.createElement('span')
    cursor.className = 'cursor'
    body.appendChild(cursor)

    function step() {
      if (!body || segIdx >= segments.length) return
      const seg = segments[segIdx]
      if (charIdx === 0) {
        currentSpan = document.createElement('span')
        currentSpan.className = seg.cls || ''
        body.insertBefore(currentSpan, cursor)
      }
      if (currentSpan) currentSpan.textContent = (currentSpan.textContent ?? '') + seg.text[charIdx]
      charIdx++
      if (charIdx >= seg.text.length) { segIdx++; charIdx = 0 }
      const ch = seg.text[charIdx - 1]
      const delay = ch === '\n' ? 60 : (ch === ' ' ? 12 : 16 + Math.random() * 12)
      timerRef.current = setTimeout(step, delay)
    }
    const start = setTimeout(step, 200)
    return () => { clearTimeout(start); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active])

  return (
    <div className="view-landing">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark">&gt;_</span>
          <span>Claude Code Stack</span>
        </div>
        <div className="landing-header-meta">
          <Link href="/explore">Explore</Link>
          <Link href="/marketplaces">Marketplaces</Link>
          <Link href="/free-ai">Free AI</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/stack">My Stack</Link>
        </div>
      </header>

      <div className="landing-hero">
        {/* LEFT: editorial */}
        <div className="hero-copy">
          <div className="hero-kicker"><span className="pulse"></span> A curated command deck</div>
          <h1>Every Claude Code tool, <em>in one place.</em></h1>
          <p className="lede">
            A searchable directory of MCPs, skills, subagents, hooks, plugins, and SaaS integrations — with install
            commands on every card and a built-in project manager to track your stack.
          </p>
          <div className="hero-stats">
            <span className="hero-stat"><strong>{toolCount.toLocaleString()}</strong> tools</span>
            <span className="hero-stat"><strong>{publisherCount.toLocaleString()}</strong> publishers</span>
            <span className="hero-stat"><strong>{categoryCount}</strong> categories</span>
          </div>
          <div className="hero-actions">
            <Link href="/explore" className="hero-cta">
              Explore the stack <span className="arrow">→</span>
            </Link>
            <a className="hero-ghost" href="https://github.com/patty-png/claude-code-toolkit-app" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.95 3.2 9.14 7.64 10.62.56.1.77-.24.77-.54v-2.1c-3.11.68-3.76-1.33-3.76-1.33-.5-1.3-1.24-1.65-1.24-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.4-1.22.72-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3.01-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15.9-.25 1.86-.37 2.82-.38.96.01 1.93.13 2.82.38 2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.01 0 4.29-2.61 5.24-5.1 5.51.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.78.54 4.43-1.48 7.63-5.67 7.63-10.62C23.25 5.48 18.27.5 12 .5z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* RIGHT: stack card + inline terminal */}
        <div className="hero-visual">
          <div className="stack-card">
            <div className="stack-card-head">
              <span>Building blocks</span>
              <span className="hint">↓ click to preview</span>
            </div>
            <div className="stack-list">
              {NODES.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  className={`node ${active === n.key ? 'active' : ''}`}
                  onClick={() => setActive(n.key)}
                  aria-label={`${n.label} demo`}
                >
                  <span className="node-icon">{n.icon}</span>
                  <span className="node-text">
                    <span className="node-label">{n.label}</span>
                    <span className="node-desc">{n.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="terminal">
              <div className="terminal-bar">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="term-title">claude-code</span>
              </div>
              <div className="terminal-body" ref={bodyRef} aria-live="polite" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
