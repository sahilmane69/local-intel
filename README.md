# Local Intel

A desktop-first community reporting feed. It requires Supabase for posts and interactions; missing or failed configuration is shown as an error rather than substituted sample data.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and configure the required values before using posts, accounts, location lookup, or AI analysis.

## Supabase integration

The feed, Auth, profiles, Storage uploads, comments, votes, and saved posts use Supabase with RLS. Copy `.env.example` to `.env.local`, set the two public Supabase variables, apply every migration, and follow [the setup guide](supabase/SETUP.md).

## Database foundation

SQL for profiles, posts, media, comments, votes, saves, evidence, verification events, AI analyses, RLS, and Storage lives in `supabase/migrations/`. Setup steps are in `supabase/SETUP.md`.

Do not treat the app as connected to Supabase until those migrations are applied and a query against the project succeeds.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The included Node tests cover report-link, field-limit, and media-upload validation. Live authentication, Storage, RLS, reverse geocoding, and Gemini grounding require configured external services and must be checked manually after applying migrations.

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Lucide, and optional Supabase / Gemini clients behind service interfaces.
