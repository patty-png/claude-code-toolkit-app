import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { tools } from '@/lib/db/schema'

const BASE_URL = 'https://www.claudecodestack.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,            lastModified: new Date(), changeFrequency: 'daily',  priority: 1 },
    { url: `${BASE_URL}/explore`,     lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/skills`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/learn`,       lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/marketplaces`,lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/free-ai`,     lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]

  let toolRoutes: MetadataRoute.Sitemap = []
  try {
    const allTools = await db.select({ slug: tools.slug, updatedAt: tools.updatedAt }).from(tools)
    toolRoutes = allTools.map((t) => ({
      url: `${BASE_URL}/explore/${t.slug}`,
      lastModified: t.updatedAt ?? new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (err) {
    // DB unreachable at build time (e.g., missing env in local/preview) — ship static routes only.
    console.warn('[sitemap] Failed to fetch tool slugs, emitting static routes only:', err)
  }

  return [...staticRoutes, ...toolRoutes]
}
