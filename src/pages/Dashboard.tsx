import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
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

  async function addTask(name: string, reward: number) {
    if (!user) return
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

  async function addFixed(name: string, reward: number) {
    if (!user) return
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

  const { required, custom, doneCount } = useMemo(() => {
    const required = tasks.filter((t) => t.type === 'required')
    const custom = tasks.filter((t) => t.type === 'custom')
    const doneCount = tasks.filter((t) => t.done).length
    return { required, custom, doneCount }
  }, [tasks])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-12 pt-6">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Welcome back</p>
          <h1 className="text-xl font-bold text-white">{profile?.username ?? 'You'}</h1>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          Sign out
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {profile && <BalanceCard balance={profile.balance} vouchers={profile.vouchers} />}

      {/* Tasks */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Today · {doneCount}/{tasks.length} done
          </h2>
          <button
            onClick={() => setShowFixed(true)}
            className="text-sm font-medium text-amber-400 hover:text-amber-300"
          >
            Edit required
          </button>
        </div>

        {required.length > 0 && (
          <ul className="mb-3 space-y-2">
            {required.map((t) => (
              <TaskItem key={t.id} task={t} onComplete={completeTask} />
            ))}
          </ul>
        )}

        {custom.length > 0 && (
          <ul className="mb-3 space-y-2">
            {custom.map((t) => (
              <TaskItem key={t.id} task={t} onComplete={completeTask} />
            ))}
          </ul>
        )}

        {tasks.length === 0 && (
          <p className="mb-3 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
            No tasks yet. Add one below, or set up your daily required list.
          </p>
        )}

        <AddTaskForm onAdd={addTask} />
      </section>

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
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
