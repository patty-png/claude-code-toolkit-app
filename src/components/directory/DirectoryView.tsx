'use client'

import { useEffect, useState, useCallback } from 'react'
import { ToolCard } from './ToolCard'

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

type Category = { id: string; label: string; short_label: string | null; emoji: string | null }

export function DirectoryView({
  initialTools,
  categories,
}: {
  initialTools: Tool[]
  categories: Category[]
}) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [results, setResults] = useState<Tool[]>(initialTools)
  const [loading, setLoading] = useState(false)

  const fetchResults = useCallback(async (q: string, c: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/search', window.location.origin)
      if (q) url.searchParams.set('q', q)
      if (c && c !== 'all') url.searchParams.set('cat', c)
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.results ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!query && cat === 'all') {
      setResults(initialTools)
      return
    }
    const t = setTimeout(() => fetchResults(query, cat), 180)
    return () => clearTimeout(t)
  }, [query, cat, fetchResults, initialTools])

  return (
    <>
      <div className="searchbar">
        <div className="searchbar-inner">
          <div className="search-field">
            <span className="icon">⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — try 'video', 'postgres', 'voice', 'figma'…"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="clear-btn"
              >
                ×
              </button>
            )}
          </div>
          <div className="chips">
            <button
              className={`chip ${cat === 'all' ? 'active' : ''}`}
              onClick={() => setCat('all')}
              type="button"
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${cat === c.id ? 'active' : ''}`}
                onClick={() => setCat(c.id)}
                type="button"
              >
                {c.short_label ?? c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">The directory</div>
        <h2 className="serif">
          {query || cat !== 'all' ? (
            <>
              <em>{results.length}</em> match{results.length === 1 ? '' : 'es'}
              {cat !== 'all' && (
                <> in <em>{categories.find((c) => c.id === cat)?.label}</em></>
              )}
            </>
          ) : (
            <>Two hundred and eighty-four, <em>categorised.</em></>
          )}
        </h2>
        {loading && <p className="section-lede">Searching…</p>}
      </div>

      <div className="directory">
        {results.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">∅</div>
            <div>No matches. Try a shorter search or clear the filter.</div>
          </div>
        ) : (
          results.map((tool) => <ToolCard key={tool.id} tool={tool} />)
        )}
      </div>
    </>
  )
}
