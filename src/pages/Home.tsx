import { useCallback, useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, Coins, Ticket, ListChecks, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { FixedTask, Task, WalletLog } from '../lib/types'
import { money } from '../lib/format'
import { Card, StatCard, SectionTitle } from '../components/ui'
import PixelBanner from '../components/PixelBanner'
import TaskItem from '../components/TaskItem'
import AddTaskForm from '../components/AddTaskForm'
import WalletHistory from '../components/WalletHistory'
import WeekChart from '../components/WeekChart'
import FixedTasksManager from '../components/FixedTasksManager'
import NumberTicker from '../components/magicui/NumberTicker'

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

  const { ordered, doneCount, todayDelta } = useMemo(() => {
    const required = tasks.filter((t) => t.type === 'required')
    const custom = tasks.filter((t) => t.type === 'custom')
    const doneCount = tasks.filter((t) => t.done).length
    const today = todayStr()
    const todayDelta = logs
      .filter((l) => l.created_at.slice(0, 10) === today)
      .reduce((s, l) => s + Number(l.amount), 0)
    return { ordered: [...required, ...custom], doneCount, todayDelta }
  }, [tasks, logs])

  const balance = profile?.balance ?? 0
  const requiredAllDone =
    tasks.some((t) => t.type === 'required') && tasks.filter((t) => t.type === 'required').every((t) => t.done)

  return (
    <div className="animate-fade-up">
      <PixelBanner name={profile?.username ?? 'friend'} doneAll={requiredAllDone} />

      {error && (
        <div className="mt-4 rounded-xl border border-[color:var(--color-berry)] bg-red-50 px-4 py-3 text-sm text-[color:var(--color-berry)]">
          {error}
        </div>
      )}

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="Balance"
          tile="bg-amber-100 text-amber-700"
          valueClass={balance < 0 ? 'text-[color:var(--color-berry)]' : 'text-[color:var(--color-ink)]'}
          value={<NumberTicker value={balance} decimalPlaces={2} prefix="¥" />}
        />
        <StatCard icon={Ticket} label="Vouchers" tile="bg-violet-100 text-violet-700" value={profile?.vouchers ?? 0} />
        <StatCard
          icon={ListChecks}
          label="Tasks"
          tile="bg-emerald-100 text-emerald-700"
          value={`${doneCount}/${tasks.length}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Today"
          tile="bg-sky-100 text-sky-700"
          valueClass={todayDelta >= 0 ? 'text-[color:var(--color-grass-dark)]' : 'text-[color:var(--color-berry)]'}
          value={`${todayDelta >= 0 ? '+' : ''}${money(todayDelta)}`}
        />
      </div>

      {/* main grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Today's tasks"
            action={
              <button
                onClick={() => setShowFixed(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-grass-dark)] transition hover:opacity-80"
              >
                <SlidersHorizontal size={14} /> Required
              </button>
            }
          />
          {loading ? (
            <div className="space-y-2 py-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-[color:var(--color-panel-2)]" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[color:var(--color-line)] px-4 py-8 text-center text-sm text-[color:var(--color-muted)]">
              No tasks yet. Add one below, or set up your daily required list.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-line)]/60">
              {ordered.map((t) => (
                <TaskItem key={t.id} task={t} onComplete={completeTask} />
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-[color:var(--color-line)]/60 pt-4">
            <AddTaskForm onAdd={addTask} />
          </div>
        </Card>

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
