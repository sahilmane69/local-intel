-- Local Intel core schema.
-- UUID primary keys, timestamptz, FK indexes, and check constraints.
-- Roles for verification live in public.profiles.role, never in user_metadata.

create extension if not exists pgcrypto;

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  neighborhood text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('member', 'moderator', 'official')),
  constraint profiles_display_name_check check (char_length(display_name) between 1 and 80)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  category text not null,
  status text not null default 'open',
  neighborhood text not null,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  location_source text,
  verification_status text not null default 'unverified',
  upvote_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_title_check check (char_length(title) between 1 and 160),
  constraint posts_category_check check (
    category in ('roads', 'utilities', 'safety', 'environment', 'transit', 'parks')
  ),
  constraint posts_status_check check (status in ('open', 'in-progress', 'resolved')),
  constraint posts_location_source_check check (
    location_source is null or location_source in ('gps', 'manual')
  ),
  constraint posts_verification_status_check check (
    verification_status in ('unverified', 'community-corroborated', 'officially-confirmed')
  ),
  constraint posts_upvote_count_check check (upvote_count >= 0),
  constraint posts_comment_count_check check (comment_count >= 0)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null,
  storage_path text,
  public_url text not null,
  mime_type text not null,
  file_name text not null,
  caption text,
  poster_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint post_media_kind_check check (kind in ('image', 'video', 'audio'))
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_check check (char_length(body) between 1 and 4000)
);

create table public.post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null,
  created_at timestamptz not null default now(),
  constraint post_votes_value_check check (value in (-1, 1)),
  constraint post_votes_unique unique (post_id, user_id)
);

create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_posts_unique unique (post_id, user_id)
);

create table public.evidence_sources (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  media_id uuid references public.post_media (id) on delete set null,
  kind text not null,
  label text not null,
  href text,
  note text,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint evidence_sources_kind_check check (
    kind in ('photo', 'video', 'audio', 'link', 'source-post')
  )
);

create table public.verification_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  status text not null,
  notes text not null,
  created_at timestamptz not null default now(),
  constraint verification_events_status_check check (
    status in ('unverified', 'community-corroborated', 'officially-confirmed')
  )
);

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  summary text not null,
  duplicate_hints jsonb not null default '[]'::jsonb,
  evidence_notes text not null,
  model text not null,
  created_at timestamptz not null default now(),
  constraint ai_analyses_duplicate_hints_is_array check (jsonb_typeof(duplicate_hints) = 'array')
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_neighborhood_idx on public.posts (neighborhood);
create index posts_category_idx on public.posts (category);
create index posts_verification_status_idx on public.posts (verification_status);
create index post_media_post_id_idx on public.post_media (post_id);
create index comments_post_id_idx on public.comments (post_id);
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_author_id_idx on public.comments (author_id);
create index post_votes_post_id_idx on public.post_votes (post_id);
create index post_votes_user_id_idx on public.post_votes (user_id);
create index saved_posts_user_id_idx on public.saved_posts (user_id);
create index saved_posts_post_id_idx on public.saved_posts (post_id);
create index evidence_sources_post_id_idx on public.evidence_sources (post_id);
create index evidence_sources_media_id_idx on public.evidence_sources (media_id);
create index verification_events_post_id_idx on public.verification_events (post_id);
create index verification_events_actor_id_idx on public.verification_events (actor_id);
create index ai_analyses_post_id_idx on public.ai_analyses (post_id);
create index ai_analyses_created_at_idx on public.ai_analyses (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger posts_set_updated_at
before update on public.posts
for each row execute procedure public.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'Neighbor'),
    'member'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.comments_same_post()
returns trigger
language plpgsql
as $$
declare
  parent_post uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select post_id into parent_post
  from public.comments
  where id = new.parent_id;

  if parent_post is null or parent_post <> new.post_id then
    raise exception 'Replies must belong to the same post';
  end if;

  return new;
end;
$$;

create trigger comments_same_post
before insert or update on public.comments
for each row execute procedure public.comments_same_post();
