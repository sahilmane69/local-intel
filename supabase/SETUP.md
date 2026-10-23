# Local Intel database setup

The app requires a working Supabase connection for its normal experience. These files create the schema; they do not connect the UI by themselves.

## 1. Project

Create a Supabase project. Do not commit secret keys.

## 2. Environment

Copy `.env.example` to `.env.local` (or `.env`) and fill in values from Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable / legacy anon key)
- `GEMINI_API_KEY` (server-only; required only for on-demand AI analysis)
- `NOMINATIM_USER_AGENT` (server-only; an identifying User-Agent with a contact address for reverse geocoding)

Restart `npm run dev` after changing env vars.

## 3. Migrations

In the SQL editor, run in order:

1. `supabase/migrations/20261023120000_init_local_intel.sql`
2. `supabase/migrations/20261023120001_rls_and_privileges.sql`
3. `supabase/migrations/20261023120002_storage_post_media.sql`
4. `supabase/migrations/20261023120003_feed_auth_profile_and_media.sql`
5. `supabase/migrations/20261023120004_profile_account_and_location.sql`
6. `supabase/migrations/20261023120005_location_and_ai_analysis.sql`

Or from a machine with the CLI logged in:

```bash
npx supabase db push
```

If a SQL Editor run was interrupted or stopped partway through, use the updated
migration file and rerun that file in full. Migration `20261023120003` is safe
to rerun: it recreates only its own constraint, policies, and trigger.

## 4. Auth

Enable the Email provider under Authentication and add your local and production URLs to the Auth redirect allow-list. New users must provide a name, account type, city, and neighborhood; the signup trigger creates their `profiles` row with role `member`. Avatar, bio, and precise coordinates are optional. Coordinates are stored only after the person explicitly clicks **Use my location** and saves their profile. Promote staff in SQL only:

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

The feed never substitutes fake posts for a failed or missing Supabase connection. Run the migrations and complete the manual connection checks before treating the UI as connected.
