-- RLS, grants, and staff-only verification.
-- Authorization uses public.profiles.role, not JWT user_metadata.

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('moderator', 'official')
  );
$$;

revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

create or replace function private.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and not private.is_staff() then
    raise exception 'Only staff can change profile roles';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute procedure private.prevent_role_escalation();

create or replace function private.prevent_author_verification_update()
returns trigger
language plpgsql
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and not private.is_staff() then
    raise exception 'Only staff can change verification status';
  end if;
  return new;
end;
$$;

create trigger posts_prevent_author_verification_update
before update on public.posts
for each row execute procedure private.prevent_author_verification_update();

create or replace function private.apply_verification_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.is_staff() then
    raise exception 'Only staff can record verification events';
  end if;

  if new.actor_id <> (select auth.uid()) then
    raise exception 'Verification actor must match the signed-in staff user';
  end if;

  update public.posts
  set verification_status = new.status,
      updated_at = now()
  where id = new.post_id;

  return new;
end;
$$;

revoke all on function private.apply_verification_event() from public;

create trigger verification_events_apply
before insert on public.verification_events
for each row execute procedure private.apply_verification_event();

create or replace function public.refresh_post_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  target := coalesce(new.post_id, old.post_id);

  update public.posts
  set
    upvote_count = (
      select coalesce(sum(value) filter (where value = 1), 0)
      from public.post_votes
      where post_id = target
    ),
    comment_count = (
      select count(*) from public.comments where post_id = target
    ),
    updated_at = now()
  where id = target;

  return coalesce(new, old);
end;
$$;

create trigger post_votes_refresh_counts
after insert or update or delete on public.post_votes
for each row execute procedure public.refresh_post_counts();

create trigger comments_refresh_counts
after insert or delete on public.comments
for each row execute procedure public.refresh_post_counts();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.verification_events enable row level security;
alter table public.ai_analyses enable row level security;

create policy profiles_select_public
on public.profiles for select
to anon, authenticated
using (true);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy posts_select_public
on public.posts for select
to anon, authenticated
using (true);

create policy posts_insert_own
on public.posts for insert
to authenticated
with check ((select auth.uid()) = author_id);

create policy posts_update_own
on public.posts for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy posts_delete_own
on public.posts for delete
to authenticated
using ((select auth.uid()) = author_id);

create policy post_media_select_public
on public.post_media for select
to anon, authenticated
using (true);

create policy post_media_insert_own_post
on public.post_media for insert
to authenticated
with check (
  exists (
    select 1 from public.posts
    where posts.id = post_id
      and posts.author_id = (select auth.uid())
  )
);

create policy post_media_delete_own_post
on public.post_media for delete
to authenticated
using (
  exists (
    select 1 from public.posts
    where posts.id = post_id
      and posts.author_id = (select auth.uid())
  )
);

create policy comments_select_public
on public.comments for select
to anon, authenticated
using (true);

create policy comments_insert_own
on public.comments for insert
to authenticated
with check ((select auth.uid()) = author_id);

create policy comments_update_own
on public.comments for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy comments_delete_own
on public.comments for delete
to authenticated
using ((select auth.uid()) = author_id);

create policy post_votes_select_public
on public.post_votes for select
to anon, authenticated
using (true);

create policy post_votes_insert_own
on public.post_votes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy post_votes_update_own
on public.post_votes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy post_votes_delete_own
on public.post_votes for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy saved_posts_select_own
on public.saved_posts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy saved_posts_insert_own
on public.saved_posts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy saved_posts_delete_own
on public.saved_posts for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy evidence_sources_select_public
on public.evidence_sources for select
to anon, authenticated
using (true);

create policy evidence_sources_insert_own_post
on public.evidence_sources for insert
to authenticated
with check (
  exists (
    select 1 from public.posts
    where posts.id = post_id
      and posts.author_id = (select auth.uid())
  )
);

create policy verification_events_select_public
on public.verification_events for select
to anon, authenticated
using (true);

create policy verification_events_insert_staff
on public.verification_events for insert
to authenticated
with check (
  (select auth.uid()) = actor_id
  and private.is_staff()
);

create policy ai_analyses_select_public
on public.ai_analyses for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select on table public.profiles, public.posts, public.post_media, public.comments, public.post_votes, public.evidence_sources, public.verification_events, public.ai_analyses to anon, authenticated;
grant select, insert, update, delete on table public.saved_posts to authenticated;
grant update on table public.profiles to authenticated;
grant insert, update, delete on table public.posts to authenticated;
grant insert, delete on table public.post_media to authenticated;
grant insert, update, delete on table public.comments to authenticated;
grant insert, update, delete on table public.post_votes to authenticated;
grant insert on table public.evidence_sources to authenticated;
grant insert on table public.verification_events to authenticated;
