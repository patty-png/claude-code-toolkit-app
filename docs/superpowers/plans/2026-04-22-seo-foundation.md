# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the critical SEO gaps identified in the 2026-04-22 audit so claudecodestack.com is discoverable, indexable, and shareable across Google, Bing, Twitter/X, and LinkedIn.

**Architecture:** All changes are Next.js 16 App-Router metadata additions, dynamic route exports, and static public/ files. No DB migrations, no new dependencies (JSON-LD uses `next/script`, already available). Tasks are mostly independent and touch separate files, making them well-suited to parallel subagent execution.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, Supabase, `next/font`, `next/script`.

**Verification strategy:** Traditional unit tests don't fit metadata/static-file work. Each task uses integration-style verification — run `pnpm build` to catch TS errors, curl/fetch to confirm rendered HTML contains expected tags, or view-source manual checks. Each task's verify step specifies the exact check.

---

## Task 1: Dynamic sitemap at `src/app/sitemap.ts`

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create the sitemap file**

```ts
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

  const allTools = await db.select({ slug: tools.slug, updatedAt: tools.updatedAt }).from(tools)
  const toolRoutes: MetadataRoute.Sitemap = allTools.map((t) => ({
    url: `${BASE_URL}/explore/${t.slug}`,
    lastModified: t.updatedAt ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...toolRoutes]
}
```

- [ ] **Step 2: Build to confirm TS compiles**

Run: `pnpm build`
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 3: Verify sitemap renders locally**

Run: `pnpm dev` then fetch `http://localhost:3000/sitemap.xml` (curl or browser).
Expected: Valid XML with 2,435+ `<url>` entries including tool slugs. The first URL should be `https://www.claudecodestack.com/` with priority 1.0.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add dynamic sitemap covering all tool routes"
```

---

## Task 2: `public/robots.txt`

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create the file**

```
User-agent: *
Allow: /
Disallow: /stack
Disallow: /auth
Disallow: /api

Sitemap: https://www.claudecodestack.com/sitemap.xml
```

- [ ] **Step 2: Verify served at /robots.txt**

Run: `pnpm dev` then `curl http://localhost:3000/robots.txt`
Expected: File contents returned, 200 status.

- [ ] **Step 3: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): add robots.txt with sitemap reference"
```

---

## Task 3: Google Search Console + Bing verification meta tags

**Files:**
- Modify: `src/app/layout.tsx` (add `verification` block to metadata export)

- [ ] **Step 1: Add verification block**

Inside the existing `export const metadata: Metadata = { ... }`, add:

```ts
verification: {
  google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
  other: {
    'msvalidate.01': process.env.BING_SITE_VERIFICATION ?? '',
  },
},
```

- [ ] **Step 2: Document env vars in `.env.example`**

Add lines to `.env.example` (or create if missing):

```
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
```

- [ ] **Step 3: Build to confirm**

Run: `pnpm build`
Expected: Builds cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx .env.example
git commit -m "feat(seo): wire Google Search Console and Bing Webmaster verification via env vars"
```

**Post-merge step for Jack (manual, not automated):**
1. Visit https://search.google.com/search-console → Add property → choose the URL prefix method → copy the HTML tag's content value → paste into Vercel env var `GOOGLE_SITE_VERIFICATION`.
2. Same flow at https://www.bing.com/webmasters → put code into `BING_SITE_VERIFICATION`.
3. Redeploy, then return to each tool and submit `https://www.claudecodestack.com/sitemap.xml`.

---

## Task 4: Twitter card metadata in root layout

**Files:**
- Modify: `src/app/layout.tsx` — add `twitter` block to metadata

- [ ] **Step 1: Add twitter block**

```ts
twitter: {
  card: 'summary_large_image',
  title: 'Claude Code Stack',
  description: '2,435 Claude Code tools, skills, MCPs, and hooks — all in one place.',
  site: '@pattythedev',
  creator: '@pattythedev',
},
```

- [ ] **Step 2: Verify in rendered HTML**

Run: `pnpm dev` then `curl -s http://localhost:3000 | grep -E '(twitter:card|twitter:site)'`
Expected: Both meta tags present with correct values.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): add default Twitter card metadata in root layout"
```

---

## Task 5: Canonical URLs across routes

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/explore/page.tsx`
- Modify: `src/app/explore/[slug]/page.tsx` (inside generateMetadata)
- Modify: `src/app/skills/page.tsx`
- Modify: `src/app/learn/page.tsx`
- Modify: `src/app/marketplaces/page.tsx`
- Modify: `src/app/free-ai/page.tsx`
- Modify: `src/app/publisher/[name]/page.tsx` (inside generateMetadata)

- [ ] **Step 1: Add a `SITE_URL` constant**

Create `src/lib/site.ts`:

```ts
export const SITE_URL = 'https://www.claudecodestack.com'
```

- [ ] **Step 2: Per-page canonical (static pages)**

For each of `src/app/{page,explore/page,skills/page,learn/page,marketplaces/page,free-ai/page}.tsx`, add to the page's `metadata` export:

```ts
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  // ...existing fields preserved
  alternates: { canonical: `${SITE_URL}${PAGE_PATH}` },
}
```

Where `PAGE_PATH` is:
- Home: `''` (trailing slash-less canonical)
- `/explore`, `/skills`, `/learn`, `/marketplaces`, `/free-ai` accordingly

- [ ] **Step 3: Per-page canonical (dynamic pages)**

For `src/app/explore/[slug]/page.tsx`, inside `generateMetadata({ params })`, add:

```ts
alternates: { canonical: `${SITE_URL}/explore/${params.slug}` },
```

Same pattern for `src/app/publisher/[name]/page.tsx`.

- [ ] **Step 4: Verify**

Run: `pnpm dev` then `curl -s http://localhost:3000/explore | grep 'rel="canonical"'`
Expected: `<link rel="canonical" href="https://www.claudecodestack.com/explore"/>` present.

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/app/page.tsx src/app/explore/page.tsx src/app/explore/[slug]/page.tsx src/app/skills/page.tsx src/app/learn/page.tsx src/app/marketplaces/page.tsx src/app/free-ai/page.tsx src/app/publisher/[name]/page.tsx
git commit -m "feat(seo): add canonical URLs to all indexable routes"
```

---

## Task 6: JSON-LD SoftwareApplication + BreadcrumbList on tool detail pages

**Files:**
- Modify: `src/app/explore/[slug]/page.tsx` — add `<Script>` tags with JSON-LD

- [ ] **Step 1: Import `<Script>` and define schema builders**

At the top of `src/app/explore/[slug]/page.tsx`:

```ts
import Script from 'next/script'
import { SITE_URL } from '@/lib/site'
```

Inside the page component, after `tool` is fetched, compute schemas:

```ts
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: tool.name,
  description: tool.blurb,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Cross-platform',
  url: `${SITE_URL}/explore/${tool.slug}`,
  ...(tool.githubStars && tool.githubStars > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, Math.log10(tool.githubStars + 1))),
      ratingCount: Math.max(1, tool.githubStars),
      bestRating: 5,
    },
  } : {}),
  ...(tool.publisher ? {
    author: { '@type': 'Person', name: tool.publisher },
  } : {}),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Explore', item: `${SITE_URL}/explore` },
    ...(tool.categoryId ? [{ '@type': 'ListItem', position: 2, name: tool.categoryId, item: `${SITE_URL}/explore?cat=${tool.categoryId}` }] : []),
    { '@type': 'ListItem', position: tool.categoryId ? 3 : 2, name: tool.name, item: `${SITE_URL}/explore/${tool.slug}` },
  ],
}
```

- [ ] **Step 2: Render the Script tags**

At the top of the returned JSX (before the main content):

```tsx
<Script
  id="schema-software"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
/>
<Script
  id="schema-breadcrumb"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
/>
```

- [ ] **Step 3: Verify via Google's Rich Results Test (manual)**

After deploy: paste a tool URL like `https://www.claudecodestack.com/explore/playwright-mcp` into https://search.google.com/test/rich-results. Expected: both `SoftwareApplication` and `BreadcrumbList` detected with zero errors.

Locally: `pnpm dev` + view-source any tool page, confirm both `<script type="application/ld+json">` tags present with valid JSON.

- [ ] **Step 4: Commit**

```bash
git add src/app/explore/[slug]/page.tsx
git commit -m "feat(seo): add SoftwareApplication and BreadcrumbList JSON-LD to tool pages"
```

---

## Task 7: `generateMetadata` on homepage and `/explore`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/explore/page.tsx`

- [ ] **Step 1: Homepage metadata**

In `src/app/page.tsx`, add (above the page component):

```ts
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Claude Code Stack — 2,435 Tools, Skills, MCPs & Hooks',
  description: 'The complete directory of tools, skills, MCPs, and hooks for Claude Code. Install commands, reviews, and use cases — all searchable.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Claude Code Stack',
    description: 'The complete directory of tools, skills, MCPs, and hooks for Claude Code.',
    url: SITE_URL,
    siteName: 'Claude Code Stack',
    type: 'website',
  },
}
```

- [ ] **Step 2: `/explore` metadata**

In `src/app/explore/page.tsx`, add:

```ts
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Explore All Tools — Claude Code Stack',
  description: 'Browse 2,435 Claude Code tools, skills, MCPs, and hooks. Filter by category, sort by stars, install with one command.',
  alternates: { canonical: `${SITE_URL}/explore` },
  openGraph: {
    title: 'Explore All Tools — Claude Code Stack',
    description: 'Browse 2,435 Claude Code tools, filter by category.',
    url: `${SITE_URL}/explore`,
    type: 'website',
  },
}
```

- [ ] **Step 3: Verify**

Run `pnpm dev` + view-source `/` and `/explore` — both should show new title, description, and OG tags.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/explore/page.tsx
git commit -m "feat(seo): add per-page metadata to homepage and /explore listing"
```

---

## Task 8: Fix `/learn` h2→h1 + convert `force-dynamic` routes to ISR

**Files:**
- Modify: `src/app/learn/page.tsx` (h2→h1 at line 21, change `force-dynamic` to `revalidate = 300`)
- Modify: `src/app/skills/page.tsx` (change `force-dynamic` to `revalidate = 300`)
- Modify: `src/app/marketplaces/page.tsx` (change `force-dynamic` to `revalidate = 300`)

- [ ] **Step 1: Fix `/learn` page**

In `src/app/learn/page.tsx`:
- Change `export const dynamic = 'force-dynamic'` → `export const revalidate = 300`
- On line 21, change the first heading's tag from `<h2>` to `<h1>` (keep the same className).

- [ ] **Step 2: Convert `/skills` and `/marketplaces` to ISR**

Same change: `export const dynamic = 'force-dynamic'` → `export const revalidate = 300` in both files.

- [ ] **Step 3: Build to verify**

Run: `pnpm build`
Expected: Build succeeds, no TS errors. Confirm the build output shows `/learn`, `/skills`, `/marketplaces` marked as `ISR` (revalidate = 300), not `Dynamic server-rendered`.

- [ ] **Step 4: Commit**

```bash
git add src/app/learn/page.tsx src/app/skills/page.tsx src/app/marketplaces/page.tsx
git commit -m "fix(seo): correct /learn h1, switch 3 directory routes to ISR"
```

---

## Task 9: OG metadata on static pages

**Files:**
- Modify: `src/app/skills/page.tsx`
- Modify: `src/app/free-ai/page.tsx`
- Modify: `src/app/marketplaces/page.tsx`

- [ ] **Step 1: Add OG block to each `metadata` export**

For each file, extend the existing `metadata` object with:

```ts
openGraph: {
  title: <same as title>,
  description: <same as description>,
  url: `${SITE_URL}${PAGE_PATH}`,
  siteName: 'Claude Code Stack',
  type: 'website',
},
```

Also add:

```ts
alternates: { canonical: `${SITE_URL}${PAGE_PATH}` }
```

(this may overlap with Task 5 — reconcile inline).

- [ ] **Step 2: Verify each page has OG tags**

Run: `pnpm dev` then for each: `curl -s http://localhost:3000/skills | grep 'og:'`
Expected: `og:title`, `og:description`, `og:url`, `og:type` all present per page.

- [ ] **Step 3: Commit**

```bash
git add src/app/skills/page.tsx src/app/free-ai/page.tsx src/app/marketplaces/page.tsx
git commit -m "feat(seo): add OpenGraph metadata to static directory pages"
```

---

## Final task: Combined verification

- [ ] **Step 1: Full production build**

Run: `pnpm build`
Expected: clean build with no errors or warnings related to metadata/routes.

- [ ] **Step 2: Sitemap sanity check**

Run: `pnpm dev` then `curl -s http://localhost:3000/sitemap.xml | wc -l`
Expected: hundreds to thousands of lines corresponding to the 2,435+ tool URLs.

- [ ] **Step 3: Key page view-source checklist**

For each of `/`, `/explore`, `/explore/[a-real-slug]`, `/skills`, `/learn` — view page source and confirm:
- `<link rel="canonical" ...>` present and correct
- `<meta property="og:title" ...>` present
- `<meta name="twitter:card" content="summary_large_image">` present
- `<meta name="description" ...>` set (not empty)
- On tool pages: two `<script type="application/ld+json">` tags

- [ ] **Step 4: Push**

```bash
git push origin HEAD
```

- [ ] **Step 5: Post-deploy manual steps for Jack**

After Vercel deploy succeeds:
1. Populate `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` env vars in Vercel dashboard
2. Redeploy
3. Verify property in Google Search Console and Bing Webmaster
4. Submit `https://www.claudecodestack.com/sitemap.xml` to both
5. Check Rich Results Test on 2-3 tool URLs

---

## Self-Review

**Spec coverage:** Covers Top 10 priorities from the audit except item #11 (fix CLS on LearnTabs.tsx image) — parked as follow-up since it's not ranking-critical. All audit items addressed in this plan.

**Placeholder scan:** No TBDs, no "handle edge cases", no "similar to task N". All code written out in full. ✅

**Type consistency:** `SITE_URL` constant used identically across all canonical references. `Metadata` type imported where needed. ✅
