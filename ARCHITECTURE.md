# Claude Code Toolkit — Full Stack Architecture

> Source of truth for the deployed cloud version. Sonnet implements against this doc.
> Last updated: 2026-04-19

---

## Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 App Router** | RSC by default, file-based routing, Vercel-native |
| Language | **TypeScript** strict | Catches schema/type drift early |
| Styling | **Tailwind CSS** + CSS vars for theme | Tailwind for utility, CSS vars keep Claude brand palette centralized |
| DB + Auth | **Supabase** | Postgres + RLS + Auth + Storage in one free tier |
| ORM | **Drizzle** | Type-safe, lightweight, good for Supabase |
| Search | **Postgres `tsvector` + GIN index** | No extra service, scales to 100k rows fine |
| Deployment | **Vercel** | One-click Next.js, free hobby tier, preview deploys |
| Forms | **React Hook Form + Zod** | Shared validation between client and server |
| Icons | **lucide-react** | Matches Claude's clean geometric style |
| Fonts | Fraunces + IBM Plex Sans + JetBrains Mono via `next/font/google` | Same as v18 |
| Analytics | **Vercel Analytics** (free tier) | Zero config |

**What we explicitly reject:**
- Algolia / Meilisearch — overkill for <50k rows, Postgres FTS is enough
- shadcn/ui — nice but we want a custom editorial feel, not another app that looks like every shadcn site
- Clerk/Auth0 — Supabase Auth is already included
- tRPC — App Router's server actions + route handlers are sufficient

---

## Color System (Claude Brand)

Ported from v18. Declared once in `globals.css`, referenced via Tailwind arbitrary values.

```css
:root {
  --paper: #f0eee6;
  --paper-2: #e8e4d8;
  --paper-3: #ddd6c5;
  --ink: #141413;
  --ink-2: #2b2926;
  --muted: #7a736b;
  --rule: #d4ccbc;
  --accent: #cc785c;
  --accent-ink: #a0583f;
  --accent-soft: #e8c5b6;
  --term-bg: #181715;
  --term-text: #ece6d8;
  --term-accent: #e89b7d;
  --term-green: #a3b86c;
  --term-yellow: #e8c670;
  --ok: #4a7c1e;
}
```

Tailwind config extends `colors.brand.*` mapped to these vars.

---

## Database Schema

Full Postgres DDL — run in Supabase SQL editor on first setup.

```sql
-- ============ CATEGORIES ============
create table categories (
  id text primary key,              -- 'official-mcp', 'community-mcp', etc.
  label text not null,
  short_label text,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ============ TOOLS ============
create table tools (
  id bigserial primary key,
  slug text unique not null,        -- url-safe: 'github-mcp'
  name text not null,
  category_id text references categories(id) on delete set null,
  tag text,                          -- 'Official', 'Community', 'Pro', etc.
  blurb text not null,
  url text,
  install_command text,
  install_notes text,                -- markdown for extra context
  is_featured boolean default false,
  feature_rank int,                  -- for Top 5 ordering
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search_vector tsvector
);

create index tools_search_idx on tools using gin(search_vector);
create index tools_category_idx on tools(category_id);
create index tools_featured_idx on tools(is_featured) where is_featured = true;

-- Auto-update search_vector on insert/update
create function tools_tsvector_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.tag, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.blurb, '')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger tools_tsvector_update
  before insert or update on tools
  for each row execute function tools_tsvector_trigger();

-- ============ TAGS (many-to-many) ============
create table tags (
  id bigserial primary key,
  name text unique not null
);

create table tool_tags (
  tool_id bigint references tools(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  primary key (tool_id, tag_id)
);

-- ============ EDUCATION ============
create table videos (
  id bigserial primary key,
  title text not null,
  url text not null,
  youtube_id text,
  thumbnail_url text,
  channel text,
  duration_seconds int,
  topic text,                        -- 'mcp', 'skills', 'hooks', etc.
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  description text,
  published_at date,
  created_at timestamptz default now()
);

create table courses (
  id bigserial primary key,
  title text not null,
  provider text not null,            -- 'Anthropic', 'DeepLearning.AI', etc.
  url text not null,
  price_usd numeric,
  is_free boolean default false,
  has_certificate boolean default false,
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  duration_hours numeric,
  description text,
  created_at timestamptz default now()
);

-- ============ USERS (Supabase Auth provides auth.users) ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ============ STACKS (project manager) ============
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table stack_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  tool_id bigint references tools(id) on delete cascade,
  custom_tool_name text,             -- for tools not in the directory
  custom_tool_url text,
  fields jsonb default '{}'::jsonb,  -- {email, username, password, apiKey, url, notes}
  added_at timestamptz default now()
);

create index projects_user_idx on projects(user_id);
create index stack_items_project_idx on stack_items(project_id);

-- ============ ROW LEVEL SECURITY ============
alter table projects enable row level security;
alter table stack_items enable row level security;
alter table profiles enable row level security;

create policy "Users own their projects"
  on projects for all
  using (auth.uid() = user_id);

create policy "Users own their stack items"
  on stack_items for all
  using (auth.uid() = (select user_id from projects where id = stack_items.project_id));

create policy "Profiles are public readable"
  on profiles for select using (true);

create policy "Users update their own profile"
  on profiles for update using (auth.uid() = id);

-- Tools, categories, videos, courses are public read
alter table tools enable row level security;
create policy "Tools are public readable" on tools for select using (true);

alter table categories enable row level security;
create policy "Categories are public readable" on categories for select using (true);

alter table videos enable row level security;
create policy "Videos are public readable" on videos for select using (true);

alter table courses enable row level security;
create policy "Courses are public readable" on courses for select using (true);
```

---

## File Structure

```
claude-code-toolkit-app/
├── .env.local.example
├── package.json
├── tailwind.config.ts
├── next.config.js
├── drizzle.config.ts
├── tsconfig.json
├── README.md
├── ARCHITECTURE.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      -- root, fonts, Vercel Analytics
│   │   ├── page.tsx                        -- landing (terminal + nodes)
│   │   ├── globals.css                     -- CSS vars, base styles
│   │   │
│   │   ├── explore/
│   │   │   ├── page.tsx                    -- directory with search
│   │   │   └── [slug]/page.tsx             -- individual tool page
│   │   │
│   │   ├── learn/
│   │   │   ├── page.tsx                    -- education hub landing
│   │   │   ├── videos/page.tsx             -- YouTube library
│   │   │   ├── courses/page.tsx            -- courses + certs
│   │   │   └── roadmap/page.tsx            -- 4-phase roadmap
│   │   │
│   │   ├── stack/
│   │   │   ├── page.tsx                    -- my stack (auth-gated)
│   │   │   └── [projectId]/page.tsx        -- single project view
│   │   │
│   │   ├── auth/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── callback/route.ts           -- OAuth callback
│   │   │
│   │   ├── admin/
│   │   │   └── tools/
│   │   │       ├── page.tsx                -- list + edit
│   │   │       └── new/page.tsx            -- add tool
│   │   │
│   │   ├── api/
│   │   │   ├── search/route.ts             -- GET ?q= → ranked results
│   │   │   └── og/route.tsx                -- dynamic OG images
│   │   │
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   │
│   ├── components/
│   │   ├── landing/
│   │   │   ├── TerminalStage.tsx           -- central terminal + 6 nodes
│   │   │   ├── FeatureNode.tsx
│   │   │   └── terminal-demos.ts           -- demo scripts
│   │   │
│   │   ├── directory/
│   │   │   ├── ToolCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CategoryChips.tsx
│   │   │   └── TopFive.tsx
│   │   │
│   │   ├── learn/
│   │   │   ├── VideoCard.tsx
│   │   │   └── CourseCard.tsx
│   │   │
│   │   ├── stack/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectView.tsx
│   │   │   ├── CredentialForm.tsx
│   │   │   └── AddToolDialog.tsx
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Dialog.tsx
│   │       ├── Input.tsx
│   │       └── CopyButton.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   -- browser client
│   │   │   ├── server.ts                   -- RSC / route handler client
│   │   │   └── middleware.ts               -- auth refresh
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts                   -- Drizzle schema
│   │   │   └── index.ts
│   │   │
│   │   ├── search.ts                       -- ranking logic (ported from v18)
│   │   ├── synonyms.ts                     -- concept-synonym map
│   │   └── utils.ts
│   │
│   ├── types/
│   │   └── db.ts                           -- generated from Supabase
│   │
│   └── middleware.ts                       -- Supabase auth middleware
│
├── public/
│   └── (favicon, og defaults)
│
├── scripts/
│   ├── migrate-v18-data.mjs                -- parse old index.html → insert rows
│   ├── seed-categories.ts
│   ├── scrape-youtube.mjs                  -- fetch metadata for Phase 4
│   └── export-stack.mjs                    -- rarely used
│
└── drizzle/
    └── (migrations auto-generated)
```

---

## Phase-by-Phase Implementation Notes

### Phase 0 — Scaffold (goal: live URL in 60 min)

**Steps:**
1. `npx create-next-app@latest claude-code-toolkit-app --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. `cd` in, `git init`, create GitHub repo `patty-png/claude-code-toolkit-app`
3. Push empty repo
4. Go to vercel.com → import from GitHub → accept defaults → deploy
5. Create Supabase project at supabase.com — save URL + anon key + service role key to `.env.local`
6. Add to Vercel env vars (same 3 keys)
7. `npm install @supabase/supabase-js @supabase/ssr drizzle-orm drizzle-kit postgres lucide-react zod react-hook-form @hookform/resolvers`
8. Create `src/lib/supabase/client.ts` and `server.ts` per Supabase SSR docs
9. Add a test page that queries `select now()` to prove DB connection
10. Deploy — confirm test query works on production URL

**Done when:** live Vercel URL renders a page that successfully reads from Supabase.

---

### Phase 1 — Schema + Drizzle

1. Run the SQL DDL (above) in Supabase SQL editor
2. Generate Drizzle types: `npx supabase gen types typescript --project-id <id> > src/types/db.ts`
3. Write Drizzle schema at `src/lib/db/schema.ts` matching the SQL
4. Set up `src/lib/db/index.ts` with postgres.js connection via `DATABASE_URL`
5. Seed categories with `scripts/seed-categories.ts` — 9 categories from v18's `CATS` array
6. Verify with a simple query in a Next.js route

**Done when:** Drizzle queries tables successfully from an RSC.

---

### Phase 2 — Data Migration

**Migration script: `scripts/migrate-v18-data.mjs`**
```js
// 1. Read old index.html
// 2. Regex-extract TOOLS = [...] block
// 3. eval() in a vm context with a TOOLS receiver
// 4. For each tool: slugify name, insert with INSERT ... ON CONFLICT (slug) DO UPDATE
// 5. Mark top 5 as is_featured=true with feature_rank 1-5
```

Pattern: extract `TOOLS = [...]` → `JSON.stringify` → batch insert 50 at a time.

**Done when:** `select count(*) from tools` returns 284 and spot-checks match v18.

---

### Phase 3 — Core Directory

**Landing (`app/page.tsx`):**
- Port `TerminalStage.tsx` component from v18 landing
- 6 feature nodes as buttons, typewriter effect uses `useEffect` + `setTimeout`
- Demo scripts in `terminal-demos.ts`

**Directory (`app/explore/page.tsx`):**
- RSC by default — fetches initial 50 tools server-side
- Client component `<SearchBar>` → calls `/api/search?q=...` on debounce
- Cards use `<details>/<summary>` for native expand/collapse (same as v18)
- Category chips filter via URL `?category=` param

**Search API (`app/api/search/route.ts`):**
```ts
// Use Postgres ts_rank_cd for ranking
// Expand query with synonyms (port from v18 SYNONYMS map)
// Also apply custom weighting: exact name match = +1000
const sql = `
  select id, slug, name, tag, blurb, url, install_command,
    ts_rank_cd(search_vector, query) as rank,
    case when lower(name) = lower($1) then 1000 else 0 end as exact_bonus
  from tools, plainto_tsquery('english', $2) query
  where search_vector @@ query
  order by rank + exact_bonus desc
  limit 50
`;
```

**Top 5 (`<TopFive>`):**
- Server component: `db.query.tools.findMany({ where: eq(tools.isFeatured, true), orderBy: tools.featureRank, limit: 5 })`
- Same 5-column grid at ≥1000px

**Tool detail (`app/explore/[slug]/page.tsx`):**
- Full page per tool for SEO — generates `og:image` dynamically
- `generateStaticParams()` pre-renders all tools at build

**Done when:** live URL matches v18 feature parity — search ranks correctly, chips filter, cards expand with install command.

---

### Phase 4 — Education Hub

**Data seeding:**
- Hand-curate first 30 YouTube videos on Claude Code (Anthropic, Matt Berman, AI Jason, etc.)
- `scripts/scrape-youtube.mjs` fetches title/duration/thumbnail via YouTube oEmbed API
- Insert into `videos` table with manual `topic` + `skill_level` tags

**Video library (`app/learn/videos/page.tsx`):**
- Filter by skill level (chips) + topic (dropdown)
- Card shows thumbnail, title, channel, duration badge
- Click opens modal with embedded `<iframe>` player

**Courses (`app/learn/courses/page.tsx`):**
- Card grid: provider logo, title, price badge (Free / $X), cert badge
- Filter by free/paid, cert-only, skill level

**Roadmap (`app/learn/roadmap/page.tsx`):**
- Port v18's 4-phase roadmap section verbatim
- Maybe store phases in DB later — static markup fine for v1

**Done when:** `/learn` has 30+ videos and 10+ courses live with working filters.

---

### Phase 5 — Auth + Synced Stack

**Auth flow:**
1. Enable GitHub provider + magic link in Supabase Auth dashboard
2. `app/auth/sign-in/page.tsx` — two buttons: "Continue with GitHub" + email input
3. `app/auth/callback/route.ts` — handles OAuth exchange, upserts into `profiles`
4. `src/middleware.ts` — refreshes Supabase session cookie on every request
5. Guard `/stack/*` routes with `if (!user) redirect('/auth/sign-in')`

**Guest mode preservation:**
- If not logged in, `/stack` still works via `localStorage` (feature parity with v18)
- On first login, show banner: "Import your local stack? [Yes] [Start fresh]"
- Import = POST all localStorage projects + items to DB in a single transaction

**Project manager rebuild:**
- `/stack` — ProjectList (sidebar) + ProjectView (main)
- All CRUD via server actions:
  ```ts
  'use server';
  export async function renameProject(id: string, name: string) {
    const supabase = createServerClient();
    await supabase.from('projects').update({ name }).eq('id', id);
    revalidatePath('/stack');
  }
  ```

**Credential fields:**
- `stack_items.fields` is jsonb — `{email, username, password, apiKey, url, notes}`
- RLS ensures only owner can read
- **Security upgrade later**: encrypt sensitive fields with Supabase Vault (keep for v2, jsonb is fine for v1 given RLS)

**Done when:** sign in on laptop, add a tool to a project, open on phone, it's there.

---

### Phase 6 — Polish + SEO

- Dynamic OG images: `app/api/og/route.tsx` using `@vercel/og` → renders per-tool card
- Individual tool pages statically generated at build → great SEO
- `sitemap.ts` includes all tools + static pages
- `robots.ts` allows all
- Add Vercel Analytics via `<Analytics />` in root layout
- Lighthouse audit pass — target 95+ perf, 100 accessibility

---

### Phase 7 — Cutover

- Optional: buy domain like `claudecodetoolkit.com`, point to Vercel
- Update old repo's `index.html` footer: `"⚡ Full version with cloud sync + education → [URL]"`
- Freeze old repo at `v18` tag — mark as "reference implementation"
- Pin new repo on GitHub profile

---

## Environment Variables

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server-only, for admin tasks + migrations
DATABASE_URL=                          # postgres connection string for Drizzle
YOUTUBE_API_KEY=                       # optional, only for metadata scraping
```

---

## Execution Order for Sonnet

When you switch to Sonnet, follow this order — each phase's "Done when" must pass before advancing:

1. Phase 0 → commit message: `chore(phase-0): scaffold Next.js + Supabase`
2. Phase 1 → `feat(phase-1): schema + drizzle`
3. Phase 2 → `feat(phase-2): migrate 284 tools from v18`
4. Phase 3 → `feat(phase-3): directory + search + top 5`
5. Phase 4 → `feat(phase-4): education hub`
6. Phase 5 → `feat(phase-5): auth + synced my stack`
7. Phase 6 → `chore(phase-6): seo + polish`
8. Phase 7 → `chore(phase-7): cutover`

Tag each phase completion: `git tag -a phase-0 -m "..."` etc.

---

## Decisions Deferred

These can wait until after cutover:
- Community submissions (add `submitted_by` + moderation queue)
- Ratings / reviews
- Collections / shareable stacks (`/stack/share/[id]`)
- MCP server health checks (automated)
- Pricing / paid tier (if ever)
- Mobile app (React Native with shared Supabase backend)
