-- Real report location metadata and owner-requested Gemini analyses.
-- AI output is informational only; it never changes workflow or verification state.

alter table public.posts
  add column if not exists city text;

alter table public.posts
  drop constraint if exists posts_city_check,
  add constraint posts_city_check check (city is null or char_length(city) between 1 and 120);

create index if not exists posts_city_neighborhood_idx
on public.posts (city, neighborhood);

alter table public.ai_analyses
  add column if not exists suggested_category text,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists checked_at timestamptz not null default now();

alter table public.ai_analyses
  drop constraint if exists ai_analyses_suggested_category_check,
  drop constraint if exists ai_analyses_sources_is_array,
  add constraint ai_analyses_suggested_category_check check (
    suggested_category is null or suggested_category in ('roads', 'utilities', 'safety', 'environment', 'transit', 'parks')
  ),
  add constraint ai_analyses_sources_is_array check (jsonb_typeof(sources) = 'array');

-- The request route uses the caller's session, so an analysis can only be
-- attached to a post its authenticated author owns.
drop policy if exists ai_analyses_insert_own_post on public.ai_analyses;

create policy ai_analyses_insert_own_post
on public.ai_analyses for insert
to authenticated
with check (
  exists (
    select 1 from public.posts
    where posts.id = post_id
      and posts.author_id = (select auth.uid())
  )
);

grant insert on table public.ai_analyses to authenticated;
