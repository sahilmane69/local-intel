# Local Intel database setup

The app runs on mock data until public Supabase keys are present **and** a connection is tested. These files create the schema; they do not connect the UI by themselves.

## 1. Project

Create a Supabase project. Do not commit secret keys.

## 2. Environment

Copy `.env.example` to `.env.local` (or `.env`) and fill in values from Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable / legacy anon key)
- `GEMINI_API_KEY` (optional; analysis currently uses the mock analyzer)

Restart `npm run dev` after changing env vars.

## 3. Migrations

In the SQL editor, run in order:

1. `supabase/migrations/20261023120000_init_local_intel.sql`
2. `supabase/migrations/20261023120001_rls_and_privileges.sql`
3. `supabase/migrations/20261023120002_storage_post_media.sql`
4. `supabase/migrations/20261023120003_feed_auth_profile_and_media.sql`

Or from a machine with the CLI logged in:

```bash
npx supabase db push
```

## 4. Auth

Enable the Email provider under Authentication and add your local and production URLs to the Auth redirect allow-list. New users get a `profiles` row with role `member`. Promote staff in SQL only:

```sql
update public.profiles
set role = 'official'
where id = '<auth-user-uuid>';
```

Verification status on `posts` can change only through `verification_events` inserted by `moderator` or `official` users. Members also cannot change a report's workflow status.

Email confirmation is supported: if enabled, users must confirm their email before their first password sign-in.

## 5. Storage layout

Upload objects to bucket `post-media` as `{user_id}/{post_id}/{filename}`. Profile avatars use the `profile-avatars` bucket as `{user_id}/{filename}`.

## 6. Connection status

The feed uses local mock posts only when public Supabase credentials are absent. Run the migrations and complete the manual connection checks before treating the UI as connected.
