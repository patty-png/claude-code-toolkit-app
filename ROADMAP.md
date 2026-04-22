# Roadmap — Claude Code Stack

> Source of truth for what's next. Foundational build (Phases 0–5) is complete and frozen in git tags.
> Current active work: **Phase 6** (data scaling). Updated: 2026-04-20.

---

## Already shipped (tags `phase-0` → `phase-5`)

Summary only — see `git log phase-0..phase-5` for details.

| Tag | Built |
|---|---|
| `phase-0` | Next.js 16 + Supabase + Vercel CI, brand palette, fonts |
| `phase-1` | 10-table Drizzle schema, 8 categories seeded |
| `phase-2` | 284 tools migrated from the static v18 directory |
| `phase-3` | Landing, `/explore`, ranked search, Top 5 |
| `phase-4` | `/learn` — 12 videos, 6 courses, 4-phase roadmap |
| `phase-5` | Auth + synced `/stack` with RLS-protected credentials |

**Stack today:** 284 tools · 12 videos · 6 courses · ~6 active categories · live at [www.claudecodestack.com](https://www.claudecodestack.com).

---

## 🟠 Phase 6 — Data scaling (in progress)

**Goal:** go from 284 → 1,000+ tools by systematically scraping competitor marketplaces and official Anthropic sources. See `SOURCES.md` for the target list.

**Why first:** every other improvement (detail pages, stats, UI polish) is worth more when there's real data volume. Scaling content is the highest-leverage thing we can do.

### Tasks
- [ ] **DB schema extension** — add columns: `github_url`, `github_stars`, `github_forks`, `github_last_commit`, `installs_count`, `upvotes`, `downvotes`, `publisher` (e.g. `anthropics`, `vercel-labs`, `remotion-dev`), `published_at`, `source` (which scraper found it)
- [ ] **Scraper framework** — `scripts/scrape/` folder with one script per source. Common interface: `fetch() → [{ name, slug, blurb, install, github_url, category_hint, source, ... }]`. Dedupe by normalized `github_url` + `slug`.
- [ ] **Scraper: MCP.so** — `/servers` directory, paginated, ~2,000 MCPs
- [ ] **Scraper: Smithery.ai** — registry API, already structured JSON
- [ ] **Scraper: Glama.ai** — curated MCP list
- [ ] **Scraper: Claude Code Marketplaces** — skills + marketplaces sections
- [ ] **Scraper: awesome-claude-code** (GitHub list) — parse README, extract links
- [ ] **Scraper: affaan-m/everything-claude-code** — 141k-star monorepo of skills
- [ ] **Scraper: Anthropic official skills** (`anthropics/*` GitHub orgs)
- [ ] **GitHub stats enrichment** — for every tool with `github_url`, fetch stars/forks/last_commit via GitHub GraphQL API. Nightly cron.
- [ ] **Moderation queue** — flag-for-review table; don't auto-publish scraped rows with <20 stars or blank blurbs
- [ ] **Deduplication pass** — merge duplicates, keep the richest row

### Done when
- `select count(*) from tools` ≥ 1,000
- ≥ 95% of tools have non-null `github_stars` and `github_url`
- Scraper runs are idempotent (re-runs don't create duplicates)

### Source priorities
See `SOURCES.md` for the full list. Order matters — start with highest signal/noise.

---

## 🟡 Phase 7 — Tool detail pages

**Goal:** match competitor UX. Every tool gets a rich page at `/explore/[slug]` with stats sidebar, README viewer, install command, and related tools.

### Reference (from Claude Code Marketplaces screenshot)
- Left column: editor's note (curated description), README viewer, install command
- Right sidebar: votes, installs, GitHub stars, category badges, "View on GitHub" link, comments
- Below: related tools grid (same category)

### Tasks
- [ ] **Route** `src/app/explore/[slug]/page.tsx` — static params generated at build from all tool slugs
- [ ] **Stats sidebar component** — votes, installs, GitHub stars, last updated, categories
- [ ] **README fetcher** — server action: `fetchReadmeFromGitHub(url)` → cached MD → rendered with `react-markdown` + syntax highlighting
- [ ] **Install command block** — prominent, with copy button (reuse existing)
- [ ] **Vote component** — upvote/downvote tied to `user_id`, RLS-protected table `tool_votes`
- [ ] **Related tools** — same-category tools, ranked by featured + stars, limit 6
- [ ] **Open Graph image** — dynamic per-tool `og:image` via `@vercel/og` (tool name + provider + stars)
- [ ] **Breadcrumb nav** — `Skills / [publisher] / [tool-name]` like the competitor
- [ ] **"Add to stack" button** — direct add from detail page if logged in

### Done when
- Every tool has a visitable `/explore/[slug]` page
- Stats sidebar shows live data (stars pulled from DB, updated by Phase 6 nightly job)
- Clicking a tool card on `/explore` navigates to detail page instead of inline expand

---

## 🟡 Phase 8 — UI/UX overhaul

**Goal:** close the gap with polished competitors. The current UI is clean but sparse. Add depth, data density, and visual hierarchy.

### Tasks
- [ ] **Stats on directory cards** — show `★ stars  ↓ installs` row on every card in `/explore` grid
- [ ] **Publisher grouping** — chip or subheader that groups by `publisher` column (`anthropics`, `vercel-labs`, etc.)
- [ ] **"Marketplaces" page** — `/marketplaces` — featured publisher pages with their skill bundles
- [ ] **Sort controls** — toggle: `Featured | Most starred | Most installed | Newest | A–Z`
- [ ] **Category icons + counts** — chips show `🔌 MCPs (487)`, `✨ Skills (312)`, etc.
- [ ] **Empty state illustrations** — custom SVG for empty search, empty stack, empty project
- [ ] **Loading skeletons** — shimmer placeholders during search debounce
- [ ] **Hover previews** — on card hover, show peek of install command + top 3 stats
- [ ] **Light/dark toggle** (maybe — decide after detail pages ship)
- [ ] **Mobile refinement** — audit every route at 375px width

### Done when
- UI side-by-side with mcp.so/skills.anthropic passes the "which one looks more professional" test
- Every card shows at minimum: name, blurb, category, stars, installs

---

## 🟢 Phase 9 — Community features

**Goal:** turn the toolkit into a place where people submit + vote, not just browse.

### Tasks
- [ ] **Submission flow** — `/submit` form: GitHub URL → scraper auto-fills name/blurb → user edits → goes to moderation queue
- [ ] **Moderation dashboard** — `/admin/queue` (auth-gated, admin role): approve/reject/edit submissions
- [ ] **Comments** — per-tool thread, logged-in users only, markdown-capable
- [ ] **Voting** — upvote/downvote already in Phase 7; add leaderboards here (`/trending`)
- [ ] **User profiles** — `/u/[username]` shows their public stacks, submitted tools, votes
- [ ] **Newsletter signup** — weekly digest of top new + trending tools
- [ ] **Shareable stacks** — `/stack/[publicId]` read-only view of someone's public stack

### Done when
- A user can submit a new tool end-to-end without manual DB access
- Each tool page has at least placeholder for comments/votes, even if empty

---

## 🔵 Phase 10 — Deep integrations

**Goal:** become indispensable by integrating with user's actual development flow.

### Tasks
- [ ] **Browser extension** — right-click any GitHub repo → "Save to Claude Code Stack"
- [ ] **CLI tool** — `npx claude-toolkit sync` pulls your `/stack` into `.claude/claude.json`
- [ ] **Slack/Discord bot** — post new tools in team channels
- [ ] **RSS / Atom feeds** — per-category firehose
- [ ] **API** — `GET /api/v1/tools?cat=mcp&sort=stars` — public JSON
- [ ] **Webhook subscriptions** — notify when a tool you saved has a new release

### Done when
- At least 2 integrations shipped and documented

---

## Decisions deferred (not planning yet)

- Paid tier / sponsored listings
- Mobile app (React Native with shared Supabase backend)
- Server-side full-text using PGlite / DuckDB for offline sync
- AI-generated tool summaries (stars nice-to-have, not essential)
- i18n (only matters past 10k DAU)

---

## Execution rules

1. **One phase active at a time.** Finish Phase 6 before starting Phase 7.
2. **Each phase gets a tag** — `git tag -a phase-N -m "..."` after the "Done when" passes.
3. **Scraper changes go in a branch** — `feat/scraper-<source>` → PR → merge. Never directly to master while scrapers are still fragile.
4. **Back up the DB** before each scraper run — Supabase dashboard → Database → Backups.
5. **Don't scrape more than 1 req/sec** per source without checking their robots.txt / ToS.
