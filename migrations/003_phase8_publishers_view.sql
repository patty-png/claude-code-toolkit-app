-- ============================================================
-- Phase 8: Publisher aggregate view for /marketplaces
-- Pre-computes publisher-level stats so we don't GROUP BY on every request
-- ============================================================

create or replace view publisher_stats as
select
  publisher,
  count(*)::int                                    as tool_count,
  coalesce(sum(github_stars), 0)::int              as total_stars,
  coalesce(max(github_stars), 0)::int              as max_stars,
  coalesce(sum(installs_count), 0)::int            as total_installs,
  coalesce(sum(upvotes), 0)::int                   as total_upvotes,
  array_agg(distinct category_id) filter (where category_id is not null) as categories,
  (array_agg(name order by github_stars desc nulls last))[1:3]           as top_tool_names,
  max(github_last_commit)                          as last_commit
from tools
where publisher is not null
group by publisher;

-- RLS not needed on views of already-RLS'd tables
