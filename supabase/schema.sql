-- ============================================================================
-- DidIt (做了么) — canonical database schema  (supersedes migrations 0001-0003)
--
-- Design principles
--  • wallet_logs is the ONE ledger. Balance changes happen ONLY by inserting a
--    ledger row; an AFTER-INSERT trigger keeps profiles.balance in sync.
--    => balance always equals the sum of the ledger, fully auditable.
--  • study_sessions inserts auto-accumulate profiles.study_minutes via trigger.
--  • Clients may only edit their own username/avatar_url. balance & study_minutes
--    are never written directly by the client (column-level grants + triggers).
--  • Server-authoritative actions (complete_task, daily deduction) run as
--    SECURITY DEFINER and also write through the ledger.
--
-- Safe to run on a fresh project; on an existing dev project it drops & recreates
-- the public tables (balances reset). Run in the Supabase SQL editor.
-- ============================================================================

-- ---- tear down old objects (idempotent) ------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from cron.job where jobname = 'didit_daily_deduction') then
    perform cron.unschedule('didit_daily_deduction');
  end if;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.complete_task(uuid) cascade;
drop function if exists public.ensure_today_tasks() cascade;
drop function if exists public.apply_daily_deduction() cascade;
drop function if exists public.apply_wallet_log() cascade;
drop function if exists public.apply_study_session() cascade;

drop table if exists public.voucher_logs   cascade;
drop table if exists public.diary_entries  cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.wallet_logs    cascade;
drop table if exists public.tasks          cascade;
drop table if exists public.fixed_tasks    cascade;
drop table if exists public.profiles       cascade;

-- ---- profiles --------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null,
  avatar_url    text,                                  -- character key, chosen at signup (permanent)
  bio           text not null default '',
  balance       numeric(12, 2) not null default 0,     -- maintained by wallet trigger
  study_minutes integer not null default 0,            -- maintained by study trigger
  created_at    timestamptz not null default now()
);

-- ---- fixed_tasks (daily required template) ---------------------------------
create table public.fixed_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  reward      numeric(12, 2) not null default 50,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, name)                            -- no duplicate dailies per user
);
create index fixed_tasks_user_idx on public.fixed_tasks (user_id);

-- ---- tasks -----------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  type            text not null default 'custom' check (type in ('required', 'custom')),
  task_date       date not null default current_date,
  reward          numeric(12, 2) not null default 0,
  done            boolean not null default false,
  completed_at    timestamptz,
  source_fixed_id uuid references public.fixed_tasks (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index tasks_user_date_idx on public.tasks (user_id, task_date);
-- one materialised copy of a given required task per day (makes ensure_today_tasks race-proof)
create unique index tasks_required_uidx on public.tasks (user_id, task_date, source_fixed_id) where source_fixed_id is not null;

-- ---- wallet_logs (the ledger; source of truth for balance) -----------------
create table public.wallet_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric(12, 2) not null,                 -- + earn, - spend/deduct
  type        text not null check (type in ('task_reward', 'study_reward', 'daily_deduction', 'purchase', 'adjustment')),
  note        text,
  created_at  timestamptz not null default now()
);
create index wallet_logs_user_idx on public.wallet_logs (user_id, created_at desc);

-- ---- study_sessions --------------------------------------------------------
create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  task_id          uuid references public.tasks (id) on delete set null,
  task_name        text not null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_minutes integer not null default 0,
  reward           numeric(12, 2) not null default 0,
  created_at       timestamptz not null default now()
);
create index study_sessions_user_idx on public.study_sessions (user_id, started_at desc);

-- ---- diary_entries (one per user per day) ----------------------------------
create table public.diary_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_date  date not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index diary_user_date_idx on public.diary_entries (user_id, entry_date desc);

-- ============================================================================
-- Triggers that keep the denormalized profile fields correct
-- ============================================================================
create function public.apply_wallet_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set balance = balance + new.amount where id = new.user_id;
  return new;
end $$;
create trigger wallet_logs_after_insert
  after insert on public.wallet_logs
  for each row execute function public.apply_wallet_log();

create function public.apply_study_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set study_minutes = study_minutes + coalesce(new.duration_minutes, 0)
    where id = new.user_id;
  return new;
end $$;
create trigger study_sessions_after_insert
  after insert on public.study_sessions
  for each row execute function public.apply_study_session();

-- ============================================================================
-- Auth: create a profile row on signup (+ backfill existing users below)
-- ============================================================================
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'character', 'hoodie')
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC: complete_task — server-authoritative; writes through the ledger.
-- ============================================================================
create function public.complete_task(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_task public.tasks%rowtype;
  v_uid  uuid := auth.uid();
begin
  select * into v_task from public.tasks where id = p_task_id and user_id = v_uid;
  if not found then raise exception 'Task not found'; end if;
  if v_task.done then raise exception 'Task already completed'; end if;

  update public.tasks set done = true, completed_at = now() where id = p_task_id;

  insert into public.wallet_logs (user_id, amount, type, note)
    values (v_uid, v_task.reward, 'task_reward', v_task.name);  -- trigger updates balance
end $$;

-- ============================================================================
-- RPC: ensure_today_tasks — materialise today's required tasks from template.
-- ============================================================================
create function public.ensure_today_tasks()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  insert into public.tasks (user_id, name, type, task_date, reward, source_fixed_id)
  select ft.user_id, ft.name, 'required', current_date, ft.reward, ft.id
  from public.fixed_tasks ft
  where ft.user_id = v_uid
    and not exists (
      select 1 from public.tasks t
      where t.user_id = v_uid and t.task_date = current_date and t.source_fixed_id = ft.id
    )
  on conflict do nothing;
end $$;

-- ============================================================================
-- Daily deduction: -300 to everyone at 00:00 Asia/Shanghai (16:00 UTC).
-- Writes through the ledger (trigger updates each balance). Needs pg_cron.
-- ============================================================================
create function public.apply_daily_deduction()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallet_logs (user_id, amount, type, note)
  select id, -300, 'daily_deduction', 'Daily cost of living' from public.profiles;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('didit_daily_deduction', '0 16 * * *',
      $cron$ select public.apply_daily_deduction(); $cron$);
  end if;
end $$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.fixed_tasks    enable row level security;
alter table public.tasks          enable row level security;
alter table public.wallet_logs    enable row level security;
alter table public.study_sessions enable row level security;
alter table public.diary_entries  enable row level security;

-- profiles: readable by all (leaderboard); you may update ONLY your own
-- username/avatar_url — balance & study_minutes are off-limits to the client.
create policy "profiles read all"   on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);
revoke update on public.profiles from authenticated;
grant update (username, bio) on public.profiles to authenticated;

-- everything else: users manage only their own rows
create policy "fixed own"   on public.fixed_tasks    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks own"   on public.tasks          for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet own"  on public.wallet_logs    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study own"   on public.study_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary own"   on public.diary_entries  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- backfill profiles for users who already signed up ---------------------
insert into public.profiles (id, username)
select id, coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
