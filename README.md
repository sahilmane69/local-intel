# Local Intel

A desktop-first neighborhood feed for Fairview. The UI runs on local mock data until public Supabase keys are configured **and** a live connection is tested.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` if you want to prepare credentials. Leave the values empty to keep using mock posts.

## Database foundation

SQL for profiles, posts, media, comments, votes, saves, evidence, verification events, AI analyses, RLS, and Storage lives in `supabase/migrations/`. Setup steps are in `supabase/SETUP.md`.

Do not treat the app as connected to Supabase until those migrations are applied and a query against the project succeeds.

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Lucide, and optional Supabase / Gemini clients behind service interfaces.
