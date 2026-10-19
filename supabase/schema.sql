-- CareBridge: planned Supabase schema (NOT active in the prototype).
-- The prototype stores everything in localStorage with fictional data.
-- Apply this only after the privacy review in docs/PRIVACY_SECURITY.md.
--
-- Every table is owned by one auth user and protected by row level security,
-- so the browser can use the publishable anon key and still only ever read or
-- write its own rows. Never ship the service role key to the frontend.

create extension if not exists "pgcrypto";

-- Preferences and display name (no legal name, DOB, or medical record number).
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  prefs        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  starts_on   date,
  starts_at   time,
  visit_type  text check (char_length(visit_type) <= 60),
  specialty   text check (char_length(specialty) <= 80),
  clinician   text check (char_length(clinician) <= 80),
  reason      text check (char_length(reason) <= 500),
  concerns    jsonb not null default '{}'::jsonb,  -- { when, worse, tried, daily, worry }
  timeline    jsonb not null default '[]'::jsonb,  -- [{ month, text }]
  sheet_ready boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  text           text not null check (char_length(text) between 1 and 300),
  priority       boolean not null default false,
  position       integer not null default 0,
  source         text check (char_length(source) <= 120),
  created_at     timestamptz not null default now()
);

create table if not exists public.question_lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) <= 120),
  questions  jsonb not null default '[]'::jsonb,   -- snapshot: [{ text, priority }]
  created_at timestamptz not null default now()
);

-- One table for the health notebook. `kind` says what the entry is.
--   saved_topic      -> payload { url, title, cat, lang }   (MedlinePlus URL only)
--   saved_procedure  -> payload { id }
--   visit_sheet      -> payload { title, snapshot }
--   visit_note       -> payload { text }
--   care_note        -> payload { procedure_id, text }
create table if not exists public.notebook_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('saved_topic','saved_procedure','visit_sheet','visit_note','care_note')),
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_user_idx on public.appointments (user_id);
create index if not exists questions_user_idx on public.questions (user_id, position);
create index if not exists question_lists_user_idx on public.question_lists (user_id);
create index if not exists notebook_user_kind_idx on public.notebook_entries (user_id, kind);

-- Row level security: each user sees and changes only their own rows.
do $$
declare t text;
begin
  foreach t in array array['profiles','appointments','questions','question_lists','notebook_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format('drop policy if exists "own rows delete" on public.%I', t);
    execute format('create policy "own rows select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
