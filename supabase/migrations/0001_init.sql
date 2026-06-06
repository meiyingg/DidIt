-- ============================================================================
-- Grind Bank — initial schema
-- A virtual-currency self-discipline system.
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles : one row per user, mirrors auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  avatar_url  text,
  balance     numeric(12, 2) not null default 0,   -- virtual wealth, may go negative
  vouchers    integer not null default 0,          -- guilt-free vouchers
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- fixed_tasks : user-defined "required every day" template list
-- ---------------------------------------------------------------------------
create table if not exists public.fixed_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  reward      numeric(12, 2) not null default 50,  -- default reward until AI pricing (Phase 2)
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists fixed_tasks_user_idx on public.fixed_tasks (user_id);

-- ---------------------------------------------------------------------------
-- tasks : concrete tasks for a given day (required = generated from template, custom = ad-hoc)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
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
create index if not exists tasks_user_date_idx on public.tasks (user_id, task_date);

-- ---------------------------------------------------------------------------
-- wallet_logs : every change to balance (audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric(12, 2) not null,             -- positive = earn, negative = deduction
  type        text not null check (type in ('task_reward', 'study_reward', 'daily_deduction')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists wallet_logs_user_idx on public.wallet_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- study_sessions : timer records (Phase 2, table created now for completeness)
-- ---------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  task_id          uuid references public.tasks (id) on delete set null,
  task_name        text not null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_minutes integer,
  reward           numeric(12, 2) not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists study_sessions_user_idx on public.study_sessions (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- vouchers : guilt-free voucher ledger (Phase 2)
-- ---------------------------------------------------------------------------
create table if not exists public.voucher_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null check (action in ('earn', 'spend')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists voucher_logs_user_idx on public.voucher_logs (user_id, created_at desc);

-- ============================================================================
-- Row Level Security
--   Users can fully manage only their own rows.
--   Profiles are readable by any authenticated user (needed for the leaderboard).
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.fixed_tasks    enable row level security;
alter table public.tasks          enable row level security;
alter table public.wallet_logs    enable row level security;
alter table public.study_sessions enable row level security;
alter table public.voucher_logs   enable row level security;

-- profiles: everyone (authed) can read; you can only update your own
create policy "profiles read all"   on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);

-- helper macro pattern: own-row-only for the rest
create policy "fixed own"    on public.fixed_tasks    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks own"    on public.tasks          for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wallet own"   on public.wallet_logs    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study own"    on public.study_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "voucher own"  on public.voucher_logs   for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Trigger: auto-create a profile row when a new auth user signs up.
-- username comes from the signup metadata (raw_user_meta_data->>'username').
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC: complete_task(task_id)
--   Atomically marks a task done, credits the reward to the balance,
--   writes a wallet log, and — if it was the LAST unfinished required task
--   for today — grants one guilt-free voucher.
--   Returns the new balance.
-- ============================================================================
create or replace function public.complete_task(p_task_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_task    public.tasks%rowtype;
  v_uid     uuid := auth.uid();
  v_balance numeric;
  v_remaining_required int;
begin
  select * into v_task from public.tasks where id = p_task_id and user_id = v_uid;
  if not found then
    raise exception 'Task not found';
  end if;
  if v_task.done then
    raise exception 'Task already completed';
  end if;

  update public.tasks
    set done = true, completed_at = now()
    where id = p_task_id;

  update public.profiles
    set balance = balance + v_task.reward
    where id = v_uid
    returning balance into v_balance;

  insert into public.wallet_logs (user_id, amount, type, note)
    values (v_uid, v_task.reward, 'task_reward', v_task.name);

  -- voucher: did this finish all of today's required tasks?
  if v_task.type = 'required' then
    select count(*) into v_remaining_required
      from public.tasks
      where user_id = v_uid
        and task_date = v_task.task_date
        and type = 'required'
        and done = false;

    if v_remaining_required = 0 then
      update public.profiles set vouchers = vouchers + 1 where id = v_uid;
      insert into public.voucher_logs (user_id, action, note)
        values (v_uid, 'earn', 'All required tasks done on ' || v_task.task_date);
    end if;
  end if;

  return v_balance;
end;
$$;

-- ============================================================================
-- RPC: ensure_today_tasks()
--   Idempotently materialises today's "required" tasks from the user's
--   fixed_tasks template. Safe to call every time the dashboard loads.
-- ============================================================================
create or replace function public.ensure_today_tasks()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  insert into public.tasks (user_id, name, type, task_date, reward, source_fixed_id)
  select ft.user_id, ft.name, 'required', current_date, ft.reward, ft.id
  from public.fixed_tasks ft
  where ft.user_id = v_uid
    and not exists (
      select 1 from public.tasks t
      where t.user_id = v_uid
        and t.task_date = current_date
        and t.source_fixed_id = ft.id
    );
end;
$$;

-- ============================================================================
-- Daily deduction: subtract 300 from every profile at 00:00 Asia/Shanghai.
--   pg_cron runs in UTC; 00:00 CST (UTC+8) == 16:00 UTC the previous day.
--   Requires the pg_cron extension (enable it in Supabase: Database > Extensions).
-- ============================================================================
create or replace function public.apply_daily_deduction()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set balance = balance - 300;

  insert into public.wallet_logs (user_id, amount, type, note)
  select id, -300, 'daily_deduction', 'Daily cost of living'
  from public.profiles;
end;
$$;

-- Schedule it (no-op if pg_cron is unavailable — comment out if it errors).
-- Unschedule any previous version first to stay idempotent.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('grindbank_daily_deduction')
      where exists (select 1 from cron.job where jobname = 'grindbank_daily_deduction');
    perform cron.schedule(
      'grindbank_daily_deduction',
      '0 16 * * *',                 -- 16:00 UTC == 00:00 Asia/Shanghai
      $cron$ select public.apply_daily_deduction(); $cron$
    );
  end if;
end;
$$;
