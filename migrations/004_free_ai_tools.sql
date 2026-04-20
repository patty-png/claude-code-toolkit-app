-- ============================================================
-- Free AI Tools — curated free AI websites (not GitHub repos).
-- Separate from `tools` because these are consumer/web tools, not Claude Code tools.
-- ============================================================

create table if not exists free_ai_tools (
  id bigserial primary key,
  slug text unique not null,
  name text not null,
  url text not null,
  description text not null,        -- what the website is
  tool_summary text,                -- the specific tool / feature it provides
  use_cases text,                   -- how it can be helpful
  category text not null,           -- 'writing' | 'coding' | 'design' | 'video' | 'audio' | 'research' | 'productivity' | 'data' | 'chatbot'
  is_free boolean default true,
  has_free_tier boolean default true,
  thumbnail_url text,
  sort_order int default 100,
  created_at timestamptz default now()
);

create index if not exists free_ai_tools_category_idx on free_ai_tools(category);
create index if not exists free_ai_tools_sort_idx on free_ai_tools(sort_order, id);

alter table free_ai_tools enable row level security;
create policy "Free AI tools are public readable" on free_ai_tools for select using (true);
