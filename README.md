# DidIt 🪙 （做了么）

A small, invite-only web app that turns self-discipline into a game with a
**virtual RMB economy**. Every day at midnight the system charges you a
"cost of living". You must complete tasks to earn it back and stay in the black.
Finish all of your required tasks and you earn a **guilt-free voucher** —
permission to play games or go out with zero guilt.

> Phase 1 (this version): accounts, daily task list, complete-to-earn,
> automatic −¥300/day deduction, wealth + transaction history, mobile-first UI.
> All UI text is in English.

Planned next: AI reward pricing (Tongyi/Qwen), study timer, vouchers UI,
personal stats dashboard, and a shared leaderboard.

## Tech stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: [Supabase](https://supabase.com) (Auth + Postgres + RLS + pg_cron)
- **Package manager**: pnpm

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql).
   This creates all tables, row-level-security policies, the new-user trigger,
   the `complete_task` / `ensure_today_tasks` functions, and the daily
   deduction job.
3. For the daily deduction to run automatically, enable the **pg_cron**
   extension: **Database → Extensions → enable `pg_cron`**, then re-run the
   `cron.schedule(...)` block at the bottom of the migration.
   (Without it, everything works except the automatic midnight charge — you can
   still call `select public.apply_daily_deduction();` manually to test.)

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in from **Supabase → Project Settings → API**:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> The `anon` key is public by design and safe to ship in the frontend.
> The Tongyi/DashScope key (Phase 2) is **backend-only** — it lives as a
> Supabase secret, never in this repo or the frontend.

### 4. Run

```bash
pnpm dev
```

Open the printed URL (default http://localhost:5173), sign up, and start earning.

> **Tip:** In Supabase **Authentication → Providers → Email** you can turn off
> "Confirm email" for a frictionless small-group signup.

## How it works

| Rule | Value |
| --- | --- |
| Daily deduction | −¥300 at 00:00 (Asia/Shanghai) |
| Required tasks | You define them; auto-added every day |
| Voucher | +1 when all required tasks are done that day (never expires) |
| Reward pricing | Manual in Phase 1; AI-priced in Phase 2 |
| Balance | Can go negative; no extra penalty |
| Leaderboard | Phase 3 — single shared board |

## Project layout

```
src/
  components/    BalanceCard, TaskItem, AddTaskForm, WalletHistory, FixedTasksManager
  contexts/      AuthContext (Supabase auth)
  lib/           supabase client, types, formatters
  pages/         Login, Dashboard
supabase/
  schema.sql     (tables + RLS + triggers + functions + cron — ledger-driven)
  functions/     price-task, daily-summary  (Edge Functions)
```

## Security notes

- Real secrets never get committed — `.env` is git-ignored.
- All money mutations go through `security definer` Postgres functions
  (`complete_task`, `apply_daily_deduction`) so the rules can't be bypassed
  from the client.
- Row-Level Security restricts every user to their own data; profiles are
  read-only-visible to other signed-in users (for the future leaderboard).
