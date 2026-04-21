-- ============================================================
-- Unified learn_resources table — videos, docs, research, blog posts from any source.
-- Plus `is_featured` + `creator_group` columns on free_ai_tools for best-of sections.
-- ============================================================

create table if not exists learn_resources (
  id bigserial primary key,
  slug text unique,
  resource_type text not null,           -- 'video' | 'doc' | 'research' | 'blog' | 'slide_deck' | 'course'
  source_type text not null,             -- 'anthropic_official' | 'creator' | 'publication' | 'community' | 'research_lab'
  source_name text,                      -- 'Anthropic', 'Nick Saraev', 'Ars Technica', 'AI Engineer'
  source_handle text,                    -- '@anthropic', '@nicksaraev'
  source_avatar_url text,
  source_url text,                       -- channel/blog homepage
  title text not null,
  url text not null,
  description text,
  thumbnail_url text,
  youtube_id text,                       -- when type='video' and hosted on YouTube
  duration_min int,
  skill_level text check (skill_level in ('beginner','intermediate','advanced')),
  topic text,                            -- 'mcp' | 'skills' | 'hooks' | 'overview' etc.
  published_at date,
  is_featured boolean default false,
  sort_order int default 100,
  created_at timestamptz default now()
);

create index if not exists learn_resources_type_idx on learn_resources(resource_type);
create index if not exists learn_resources_source_type_idx on learn_resources(source_type);
create index if not exists learn_resources_source_name_idx on learn_resources(source_name);
create index if not exists learn_resources_featured_idx on learn_resources(is_featured) where is_featured = true;

alter table learn_resources enable row level security;
create policy "Learn resources are public readable" on learn_resources for select using (true);

-- Add is_featured to free_ai_tools (for best-of section)
alter table free_ai_tools add column if not exists is_best boolean default false;
create index if not exists free_ai_tools_best_idx on free_ai_tools(is_best) where is_best = true;
