'use client'

import { useState, useTransition } from 'react'
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
  const [, startTransition] = useTransition()
  const router = useRouter()

  const activeProject = projects.find(p => p.id === activeId) ?? null

  const filteredTools = query
    ? allTools.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.blurb.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : allTools.slice(0, 30)

  const usedToolIds = new Set(items.map(i => i.tool_id).filter(Boolean))

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
                    placeholder="Search tools…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setQuery('') }}>Done</button>
                </div>
                <div className="add-tool-results">
                  {filteredTools.map(t => {
                    const already = usedToolIds.has(t.id)
                    return (
                      <div key={t.id} className={`add-tool-row ${already ? 'already' : ''}`}>
                        <div>
                          <strong>{t.name}</strong>{t.tag && <span className="row-tag">{t.tag}</span>}
                          <p>{t.blurb}</p>
                        </div>
                        {already ? (
                          <span className="row-status">✓ Added</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => startTransition(async () => { await addToolToProject(activeProject.id, t.id); router.refresh() })}
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
        <div>
          <h3 className="stack-item-name">{name}</h3>
          {item.tool?.blurb && <p className="stack-item-blurb">{item.tool.blurb}</p>}
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
