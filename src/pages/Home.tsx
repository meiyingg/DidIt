import { useCallback, useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, Wallet, TrendingUp, ListChecks, Ticket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { FixedTask, Task, WalletLog } from '../lib/types'
import { money } from '../lib/format'
import { Card, Label, SectionTitle } from '../components/ui'
import TaskItem from '../components/TaskItem'
import AddTaskForm from '../components/AddTaskForm'
import WalletHistory from '../components/WalletHistory'
import WeekChart from '../components/WeekChart'
import FixedTasksManager from '../components/FixedTasksManager'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export default function Home() {
  const { user } = useAuth()
  const { profile, refresh: refreshProfile } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([])
  const [logs, setLogs] = useState<WalletLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFixed, setShowFixed] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      await supabase.rpc('ensure_today_tasks')
      const [tasksRes, fixedRes, logsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_date', todayStr())
          .order('type', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase.from('fixed_tasks').select('*').eq('user_id', user.id).order('sort_order'),
        supabase
          .from('wallet_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (fixedRes.error) throw fixedRes.error
      if (logsRes.error) throw logsRes.error
      setTasks(tasksRes.data ?? [])
      setFixedTasks(fixedRes.data ?? [])
      setLogs(logsRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function after() {
    await Promise.all([load(), refreshProfile()])
  }

  async function completeTask(id: string) {
    const { error: e } = await supabase.rpc('complete_task', { p_task_id: id })
    if (e) return setError(e.message)
    await after()
  }
  async function addTask(name: string) {
    if (!user) return
    const reward = await priceTask(name)
    const { error: e } = await supabase.from('tasks').insert({ user_id: user.id, name, type: 'custom', reward })
    if (e) return setError(e.message)
    await after()
  }
  async function addFixed(name: string) {
    if (!user) return
    const reward = await priceTask(name)
    const { error: e } = await supabase
      .from('fixed_tasks')
      .insert({ user_id: user.id, name, reward, sort_order: fixedTasks.length })
    if (e) return setError(e.message)
    await after()
  }
  async function removeFixed(id: string) {
    const { error: e } = await supabase.from('fixed_tasks').delete().eq('id', id)
    if (e) return setError(e.message)
    await after()
  }

  const { required, custom, doneCount, todayDelta } = useMemo(() => {
    const required = tasks.filter((t) => t.type === 'required')
    const custom = tasks.filter((t) => t.type === 'custom')
    const doneCount = tasks.filter((t) => t.done).length
    const today = todayStr()
    const todayDelta = logs
      .filter((l) => l.created_at.slice(0, 10) === today)
      .reduce((s, l) => s + Number(l.amount), 0)
    return { required, custom, doneCount, todayDelta }
  }, [tasks, logs])

  const balance = profile?.balance ?? 0
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  return (
    <div className="animate-fade-up">
      {/* page header */}
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Label>Overview</Label>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            Welcome back, {profile?.username ?? 'you'}
          </h1>
        </div>
        <p className="hidden text-sm text-zinc-400 sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* balance — the one dark, focal tile */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-600/25 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Balance</span>
            <Wallet size={16} className="text-white/40" />
          </div>
          <p className={`relative mt-2.5 text-2xl font-bold tabular-nums tracking-tight ${balance < 0 ? 'text-rose-400' : 'text-white'}`}>
            {money(balance)}
          </p>
          <p className="relative mt-1 text-xs text-white/40">−¥300 daily at midnight</p>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <Label>Today</Label>
            <TrendingUp size={16} className="text-zinc-300" />
          </div>
          <p className={`mt-2.5 text-2xl font-bold tabular-nums tracking-tight ${todayDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {todayDelta >= 0 ? '+' : ''}
            {money(todayDelta)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">net change today</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <Label>Tasks</Label>
            <ListChecks size={16} className="text-zinc-300" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
            {doneCount}
            <span className="text-base font-semibold text-zinc-300">/{tasks.length}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-zinc-900 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <Label>Vouchers</Label>
            <Ticket size={16} className="text-amber-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
            {profile?.vouchers ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-400">guilt-free passes</p>
        </Card>
      </div>

      {/* main grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* tasks */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Today's tasks"
            action={
              <button
                onClick={() => setShowFixed(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-violet-700 transition hover:text-violet-600"
              >
                <SlidersHorizontal size={14} /> Required
              </button>
            }
          />

          {loading ? (
            <div className="space-y-2 py-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-zinc-100" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
              No tasks yet. Add one below, or set up your daily required list.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {[...required, ...custom].map((t) => (
                <TaskItem key={t.id} task={t} onComplete={completeTask} />
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <AddTaskForm onAdd={addTask} />
          </div>
        </Card>

        {/* side column */}
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle title="This week" />
            <WeekChart logs={logs} />
          </Card>
          <Card>
            <SectionTitle title="Recent activity" />
            <WalletHistory logs={logs} limit={6} />
          </Card>
        </div>
      </div>

      {showFixed && (
        <FixedTasksManager
          fixedTasks={fixedTasks}
          onAdd={addFixed}
          onRemove={removeFixed}
          onClose={() => setShowFixed(false)}
        />
      )}
    </div>
  )
}
