-- Public read, owner write for post media.
-- Upsert requires INSERT + SELECT + UPDATE on storage.objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/ogg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy post_media_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'post-media');

create policy post_media_authenticated_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy post_media_authenticated_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'post-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'post-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy post_media_authenticated_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
