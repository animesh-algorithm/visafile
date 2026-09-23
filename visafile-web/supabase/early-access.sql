create table if not exists public.early_access_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null unique check (char_length(email) between 3 and 254),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sending', 'sent', 'failed')),
  confirmation_status text not null default 'pending' check (confirmation_status in ('pending', 'sending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.early_access_requests enable row level security;
revoke all on public.early_access_requests from anon, authenticated;
grant all on public.early_access_requests to service_role;
notify pgrst, 'reload schema';
