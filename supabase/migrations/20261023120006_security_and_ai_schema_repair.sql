-- Safe repair for projects that were provisioned before AI analysis fields
-- were introduced. This migration preserves rows and leaves RLS enabled.

alter table public.ai_analyses
  add column if not exists suggested_category text,
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists checked_at timestamptz not null default now();

update public.ai_analyses
set sources = '[]'::jsonb
where sources is null;

update public.ai_analyses
set checked_at = created_at
where checked_at is null;

alter table public.ai_analyses
  alter column sources set not null,
  alter column checked_at set not null;

alter table public.ai_analyses
  drop constraint if exists ai_analyses_suggested_category_check,
  drop constraint if exists ai_analyses_sources_is_array,
  add constraint ai_analyses_suggested_category_check check (
    suggested_category is null or suggested_category in ('roads', 'utilities', 'safety', 'environment', 'transit', 'parks')
  ),
  add constraint ai_analyses_sources_is_array check (jsonb_typeof(sources) = 'array');

create index if not exists ai_analyses_post_checked_at_idx
on public.ai_analyses (post_id, checked_at desc);

-- A client must never be able to turn itself into staff. Service-role and SQL
-- administration have no auth.uid(), so administrators can still promote users
-- through controlled server-side operations.
create or replace function private.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'Profile roles can only be changed by server-side administration';
  end if;
  return new;
end;
$$;

-- Verification state is an auditable projection of verification_events. A
-- direct update is rejected; the nested update made by that event trigger is
-- the only application-level path allowed to change it.
create or replace function private.prevent_author_verification_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and pg_trigger_depth() = 1 then
    raise exception 'Use a verification event to change verification status';
  end if;
  return new;
end;
$$;

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
