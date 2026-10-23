-- Complete the fields used by the existing feed and add authenticated profile media.
-- This migration keeps public reads and owner-only writes enforced by RLS.

alter table public.posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists intake_notes text;

alter table public.posts
  add constraint posts_tags_limit_check check (cardinality(tags) <= 8);

create index if not exists posts_tags_gin_idx on public.posts using gin (tags);

-- Existing Auth users created before the profile trigger was introduced can create
-- only their own member profile. They cannot choose a staff role.
create policy profiles_insert_own_member
on public.profiles for insert
to authenticated
with check (
  id = (select auth.uid())
  and role = 'member'
);

-- Members may edit report content, but only staff can change the workflow status.
create or replace function private.prevent_member_status_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not private.is_staff() then
    raise exception 'Only staff can change post status';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_member_status_update() from public;

create trigger posts_prevent_member_status_update
before update on public.posts
for each row execute procedure private.prevent_member_status_update();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy profile_avatars_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-avatars');

create policy profile_avatars_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy profile_avatars_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
