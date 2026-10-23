-- Structured, server-generated AI verification and analysis comments.
-- AI output is informational only and cannot alter posts.verification_status.

alter table public.ai_analyses
  add column if not exists assessment text,
  add column if not exists confidence text,
  add column if not exists reasoning text,
  add column if not exists known_facts text,
  add column if not exists uncertainties text,
  add column if not exists next_steps text,
  add column if not exists analysis_comment text;

alter table public.ai_analyses
  drop constraint if exists ai_analyses_assessment_check,
  drop constraint if exists ai_analyses_confidence_check,
  add constraint ai_analyses_assessment_check check (
    assessment is null or assessment in ('unverified', 'community-corroborated')
  ),
  add constraint ai_analyses_confidence_check check (
    confidence is null or confidence in ('low', 'medium', 'high')
  );

comment on column public.ai_analyses.assessment is
  'AI assessment only. Values intentionally exclude officially-confirmed.';
comment on column public.ai_analyses.analysis_comment is
  'Server-generated AI analysis displayed separately from user comments.';

-- The app writes this table only from its authenticated server route with a
-- service-role client. Keep direct browser writes limited to existing owner
-- requests and do not grant UPDATE or DELETE to application users.
create index if not exists ai_analyses_post_checked_at_idx
  on public.ai_analyses (post_id, checked_at desc);
