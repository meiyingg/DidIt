import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { priceTask } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import type { Task } from '../lib/types'
import { money } from '../lib/format'
import Coin from './Coin'

function fmt(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function dayLabel(date: string): string {
  const today = new Date().toLocaleDateString('en-CA')
  if (date === today) return 'Today'
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  onClose: () => void
  onDone: () => void
  onActivityChange?: (activity: string | null) => void
}

/** Focus timer: pick an existing to-do (incl. unfinished ones) or type a new task. */
export default function StudyTimerModal({ onClose, onDone, onActivityChange }: Props) {
  const { user } = useAuth()
  const { refresh } = useProfile()
  const [todos, setTodos] = useState<Task[]>([])
  const [task, setTask] = useState('')
  const [selected, setSelected] = useState<Task | null>(null)
  const [sec, setSec] = useState(0)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [earned, setEarned] = useState<number | null>(null)
  const startedAt = useRef<string | null>(null)
  const tick = useRef<number | null>(null)

  // load unfinished to-dos (today + earlier) to choose from
  useEffect(() => {
    if (!user) return
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('done', false)
      .order('task_date', { ascending: false })
      .limit(30)
      .then(({ data }) => setTodos(data ?? []))
  }, [user])

  useEffect(() => {
    if (!running) return
    tick.current = window.setInterval(() => setSec((s) => s + 1), 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [running])

  // broadcast a live "studying X" status to the room while the timer runs
  useEffect(() => {
    onActivityChange?.(running && task.trim() ? `studying ${task.trim()}` : null)
  }, [running, task, onActivityChange])

  function pick(t: Task) {
    setSelected(t)
    setTask(t.name)
  }

  function start() {
    if (!task.trim()) return
    if (!startedAt.current) startedAt.current = new Date().toISOString()
    setRunning(true)
  }

  async function finish() {
    setRunning(false)
    const minutes = Math.max(0, Math.round(sec / 60))
    if (!user || !task.trim() || sec < 1) {
      onClose()
      return
    }
    setSaving(true)
    try {
      // Balance and study_minutes are maintained by DB triggers — we only
      // insert the session (→ study_minutes) and the ledger row (→ balance).
      const startedIso = startedAt.current ?? new Date().toISOString()
      let reward = 0
      if (selected) {
        // completing the selected to-do credits its reward via complete_task (no double pay)
        const { error } = await supabase.rpc('complete_task', { p_task_id: selected.id })
        if (error) throw error
        reward = Number(selected.reward)
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          task_id: selected.id,
          task_name: task.trim(),
          started_at: startedIso,
          ended_at: new Date().toISOString(),
          duration_minutes: minutes,
          reward,
        })
      } else {
        reward = await priceTask(`${task.trim()} (studied ${minutes} min)`)
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          task_name: task.trim(),
          started_at: startedIso,
          ended_at: new Date().toISOString(),
          duration_minutes: minutes,
          reward,
        })
        await supabase.from('wallet_logs').insert({
          user_id: user.id,
          amount: reward,
          type: 'study_reward',
          note: `${task.trim()} · ${minutes}m`,
        })
      }
      await refresh()
      setEarned(reward)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div className="px-panel w-full max-w-sm overflow-hidden">
        <div className="px-header px-h-amber">
          <img src="/assets/icon-timer.png" alt="" className="h-5 w-5 object-contain" />
          <h3 className="font-pixel flex-1 text-[15px] font-bold">Focus Timer</h3>
          <button onClick={onClose} className="font-pixel text-white/90 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-5">
          {earned !== null ? (
            <div className="py-6 text-center">
              <img src="/assets/icon-party.png" alt="" className="mx-auto h-12 w-12 object-contain" />
              <p className="font-pixel mt-3 text-lg font-bold text-[color:var(--color-ink)]">Nice work!</p>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">You studied {fmt(sec)} and earned</p>
              <p className="font-pixel mt-1 flex items-center justify-center gap-1.5 text-2xl font-bold text-[color:var(--color-grass-dark)]">
                <Coin className="h-6 w-6" /> {money(earned).replace('¥', '')}
              </p>
              <button onClick={onClose} className="px-btn mt-5 w-full">
                Done
              </button>
            </div>
          ) : (
            <>
              {todos.length > 0 && (
                <>
                  <label className="font-pixel mb-1.5 block text-xs font-bold uppercase text-[color:var(--color-muted)]">
                    Pick a to-do
                  </label>
                  <div className="mb-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {todos.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => pick(t)}
                        disabled={running}
                        className={`rounded-full border-2 px-2.5 py-1 text-xs transition ${
                          selected?.id === t.id
                            ? 'border-[#3c6b28] bg-[#6aa84f] text-white'
                            : 'border-[#c9a772] bg-[#fffdf5] text-[color:var(--color-ink)] hover:border-[#6aa84f]'
                        }`}
                      >
                        {t.name}
                        <span className="ml-1 opacity-60">· {dayLabel(t.task_date)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <label className="font-pixel mb-1 block text-xs font-bold uppercase text-[color:var(--color-muted)]">
                {todos.length > 0 ? 'Or type a new one' : 'What are you working on?'}
              </label>
              <input
                value={task}
                onChange={(e) => {
                  setTask(e.target.value)
                  setSelected(null)
                }}
                placeholder="e.g. Math homework"
                disabled={running}
                className="px-input mb-4 w-full text-sm disabled:opacity-60"
              />

              <div className="font-pixel my-1 rounded-lg border-2 border-[#6b4a24] bg-[#2b2436] py-4 text-center text-4xl font-bold tracking-widest text-[#7ee0a0] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                {fmt(sec)}
              </div>

              <div className="mt-4 flex gap-2">
                {!running ? (
                  <button onClick={start} disabled={!task.trim()} className="px-btn flex-1">
                    ▶ {sec > 0 ? 'Resume' : 'Start'}
                  </button>
                ) : (
                  <button onClick={() => setRunning(false)} className="px-btn px-btn-amber flex-1">
                    ⏸ Pause
                  </button>
                )}
                <button onClick={finish} disabled={saving || sec < 1} className="px-btn flex-1">
                  {saving ? 'Saving…' : '⏹ Finish'}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-[color:var(--color-faint)]">
                {selected
                  ? 'Finishing completes this to-do & banks its reward.'
                  : 'AI rewards you based on the task & time when you finish.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
