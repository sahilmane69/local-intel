# Local Intel database setup

The app runs on mock data until public Supabase keys are present **and** a connection is tested. These files create the schema; they do not connect the UI by themselves.

## 1. Project

Create a Supabase project. Do not commit secret keys.

## 2. Environment

Copy `.env.example` to `.env.local` (or `.env`) and fill in values from Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable / legacy anon key)
- `SUPABASE_SECRET_KEY` (server only; never expose to the browser)
- `GEMINI_API_KEY` (optional; analysis currently uses the mock analyzer)

Restart `npm run dev` after changing env vars.

## 3. Migrations

In the SQL editor, run in order:

1. `supabase/migrations/20261023120000_init_local_intel.sql`
2. `supabase/migrations/20261023120001_rls_and_privileges.sql`
3. `supabase/migrations/20261023120002_storage_post_media.sql`

Or from a machine with the CLI logged in:

```bash
npx supabase db push
```

## 4. Auth

Enable Email (or another) provider under Authentication. New users get a `profiles` row with role `member`. Promote staff in SQL only:

```sql
update public.profiles
set role = 'official'
where id = '<auth-user-uuid>';
```

Verification status on `posts` can change only through `verification_events` inserted by `moderator` or `official` users.

## 5. Storage layout

Upload objects to bucket `post-media` as `{user_id}/{post_id}/{filename}`.

## 6. Connection status

The feed still uses local mock posts until a dedicated data mapper is tested against this schema with real credentials. Do not treat the UI as “connected to Supabase” after running SQL alone.
