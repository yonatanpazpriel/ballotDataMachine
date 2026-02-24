create table if not exists public.shared_tournaments (
  share_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_tournaments enable row level security;

create policy "shared_tournaments_read"
  on public.shared_tournaments
  for select
  using (true);

create policy "shared_tournaments_insert"
  on public.shared_tournaments
  for insert
  with check (true);

create policy "shared_tournaments_update"
  on public.shared_tournaments
  for update
  using (true)
  with check (true);

create policy "shared_tournaments_delete"
  on public.shared_tournaments
  for delete
  using (true);
