import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import type { FixedTask, Profile, Task, WalletLog } from '../lib/types'
import BalanceCard from '../components/BalanceCard'
import TaskItem from '../components/TaskItem'
import AddTaskForm from '../components/AddTaskForm'
import WalletHistory from '../components/WalletHistory'
import FixedTasksManager from '../components/FixedTasksManager'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
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
      // Materialise today's required tasks from the template, then read everything.
      await supabase.rpc('ensure_today_tasks')

      const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local

      const [profileRes, tasksRes, fixedRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_date', today)
          .order('type', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase.from('fixed_tasks').select('*').eq('user_id', user.id).order('sort_order'),
        supabase
          .from('wallet_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (profileRes.error) throw profileRes.error
      if (tasksRes.error) throw tasksRes.error
      if (fixedRes.error) throw fixedRes.error
      if (logsRes.error) throw logsRes.error

      setProfile(profileRes.data)
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

  async function completeTask(id: string) {
    const { error: rpcError } = await supabase.rpc('complete_task', { p_task_id: id })
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    await load()
  }

  async function addTask(name: string) {
    if (!user) return
    const reward = await priceTask(name)
    const { error: insErr } = await supabase.from('tasks').insert({
      user_id: user.id,
      name,
      type: 'custom',
      reward,
    })
    if (insErr) {
      setError(insErr.message)
      return
    }
    await load()
  }

  async function addFixed(name: string) {
    if (!user) return
    const reward = await priceTask(name)
    const { error: insErr } = await supabase.from('fixed_tasks').insert({
      user_id: user.id,
      name,
      reward,
      sort_order: fixedTasks.length,
    })
    if (insErr) {
      setError(insErr.message)
      return
    }
    await load()
  }

  async function removeFixed(id: string) {
    const { error: delErr } = await supabase.from('fixed_tasks').delete().eq('id', id)
    if (delErr) {
      setError(delErr.message)
      return
    }
    await load()
  }

  const { required, custom, doneCount, todayDelta } = useMemo(() => {
    const required = tasks.filter((t) => t.type === 'required')
    const custom = tasks.filter((t) => t.type === 'custom')
    const doneCount = tasks.filter((t) => t.done).length
    const today = new Date().toLocaleDateString('en-CA')
    const todayDelta = logs
      .filter((l) => l.created_at.slice(0, 10) === today)
      .reduce((sum, l) => sum + Number(l.amount), 0)
    return { required, custom, doneCount, todayDelta }
  }, [tasks, logs])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-16 pt-6">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            {(profile?.username ?? 'Y').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400">Welcome back</p>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {profile?.username ?? 'You'}
            </h1>
          </div>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {profile && (
        <BalanceCard
          balance={profile.balance}
          vouchers={profile.vouchers}
          todayDelta={todayDelta}
          doneCount={doneCount}
          totalCount={tasks.length}
        />
      )}

      {/* Tasks */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</h2>
          <button
            onClick={() => setShowFixed(true)}
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
          >
            Edit required
          </button>
        </div>

        {required.length > 0 && (
          <ul className="mb-2 space-y-2">
            {required.map((t) => (
              <TaskItem key={t.id} task={t} onComplete={completeTask} />
            ))}
          </ul>
        )}

        {custom.length > 0 && (
          <ul className="mb-2 space-y-2">
            {custom.map((t) => (
              <TaskItem key={t.id} task={t} onComplete={completeTask} />
            ))}
          </ul>
        )}

        {tasks.length === 0 && (
          <p className="mb-3 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No tasks yet. Add one below, or set up your daily required list.
          </p>
        )}

        <div className="mt-3">
          <AddTaskForm onAdd={addTask} />
        </div>
      </section>

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Recent activity
        </h2>
        <WalletHistory logs={logs} />
      </section>

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
