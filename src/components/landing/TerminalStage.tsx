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
  { key: 'mcp', label: 'MCP', angle: -90 },
  { key: 'skills', label: 'Skills', angle: -30 },
  { key: 'subagents', label: 'Subagents', angle: 30 },
  { key: 'hooks', label: 'Hooks', angle: 90 },
  { key: 'plugins', label: 'Plugins', angle: 150 },
  { key: 'claudemd', label: 'CLAUDE.md', angle: 210 },
]

export function TerminalStage() {
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
          <span>Claude Code Toolkit</span>
        </div>
        <nav className="landing-nav">
          <Link href="/explore">Explore</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/stack">My Stack</Link>
        </nav>
      </header>

      <div className="landing-stage-wrap">
        <div className="landing-stage">
          <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {NODES.map((n) => {
              const r = 44
              const rad = (n.angle * Math.PI) / 180
              const x2 = 50 + Math.cos(rad) * r
              const y2 = 50 + Math.sin(rad) * r
              return (
                <line
                  key={n.key}
                  className={`line ${active === n.key ? 'active' : ''}`}
                  x1="50" y1="50" x2={x2} y2={y2}
                />
              )
            })}
          </svg>

          <div className="orbit">
            {NODES.map((n) => (
              <button
                key={n.key}
                type="button"
                className={`node ${active === n.key ? 'active' : ''}`}
                style={{ ['--a' as string]: `${n.angle}deg`, ['--r' as string]: '44%' }}
                onClick={() => setActive(n.key)}
                aria-label={`${n.label} demo`}
              >
                <span className="node-label">{n.label}</span>
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

      <div className="landing-cta-wrap">
        <h1 className="display">Your Claude Code <em>command deck.</em></h1>
        <p className="lede">
          284 curated MCPs, skills, agents, and SaaS integrations — searchable, with one-line install commands.
          Save your stack, track credentials per project, access from anywhere.
        </p>
        <Link href="/explore" className="hero-cta">
          Explore the stack <span className="arrow">→</span>
        </Link>
        <div className="landing-hint">Click any node above to see it in action</div>
      </div>
    </div>
  )
}
