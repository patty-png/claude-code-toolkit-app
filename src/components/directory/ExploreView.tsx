'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ToolCard, ToolCardSkeleton, type Tool } from './ToolCard'

type Category = { id: string; label: string; short_label: string | null; emoji: string | null }
type Page = { items: Tool[]; nextCursor: string | null; count: number }

type SortKey = 'stars' | 'installs' | 'recent' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = {
  stars: 'Most starred',
  installs: 'Most installed',
  recent: 'Newest',
  alpha: 'A–Z',
}

export function ExploreView({
  initialTools,
  categories,
  totalCount,
}: {
  initialTools: Tool[]
  categories: Category[]
  totalCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL-synced state
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [cat, setCat] = useState(searchParams.get('cat') ?? 'all')
  const [sort, setSort] = useState<SortKey>((searchParams.get('sort') as SortKey) ?? 'stars')

  // Debounce query so we don't re-query on every keystroke
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220)
    return () => clearTimeout(t)
  }, [query])

  // Sync URL without triggering re-render
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (cat && cat !== 'all') params.set('cat', cat)
    if (sort !== 'stars') params.set('sort', sort)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [debouncedQuery, cat, sort, pathname, router])

  const fetchPage = useCallback(
    async ({ pageParam = null as string | null }) => {
      const url = new URL('/api/tools', window.location.origin)
      if (debouncedQuery) url.searchParams.set('q', debouncedQuery)
      if (cat && cat !== 'all') url.searchParams.set('cat', cat)
      url.searchParams.set('sort', sort)
      url.searchParams.set('limit', '50')
      if (pageParam) url.searchParams.set('cursor', pageParam)
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as Page
    },
    [debouncedQuery, cat, sort]
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['tools', { q: debouncedQuery, cat, sort }],
    queryFn: fetchPage,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData:
      debouncedQuery === '' && cat === 'all' && sort === 'stars' && initialTools.length > 0
        ? { pages: [{ items: initialTools, nextCursor: null, count: initialTools.length }], pageParams: [null] }
        : undefined,
  })

  // Force initial fetch when filter changes away from "default stars all"
  useEffect(() => {
    // initialData only applies to the default query. Anything else needs fresh data.
    if (debouncedQuery !== '' || cat !== 'all' || sort !== 'stars') {
      refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, cat, sort])

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

  // IntersectionObserver for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !isFetchingNextPage) fetchNextPage() },
      { rootMargin: '400px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const isFiltered = !!debouncedQuery || cat !== 'all' || sort !== 'stars'
  const activeCategory = categories.find((c) => c.id === cat)

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
              placeholder={`Search ${totalCount.toLocaleString()} tools — try 'postgres', 'video', 'figma'…`}
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="clear-btn">
                ×
              </button>
            )}
          </div>

          <div className="filter-row">
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

            {!debouncedQuery && (
              <div className="sort-select">
                <label>Sort</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>{SORT_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">The directory</div>
        <h2 className="serif">
          {isFiltered ? (
            <>
              {debouncedQuery ? <><em>{items.length}</em> match{items.length === 1 ? '' : 'es'}</> : <>{activeCategory?.label ?? 'All'}</>}
              {activeCategory && !debouncedQuery && <> — {items.length.toLocaleString()} tools</>}
              {debouncedQuery && activeCategory && <> in <em>{activeCategory.label}</em></>}
            </>
          ) : (
            <>{totalCount.toLocaleString()} tools, <em>categorised.</em></>
          )}
        </h2>
      </div>

      {isLoading ? (
        <div className="directory">
          {Array.from({ length: 12 }).map((_, i) => <ToolCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">∅</div>
          <div>No matches. Try a shorter search or clear the filter.</div>
        </div>
      ) : (
        <>
          <div className="directory">
            {items.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>

          {hasNextPage && (
            <div ref={sentinelRef} className="load-more-sentinel">
              {isFetchingNextPage ? 'Loading more…' : 'Scroll for more'}
            </div>
          )}
          {!hasNextPage && items.length > 50 && (
            <div className="load-more-end">
              — End of list · {items.length.toLocaleString()} tools shown —
            </div>
          )}
        </>
      )}
    </>
  )
}
