-- ============================================================
-- Phase 6: Tool metadata expansion
-- Adds the fields Phase 7 detail pages need:
--   stars, forks, installs, publisher, license, last_commit,
--   readme_md, skill_md, claude_md, source (which scraper found it)
-- Also adds votes + comments tables for community features
-- ============================================================

-- --- Extend tools table ---
alter table tools add column if not exists github_url text;
alter table tools add column if not exists github_stars int default 0;
alter table tools add column if not exists github_forks int default 0;
alter table tools add column if not exists github_last_commit timestamptz;
alter table tools add column if not exists license text;
alter table tools add column if not exists primary_language text;
alter table tools add column if not exists publisher text;              -- e.g. 'anthropics', 'vercel-labs'
alter table tools add column if not exists repo_name text;              -- e.g. 'claude-skills'
alter table tools add column if not exists installs_count int default 0;
alter table tools add column if not exists upvotes int default 0;
alter table tools add column if not exists downvotes int default 0;
alter table tools add column if not exists readme_md text;              -- full README.md content
alter table tools add column if not exists skill_md text;               -- SKILL.md if present
alter table tools add column if not exists claude_md text;              -- CLAUDE.md if present
alter table tools add column if not exists source text;                 -- 'v18', 'mcp-so', 'smithery', 'awesome-claude-code', etc.
alter table tools add column if not exists identity_key text;           -- normalized dedupe key
alter table tools add column if not exists enriched_at timestamptz;     -- last time GitHub stats were pulled
alter table tools add column if not exists last_seen_at timestamptz;    -- last time a scraper saw it

create unique index if not exists tools_identity_key_idx on tools(identity_key) where identity_key is not null;
create index if not exists tools_publisher_idx on tools(publisher) where publisher is not null;
create index if not exists tools_stars_idx on tools(github_stars desc);
create index if not exists tools_installs_idx on tools(installs_count desc);

-- --- Staging table for unreviewed scraper output ---
create table if not exists staging_tools (
  id bigserial primary key,
  identity_key text not null,
  name text not null,
  category_hint text,
  tag text,
  blurb text,
  url text,
  github_url text,
  install_command text,
  publisher text,
  repo_name text,
  source text not null,
  raw jsonb,                         -- whatever the scraper found
  status text default 'pending',     -- 'pending' | 'approved' | 'rejected' | 'merged'
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz default now()
);

create index if not exists staging_tools_status_idx on staging_tools(status);
create index if not exists staging_tools_identity_key_idx on staging_tools(identity_key);

alter table staging_tools enable row level security;
-- only authenticated admins can see staging (we'll tighten to role='admin' later)
create policy "Authenticated can read staging" on staging_tools for select using (auth.uid() is not null);

-- --- Votes table (used by Phase 7 vote buttons) ---
create table if not exists tool_votes (
  id uuid primary key default gen_random_uuid(),
  tool_id bigint references tools(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  value int not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  unique(tool_id, user_id)
);

alter table tool_votes enable row level security;
create policy "Users can manage their own votes" on tool_votes for all using (auth.uid() = user_id);
create policy "Vote counts are public readable" on tool_votes for select using (true);

-- --- Comments table (used by Phase 7 comment section) ---
create table if not exists tool_comments (
  id uuid primary key default gen_random_uuid(),
  tool_id bigint references tools(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 4000),
  parent_id uuid references tool_comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tool_comments_tool_idx on tool_comments(tool_id);

alter table tool_comments enable row level security;
create policy "Comments are public readable" on tool_comments for select using (true);
create policy "Authenticated can post comments" on tool_comments for insert with check (auth.uid() = user_id);
create policy "Users can edit own comments" on tool_comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on tool_comments for delete using (auth.uid() = user_id);

-- --- Trigger: recompute tool.upvotes/downvotes when votes change ---
create or replace function recompute_tool_votes() returns trigger as $$
declare
  target_tool bigint;
begin
  target_tool := coalesce(new.tool_id, old.tool_id);
  update tools
    set upvotes   = (select count(*) from tool_votes where tool_id = target_tool and value =  1),
        downvotes = (select count(*) from tool_votes where tool_id = target_tool and value = -1)
    where id = target_tool;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recompute_tool_votes on tool_votes;
create trigger trg_recompute_tool_votes
  after insert or update or delete on tool_votes
  for each row execute function recompute_tool_votes();
