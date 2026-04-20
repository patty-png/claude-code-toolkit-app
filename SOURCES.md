# Scraping Sources

> Comprehensive list of directories, marketplaces, and curated lists where Claude Code tools are published.
> Ordered by priority — start from the top, bank easy wins, then move down.

**Legal reminder:** before scraping any source, check its `robots.txt` and ToS. Prefer JSON APIs where available. Rate-limit to ≤1 req/sec unless explicitly allowed.

---

## Tier 1 — High signal, structured data

### 1. MCP.so
- **URL:** https://mcp.so/servers
- **Volume:** ~2,000+ MCP servers
- **Structure:** Paginated grid, each card has name, description, category, GitHub link
- **Method:** HTML scrape with Playwright (JS-rendered)
- **Category mapping:** official / database / dev-tools / productivity → `mcp`, `saas`, `tool`

### 2. Smithery.ai
- **URL:** https://smithery.ai/
- **Volume:** ~1,500+ MCPs
- **Structure:** Has a registry, check for `/api/registry.json` or similar
- **Method:** API call preferred, HTML fallback
- **Bonus:** includes install counts + star counts directly

### 3. Glama.ai
- **URL:** https://glama.ai/mcp/servers
- **Volume:** ~500+ curated MCPs
- **Structure:** Clean JSON endpoints, categories, quality ratings
- **Method:** Likely has a public API — inspect network tab first

### 4. Anthropic Official Skills Repo
- **URL:** https://github.com/anthropics/claude-skills (and any `anthropics/*-skills` orgs)
- **Volume:** ~50 high-quality official skills
- **Structure:** Each skill is a folder with `SKILL.md`
- **Method:** GitHub GraphQL API — list repos, read SKILL.md from each
- **Priority tag:** `is_featured = true` for all official

### 5. Claude Code Marketplaces
- **URL:** https://claudecodemarketplaces.com (confirm actual URL)
- **Volume:** unknown — skills + marketplaces sections
- **Structure:** has `/skills/[org]/skills/[name]` URLs with stats (votes, installs, GitHub stars)
- **Method:** HTML scrape, rich metadata per tool

---

## Tier 2 — Curated GitHub lists

### 6. affaan-m/everything-claude-code
- **URL:** https://github.com/affaan-m/everything-claude-code
- **Volume:** 141k stars, huge monorepo of skills
- **Structure:** README + subfolders of skills
- **Method:** Clone, walk directory, extract each skill's metadata

### 7. awesome-claude-code
- **URL:** https://github.com/hesreallyhim/awesome-claude-code (and forks)
- **Volume:** 100+ curated links
- **Structure:** Markdown list, categorized sections
- **Method:** Parse README.md, extract `[name](url)` patterns, classify by section heading

### 8. awesome-mcp-servers
- **URL:** https://github.com/punkpeye/awesome-mcp-servers
- **Volume:** 500+ MCP entries
- **Structure:** Markdown list grouped by category
- **Method:** Markdown parse

### 9. GitHub topic search
- **Query:** `topic:claude-code-skill`, `topic:mcp-server`, `topic:claude-code-plugin`
- **Volume:** varies, likely 1,000+ repos
- **Method:** GitHub search API with pagination

---

## Tier 3 — Publisher-specific

### 10. vercel-labs/agent-skills
- **URL:** https://github.com/vercel-labs/agent-skills
- **Volume:** Vercel's official skills for deployment / Next.js / etc.

### 11. remotion-dev/skills
- **URL:** https://github.com/remotion-dev/skills
- **Volume:** Remotion video-generation skills

### 12. stripe/docs & api-skills
- Stripe's official MCP/skill guides for payments integration

### 13. supabase community skills
- **URL:** Search GitHub for `topic:supabase topic:claude`

### 14. Langchain / LlamaIndex MCP adapters
- **URL:** Their respective orgs — look for `mcp-server-*` repos

---

## Tier 4 — Long tail

### 15. npm search
- **Query:** `@modelcontextprotocol/server-*` and `mcp-server-*` packages
- **Method:** npm registry API (`https://registry.npmjs.org/-/v1/search?text=mcp-server`)

### 16. PyPI search
- **Query:** `mcp-server-*`, `claude-skill-*`
- **Method:** PyPI JSON API

### 17. Twitter / X
- **Query:** `"claude code"` (recent, filtered) — manual extraction, skip automation here
- **Purpose:** discover brand-new tools before they hit directories

### 18. Hacker News / Reddit r/ClaudeAI
- **Purpose:** discovery of emerging tools, not bulk scrape
- **Method:** manual curation queue

---

## Method priority (per source)

For each source, try in this order:

1. **Official API** (JSON, documented)
2. **Unofficial API** (inspect network tab — many sites have public JSON endpoints)
3. **GraphQL** (GitHub uses this for most metadata)
4. **HTML parsing with Cheerio** (fast, no browser needed)
5. **Playwright** (only if JS-rendered content can't be reached any other way)

---

## Deduplication strategy

Every scraped tool must have a normalized `identity_key`:

```ts
identity_key = normalize(github_url ?? npm_package ?? pypi_package ?? homepage)
```

Where `normalize()`:
- Lowercase everything
- Strip `https://` / `www.` / trailing slash
- Resolve GitHub redirects (git.io → github.com/...)
- For GitHub: keep only `github.com/{owner}/{repo}`

Upsert on `identity_key`. If a tool appears in 3 sources, we keep the first scrape's row but merge fields (use the longest blurb, highest star count, earliest `created_at`).

---

## GitHub stats enrichment

After scraping, for every row with a GitHub URL, run enrichment:

```
GET https://api.github.com/graphql
query {
  repository(owner: $owner, name: $repo) {
    stargazerCount
    forkCount
    pushedAt
    description
    primaryLanguage { name }
    licenseInfo { spdxId }
  }
}
```

Store in `github_stars`, `github_forks`, `github_last_commit`. Nightly cron via Vercel or Supabase Edge Function.

---

## Scraper structure (planned)

```
scripts/scrape/
├── _lib/
│   ├── dedupe.ts       — identity_key normalization
│   ├── enrich.ts       — GitHub GraphQL fetcher
│   ├── commit.ts       — upsert to Supabase via service role
│   └── types.ts        — RawTool shape
├── mcp-so.ts
├── smithery.ts
├── glama.ts
├── anthropics-official.ts
├── claude-marketplaces.ts
├── everything-claude-code.ts
├── awesome-claude-code.ts
├── awesome-mcp-servers.ts
├── github-topic-search.ts
├── npm-search.ts
└── pypi-search.ts
```

Run all: `node scripts/scrape/run-all.mjs` (sequential, with rate limit).
Run one: `node scripts/scrape/mcp-so.ts`.

Every scraper emits to the same `staging_tools` table first — moderation decides what graduates to `tools`.

---

## Questions to answer before Phase 6 starts

1. **Do we respect robots.txt?** (yes, default)
2. **Do we attribute source?** (yes, `source` column on every row)
3. **Do we auto-publish or moderate?** (moderate — nothing auto-publishes with <20 stars or blank blurb)
4. **How often do we re-run?** (weekly full sweep; nightly stats enrichment)
5. **What's our "published" threshold?** (minimum: has a blurb, has a GitHub URL, has >= 5 stars OR is in Tier 1 source)
