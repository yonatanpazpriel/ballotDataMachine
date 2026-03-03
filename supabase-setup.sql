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

-- New schema for Google Auth + user access
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  share_id text unique not null,
  name text not null,
  created_at timestamptz not null default now(),
  roster jsonb not null default '{"teamNumber":"","prosecution":{"attorneys":{"opener":"","middle":"","closer":""},"witnesses":["","",""]},"defense":{"attorneys":{"opener":"","middle":"","closer":""},"witnesses":["","",""]}}'::jsonb,
  owner_id uuid references auth.users(id) on delete set null
);

create table if not exists public.ballots (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number int not null,
  judge_name text not null,
  prosecution_team_number text not null,
  defense_team_number text not null,
  our_side text not null check (our_side in ('P', 'D')),
  created_at timestamptz not null default now(),
  scores jsonb not null default '[]'::jsonb
);

alter table public.ballots
  add column if not exists ranks jsonb not null default '[]'::jsonb;

create table if not exists public.user_tournament_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tournament_id)
);

create table if not exists public.aggregated_ballot_data (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  generated_at timestamptz not null default now(),
  data jsonb not null
);

alter table public.tournaments enable row level security;
alter table public.ballots enable row level security;
alter table public.user_tournament_access enable row level security;
alter table public.aggregated_ballot_data enable row level security;

-- RLS: tournaments - fully public read/write (links are shareable)
create policy "tournaments_select"
  on public.tournaments for select
  using (true);

create policy "tournaments_insert"
  on public.tournaments for insert
  with check (true);

create policy "tournaments_update"
  on public.tournaments for update
  using (true)
  with check (true);

create policy "tournaments_delete"
  on public.tournaments for delete
  using (true);

-- RLS: ballots - fully public read/write (linked to public tournaments)
create policy "ballots_select"
  on public.ballots for select
  using (true);

create policy "ballots_insert"
  on public.ballots for insert
  with check (true);

create policy "ballots_update"
  on public.ballots for update
  using (true);

create policy "ballots_delete"
  on public.ballots for delete
  using (true);

-- RLS: user_tournament_access - select/insert own rows only (used for \"My tournaments\" list)
create policy "user_tournament_access_select"
  on public.user_tournament_access for select
  using (user_id = auth.uid());

create policy "user_tournament_access_insert"
  on public.user_tournament_access for insert
  with check (user_id = auth.uid());

-- RLS: aggregated_ballot_data - fully public read/write (derived from public ballots)
create policy "aggregated_ballot_data_select"
  on public.aggregated_ballot_data for select
  using (true);

create policy "aggregated_ballot_data_insert"
  on public.aggregated_ballot_data for insert
  with check (true);

create policy "aggregated_ballot_data_update"
  on public.aggregated_ballot_data for update
  using (true);

create policy "aggregated_ballot_data_delete"
  on public.aggregated_ballot_data for delete
  using (true);
