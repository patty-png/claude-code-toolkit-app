import Link from 'next/link'

type TrendingItem = {
  slug: string
  name: string
  publisher: string | null
  github_stars: number | null
  blurb: string
}

function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function TrendingStrip({ items }: { items: TrendingItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <section className="trending-strip">
      <div className="trending-head">
        <h3>Most starred right now</h3>
        <Link href="/explore?sort=stars" className="trending-viewall">View all →</Link>
      </div>
      <div className="trending-row">
        {items.map((t) => (
          <Link key={t.slug} href={`/explore/${t.slug}`} className="trending-pill">
            <div className="trending-pill-top">
              <strong>{t.name}</strong>
              {t.github_stars !== null && t.github_stars > 0 && (
                <span className="trending-stars">
                  <span className="stat-icon">★</span>{compact(t.github_stars)}
                </span>
              )}
            </div>
            {t.publisher && <div className="trending-publisher">{t.publisher}</div>}
          </Link>
        ))}
      </div>
    </section>
  )
}
