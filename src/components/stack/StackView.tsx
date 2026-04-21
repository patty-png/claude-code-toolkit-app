'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createProject,
  deleteProject,
  addToolToProject,
  addCustomTool,
  removeStackItem,
  updateFields,
  signOut,
} from '@/app/stack/actions'

type PickerItem = {
  source: 'tools' | 'free_ai'
  id: number
  name: string
  blurb: string
  url: string | null
  category_id: string | null
  tag: string | null
  publisher: string | null
  github_stars: number | null
  install_command: string | null
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'mcp',     label: 'MCP' },
  { id: 'skill',   label: 'Skills' },
  { id: 'agent',   label: 'Agents' },
  { id: 'auto',    label: 'Hooks' },
  { id: 'tool',    label: 'Editors' },
  { id: 'saas',    label: 'SaaS' },
  { id: 'free_ai', label: 'Free AI' },
]

type Project = { id: string; name: string; description: string | null; created_at: string | null }
type Tool = { id: number; name: string; tag: string | null; blurb: string; url?: string | null; install_command?: string | null; category_id: string | null }
type StackItem = {
  id: string
  project_id: string
  tool_id: number | null
  custom_tool_name: string | null
  custom_tool_url: string | null
  fields: Record<string, string>
  tool: Tool | null
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  apiKey: 'API key',
  url: 'URL / Endpoint',
  notes: 'Notes',
}
const FIELD_ORDER = ['email', 'username', 'password', 'apiKey', 'url', 'notes']

export function StackView({
  projects,
  activeId,
  items,
  allTools,
}: {
  projects: Project[]
  activeId: string | null
  items: StackItem[]
  allTools: Tool[]
}) {
  const [showNew, setShowNew] = useState(projects.length === 0)
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [pickerCat, setPickerCat] = useState('all')
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const activeProject = projects.find(p => p.id === activeId) ?? null

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220)
    return () => clearTimeout(t)
  }, [query])

  // Fetch picker results when open + filter/query changes
  useEffect(() => {
    if (!showAdd) return
    const abort = new AbortController()
    setLoading(true)
    const url = new URL('/api/stack-picker', window.location.origin)
    if (debouncedQuery) url.searchParams.set('q', debouncedQuery)
    if (pickerCat && pickerCat !== 'all') url.searchParams.set('cat', pickerCat)
    url.searchParams.set('limit', '40')
    fetch(url, { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => setPickerItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => abort.abort()
  }, [showAdd, debouncedQuery, pickerCat])

  // Track already-added identifiers (compound key so free_ai + tools don't collide)
  const addedKey = (s: 'tools' | 'free_ai', id: number) => `${s}:${id}`
  const usedKeys = new Set<string>()
  items.forEach((i) => {
    if (i.tool_id) usedKeys.add(addedKey('tools', i.tool_id))
    const src = (i.fields as any)?.__source
    const sid = (i.fields as any)?.__source_id
    if (src === 'free_ai' && sid) usedKeys.add(addedKey('free_ai', sid))
  })

  const handleAdd = (p: PickerItem) => {
    if (!activeProject) return
    startTransition(async () => {
      if (p.source === 'tools') {
        await addToolToProject(activeProject.id, p.id)
      } else {
        await addCustomTool(activeProject.id, p.name, p.url, {
          blurb: p.blurb,
          source: 'free_ai',
          source_id: p.id,
        })
      }
      router.refresh()
    })
  }

  return (
    <div className="stack-layout">
      {/* Sidebar — projects */}
      <aside className="stack-sidebar">
        <div className="stack-sidebar-head">
          <h3>Projects</h3>
          <button type="button" className="btn-icon" onClick={() => setShowNew(s => !s)} aria-label="New project">+</button>
        </div>

        {showNew && (
          <form
            className="new-project-form"
            action={async (fd) => {
              await createProject(fd)
              setShowNew(false)
              router.refresh()
            }}
          >
            <input name="name" placeholder="Project name" required autoFocus />
            <input name="description" placeholder="Short description (optional)" />
            <div className="new-project-actions">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </form>
        )}

        <ul className="project-list">
          {projects.map(p => (
            <li key={p.id} className={p.id === activeId ? 'active' : ''}>
              <Link href={`/stack?project=${p.id}`}>
                <span className="project-name">{p.name}</span>
                {p.description && <span className="project-desc">{p.description}</span>}
              </Link>
            </li>
          ))}
          {projects.length === 0 && !showNew && (
            <li className="empty-projects">No projects yet. Click + to create one.</li>
          )}
        </ul>

        <form action={signOut} className="sign-out-form">
          <button type="submit" className="btn-ghost">Sign out</button>
        </form>
      </aside>

      {/* Main — active project */}
      <section className="stack-main">
        {!activeProject ? (
          <div className="stack-empty">
            <div className="empty-icon">✦</div>
            <h2>Start your first project</h2>
            <p>Create a project to save tools with their credentials, API keys, and notes.</p>
          </div>
        ) : (
          <>
            <div className="stack-main-head">
              <div>
                <h2 className="serif">{activeProject.name}</h2>
                {activeProject.description && <p className="section-lede">{activeProject.description}</p>}
              </div>
              <div className="stack-actions">
                <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>+ Add tool</button>
                <button
                  type="button"
                  className="btn-ghost danger"
                  onClick={() => {
                    if (confirm(`Delete project "${activeProject.name}" and all its saved tools?`)) {
                      startTransition(async () => { await deleteProject(activeProject.id); router.push('/stack') })
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {showAdd && (
              <div className="add-tool-panel">
                <div className="add-tool-head">
                  <input
                    type="text"
                    placeholder="Search everything — tools, skills, MCPs, free AI…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setQuery(''); setPickerCat('all') }}>Done</button>
                </div>

                <div className="add-tool-chips">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chip ${pickerCat === c.id ? 'active' : ''}`}
                      onClick={() => setPickerCat(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="add-tool-results">
                  {loading && pickerItems.length === 0 && (
                    <div className="row" style={{ padding: 16, color: 'var(--muted)' }}>Searching…</div>
                  )}
                  {!loading && pickerItems.length === 0 && (
                    <div className="row" style={{ padding: 16, color: 'var(--muted)' }}>
                      No matches. Try a shorter search or different category.
                    </div>
                  )}
                  {pickerItems.map(p => {
                    const already = usedKeys.has(addedKey(p.source, p.id))
                    const sourceBadge = p.source === 'free_ai' ? 'Free AI' : (p.tag || p.category_id || 'Tool')
                    return (
                      <div key={`${p.source}:${p.id}`} className={`add-tool-row ${already ? 'already' : ''}`}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div>
                            <strong>{p.name}</strong>
                            <span className="row-tag">{sourceBadge}</span>
                            {p.github_stars !== null && p.github_stars > 0 && (
                              <span className="row-tag" style={{ marginLeft: 4, color: 'var(--accent-ink)' }}>
                                ★ {p.github_stars >= 1000 ? `${(p.github_stars / 1000).toFixed(p.github_stars >= 10_000 ? 0 : 1)}k` : p.github_stars}
                              </span>
                            )}
                          </div>
                          {p.publisher && <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>{p.publisher}</div>}
                          <p>{p.blurb}</p>
                        </div>
                        {already ? (
                          <span className="row-status">✓ Added</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleAdd(p)}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="stack-items">
              {items.length === 0 ? (
                <div className="stack-empty-tools">
                  <p>No tools yet. Click <strong>+ Add tool</strong> to start building your stack.</p>
                </div>
              ) : (
                items.map(item => {
                  const name = item.tool?.name ?? item.custom_tool_name ?? 'Untitled'
                  const url = item.tool?.url ?? item.custom_tool_url ?? null
                  return (
                    <StackItemRow
                      key={item.id}
                      item={item}
                      name={name}
                      url={url}
                    />
                  )
                })
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function StackItemRow({ item, name, url }: { item: StackItem; name: string; url: string | null }) {
  // Blurb: from linked tool, or from fields.__blurb (set when added as free AI custom)
  const blurb: string | null = item.tool?.blurb ?? (item.fields as any)?.__blurb ?? null
  const sourceBadge = item.tool
    ? (item.tool.tag ?? item.tool.category_id ?? 'Tool')
    : (item.fields as any)?.__source === 'free_ai'
      ? 'Free AI'
      : 'Custom'
  const [fields, setFields] = useState(item.fields ?? {})
  const [, startTransition] = useTransition()
  const router = useRouter()

  const save = (key: string, val: string) => {
    const next = { ...fields, [key]: val }
    setFields(next)
    startTransition(async () => { await updateFields(item.id, next) })
  }

  return (
    <article className="stack-item">
      <header className="stack-item-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="stack-item-name">
            {name}
            <span className="row-tag" style={{ marginLeft: 8, fontSize: '0.62rem' }}>{sourceBadge}</span>
          </h3>
          {blurb && <p className="stack-item-blurb">{blurb}</p>}
        </div>
        <div className="stack-item-actions">
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="stack-item-link">↗</a>}
          <button
            type="button"
            className="btn-icon danger"
            aria-label="Remove"
            onClick={() => {
              if (confirm(`Remove ${name}?`)) {
                startTransition(async () => { await removeStackItem(item.id); router.refresh() })
              }
            }}
          >
            ×
          </button>
        </div>
      </header>
      <div className="stack-item-fields">
        {FIELD_ORDER.map(key => (
          <label key={key} className="field">
            <span>{FIELD_LABELS[key]}</span>
            {key === 'notes' ? (
              <textarea
                rows={2}
                defaultValue={fields[key] ?? ''}
                onBlur={(e) => save(key, e.target.value)}
              />
            ) : (
              <input
                type={key === 'password' || key === 'apiKey' ? 'password' : 'text'}
                defaultValue={fields[key] ?? ''}
                onBlur={(e) => save(key, e.target.value)}
                autoComplete="off"
              />
            )}
          </label>
        ))}
      </div>
    </article>
  )
}
