create table if not exists public.ds160_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  step integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  source text not null default 'visafile-web',
  schema_version integer not null default 1,
  automation_job_id text unique,
  automation_status text not null default 'queued',
  automation_error text,
  authorize_official_submission boolean not null default false,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.ds160_intake_submissions
  add column if not exists schema_version integer not null default 1,
  add column if not exists automation_job_id text,
  add column if not exists automation_status text not null default 'queued',
  add column if not exists automation_error text,
  add column if not exists authorize_official_submission boolean not null default false;

create unique index if not exists ds160_intake_submissions_automation_job_id_idx
  on public.ds160_intake_submissions (automation_job_id)
  where automation_job_id is not null;

alter table public.ds160_intake_submissions enable row level security;

drop policy if exists "Users can create their own intake submissions"
  on public.ds160_intake_submissions;
create policy "Users can create their own intake submissions"
  on public.ds160_intake_submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own intake submissions"
  on public.ds160_intake_submissions;
create policy "Users can read their own intake submissions"
  on public.ds160_intake_submissions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Automation state is updated only by authenticated Next.js server routes
-- using SUPABASE_SERVICE_ROLE_KEY. Applicants do not receive direct UPDATE access.
drop policy if exists "Users can update their own intake automation state"
  on public.ds160_intake_submissions;

grant select, insert on table public.ds160_intake_submissions to authenticated;
grant all on table public.ds160_intake_submissions to service_role;

notify pgrst, 'reload schema';
